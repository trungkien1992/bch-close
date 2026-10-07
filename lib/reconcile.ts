import bchaddr from "bchaddrjs/dist/bchaddrjs-0.5.2.min.js";

export type Invoice = { id: string; customer: string; expectedSats: string; address: string; dueDate: string; reference: string };
export type Receipt = { txid: string; vout: number; amountSats: string; address: string; invoiceId: string; confirmations: number | null; source: "sample" | "import" | "blockchair"; observedAt: string };
export type Decision = { invoiceId: string | null; note: string; at: string };
export type WorkspaceData = { version: 1; mode: "sample" | "own"; invoices: Invoice[]; receipts: Receipt[]; decisions: Record<string, Decision>; duplicateCount: number };
export type Status = "Paid" | "Partial" | "Unpaid" | "Excess" | "Review" | "Pending";
export type ReceiptMatch = { receipt: Receipt; key: string; invoiceId: string | null; method: "Reference" | "Address" | "Manual" | "Excluded" | "Unmatched"; reason: string; candidates: string[] };
export type InvoiceResult = { invoice: Invoice; confirmed: bigint; pending: bigint; outstanding: bigint; excess: bigint; status: Status; matches: ReceiptMatch[]; review: ReceiptMatch[] };
const MAX = BigInt("2100000000000000");
const now = () => new Date().toISOString();

export function amountToSats(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!/^(0|[1-9]\d*)(\.\d{1,8})?$/.test(text)) throw new Error("Use a positive BCH amount with at most 8 decimal places.");
  const [whole, fraction = ""] = text.split(".");
  const sats = BigInt(whole) * BigInt(100000000) + BigInt(fraction.padEnd(8, "0"));
  if (sats <= BigInt(0) || sats > MAX) throw new Error("The BCH amount must be greater than zero and at most 21 million.");
  return sats.toString();
}

export function checkedSats(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!/^(0|[1-9]\d*)$/.test(text)) throw new Error("Satoshi amounts must be whole numbers.");
  const amount = BigInt(text);
  if (amount <= BigInt(0) || amount > MAX) throw new Error("Satoshi amount is outside the supported range.");
  return amount.toString();
}

export function formatBch(value: string | bigint, trim = true): string {
  const amount = BigInt(value);
  const sign = amount < BigInt(0) ? "−" : "";
  const absolute = amount < BigInt(0) ? -amount : amount;
  const whole = (absolute / BigInt(100000000)).toString();
  let decimals = (absolute % BigInt(100000000)).toString().padStart(8, "0");
  if (trim) decimals = decimals.replace(/0+$/, "").padEnd(2, "0");
  return `${sign}${whole}.${decimals}`;
}

export function normalizeAddress(value: unknown): string {
  const text = String(value ?? "").trim();
  const candidate = /^[qp][a-z0-9]+$/i.test(text) ? `bitcoincash:${text}` : text;
  if (!bchaddr.isValidAddress(candidate) || !bchaddr.isMainnetAddress(candidate)) throw new Error("Enter a valid Bitcoin Cash mainnet address (CashAddr or legacy).");
  return bchaddr.toCashAddress(candidate).toLowerCase();
}

function field(row: Record<string, unknown>, ...names: string[]): unknown {
  for (const name of names) if (row[name] !== undefined && row[name] !== "") return row[name];
  return "";
}

function textField(value: unknown, max = 180): string {
  const text = String(value ?? "").trim();
  if (text.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) throw new Error("A text field is too long or contains unsupported characters.");
  return text;
}

export function parseInvoice(row: Record<string, unknown>): Invoice {
  const id = textField(field(row, "invoice_id", "id"), 80);
  if (!id) throw new Error("Every invoice needs an invoice_id.");
  const dueDate = textField(field(row, "due_date", "dueDate"), 10);
  if (dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || new Date(`${dueDate}T00:00:00Z`).toISOString().slice(0, 10) !== dueDate)) throw new Error("Use a valid due_date in YYYY-MM-DD format.");
  const reference = textField(field(row, "payment_reference", "reference"), 72).toLowerCase();
  if (reference && !/^[a-f0-9]{64}:\d+$/.test(reference)) throw new Error("payment_reference must be a transaction ID followed by :output_index.");
  return { id, customer: textField(field(row, "customer", "name")) || "Unnamed customer", expectedSats: field(row, "expected_sats", "expectedSats") ? checkedSats(field(row, "expected_sats", "expectedSats")) : amountToSats(field(row, "expected_bch", "amount_bch")), address: normalizeAddress(field(row, "address", "receiving_address")), dueDate, reference };
}

