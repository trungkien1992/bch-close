import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const projectRoot = path.resolve(process.argv[2] || fileURLToPath(new URL("../", import.meta.url)));
const qaRequire = createRequire(import.meta.url);
const appRequire = createRequire(path.join(projectRoot, "package.json"));
const { JSDOM } = qaRequire("jsdom");
const runtime = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', { url: "https://bch-close.example/", pretendToBeVisual: true });
const { window } = runtime;
for (const name of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLTextAreaElement", "HTMLButtonElement", "HTMLAnchorElement", "HTMLSelectElement", "HTMLFormElement", "SVGElement", "Node", "NodeFilter", "Element", "Document", "DocumentFragment", "ShadowRoot", "Range", "DOMRect", "Event", "MouseEvent", "CustomEvent", "MutationObserver"]) {
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: name === "window" ? window : window[name] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
globalThis.ResizeObserver = window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
window.HTMLElement.prototype.scrollIntoView = () => {};
window.HTMLElement.prototype.hasPointerCapture = () => false;
window.HTMLElement.prototype.setPointerCapture = () => {};
window.HTMLElement.prototype.releasePointerCapture = () => {};
window.PointerEvent = class extends window.MouseEvent {
  constructor(type, init = {}) { super(type, init); for (const [key, value] of Object.entries({ pointerId: 1, pointerType: "mouse", isPrimary: true })) Object.defineProperty(this, key, { value, configurable: true }); }
};
globalThis.PointerEvent = window.PointerEvent;
const downloads = [];
const blobs = new Map();
const createObjectURL = blob => { const url = `blob:qa-${blobs.size}`; blobs.set(url, blob); return url; };
globalThis.URL.createObjectURL = window.URL.createObjectURL = createObjectURL;
globalThis.URL.revokeObjectURL = window.URL.revokeObjectURL = () => {};
window.HTMLAnchorElement.prototype.click = function () { if (this.download) downloads.push({ filename: this.download, blob: blobs.get(this.href) }); };
let fetchCalls = 0;
globalThis.fetch = async () => { fetchCalls++; return new Response(JSON.stringify({ error: "Simulated provider outage" }), { status: 503, headers: { "Content-Type": "application/json" } }); };

const React = appRequire("react");
const { createRoot } = appRequire("react-dom/client");
const { act } = React;
const userEvent = qaRequire("@testing-library/user-event").default;
const { getByRole, getAllByRole, queryByRole, within, configure } = qaRequire("@testing-library/dom");
configure({ getElementError: message => new Error(message.split("\n")[0]) });
const user = userEvent.setup({ document: window.document });
const esbuild = createRequire(appRequire.resolve("wrangler/package.json"))("esbuild");
const outDir = path.join(projectRoot, ".sites-runtime", "dom-qa");
mkdirSync(outDir, { recursive: true });
await esbuild.build({ entryPoints: [path.join(projectRoot, "components/workspace.tsx")], outfile: path.join(outDir, "workspace.cjs"),
  absWorkingDir: projectRoot, bundle: true, platform: "node", format: "cjs", target: "node22", logLevel: "silent",
  external: ["react", "react-dom", "react/jsx-runtime", "react-dom/client"] });
const Workspace = appRequire(path.join(outDir, "workspace.cjs")).default;
const app = createRoot(document.getElementById("app"));
const checks = [];
const button = name => getByRole(document.body, "button", { name });
const menuitem = name => getByRole(document.body, "menuitem", { name });
const click = async target => { await act(async () => { await user.click(target); }); };
const tick = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 35)); }); };
const escape = async () => { await act(async () => { await user.keyboard("{Escape}"); }); await tick(); };
const fixture = name => readFileSync(path.join(projectRoot, "fixtures", "synthetic-30", name), "utf8");
const check = (name, fn) => { fn(); checks.push({ name, passed: true }); };
const type = async (element, text) => { await act(async () => { await user.clear(element); if (text) await user.type(element, text); }); };
const importFile = async (kind, text, filename) => {
  await click(button(/^Import data$/));
  const dialog = getByRole(document.body, "dialog");
  await click(within(dialog).getByRole("tab", { name: new RegExp(`^${kind}$`) }));
  const input = dialog.querySelector('input[type="file"]');
  const file = new File([text], filename, { type: filename.endsWith(".json") ? "application/json" : "text/csv" });
  await act(async () => { await user.upload(input, file); });
  await tick();
  const label = kind === "Restore workspace" ? /^Restore workspace$/ : new RegExp(`^Import ${kind.toLowerCase()}$`);
  const apply = within(dialog).getByRole("button", { name: label });
  assert.equal(apply.disabled, false);
  await click(apply);
  await tick();
};
const exportJson = async () => {
  await click(button(/^Export report$/));
  await click(menuitem(/^JSON with evidence$/));
  await tick();
  assert.ok(downloads.length);
  return JSON.parse(await downloads.at(-1).blob.text());
};

