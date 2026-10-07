# BCH Close — application draft

Prepared 7 October 2026. This is draft copy, not an application already submitted.

**Mainnet Track status: ineligible in its current form.** The supplied rules require a BCH mainnet-send feature and WizardConnect, both absent from this prototype. Use the descriptions below only for the current version. Do not describe the planned payment upgrade as shipped until implementation and real transaction evidence exist.

## One-line description

BCH Close helps merchants reconcile their invoice ledger against Bitcoin Cash payment outputs and export a report of paid, partial, unpaid, excess, pending, and unresolved payments.

## Project description

A merchant's expected invoices and incoming BCH outputs are separate records. BCH Close brings them into one review workspace. Import a complete CSV or JSON invoice ledger, including unpaid invoices, then import receipt outputs or look up a BCH mainnet transaction through Blockchair. The app records payment amounts in integer satoshis, distinguishes outputs by transaction ID and output index, and keeps ambiguous payments in review until the user records a decision.

The result is a CSV bookkeeping report and a JSON report with output references, data sources, observation times, and review notes. Duplicate receipt imports do not add payment credit. Pending or unknown confirmations remain separate from confirmed totals. The workspace can be saved to a file and restored later.

## What Bitcoin Cash is used for

BCH Close reads BCH coin payment outputs, validates mainnet CashAddr and legacy addresses, and reconciles the resulting satoshi amounts with invoices. The live lookup uses Blockchair's Bitcoin Cash transaction dashboard API. It is a read-only bookkeeping application; it does not require a wallet connection or broadcast transactions. The current version covers supported P2PKH/P2SH coin outputs, not CashToken balances.

The proposed hackathon improvement is an invoice payment flow: a customer pairs a BCH wallet through WizardConnect, approves a BCH mainnet payment in the wallet, and receives an output-specific receipt that the merchant can reconcile. This is a design proposal, not current functionality. See [PAYMENT_UPGRADE_SPEC.md](PAYMENT_UPGRADE_SPEC.md).

## Evidence available today

- The app is deployed at https://bch-close.petervn.chatgpt.site with public access enabled on 7 October 2026. Independent browser verification is pending.
- Application source, tests, fictional fixtures and validation evidence are published at https://github.com/trungkien1992/bch-close. A matching source export is included in this package.
- The original application passed 19 automated accounting, adapter, and compatibility checks.
- An isolated simulated-DOM harness passed 14 UI workflow checks for imports, duplicate handling, manual review, reports, save/restore and lookup error handling. Real browser and layout validation remains pending.
- A separate 30-invoice fictional fixture passed all 17 benchmark scenario groups. Every invoice's status, balances, and assigned outputs matched a declarative answer key generated without app reconciliation code.
- The 31-row receipt file contains 26 distinct outputs and five repeated rows. Reimporting the entire file added zero credit.
- A prior read-only adapter check returned a real public BCH transaction output of 370,856 satoshis. That transaction is integration evidence, not a merchant sale or pilot.

## Intended impact and how it will be measured

The intended benefit is less work closing a merchant's BCH invoice ledger while retaining exceptions and output evidence. It is a workflow hypothesis, not a claim that existing payment processors lack partial-payment handling.

The next validation is one consenting merchant or bookkeeper reviewing the same 30 invoices with their existing workflow and with BCH Close. Record total review time, incorrect amounts or assignments, duplicate credits, unresolved items, and time spent preparing files. A second batch will test whether the user returns to the workflow. A 50% reduction in review time is a proposed target, not a result already achieved.

## Current limitations

Browser interaction and responsive layout checks remain unverified in the available preview environment. Merchant adoption and human review-time improvements have not been measured. Files stay in the browser tab until the user saves a workspace; there is no shared invoice database. Imported confirmation counts are claims, while Blockchair results are provider observations rather than independent inclusion proofs. Public provider availability and quotas can interrupt lookups.

## Links to fill before submission

| Field | Current state |
| --- | --- |
| Live demo | https://bch-close.petervn.chatgpt.site — public access enabled |
| Public repository | https://github.com/trungkien1992/bch-close — public source, tests and evidence |
| Demo recording | Pending — walkthrough in DEMO_SCRIPT.md |
| Builder profile | Connected GitHub account: https://github.com/trungkien1992 |
| Widget Factory presentation | Pending — obtain and follow the official template |
| Mainnet transaction evidence | Pending — no transaction has been sent through BCH Close |
| WizardConnect wallet evidence | Pending — not implemented |
| Stream roll call / Telegram confirmation | Pending — no participation completion recorded |
| Individual prize or funding request | Mainnet placement prizes are advertised as $3,500 / $1,500 / $750 PUSD plus stated BLISS tickets; another paragraph says payout in BCH. Resolve the denomination conflict. The $8,000 total pool is not an individual award. |

## Organizer clarification draft

Hi BCH BLAZE team — I'm Peter, a solo builder in Vietnam preparing BCH Close: https://bch-close.petervn.chatgpt.site, with public source at https://github.com/trungkien1992/bch-close.

The 7 October prototype is read-only. I understand the Mainnet Track requires WizardConnect and a feature sending BCH mainnet transactions, so I plan a substantive invoice payment and receipt upgrade. Before I schedule that work, could you clarify:

1. When does the qualifying development period begin, and can an existing prototype enter with this substantial improvement made during that period? Are there Mainnet Track rules about AI-assisted coding or reused components?
2. Is the submission deadline 21 November at 20:00 as shown in the header, or 22 November as stated in the body, and in which timezone? When do submissions open?
3. Where are the Widget Factory presentation template, official Telegram channel, and preparation-stream schedule/roll-call instructions?
4. Are placement prizes paid in PUSD or BCH? The prize list and payout paragraph differ.

Thank you.

This question has not been sent.

## Reference

Official target page: https://dorahacks.io/hackathon/bchblaze2026/detail
The event text supplied by the builder on 7 October establishes worldwide individual eligibility, required mainnet sending and WizardConnect, the presentation template, roll-call attendance and Telegram confirmation. See [BCH_BLAZE_2026_REQUIREMENTS.md](BCH_BLAZE_2026_REQUIREMENTS.md) for the complete readiness mapping and unresolved details.
