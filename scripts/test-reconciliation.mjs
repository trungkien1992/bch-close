import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { test } from "node:test";
import assert from "node:assert/strict";

const compiled = spawnSync(process.execPath, ["node_modules/typescript/bin/tsc", "lib/reconcile.ts", "lib/sample.ts", "lib/blockchair.ts", "lib/bchaddrjs.d.ts", "--outDir", ".sites-runtime/core-tests", "--module", "commonjs", "--target", "ES2022", "--esModuleInterop", "--skipLibCheck", "--strict"], { encoding: "utf8" });
if (compiled.status !== 0) { process.stderr.write(compiled.stdout + compiled.stderr); process.exit(1); }
mkdirSync(".sites-runtime/core-tests", { recursive: true });
writeFileSync(".sites-runtime/core-tests/package.json", '{"type":"commonjs"}\n');
const require = createRequire(import.meta.url);
const core = require("../.sites-runtime/core-tests/reconcile.js");
const { sampleWorkspace } = require("../.sites-runtime/core-tests/sample.js");
const { normalizeBlockchair } = require("../.sites-runtime/core-tests/blockchair.js");
const { amountToSats, csv, exportReport, formatBch, importRows, mergeReceipts, normalizeAddress, parseInvoiceRows, parseReceipt, receiptKey, reconcile, restoreWorkspace } = core;
const n = value => value.toString();

test("address library browser distribution runs without Node globals", () => {
  const context = {};
  vm.runInNewContext(readFileSync("node_modules/bchaddrjs/dist/bchaddrjs-0.5.2.min.js", "utf8"), context);
  assert.equal(context.bchaddr.toCashAddress("1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu"), "bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a");
});

test("sample ledger has independently specified exact totals", () => {
  const result = reconcile(sampleWorkspace());
  assert.equal(n(result.totals.expected), "77000000");
  assert.equal(n(result.totals.confirmed), "51750000");
  assert.equal(n(result.totals.outstanding), "25500000");
  assert.equal(n(result.totals.excess), "250000");
  assert.equal(n(result.totals.pending), "3500000");
  assert.equal(result.unresolved.length, 1);
  assert.equal(result.invoices.filter(row => row.status === "Paid").length, 2);
});
test("satoshi parsing preserves precision and rejects ambiguous amounts", () => {
  assert.equal(amountToSats("0.00000001"), "1");
  assert.equal(amountToSats("21000000.00000000"), "2100000000000000");
  for (const value of ["0", "-1", "1e-8", "0.000000001", "21000000.00000001", "NaN"]) assert.throws(() => amountToSats(value));
  assert.equal(formatBch("1", false), "0.00000001");
});
test("legacy and CashAddr recipient representations agree", () => {
  const expected = "bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a";
  assert.equal(normalizeAddress("1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu"), expected);
  assert.equal(normalizeAddress(expected.replace("bitcoincash:", "")), expected);
  assert.throws(() => normalizeAddress(expected.slice(0, -1) + "x"));
  assert.throws(() => normalizeAddress("mnbGP2FeRsbgdQCzDT35zPWDcYSKm4wrcg"));
});
test("repeated imports give no additional payment credit", () => {
  const data = sampleWorkspace();
  const merged = mergeReceipts(data.receipts, [...data.receipts, data.receipts[0]]);
  assert.equal(merged.duplicates, 8);
  assert.equal(merged.receipts.length, 7);
  assert.equal(n(reconcile({ ...data, receipts: merged.receipts }).totals.confirmed), "51750000");
});
test("two outputs in the same transaction remain distinct", () => {
  const row = reconcile(sampleWorkspace()).invoices.find(row => row.invoice.id === "INV-007");
  assert.equal(row.matches.length, 2);
  assert.equal(n(row.confirmed), "10000000");
  assert.equal(row.matches[0].receipt.txid, row.matches[1].receipt.txid);
});
test("reused addresses stay unresolved even when the amount equals an invoice", () => {
  const data = sampleWorkspace();
  const result = reconcile(data);
  assert.deepEqual(result.unresolved[0].candidates, ["INV-005", "INV-006"]);
  assert.equal(result.unresolved[0].invoiceId, null);
  assert.equal(n(result.invoices.find(row => row.invoice.id === "INV-005").confirmed), "0");
});
test("pending and unknown confirmation counts do not reduce outstanding amounts", () => {
  const data = sampleWorkspace();
  for (const confirmations of [0, null]) {
    data.receipts[6].confirmations = confirmations;
    const row = reconcile(data).invoices.find(row => row.invoice.id === "INV-008");
    assert.equal(n(row.confirmed), "0"); assert.equal(n(row.pending), "3500000"); assert.equal(n(row.outstanding), "3500000");
  }
});
test("excess on one invoice does not settle another invoice", () => {
  const rows = reconcile(sampleWorkspace()).invoices;
  assert.equal(n(rows.find(row => row.invoice.id === "INV-004").excess), "250000");
  assert.equal(n(rows.find(row => row.invoice.id === "INV-003").outstanding), "4000000");
});
test("reference mismatches and missing invoice IDs receive no automatic credit", () => {
  const data = sampleWorkspace();
  data.receipts[0].invoiceId = "INV-002";
  let result = reconcile(data);
  assert.equal(result.matches[0].invoiceId, null);
  assert.equal(n(result.invoices[0].confirmed), "0");
  data.receipts[0].invoiceId = "MISSING";
  result = reconcile(data);
  assert.equal(result.matches[0].invoiceId, null);
});
test("manual assignment and exclusion update exactly one output", () => {
  const data = sampleWorkspace(); const key = receiptKey(data.receipts[3]);
  data.decisions[key] = { invoiceId: "INV-005", note: "Payment reference checked with customer.", at: "2026-10-07T04:00:00Z" };
  assert.equal(n(reconcile(data).invoices[4].confirmed), "6000000");
  assert.equal(n(reconcile(data).invoices[5].confirmed), "0");
  data.decisions[key] = { invoiceId: null, note: "Unrelated transfer.", at: "2026-10-07T04:00:00Z" };
  assert.equal(n(reconcile(data).totals.confirmed), "51750000");
});
test("conflicting duplicate imports fail atomically", () => {
  const data = sampleWorkspace(); const before = JSON.stringify(data.receipts);
  assert.throws(() => mergeReceipts(data.receipts, [{ ...data.receipts[0], amountSats: "1" }]));
  assert.equal(JSON.stringify(data.receipts), before);
});
test("CSV accepts quoted commas, escaped quotes, and multiline text", () => {
  const values = [["invoice_id", "customer", "expected_bch", "address"], ["I-1", 'Coffee, "Tea"\nand More', "0.1", sampleWorkspace().invoices[0].address]];
  const parsed = parseInvoiceRows(importRows(csv(values)));
  assert.equal(parsed[0].customer, 'Coffee, "Tea"\nand More');
  assert.equal(parsed[0].expectedSats, "10000000");
  assert.throws(() => importRows('a,b\n"broken,b'));
});
test("invalid and duplicate invoice records reject the import", () => {
  const invoice = sampleWorkspace().invoices[0];
  assert.throws(() => parseInvoiceRows([invoice, invoice]));
  assert.throws(() => parseReceipt({ txid: "bad", output_index: 0, amount_bch: "0.1", address: invoice.address }));
  assert.throws(() => parseInvoiceRows([{ ...invoice, dueDate: "2026-02-30" }]));
});
test("workspace round trip preserves decisions, totals, and dataset label", () => {
  const data = sampleWorkspace(); const key = receiptKey(data.receipts[3]);
  data.decisions[key] = { invoiceId: "INV-005", note: "Checked invoice reference.", at: "2026-10-07T04:00:00Z" };
  const restored = restoreWorkspace(JSON.stringify(data));
  assert.equal(restored.mode, "sample"); assert.equal(restored.duplicateCount, 1);
  assert.deepEqual(restored.decisions, data.decisions);
  assert.equal(n(reconcile(restored).totals.confirmed), "57750000");
  assert.ok(restored.receipts.every(receipt => receipt.source === "import"));
});
test("report retains output-level evidence and neutralizes spreadsheet formulas", () => {
  const report = exportReport(sampleWorkspace());
  assert.equal(report.receipts.length, 7);
  assert.equal(report.receipts[4].key.slice(-2), ":0");
  assert.equal(report.receipts[5].key.slice(-2), ":1");
  assert.equal(report.receipts[0].source, "sample");
  assert.ok(csv([["=SUM(A1:A2)", "@value"]]).includes("'=SUM"));
});