try {
  await act(async () => { app.render(React.createElement(Workspace)); });
  await tick();
  check("Initial workspace renders all eight labelled sample invoices", () => {
    assert.ok(document.body.textContent.includes("INV-008"));
    assert.ok(/sample/i.test(document.body.textContent));
  });
  await click(button(/^Workspace$/));
  await click(menuitem(/^Start empty workspace$/));
  await click(button(/^Start empty$/));
  await tick();
  const emptyReport = await exportJson();
  check("Reset confirmation starts an empty invoice workspace", () => { assert.equal(emptyReport.invoices.length, 0); assert.equal(emptyReport.receipts.length, 0); });

  await importFile("Invoices", fixture("invoices.csv"), "invoices.csv");
  check("Invoice file import creates the 30-row ledger", () => assert.ok(document.body.textContent.includes("30 of 30 invoices")));
  await importFile("Receipts", fixture("receipts-with-duplicates.csv"), "receipts-with-duplicates.csv");
  const before = await exportJson();
  check("Receipt file import produces exact totals and ignores five duplicate rows", () => {
    assert.equal(before.invoices.length, 30); assert.equal(before.receipts.length, 26); assert.equal(before.duplicateRecordsIgnored, 5);
    assert.equal(before.totals.confirmedSats, "19800000"); assert.equal(before.totals.outstandingSats, "10400000");
  });
  await importFile("Receipts", fixture("receipts-with-duplicates.csv"), "receipts-with-duplicates.csv");
  const repeated = await exportJson();
  check("Reimporting through the UI adds no payment credit", () => { assert.deepEqual(repeated.totals, before.totals); assert.equal(repeated.duplicateRecordsIgnored, 36); });

  const search = getByRole(document.body, "textbox", { name: /^Search invoices$/ });
  await type(search, "SYN-029");
  check("Search narrows the ledger to the requested invoice", () => assert.ok(document.body.textContent.includes("1 of 30 invoices")));
  await type(search, "");
  await click(getByRole(document.body, "tab", { name: /^Receipts/ }));
  const unresolved = getAllByRole(document.body, "button").find(el => /^Review$/.test(el.textContent.trim()));
  assert.ok(unresolved, "Unresolved output has a Review action");
  await click(unresolved);
  const reviewDialog = getByRole(document.body, "dialog");
  const saveDecision = within(reviewDialog).getByRole("button", { name: /^Save review decision$/ });
  check("A review decision cannot be saved without a choice and note", () => assert.equal(saveDecision.disabled, true));
  await click(within(reviewDialog).getByRole("combobox"));
  await click(getByRole(document.body, "option", { name: /SYN-029/ }));
  await type(within(reviewDialog).getByRole("textbox", { name: /^Review note$/ }), "FICTIONAL: independent fixture answer assigns this output to SYN-029.");
  await click(saveDecision);
  const manual = await exportJson();
  check("Saving a noted assignment credits SYN-029 and leaves SYN-030 unpaid", () => {
    assert.equal(manual.invoices.find(i => i.id === "SYN-029").status, "Paid");
    assert.equal(manual.invoices.find(i => i.id === "SYN-030").status, "Unpaid");
    assert.equal(manual.totals.confirmedSats, "20800000");
    assert.equal(manual.totals.outstandingSats, "9400000");
  });
  await click(button(/^Export report$/));
  await click(menuitem(/^CSV report$/));
  await tick();
  check("CSV export invokes a downloadable report with invoice and receipt records", () => {
    assert.ok(downloads.at(-1).filename.endsWith(".csv"));
  });
  const csvText = await downloads.at(-1).blob.text();
  assert.ok(csvText.includes('"invoice"')); assert.ok(csvText.includes('"receipt"'));

  await click(button(/^Workspace$/));
  await click(menuitem(/^Save workspace JSON$/));
  await tick();
  const saved = await downloads.at(-1).blob.text();
  check("Workspace save retains all imported data and the review decision", () => {
    const data = JSON.parse(saved); assert.equal(data.invoices.length, 30); assert.equal(data.receipts.length, 26); assert.equal(Object.keys(data.decisions).length, 1);
  });
  await click(button(/^Workspace$/));
  await click(menuitem(/^Start empty workspace$/));
  await click(button(/^Start empty$/));
  await importFile("Restore workspace", saved, "saved-workspace.json");
  const restored = await exportJson();
  check("Restoring through the UI preserves balances and manual decisions", () => {
    assert.deepEqual(restored.totals, manual.totals);
    assert.equal(restored.receipts.filter(row => row.decision).length, 1);
  });
  await click(getByRole(document.body, "tab", { name: /^Receipts/ }));
  await click(button(/^Look up transaction$/));
  const lookup = getByRole(document.body, "dialog");
  await type(within(lookup).getByRole("textbox", { name: /^Transaction ID$/ }), "invalid");
  await click(within(lookup).getByRole("button", { name: /^Look up transaction$/ }));
  check("Invalid transaction IDs show an error without a network call", () => {
    assert.ok(within(lookup).getByRole("alert")); assert.equal(fetchCalls, 0);
  });
  await type(within(lookup).getByRole("textbox", { name: /^Transaction ID$/ }), "1".repeat(64));
  await click(within(lookup).getByRole("button", { name: /^Look up transaction$/ }));
  await tick();
  check("A simulated provider failure shows its error and offers no output import", () => {
    assert.ok(within(lookup).getByRole("alert").textContent.includes("Simulated provider outage"));
    assert.equal(queryByRole(lookup, "button", { name: /^Import these outputs$/ }), null);
    assert.equal(fetchCalls, 1);
  });
  await escape();
  const final = await exportJson();
  check("Failed lookups preserve the previous ledger and evidence", () => assert.deepEqual(final.totals, restored.totals));

  const evidence = { schema: "bch-close-dom-workflow/v1", runAt: new Date().toISOString(), environment: "JSDOM 26.1.0 with user-event 14.6.1; not a real browser", synthetic: true,
    checksPassed: checks.length, checksTotal: checks.length, checks,
    workspaceSha256: createHash("sha256").update(readFileSync(path.join(projectRoot, "components/workspace.tsx"))).digest("hex"),
    instrumentation: ["No rendering or layout engine", "ResizeObserver and viewport-dependent APIs are stubs", "Downloads are intercepted as real Blob contents", "Fetch is stubbed only for the provider-error UI", "Node File supplies the uploaded fixture bytes"],
    remaining: ["Actual browser interactions and file downloads", "Responsive and visual layout", "Independent logged-out reviewer access", "Real merchant pilot"] };
  mkdirSync(path.join(projectRoot, "evidence"), { recursive: true });
  writeFileSync(path.join(projectRoot, "evidence", "dom-workflow.json"), JSON.stringify(evidence, null, 2) + "\n");
  console.log(JSON.stringify({ checksPassed: checks.length, checksTotal: checks.length, environment: evidence.environment }, null, 2));
} catch (error) {
  console.error(error.stack || error);
  console.error("Visible buttons:", [...document.querySelectorAll("button")].map(el => el.textContent.trim()).join(" | "));
  process.exitCode = 1;
} finally {
  await act(async () => { app.unmount(); });
  runtime.window.close();
}
