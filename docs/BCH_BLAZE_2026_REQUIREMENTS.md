# BCH BLAZE 2026 — requirements and readiness

Reviewed 7 October 2026 against the event text supplied by the builder from [the official DoraHacks page](https://dorahacks.io/hackathon/bchblaze2026/detail). This records supplied rules; unresolved links, dates and interpretations are not organizer confirmations.

**BCH Close is not currently eligible for the Mainnet Track.** The live prototype reads transaction outputs but does not send BCH or integrate WizardConnect. Its public demo and repository are useful starting evidence, not a completed entry.

## Mainnet Track

| Supplied requirement | Actual status on 7 October | Completion evidence |
| --- | --- | --- |
| Worldwide individuals or teams of 2–4 | An individual builder in Vietnam fits the stated participant category | Actual DoraHacks registration |
| Register and submit a valid project | Not registered or submitted | Platform registration and final submission receipt |
| Original or significantly improved during the hackathon; minor tweaks do not qualify | Read-only prototype existed before registration; qualifying build-period start is unspecified | Organizer-confirmed period, baseline, dated substantive improvement commits and before/after demo |
| At least one feature sending BCH mainnet transactions | Missing; Blockchair lookup is a read operation | Actual app-initiated payment approved by the user, mainnet txid, recipient output and network observation |
| WizardConnect integration | Missing | Live pairing and payment request demonstrated with a supported wallet |
| Clickable, usable live demo | Public deployment exists at https://bch-close.petervn.chatgpt.site; independent access and real browser rehearsal remain pending | Reviewer access without an owner session; successful end-to-end browser rehearsal |
| Short presentation based on BCH Blaze's Widget Factory template | Template link not available in the supplied text; presentation incomplete | Official template obtained and completed hosted presentation |
| A representative attends one Information / Workshop 1 / Workshop 2 / Workshop 3 preparation stream; roll call taken | No attendance recorded; schedule link missing | Actual participation and organizer roll-call acknowledgement |
| Confirm the project is real in the BCH BLAZE Telegram channel | Not completed; official channel link missing | Actual channel confirmation and message link |

The rules supplied here do not separately require a public repository, merchant pilot, demo video, or a chosen project license. We maintain public source and pursue a pilot to make the project reviewable and useful. Publishing source alone does not grant an open-source license.

## Schedule conflicts to resolve

| Event | Header | Body | Planning treatment |
| --- | --- | --- | --- |
| Registration opens | 10 October 2026, 19:00 | 10 October | Same date; header timezone unspecified |
| Registration closes | Not stated in header | Registrations remain open through 13 November | Plan to register before this date |
| Submissions open | 13 November 2026, 20:00 | 14 November | Confirm date and timezone |
| Submission deadline | 21 November 2026, 20:00 | 22 November | Use 21 November as the earlier provisional planning date; do not convert 20:00 without the timezone |
| Judging | Not supplied | 23–27 November | Advertised dates, subject to organizer updates |
| Winner announcement | Not supplied | 28 November | Advertised date, not a funding guarantee |
| Qualifying development begins | Not supplied | Significant improvements must occur during the hackathon | Registration opening is not proof of the build-period start; ask the organizer |

## Prizes and other tracks

Mainnet placement prizes are listed as $3,500 / $1,500 / $750 PUSD, with BLISS 2027 tickets as stated in the event. A later paragraph says prizes are distributed in BCH on mainnet. The denomination conflict needs clarification. The advertised $8,000 pool is not an individual grant.

Media entries can be submitted alongside Mainnet entries. The Media Track explicitly allows AI-created or assisted art, requires original/significantly improved work, a hosted artifact, stream attendance and Telegram confirmation. This does not establish a Mainnet coding policy. No separate media entry has been prepared.

Community Choice requires track eligibility and a listed CashTokens address able to receive EMBER2026. No such builder-controlled address has been supplied or verified. We must not substitute a sample address. TokenHunt completion and bounties need their own instructions before making a participation claim.

## Value and judging plan

| Mainnet judging category | BCH Close evidence to deliver |
| --- | --- |
| Innovation and creativity | Connect invoice payment to an output-specific bookkeeping receipt; explain the merchant problem and differences from existing workflows |
| Design and usability | Clear recipient/amount/fee review, successful mobile and desktop wallet pairing, accessible exception review, actual browser rehearsal |
| Technical strength | Mainnet payment and receipt observation, exact satoshi arithmetic, explicit output identity, pending/confirmed separation, cancellation and duplicate handling |
| Business or investment potential | One consenting merchant/bookkeeper pilot with total preparation/review time, accuracy and follow-up usage; pricing remains a hypothesis until a customer validates it |

No pilot, sales, attendance, mainnet-send, or wallet-integration result exists today. Current test evidence comprises automated accounting checks, a fictional benchmark and simulated DOM workflows.

## Immediate sequence

1. Await the organizer's response to the short question the builder reports posting on 7 October. Obtain the official template, stream and Telegram links; the longer draft in [APPLICATION_DRAFT.md](APPLICATION_DRAFT.md) includes additional questions not confirmed as posted. See [OUTREACH_STATUS.md](OUTREACH_STATUS.md).
2. Register when registration opens. Attend one qualifying stream and complete roll call; confirm the project in the official Telegram channel.
3. Implement the substantive [payment upgrade](PAYMENT_UPGRADE_SPEC.md) during the confirmed eligible period. Retain a clear baseline and dated changes.
4. Verify pairing, an actual user-approved mainnet payment, receipt reconciliation, independent public access and browser behavior. Run the consenting merchant pilot when a volunteer and compatible data are available.
5. Complete the official presentation, publish final links and submit before the clarified deadline.

## Preserved baseline

- Public repository: https://github.com/trungkien1992/bch-close
- Pre-event branch: https://github.com/trungkien1992/bch-close/tree/pre-bch-blaze-2026
- Public baseline commit: `0338b5b49bb06a2aa719e9e58933982f6fdefe82`
- Live application core commit: `8cdaceb2af40adcced59cf5410ba7b771e263b5e`

The public baseline includes packaging and evidence documents added to the live core. Preparing these documents does not change the live application or satisfy the requirement for significant hackathon development.