export function parseReceipt(row: Record<string, unknown>, source: Receipt["source"] = "import"): Receipt {
  const txid = textField(field(row, "txid", "transaction_id"), 64).toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(txid)) throw new Error("Every receipt needs a 64-character transaction ID.");
  const voutText = String(field(row, "output_index", "vout"));
  if (!/^\d+$/.test(voutText) || Number(voutText) > 4294967295) throw new Error("output_index must be a non-negative whole number.");
  const confValue = field(row, "confirmations");
  const confirmations = confValue === "" || confValue === null ? null : Number(confValue);
  if (confirmations !== null && (!Number.isSafeInteger(confirmations) || confirmations < 0)) throw new Error("confirmations must be a non-negative whole number or empty.");
  const observed = field(row, "observed_at", "observedAt");
  const observedAt = observed ? String(observed) : now();
  if (Number.isNaN(Date.parse(observedAt))) throw new Error("observed_at must be a valid timestamp.");
  return { txid, vout: Number(voutText), address: normalizeAddress(field(row, "address", "recipient")), amountSats: field(row, "amount_sats", "amountSats") ? checkedSats(field(row, "amount_sats", "amountSats")) : amountToSats(field(row, "amount_bch")), invoiceId: textField(field(row, "invoice_id", "invoiceId"), 80), confirmations, source, observedAt };
}

export const receiptKey = (receipt: Receipt) => `${receipt.txid}:${receipt.vout}`;

export function mergeReceipts(existing: Receipt[], incoming: Receipt[]): { receipts: Receipt[]; duplicates: number } {
  const map = new Map(existing.map(receipt => [receiptKey(receipt), receipt]));
  let duplicates = 0;
  for (const receipt of incoming) {
    const key = receiptKey(receipt);
    const old = map.get(key);
    if (old) {
      if (old.address !== receipt.address || old.amountSats !== receipt.amountSats || (old.invoiceId && receipt.invoiceId && old.invoiceId !== receipt.invoiceId)) throw new Error(`Conflicting records for ${key.slice(0, 12)}…:${receipt.vout}. No receipts were imported.`);
      duplicates++;
      // A file cannot overwrite an observed provider result. A fresh provider lookup may update confirmations after a reorganization.
      if (receipt.source === "blockchair" || old.source !== "blockchair") map.set(key, { ...receipt, invoiceId: receipt.invoiceId || old.invoiceId });
    } else map.set(key, receipt);
  }
  if (map.size > 5000) throw new Error("This workspace supports at most 5,000 receipt outputs.");
  return { receipts: [...map.values()], duplicates };
}

export function matchReceipts(data: WorkspaceData): ReceiptMatch[] {
  return data.receipts.map(receipt => {
    const key = receiptKey(receipt);
    const sameAddress = data.invoices.filter(invoice => invoice.address === receipt.address);
    const candidates = sameAddress.map(invoice => invoice.id);
    const decision = data.decisions[key];
    if (decision) {
      if (decision.invoiceId === null) return { receipt, key, invoiceId: null, method: "Excluded", reason: decision.note, candidates };
      const invoice = sameAddress.find(invoice => invoice.id === decision.invoiceId);
      if (invoice) return { receipt, key, invoiceId: invoice.id, method: "Manual", reason: decision.note, candidates };
      return { receipt, key, invoiceId: null, method: "Unmatched", reason: "Saved decision does not match a receiving address.", candidates };
    }
    const byReference = data.invoices.filter(invoice => invoice.reference === key || (receipt.invoiceId && invoice.id === receipt.invoiceId));
    if (byReference.length) {
      if (byReference.length === 1 && byReference[0].address === receipt.address) return { receipt, key, invoiceId: byReference[0].id, method: "Reference", reason: "Explicit payment reference and receiving address agree.", candidates };
      return { receipt, key, invoiceId: null, method: "Unmatched", reason: byReference.length > 1 ? "More than one invoice claims this payment reference." : "Invoice reference points to a different receiving address.", candidates: [...new Set([...candidates, ...byReference.map(invoice => invoice.id)])] };
    }
    if (receipt.invoiceId) return { receipt, key, invoiceId: null, method: "Unmatched", reason: "Referenced invoice is missing from the ledger.", candidates };
    if (sameAddress.length === 1) return { receipt, key, invoiceId: sameAddress[0].id, method: "Address", reason: "Only one invoice in this ledger uses the receiving address. Confirm it is invoice-specific.", candidates };
    return { receipt, key, invoiceId: null, method: "Unmatched", reason: sameAddress.length > 1 ? "Receiving address is reused. Choose the invoice after checking the payment." : "No invoice uses this receiving address.", candidates };
  });
}

