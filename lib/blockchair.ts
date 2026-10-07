import { mergeReceipts, parseReceipt, type Receipt } from "./reconcile";

type ProviderOutput = { index?: unknown; value?: unknown; recipient?: unknown; type?: unknown; transaction_hash?: unknown };
type ProviderData = { data?: Record<string, { transaction?: { hash?: unknown; block_id?: unknown }; outputs?: ProviderOutput[] }>; context?: { code?: unknown; state?: unknown } };

export function normalizeBlockchair(payload: unknown, txid: string, observedAt = new Date().toISOString()): { receipts: Receipt[]; skippedOutputs: number } {
  if (!/^[a-f0-9]{64}$/.test(txid)) throw new Error("Invalid transaction ID.");
  const data = payload as ProviderData;
  if (data?.context?.code !== 200) throw new Error("Blockchair did not return a successful transaction response.");
  const item = data.data?.[txid];
  if (!item) throw new Error("Transaction not found on Bitcoin Cash mainnet.");
  if (item.transaction?.hash !== txid || !Array.isArray(item.outputs) || item.outputs.length > 5000) throw new Error("The provider returned an unsupported transaction response.");
  const block = item.transaction.block_id;
  const state = data.context.state;
  let confirmations: number | null = null;
  if (block === -1) confirmations = 0;
  else if (typeof block === "number" && Number.isSafeInteger(block) && block >= 0 && typeof state === "number" && Number.isSafeInteger(state) && state >= block) confirmations = state - block + 1;
  else if (block !== undefined && block !== null && !(typeof block === "number" && Number.isSafeInteger(block) && block >= 0)) throw new Error("The provider returned an invalid block height.");
  const receipts: Receipt[] = [];
  let skippedOutputs = 0;
  for (const output of item.outputs) {
    if (!["pubkeyhash", "scripthash"].includes(String(output.type)) || output.value === 0 || output.value === "0") { skippedOutputs++; continue; }
    if (output.transaction_hash !== undefined && output.transaction_hash !== txid) throw new Error("An output belongs to a different transaction.");
    if (typeof output.value === "number" && !Number.isSafeInteger(output.value)) throw new Error("The provider returned an imprecise amount.");
    receipts.push(parseReceipt({ txid, output_index: output.index, amount_sats: output.value, address: output.recipient, confirmations, observed_at: observedAt }, "blockchair"));
  }
  const merged = mergeReceipts([], receipts);
  if (merged.duplicates) throw new Error("The provider returned repeated output indexes.");
  return { receipts: merged.receipts, skippedOutputs };
}
