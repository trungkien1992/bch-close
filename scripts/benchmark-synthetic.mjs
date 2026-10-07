import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, ".sites-runtime", "synthetic-benchmark");
mkdirSync(output, { recursive: true });
const compiled = spawnSync(process.execPath, ["node_modules/typescript/bin/tsc", "lib/reconcile.ts", "lib/bchaddrjs.d.ts", "--outDir", output, "--module", "commonjs", "--target", "ES2022", "--esModuleInterop", "--skipLibCheck", "--strict"], { cwd: root, encoding: "utf8" });
if (compiled.status !== 0) { process.stderr.write(compiled.stdout + compiled.stderr); process.exit(1); }
writeFileSync(path.join(output, "package.json"), '{"type":"commonjs"}\n');
const require = createRequire(import.meta.url);
const core = require(path.join(output, "reconcile.js"));
const { emptyWorkspace, importRows, parseInvoiceRows, parseReceiptRows, mergeReceipts, reconcile, receiptKey, restoreWorkspace, exportReport, reportCsv, normalizeAddress } = core;
const fixtureRoot = path.join(root, "fixtures", "synthetic-30");
const read = name => readFileSync(path.join(fixtureRoot, name), "utf8");
const expected = JSON.parse(read("expected.json"));
const invoices = parseInvoiceRows(importRows(read("invoices.csv")));
const input = parseReceiptRows(importRows(read("receipts-with-duplicates.csv")));
const merged = mergeReceipts([], input);
const workspace = { ...emptyWorkspace(), mode: "sample", invoices, receipts: merged.receipts.map(row => ({ ...row, source: "sample" })), duplicateCount: merged.duplicates };
const result = reconcile(workspace);
const totals = result => Object.fromEntries(Object.entries(result.totals).map(([key, value]) => [key, value.toString()]));
const answers = result => result.invoices.map(row => ({ invoice_id: row.invoice.id, status: row.status,
  expectedSats: row.invoice.expectedSats, confirmedSats: row.confirmed.toString(), pendingSats: row.pending.toString(),
  outstandingSats: row.outstanding.toString(), excessSats: row.excess.toString(), receiptKeys: row.matches.map(match => match.key) }));
const checks = [];
function check(name, fn) { fn(); checks.push({ name, passed: true }); }