export function reconcile(data: WorkspaceData) {
  const matches = matchReceipts(data);
  const invoices: InvoiceResult[] = data.invoices.map(invoice => {
    const linked = matches.filter(match => match.invoiceId === invoice.id);
    const confirmed = linked.filter(match => (match.receipt.confirmations ?? 0) >= 1).reduce((sum, match) => sum + BigInt(match.receipt.amountSats), BigInt(0));
    const pending = linked.filter(match => (match.receipt.confirmations ?? 0) < 1).reduce((sum, match) => sum + BigInt(match.receipt.amountSats), BigInt(0));
    const expected = BigInt(invoice.expectedSats);
    const review = matches.filter(match => match.method === "Unmatched" && match.candidates.includes(invoice.id));
    const status: Status = review.length ? "Review" : confirmed > expected ? "Excess" : confirmed === expected ? "Paid" : pending > BigInt(0) ? "Pending" : confirmed > BigInt(0) ? "Partial" : "Unpaid";
    return { invoice, confirmed, pending, outstanding: confirmed < expected ? expected - confirmed : BigInt(0), excess: confirmed > expected ? confirmed - expected : BigInt(0), status, matches: linked, review };
  });
  const totals = { expected: BigInt(0), confirmed: BigInt(0), outstanding: BigInt(0), excess: BigInt(0), pending: BigInt(0) };
  for (const row of invoices) { totals.expected += BigInt(row.invoice.expectedSats); totals.confirmed += row.confirmed; totals.outstanding += row.outstanding; totals.excess += row.excess; totals.pending += row.pending; }
  return { invoices, matches, totals, unresolved: matches.filter(match => match.method === "Unmatched"), exceptionCount: invoices.filter(row => row.status !== "Paid").length };
}

export function emptyWorkspace(): WorkspaceData { return { version: 1, mode: "own", invoices: [], receipts: [], decisions: {}, duplicateCount: 0 }; }

export function importRows(text: string): Record<string, unknown>[] {
  if (text.length > 3000000) throw new Error("Choose a file smaller than 3 MB.");
  const input = text.replace(/^\uFEFF/, "").trim();
  if (!input) throw new Error("The file is empty.");
  if (input.startsWith("[") || input.startsWith("{")) {
    const value = JSON.parse(input);
    if (!Array.isArray(value)) throw new Error("Use a JSON array of records. To restore a saved workspace, select Restore workspace.");
    if (value.length > 5000 || value.some(row => !row || typeof row !== "object" || Array.isArray(row))) throw new Error("Use at most 5,000 record objects.");
    return value;
  }
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false; let closed = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) { if (char === '"' && input[i + 1] === '"') { cell += '"'; i++; } else if (char === '"') { quoted = false; closed = true; } else cell += char; }
    else if (char === '"' && !cell && !closed) quoted = true;
    else if (char === ",") { row.push(cell); cell = ""; closed = false; }
    else if (char === "\n" || char === "\r") { if (char === "\r" && input[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; closed = false; }
    else { if (closed && char !== " " && char !== "\t") throw new Error("Invalid CSV: unexpected text after a quoted field."); if (!closed) cell += char; }
  }
  if (quoted) throw new Error("Invalid CSV: a quoted field was not closed.");
  row.push(cell); rows.push(row);
  const header = rows.shift()!.map(name => name.trim().toLowerCase());
  if (header.some(name => !name) || new Set(header).size !== header.length) throw new Error("CSV column names must be unique and non-empty.");
  const records = rows.filter(values => values.some(value => value.trim())).map((values, index) => { if (values.length !== header.length) throw new Error(`CSV row ${index + 2} has the wrong number of columns.`); return Object.fromEntries(header.map((key, position) => [key, values[position]])); });
  if (records.length > 5000) throw new Error("Use at most 5,000 records.");
  return records;
}

export function parseInvoiceRows(rows: Record<string, unknown>[]): Invoice[] {
  const ids = new Set<string>();
  return rows.map((row, index) => { try { const invoice = parseInvoice(row); if (ids.has(invoice.id)) throw new Error(`Duplicate invoice_id ${invoice.id}.`); ids.add(invoice.id); return invoice; } catch (error) { throw new Error(`Row ${index + 1}: ${(error as Error).message}`); } });
}

