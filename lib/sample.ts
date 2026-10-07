import { amountToSats, normalizeAddress, receiptKey, type Invoice, type Receipt, type WorkspaceData } from "./reconcile";

const addresses = ["1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu", "1KXrWXciRDZUpQwQmuM1DbwsKDLYAYsVLR", "16w1D5WRVKJuZUsSRzdLp9w3YGcgoxDXb", "3CWFddi6m4ndiGyKqzYvsFYagqDLPVMTzC", "3LDsS579y7sruadqu11beEJoTjdFiFCdX4", "31nwvkZwyPdgzjBJZXfDmSWsC4ZLKpYyUw"].map(normalizeAddress);
const tx = (n: number) => n.toString(16).padStart(64, "0");

export function sampleWorkspace(): WorkspaceData {
  const invoice = (n: number, customer: string, amount: string, address: string): Invoice => ({ id: `INV-${String(n).padStart(3, "0")}`, customer, expectedSats: amountToSats(amount), address, dueDate: "2026-10-06", reference: "" });
  const invoices = [invoice(1, "Lantern Coffee", "0.125", addresses[0]), invoice(2, "Northside Studio", "0.15", addresses[1]), invoice(3, "Paper & Pine", "0.04", addresses[2]), invoice(4, "Fieldwork Supply", "0.20", addresses[3]), invoice(5, "Linh Design", "0.06", addresses[4]), invoice(6, "Moss Market", "0.06", addresses[4]), invoice(7, "Orbit Print", "0.10", addresses[5]), invoice(8, "Monday Goods", "0.035", addresses[2])];
  const receipt = (n: number, amount: string, address: string, invoiceId = "", confirmations: number | null = 6, vout = 0): Receipt => ({ txid: tx(n), vout, amountSats: amountToSats(amount), address, invoiceId, confirmations, source: "sample", observedAt: "2026-10-07T03:00:00.000Z" });
  const receipts = [receipt(1, "0.125", addresses[0]), receipt(2, "0.09", addresses[1]), receipt(3, "0.2025", addresses[3]), receipt(4, "0.06", addresses[4]), receipt(5, "0.025", addresses[5], "", 6, 0), receipt(5, "0.075", addresses[5], "", 6, 1), receipt(6, "0.035", addresses[2], "INV-008", 0)];
  invoices[7].reference = receiptKey(receipts[6]);
  return { version: 1, mode: "sample", invoices, receipts, decisions: {}, duplicateCount: 1 };
}
