"""Generate fictional records and a declarative answer key; uses no app code."""
import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "fixtures" / "synthetic-30"
ROOT.mkdir(parents=True, exist_ok=True)
STAMP = "2026-10-07T04:00:00.000Z"
# Public address test vectors. These are not merchant receiving addresses.
ADDRESSES = [
    "1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu",
    "1KXrWXciRDZUpQwQmuM1DbwsKDLYAYsVLR",
    "3LDsS579y7sruadqu11beEJoTjdFiFCdX4",
]
ANSWERS = {
    "Paid": dict(confirmedSats="1000000", pendingSats="0", outstandingSats="0", excessSats="0"),
    "Partial": dict(confirmedSats="400000", pendingSats="0", outstandingSats="600000", excessSats="0"),
    "Unpaid": dict(confirmedSats="0", pendingSats="0", outstandingSats="1000000", excessSats="0"),
    "Excess": dict(confirmedSats="1100000", pendingSats="0", outstandingSats="0", excessSats="100000"),
    "Pending": dict(confirmedSats="0", pendingSats="1000000", outstandingSats="1000000", excessSats="0"),
    "Review": dict(confirmedSats="0", pendingSats="0", outstandingSats="1000000", excessSats="0"),
}

def tx(number):
    return hashlib.sha256(f"BCH Close fictional fixture v1 output group {number}".encode()).hexdigest()

def bch(sats):
    return f"{sats // 100000000}.{sats % 100000000:08d}"

def invoice_id(number):
    return f"SYN-{number:03d}"

def receipt(number, sats, address, invoice, confirmations=6, vout=0):
    return dict(txid=tx(number), output_index=vout, amount_sats=str(sats), address=address,
                invoice_id=invoice, confirmations=confirmations, observed_at=STAMP)

invoices, receipts, oracle_rows = [], [], []
for number in range(1, 31):
    status = ("Paid" if number <= 16 else "Partial" if number <= 20 else
              "Unpaid" if number <= 24 else "Excess" if number <= 26 else
              "Pending" if number <= 28 else "Review")
    address = ADDRESSES[0 if number <= 26 else 1 if number <= 28 else 2]
    iid = invoice_id(number)
    invoices.append(dict(invoice_id=iid, customer=f"Fictional customer {number:02d}",
                         expected_sats="1000000", address=address, due_date="2026-10-06", payment_reference=""))
    keys = []
    if number <= 15:
        receipts.append(receipt(number, 1000000, address, iid))
        keys = [f"{tx(number)}:0"]
    elif number == 16:
        receipts.extend([receipt(number, 400000, address, iid), receipt(number, 600000, address, iid, vout=1)])
        keys = [f"{tx(number)}:0", f"{tx(number)}:1"]
    elif number <= 20:
        receipts.append(receipt(number, 400000, address, iid))
        keys = [f"{tx(number)}:0"]
    elif 25 <= number <= 26:
        receipts.append(receipt(number, 1100000, address, iid))
        keys = [f"{tx(number)}:0"]
    elif 27 <= number <= 28:
        receipts.append(receipt(number, 1000000, address, iid, confirmations=0 if number == 27 else None))
        keys = [f"{tx(number)}:0"]
    oracle_rows.append(dict(invoice_id=iid, status=status, expectedSats="1000000", receiptKeys=keys, **ANSWERS[status]))

# One receipt for two invoices sharing the same address and amount; no invoice ID.
receipts.append(receipt(29, 1000000, ADDRESSES[2], ""))
duplicate_positions = [0, 5, 15, 16, 25]
input_rows = receipts + [dict(receipts[i]) for i in duplicate_positions]

def save_json(name, data):
    (ROOT / name).write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")

def save_csv(name, rows, fields):
    with (ROOT / name).open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)

save_json("invoices.json", invoices)
save_json("receipts-with-duplicates.json", input_rows)
save_csv("invoices.csv", [{**i, "expected_bch": bch(int(i["expected_sats"]))} for i in invoices],
         ["invoice_id", "customer", "expected_sats", "expected_bch", "address", "due_date", "payment_reference"])
save_csv("receipts-with-duplicates.csv", [{**r, "amount_bch": bch(int(r["amount_sats"]))} for r in input_rows],
         ["txid", "output_index", "amount_sats", "amount_bch", "address", "invoice_id", "confirmations", "observed_at"])
save_json("expected.json", dict(
    schema="bch-close-synthetic-oracle/v1", synthetic=True,
    description="Fictional 30-invoice fixture. Declarative answer key written without reconciliation code.",
    counts=dict(invoices=30, inputReceiptRows=31, uniqueReceiptOutputs=26, duplicateRows=5, unresolvedOutputs=1, exceptionInvoices=14),
    statusCounts=dict(Paid=16, Partial=4, Unpaid=4, Excess=2, Pending=2, Review=2),
    totals=dict(expected="30000000", confirmed="19800000", outstanding="10400000", excess="200000", pending="2000000"),
    invoices=oracle_rows,
    ambiguousOutput=f"{tx(29)}:0", ambiguousCandidates=["SYN-029", "SYN-030"],
    manualDecision=dict(invoiceId="SYN-029", note="FICTIONAL: independent fixture answer assigns this output to SYN-029.", at=STAMP),
    afterManualTotals=dict(expected="30000000", confirmed="20800000", outstanding="9400000", excess="200000", pending="2000000"),
))
save_json("fixture-manifest.json", dict(synthetic=True, fixtureVersion=1, invoices=30,
    note="Every invoice, customer and transaction ID is fictional. Addresses are public library test vectors. Do not send funds or treat these files as mainnet payment evidence.",
    generatedBy="scripts/generate-synthetic-fixture.py", oracleUsesAppCode=False))
print("Generated 30 fictional invoices, 26 distinct outputs and 5 duplicate input rows.")
