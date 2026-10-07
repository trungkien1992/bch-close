# BCH Close — submission package

Prepared 7 October 2026. Core application source exported from commit `8cdaceb2af40adcced59cf5410ba7b771e263b5e`. The fixture, benchmark, evidence and submission documents are additions to this export. They have not changed the live Site. The export removes the owning Site's project ID and build cache; its neutral hosting configuration retains the fields required by the build.

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
| Eligibility and official rules | Confirm remote solo eligibility for a Vietnam-based builder, AI assistance, pre-registration work and component reuse, qualifying BCH functionality, formats, judging, closing time, and payout terms. |
| Evidence of practical value | Paytaca invitation is approved but unsent; Gmail is not installed or connected. Install and connect Gmail for sending, or open docs/PAYTACA_PILOT_INVITATION.eml in a mail client. Obtain participant consent and suitable data, then run the pilot. Adoption and the proposed 50% review-time improvement are unmeasured. |

The package is ready for review and repository import. It is not yet a completed or submitted BCH BLAZE application. No organizer message or merchant outreach has been sent.
