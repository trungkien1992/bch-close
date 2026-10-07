# BCH Close — two-minute walkthrough

This is a recording script, not a completed video. All benchmark records are fictional. The import, review, report and save/restore sequence has passed a simulated-DOM check and still needs a real browser rehearsal.

This script demonstrates the pre-event accounting prototype. It is not a complete BCH BLAZE Mainnet Track demonstration: the app currently has no WizardConnect or mainnet-send feature. After the planned payment upgrade, add a separate segment showing pairing, explicit wallet approval, an actual mainnet transaction, and its recipient output moving from pending to confirmed in the ledger. Use only a recipient address controlled or explicitly approved by the participant; never pay a fixture address.

## Preparation

Use a fresh tab and the package's `fixtures/synthetic-30` folder. Do not mix a merchant's records with this fixture. For a sample-labelled tour, use Workspace → Restore workspace and choose `workspace.json`; it contains the 30-invoice fixture. For the import and duplicate segment below, start empty and import CSV files. CSV imports enter the app's own-data mode; that label describes the import path, not actual mainnet activity. Say and show that the fixture is fictional.

## Recording sequence

| Time | Screen action | Narration |
| --- | --- | --- |
| 0:00–0:15 | Open BCH Close. Show the invoice ledger. | “BCH Close compares a merchant's expected invoices with BCH payment outputs. This demonstration uses 30 fictional invoices.” |
| 0:15–0:35 | Workspace → Start empty. Confirm. Import data → Invoices. Choose `invoices.csv`, then Import invoices. Import data → Receipts. Choose `receipts-with-duplicates.csv`, then Import receipts. | “We include unpaid invoices in the expected ledger. The receipt file has 31 rows, including five repeated output records.” |
| 0:35–0:55 | Show totals and invoice statuses. | “Expected value is 0.30000000 BCH. Reported confirmed payments total 0.19800000. Outstanding is 0.10400000, with 0.00200000 excess and 0.02000000 pending. Pending amounts have not reduced the outstanding balance.” |
| 0:55–1:10 | Import the same receipt CSV again. Show unchanged totals. | “Repeating the import adds no payment credit. Output identity is transaction ID plus output index, so separate outputs in the same transaction are still counted separately.” |
| 1:10–1:35 | Open Receipts. Find the unresolved output associated with SYN-029/SYN-030. Open its detail. Select SYN-029, add the note below, and Save review decision. | “Two invoices reuse the same address and expected amount. The app leaves this output unassigned. For this fictional exercise, the answer key says it belongs to SYN-029. We record that decision with a note.” |
| 1:35–1:50 | Show SYN-029 Paid and SYN-030 Unpaid. Export CSV and JSON from the report menu. | “The decision settles one invoice. The other stays unpaid. Reports retain invoice rows, output references, sources, and the review note.” |
| 1:50–2:00 | Workspace → Save workspace JSON. | “Save the workspace to continue later. The next test is a consenting merchant pilot measuring accuracy and review time on real records.” |

Fictional review note: `FICTIONAL: independent fixture answer assigns this output to SYN-029.`

Before the manual decision, expected status counts are 16 Paid, 4 Partial, 4 Unpaid, 2 Excess, 2 Pending, and 2 Review. After assigning the ambiguous output to SYN-029, confirmed becomes 0.20800000 BCH and outstanding becomes 0.09400000 BCH. SYN-030 remains unpaid. Excess and pending totals do not change.

## Optional mainnet lookup segment

Keep this separate from the fictional payment-matching exercise. Choose Look up transaction and enter the public transaction below. Read the returned output before deciding whether to import it. There is no need to import it into the fictional ledger.

`03601432293ea54c4852b5850f0e34f2810256001dfb48cfcb10bf0c73341008`

At the prior integration check, output 0 was 370,856 satoshis. Confirmation counts can change. Provider failures should be shown honestly. This transaction is not evidence of a merchant using BCH Close.

## Recording acceptance

- Rehearse the interactions in a browser and check the report downloads and saved workspace.
- State that the fixture is fictional and distinguish mainnet lookup from merchant validation.
- Ensure the demo link opens for a reviewer without the owner's session before sharing it externally.
- Upload an actual recording and add its link to APPLICATION_DRAFT.md. No recording is included today.