const providerFixture = () => { const sample = sampleWorkspace().receipts[0]; return { id: sample.txid, payload: { context: { code: 200, state: 500 }, data: { [sample.txid]: { transaction: { hash: sample.txid, block_id: 499 }, outputs: [{ index: 0, value: 12500000, recipient: sample.address, type: "pubkeyhash", transaction_hash: sample.txid }, { index: 1, value: 0, recipient: "data", type: "nulldata" }] } } } }; };
test("provider adapter computes confirmations and skips non-payment outputs", () => {
  const { id, payload } = providerFixture();
  const normalized = normalizeBlockchair(payload, id, "2026-10-07T04:00:00Z");
  assert.equal(normalized.receipts.length, 1); assert.equal(normalized.skippedOutputs, 1);
  assert.equal(normalized.receipts[0].confirmations, 2); assert.equal(normalized.receipts[0].source, "blockchair");
  assert.equal(normalized.receipts[0].amountSats, "12500000");
  payload.data[id].transaction.block_id = -1;
  assert.equal(normalizeBlockchair(payload, id).receipts[0].confirmations, 0);
});
test("a refreshed provider observation can remove previously confirmed credit", () => {
  const data = sampleWorkspace(); const old = { ...data.receipts[0], source: "blockchair" };
  const refreshed = { ...old, confirmations: 0 };
  const merged = mergeReceipts([old], [refreshed]);
  assert.equal(merged.receipts[0].confirmations, 0);
  assert.equal(n(reconcile({ ...data, receipts: merged.receipts }).totals.confirmed), "0");
  const claim = mergeReceipts([old], [{ ...old, source: "import", confirmations: 100 }]);
  assert.equal(claim.receipts[0].confirmations, old.confirmations);
});
test("provider transaction identity and output indexes must agree", () => {
  const { id, payload } = providerFixture();
  payload.data[id].transaction.hash = "1".repeat(64);
  assert.throws(() => normalizeBlockchair(payload, id));
  payload.data[id].transaction.hash = id;
  payload.data[id].outputs.push(payload.data[id].outputs[0]);
  assert.throws(() => normalizeBlockchair(payload, id));
});
