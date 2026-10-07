import { normalizeBlockchair } from "@/lib/blockchair";

export async function GET(request: Request) {
  const txid = new URL(request.url).searchParams.get("txid")?.toLowerCase() ?? "";
  const headers = { "Cache-Control": "no-store" };
  if (!/^[a-f0-9]{64}$/.test(txid)) return Response.json({ error: "Enter a 64-character BCH transaction ID." }, { status: 400, headers });
  try {
    const response = await fetch(`https://api.blockchair.com/bitcoin-cash/dashboards/transaction/${txid}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) return Response.json({ error: response.status === 429 || response.status === 402 ? "Blockchair's public lookup limit has been reached. Try later or import a receipt file." : "Blockchair lookup is currently unavailable. Try later or import a receipt file." }, { status: 503, headers });
    if (Number(response.headers.get("content-length") || 0) > 3000000) return Response.json({ error: "This transaction response is too large. Import the relevant payment outputs instead." }, { status: 422, headers });
    const text = await response.text();
    if (text.length > 3000000) return Response.json({ error: "This transaction response is too large. Import the relevant payment outputs instead." }, { status: 422, headers });
    const value = normalizeBlockchair(JSON.parse(text), txid);
    return Response.json({ ...value, source: "Blockchair", network: "bitcoin-cash-mainnet" }, { headers });
  } catch (error) {
    const message = (error as Error).message;
    const status = message === "Transaction not found on Bitcoin Cash mainnet." ? 404 : 503;
    return Response.json({ error: status === 404 ? message : "The transaction could not be read from Blockchair. Try later or import a receipt file." }, { status, headers });
  }
}