export function parseReceiptRows(rows: Record<string, unknown>[]): Receipt[] { return rows.map((row, index) => { try { return parseReceipt(row); } catch (error) { throw new Error(`Row ${index + 1}: ${(error as Error).message}`); } }); }

export function restoreWorkspace(text: string): WorkspaceData {
  if (text.length > 6000000) throw new Error("Choose a workspace smaller than 6 MB.");
  const value = JSON.parse(text);
  if (value.version !== 1 || !Array.isArray(value.invoices) || !Array.isArray(value.receipts) || value.invoices.length > 5000 || value.receipts.length > 5000) throw new Error("This is not a supported BCH Close workspace.");
  const invoices = parseInvoiceRows(value.invoices);
  // Restored receipt observations are file claims until refreshed through the provider.
  const merged = mergeReceipts([], parseReceiptRows(value.receipts));
  const decisions: Record<string, Decision> = {};
  for (const [key, decision] of Object.entries(value.decisions ?? {})) {
    const d = decision as Decision;
    const receipt = merged.receipts.find(receipt => receiptKey(receipt) === key);
    if (!receipt || !d || (d.invoiceId !== null && !invoices.some(invoice => invoice.id === d.invoiceId && invoice.address === receipt.address))) throw new Error("A saved review decision does not match the ledger.");
    const note = textField(d.note, 500); if (!note) throw new Error("Review decisions need a note.");
    decisions[key] = { invoiceId: d.invoiceId, note, at: Number.isNaN(Date.parse(d.at)) ? now() : d.at };
  }
  const previousDuplicates = Number.isSafeInteger(value.duplicateCount) && value.duplicateCount >= 0 ? value.duplicateCount : 0;
  return { version: 1, mode: value.mode === "sample" ? "sample" : "own", invoices, receipts: merged.receipts, decisions, duplicateCount: previousDuplicates + merged.duplicates };
}

export function csv(rows: unknown[][]): string {
  return rows.map(row => row.map(value => { let text = String(value ?? ""); if (/^[=+\-@\t\r]/.test(text)) text = "'" + text; return '"' + text.replace(/"/g, '""') + '"'; }).join(",")).join("\r\n");
}

export function exportReport(data: WorkspaceData) {
  const result = reconcile(data);
  return { schema: "bch-close-report/v1", generatedAt: now(), dataset: data.mode, confirmationPolicy: "At least 1 reported confirmation; imported confirmation counts are file claims.", invoices: result.invoices.map(row => ({ ...row.invoice, confirmedSats: row.confirmed.toString(), pendingSats: row.pending.toString(), outstandingSats: row.outstanding.toString(), excessSats: row.excess.toString(), status: row.status, receiptReferences: row.matches.map(match => ({ key: match.key, method: match.method })) })), receipts: result.matches.map(match => ({ ...match.receipt, key: match.key, assignedInvoice: match.invoiceId, matchMethod: match.method, explanation: match.reason, decision: data.decisions[match.key] ?? null })), totals: Object.fromEntries(Object.entries(result.totals).map(([key, value]) => [key + "Sats", value.toString()])), duplicateRecordsIgnored: data.duplicateCount };
}

export function reportCsv(data: WorkspaceData): string {
  const result = reconcile(data);
  const generatedAt = now();
  const header = ["record_type", "invoice_id", "customer", "expected_bch", "confirmed_bch", "pending_bch", "outstanding_bch", "excess_bch", "status", "txid", "output_index", "receipt_bch", "receiving_address", "confirmations", "source", "observed_at", "match_method", "review_note", "generated_at", "dataset"];
  const rows: unknown[][] = result.invoices.map(row => ["invoice", row.invoice.id, row.invoice.customer, formatBch(row.invoice.expectedSats, false), formatBch(row.confirmed, false), formatBch(row.pending, false), formatBch(row.outstanding, false), formatBch(row.excess, false), row.status, "", "", "", row.invoice.address, "", "", "", "", "", generatedAt, data.mode]);
  for (const match of result.matches) rows.push(["receipt", match.invoiceId ?? "", "", "", "", "", "", "", match.method === "Unmatched" ? "Review" : match.method, match.receipt.txid, match.receipt.vout, formatBch(match.receipt.amountSats, false), match.receipt.address, match.receipt.confirmations ?? "", match.receipt.source, match.receipt.observedAt, match.method, data.decisions[match.key]?.note ?? match.reason, generatedAt, data.mode]);
  return csv([header, ...rows]);
}
