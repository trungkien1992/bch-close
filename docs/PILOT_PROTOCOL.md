# BCH Close — merchant pilot protocol

Status: ready to run; no merchant has been enrolled and no pilot results have been recorded.

## Decision to test

Does BCH Close help a merchant or bookkeeper close a BCH invoice ledger more quickly while preserving correct balances and explicit review of ambiguous payments?

## Dataset and permission

Use one consenting merchant's 30-invoice closed batch and the payment output records needed to reconcile it. Include their actual mix of paid, partial, unpaid, excess, pending and ambiguous cases; do not manufacture real-world exceptions to match the synthetic fixture. Remove customer names and unnecessary personal information. Keep private raw records out of a public repository, recording, or grant application. Public addresses and transaction IDs can still reveal business relationships, so agree in advance on which evidence may be shared.

Prepare an adjudicated answer sheet with the merchant: expected invoice amount, confirmed assigned output amounts, pending amounts, unresolved exceptions, and the documents supporting each assignment. A confirmation that funds arrived at an address is insufficient to decide which of several invoices a payment belongs to.

## Comparison

Run the merchant's current spreadsheet or bookkeeping process and BCH Close against equivalent copies of the same 30-invoice batch. Use two comparable reviewers and swap methods on a second comparable batch when possible. If only one reviewer is available, record the order and acknowledge that prior familiarity can make the second method faster. Do not describe a single sequential comparison as a controlled study.

Time file preparation separately from reconciliation. Start reconciliation timing when source records are ready; stop when the reviewer produces the report and records remaining exceptions. Include lookup delays and manual decisions within the reconciliation time. Report total end-to-end time as well as reconciliation time so import preparation is not hidden.

## Measurements

| Measure | How to record it | Success condition |
| --- | --- | --- |
| Confirmed, pending, outstanding and excess | Compare per-invoice and total satoshis against the answer sheet | Exact agreement, or a documented discrepancy requiring correction |
| Wrong invoice assignments | Count assignments contradicted by the agreed evidence | Zero |
| Duplicate credits | Reimport the same receipt batch and compare balances | Zero extra credit |
| Ambiguous payments | Record which were flagged, resolved with evidence, or left unresolved | No unsupported automatic assignment |
| Reconciliation time | Seconds for existing workflow and BCH Close | Proposed target: at least 50% reduction; not yet achieved |
| End-to-end time | Preparation plus reconciliation seconds | Report alongside the reconciliation result |
| Reuse | Ask the merchant to complete a second batch | Record whether they return and complete it |

Review-time reduction = `(baseline_seconds - app_seconds) / baseline_seconds × 100`. Report batch size, exception mix, reviewer, method order, file-preparation time, and any failed imports. A faster report with wrong invoice assignments is not a successful result.

## Result form

Use `pilot-results-template.csv`. Every timing, count and consent field is blank intentionally. Fill it with observations rather than proposed targets. Retain notes on disagreements and any app fixes. Keep raw merchant records private; share an agreed aggregate summary and redacted evidence only.

## Go / revise decision

Proceed with an impact claim only after the results support it. If a merchant's export does not retain stable output indexes or invoice references, build a documented adapter for that actual source and remeasure with its file-preparation time included. If the app misassigns payments or produces incorrect balances, correct the cause before using timing improvements in an application.
