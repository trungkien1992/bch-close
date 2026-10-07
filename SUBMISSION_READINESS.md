# BCH Close — submission package

Prepared 7 October 2026. Core application source exported from commit `8cdaceb2af40adcced59cf5410ba7b771e263b5e`. The fixture, benchmark, evidence and submission documents are additions to this export. They have not changed the live Site. The export removes the owning Site's project ID and build cache; its neutral hosting configuration retains the fields required by the build.

**Not yet eligible for BCH BLAZE's Mainnet Track.** The current app is read-only: it has neither WizardConnect nor a feature sending BCH mainnet transactions. The event rules supplied by the builder on 7 October establish these requirements. [BCH_BLAZE_2026_REQUIREMENTS.md](docs/BCH_BLAZE_2026_REQUIREMENTS.md) maps every requirement and the unresolved dates; [PAYMENT_UPGRADE_SPEC.md](docs/PAYMENT_UPGRADE_SPEC.md) defines the proposed substantive improvement.

## Included

- Application source and pnpm lockfile.
- [Application copy](docs/APPLICATION_DRAFT.md), [demo recording script](docs/DEMO_SCRIPT.md), and [merchant pilot protocol](docs/PILOT_PROTOCOL.md).
- Thirty fictional invoice records, 31 receipt input rows, and a declarative answer key in `fixtures/synthetic-30`.
- A reproducible benchmark script and generated reports in `evidence`.
- An isolated DOM interaction harness in `qa` and its 14 passing workflow checks in `evidence/dom-workflow.json`.
- A blank pilot result form, a verified recruitment route and an approved but unsent invitation in docs/PILOT_RECRUITMENT.md. A ready-to-send copy is in docs/PAYTACA_PILOT_INVITATION.eml. No real merchant information is included.

## Measured synthetic result

| Metric | Result |
| --- | --- |
| Invoice rows matching the authored answer key | 30 / 30 |
| Benchmark scenario groups | 17 / 17 passed |
| Distinct receipt outputs | 26 |
| Repeated rows ignored on initial import | 5 |
| Additional credit after reimporting all 31 receipt rows | 0 satoshis |
| Ambiguous output left unassigned before a review decision | 1 |

Expected = 30,000,000 sats; confirmed = 19,800,000; outstanding = 10,400,000; excess = 200,000; pending = 2,000,000. These are synthetic accounting outcomes, not merchant revenue or observed human time savings. The 17 scenario groups are separate from the original application's 19 automated checks.

The 14 additional simulated-DOM checks cover initial rendering, reset confirmation, invoice and receipt file imports, duplicate reimport, search, required review input, manual assignment, CSV/JSON report export, workspace save/restore, invalid lookup IDs and simulated provider errors. The harness uses JSDOM with layout-dependent APIs stubbed and downloads intercepted as Blob contents. It does not verify actual browser layout, downloads or live lookup behavior.

## Reproduce

Use Node 22.13 or newer and the pnpm version in package.json.

```sh
pnpm install
python3 scripts/generate-synthetic-fixture.py
node scripts/benchmark-synthetic.mjs
node scripts/test-reconciliation.mjs
node node_modules/typescript/bin/tsc --noEmit
```

The benchmark recompiles the exported accounting source, compares each invoice's status, balances and output assignments with `expected.json`, and writes its run time, Node version and SHA-256 hashes to `evidence/synthetic-benchmark.json`. It contains no human review-time measurement. `fixtures/synthetic-30/workspace.json` is generated for a sample-labelled UI tour; the CSV files exercise the import path.

Run the isolated DOM harness after installing the main project's pnpm dependencies:

```sh
cd qa
npm ci --ignore-scripts
npm test
```

## Before submitting

| Requirement | State / concrete next action |
| --- | --- |
| Reviewer-accessible deployment | App exists at https://bch-close.petervn.chatgpt.site; public access was enabled on 7 October 2026. Confirm an independent reviewer can open it. |
| Public source repository | https://github.com/trungkien1992/bch-close — public repository containing this source tree, tests, fixtures and validation evidence. |
| License | Choose the project's license before calling it open source. Preserve existing third-party license notices. No new project license has been assigned here. |
| Browser checks | All 14 simulated-DOM workflow checks pass. Real browser interactions, real downloads, independent public access, and small-screen layout remain unverified. The Sites managed-preview instructions require the unavailable control-browser skill. |
| Recording | Record the walkthrough in docs/DEMO_SCRIPT.md and add the resulting link. |
| Worldwide individual eligibility | Permitted by the supplied Mainnet Track rules. This does not establish that the current project satisfies the track's technical and participation requirements. |
| BCH mainnet-send feature | Missing. Implement the invoice payment and receipt flow in docs/PAYMENT_UPGRADE_SPEC.md, then record an actual user-approved BCH mainnet transaction and its recipient output. Reading a public transaction does not satisfy this requirement. |
| WizardConnect | Missing. Add wallet pairing and the payment signing flow; verify it with a real supported wallet. |
| Significant improvement during the hackathon | Current source is preserved at public commit `0338b5b49bb06a2aa719e9e58933982f6fdefe82` on branch `pre-bch-blaze-2026`. Confirm the qualifying build period, then retain dated commits and before/after evidence for the payment upgrade. Registration opening does not establish the build-period start. |
| Registration | Not completed; registration is advertised to open on 10 October and remain open through 13 November. |
| Widget Factory presentation | Required template link not yet obtained; no template-based presentation is complete. |
| Preparation stream and roll call | Required; no representative attendance is recorded. Obtain the official stream schedule and attend at least one qualifying session. |
| BCH BLAZE Telegram confirmation | Required; not completed. Use the official event-linked channel and confirm the builder/project is real. |
| Dates and prize payout | Header lists submission 13 November 20:00 and deadline 21 November 20:00; body says 14–22 November. Header timezone is unknown. Prize list says PUSD while another paragraph says BCH. Obtain organizer clarification. |
| Evidence of practical value | Paytaca invitation is approved but unsent; Gmail is not installed or connected. Install and connect Gmail for sending, or open docs/PAYTACA_PILOT_INVITATION.eml in a mail client. Obtain participant consent and suitable data, then run the pilot. Adoption and the proposed 50% review-time improvement are unmeasured. |

The package is ready for review as a pre-event prototype and implementation plan. It is not a complete or submitted BCH BLAZE application. No organizer message or merchant outreach has been sent. A merchant pilot, project license, and demo recording are our quality/adoption goals, not additional eligibility rules inferred from the supplied event text.