check("CSV and JSON imports produce identical parsed records", () => {
  assert.deepEqual(invoices, parseInvoiceRows(importRows(read("invoices.json"))));
  assert.deepEqual(input, parseReceiptRows(importRows(read("receipts-with-duplicates.json"))));
});
check("All 30 invoice statuses, balances and assigned outputs match the declarative oracle", () => {
  assert.deepEqual(answers(result), expected.invoices);
});
check("All five aggregate satoshi totals match fixed expected values", () => {
  assert.deepEqual(totals(result), expected.totals);
});
check("31 input rows yield exactly 26 distinct outputs and 5 ignored duplicates", () => {
  assert.equal(input.length, expected.counts.inputReceiptRows);
  assert.equal(merged.receipts.length, expected.counts.uniqueReceiptOutputs);
  assert.equal(merged.duplicates, expected.counts.duplicateRows);
});
check("Status distribution and exception count match the authored fixture", () => {
  const counts = Object.fromEntries(Object.keys(expected.statusCounts).map(status => [status, result.invoices.filter(row => row.status === status).length]));
  assert.deepEqual(counts, expected.statusCounts);
  assert.equal(result.exceptionCount, expected.counts.exceptionInvoices);
});
check("Reimporting the complete 31-row receipt file adds no payment credit", () => {
  const again = mergeReceipts(workspace.receipts, input);
  assert.equal(again.duplicates, 31);
  assert.equal(again.receipts.length, 26);
  assert.deepEqual(answers(reconcile({ ...workspace, receipts: again.receipts })), expected.invoices);
  assert.deepEqual(totals(reconcile({ ...workspace, receipts: again.receipts })), expected.totals);
});
check("Two outputs from one transaction separately settle SYN-016", () => {
  const row = result.invoices.find(row => row.invoice.id === "SYN-016");
  assert.equal(row.matches.length, 2);
  assert.equal(row.matches[0].receipt.txid, row.matches[1].receipt.txid);
  assert.deepEqual(row.matches.map(match => match.receipt.vout), [0, 1]);
  assert.equal(row.confirmed.toString(), "1000000");
});
check("Equal amounts on a reused address leave one output unassigned", () => {
  assert.equal(result.unresolved.length, 1);
  assert.equal(result.unresolved[0].key, expected.ambiguousOutput);
  assert.equal(result.unresolved[0].invoiceId, null);
  assert.deepEqual(result.unresolved[0].candidates, expected.ambiguousCandidates);
});
check("Zero and unknown confirmations remain pending without reducing outstanding", () => {
  for (const id of ["SYN-027", "SYN-028"]) {
    const row = result.invoices.find(row => row.invoice.id === id);
    assert.equal(row.confirmed.toString(), "0");
    assert.equal(row.outstanding.toString(), "1000000");
    assert.equal(row.pending.toString(), "1000000");
  }
});
check("Excess payment does not offset a different unpaid invoice", () => {
  assert.equal(result.invoices.find(row => row.invoice.id === "SYN-025").excess.toString(), "100000");
  assert.equal(result.invoices.find(row => row.invoice.id === "SYN-021").outstanding.toString(), "1000000");
});
check("A missing explicit invoice reference gives that output no credit", () => {
  const changed = { ...workspace, receipts: workspace.receipts.map((row, i) => i ? row : { ...row, invoiceId: "MISSING" }) };
  const r = reconcile(changed);
  assert.equal(r.matches[0].invoiceId, null);
  assert.equal(r.invoices[0].confirmed.toString(), "0");
});
check("An explicit invoice reference with the wrong recipient gives no credit", () => {
  const changed = { ...workspace, receipts: workspace.receipts.map((row, i) => i ? row : { ...row, address: normalizeAddress(invoices[26].address) }) };
  assert.equal(reconcile(changed).matches[0].invoiceId, null);
});
check("A noted manual assignment credits only the selected invoice", () => {
  const manual = { ...workspace, decisions: { [expected.ambiguousOutput]: expected.manualDecision } };
  const r = reconcile(manual);
  assert.deepEqual(totals(r), expected.afterManualTotals);
  assert.equal(r.unresolved.length, 0);
  assert.equal(r.invoices[28].status, "Paid");
  assert.equal(r.invoices[29].status, "Unpaid");
  assert.equal(r.invoices[29].confirmed.toString(), "0");
});
check("Manual exclusion retains the note and gives no additional credit", () => {
  const excluded = { ...workspace, decisions: { [expected.ambiguousOutput]: { ...expected.manualDecision, invoiceId: null, note: "FICTIONAL: unrelated transfer excluded from this ledger." } } };
  const r = reconcile(excluded);
  assert.deepEqual(totals(r), expected.totals);
  assert.equal(r.unresolved.length, 0);
  assert.equal(exportReport(excluded).receipts.find(row => row.key === expected.ambiguousOutput).decision.note, excluded.decisions[expected.ambiguousOutput].note);
});
check("Workspace restoration preserves sample labelling, decisions and accounting", () => {
  const manual = { ...workspace, decisions: { [expected.ambiguousOutput]: expected.manualDecision } };
  const restored = restoreWorkspace(JSON.stringify(manual));
  assert.equal(restored.mode, "sample");
  assert.deepEqual(restored.decisions, manual.decisions);
  assert.deepEqual(totals(reconcile(restored)), expected.afterManualTotals);
});
check("JSON and CSV reports retain all 30 invoices and 26 output evidence rows", () => {
  const report = exportReport(workspace);
  assert.equal(report.invoices.length, 30);
  assert.equal(report.receipts.length, 26);
  assert.equal(new Set(report.receipts.map(row => row.key)).size, 26);
  const rows = importRows(reportCsv(workspace));
  assert.equal(rows.filter(row => row.record_type === "invoice").length, 30);
  assert.equal(rows.filter(row => row.record_type === "receipt").length, 26);
});
check("A conflicting duplicate rejects the merge without changing existing receipts", () => {
  const before = JSON.stringify(workspace.receipts);
  assert.throws(() => mergeReceipts(workspace.receipts, [{ ...workspace.receipts[0], amountSats: "1000001" }]));
  assert.equal(JSON.stringify(workspace.receipts), before);
});

const evidenceRoot = path.join(root, "evidence");
mkdirSync(evidenceRoot, { recursive: true });
const sha256 = data => createHash("sha256").update(data).digest("hex");
const outputReport = { schema: "bch-close-synthetic-benchmark/v1", synthetic: true, runAt: new Date().toISOString(),
  sourceCommit: "8cdaceb2af40adcced59cf5410ba7b771e263b5e", nodeVersion: process.version,
  coreSha256: sha256(readFileSync(path.join(root, "lib/reconcile.ts"))),
  oracleSha256: sha256(read("expected.json")), invoiceCount: 30, invoiceRowsMatchingOracle: 30,
  checkGroupsPassed: checks.length, checkGroupsTotal: checks.length,
  totalsSats: totals(result), statusCounts: expected.statusCounts,
  receiptInputRows: input.length, uniqueReceiptOutputs: merged.receipts.length,
  ignoredDuplicateRows: merged.duplicates, repeatedImportDuplicateRows: 31, repeatedImportAdditionalCreditSats: "0",
  unresolvedOutputs: result.unresolved.length, checks,
  limits: ["All customers, invoices and transaction IDs are fictional.", "This measures deterministic fixture outcomes, not merchant adoption or general accuracy.", "Human review time and the proposed 50% improvement have not been measured.", "Browser interaction and responsive UI checks remain unverified."] };
writeFileSync(path.join(evidenceRoot, "synthetic-benchmark.json"), JSON.stringify(outputReport, null, 2) + "\n");
writeFileSync(path.join(fixtureRoot, "workspace.json"), JSON.stringify(workspace, null, 2) + "\n");
writeFileSync(path.join(evidenceRoot, "synthetic-report.json"), JSON.stringify(exportReport(workspace), null, 2) + "\n");
writeFileSync(path.join(evidenceRoot, "synthetic-report.csv"), reportCsv(workspace));
console.log(JSON.stringify({ synthetic: true, passed: checks.length, total: checks.length, invoiceRowsMatchingOracle: 30,
  uniqueReceiptOutputs: 26, ignoredDuplicateRows: 5, repeatedImportAdditionalCreditSats: "0", totalsSats: totals(result) }, null, 2));
