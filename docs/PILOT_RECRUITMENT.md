# Real merchant pilot — recruitment and intake

Prepared 7 October 2026. The demo is public at https://bch-close.petervn.chatgpt.site. The builder reports manually sending four invitations on 7 October; no merchant reply or agreement has been provided. See [OUTREACH_STATUS.md](OUTREACH_STATUS.md).

The user approved the Paytaca invitation below, then reported sending it manually on 7 October 2026. The official support address was rechecked against Paytaca's Payment Hub documentation. The archived `PAYTACA_PILOT_INVITATION.eml` remains a draft artifact; its existence and the user's sending report do not independently verify delivery.

## First route

Ask Paytaca to introduce one willing merchant or bookkeeper from its existing BCH merchant network. Paytaca describes its merchant map as a directory of verified POS users, with recent activity available as a filter. This is a recruitment route, not evidence that Paytaca endorses BCH Close or that any merchant needs it.

The official Payment Hub webhook documentation lists `support@paytaca.com`. It is a verified public support address, not a dedicated pilot-partnership address. Ask the support team to route the request to merchant onboarding rather than assuming a specific employee will receive it.

Publicly profiled candidates:

| Business | Public evidence | Possible workflow to ask about |
| --- | --- | --- |
| Le Dure Room Rental, Ormoc City | Paytaca's podcast episode 29 describes it as a partner merchant, February 2026 | Rental invoices and payment references |
| Lorraine Travels and Tours, Ormoc City | Paytaca's podcast episode 27 profiles it as an early partner merchant, January 2026 | Booking invoices and deposits |
| Forever Café | Paytaca's podcast episode 26 profiles the business, January 2026 | Sales-to-payment closing, if records can be exported |

These are candidates for an introduction. Their current activity, bookkeeping needs, export formats and willingness remain unverified. Start with one consenting participant rather than contacting every listed business.

## Archived Paytaca invitation draft

To: `support@paytaca.com`

Subject: Looking for one BCH merchant reconciliation pilot

Hi Paytaca team,

I'm Peter, an independent builder in Vietnam. I've built BCH Close, a read-only workspace that compares expected invoice records with BCH payment outputs and exports a report of payment exceptions: https://bch-close.petervn.chatgpt.site

I'm looking for one willing BCH merchant or bookkeeper to compare it with their current reconciliation process using an anonymized batch of up to 30 existing BCH coin invoices. We'd measure accuracy and preparation/review time. Merchant results are not yet available.

Could you route this to merchant onboarding or introduce a suitable volunteer? We can first check a small redacted export for compatibility. Their raw data would remain private; we would agree separately on any aggregate results shared publicly.

Thank you,
Peter

## Intake before starting the timed comparison

1. Record who is consenting to the pilot and what results may be shared. Use a pseudonymous participant ID in public evidence.
2. Confirm the batch contains BCH coin payments supported by the app. CashToken balances and nonstandard scripts are outside the current version.
3. Obtain expected invoice IDs, BCH amounts owed, merchant receiving addresses, and available transaction/output references. Include unpaid invoices. Clarify how cancelled, refunded or fiat-priced invoices should be represented.
4. Confirm whether invoice amounts represent gross customer charges or the merchant payout after processor fees. Do not silently change invoice amounts to force a match. Payment Hub documents separate merchant-payout and processing-fee outputs, so this distinction may require an adapter or a clearly defined net-payout ledger before the current app is suitable.
5. Obtain actual `txid`, `output_index`, amount and recipient evidence, then agree an answer sheet independently of the app.
6. Run the existing-workflow and app comparison using PILOT_PROTOCOL.md, retaining preparation time as well as review time. Record unresolved records and format failures.
7. Ask the participant to complete a second batch before claiming reuse or adoption.

## Sources

- Paytaca Merchant Map: https://www.paytaca.com/applications/map
- Public merchant profiles: https://www.paytaca.com/podcast
- Official support address: https://paymenthub.paytaca.com/webhook-docs/
- Payment-output fee model: https://paymenthub.paytaca.com/

Retrieved 7 October 2026. The workflow-fit suggestions and proposed introduction route are our inferences from these public descriptions.
