# BCH Close

Live demo: https://bch-close.petervn.chatgpt.site  
Public source: https://github.com/trungkien1992/bch-close

See [SUBMISSION_READINESS.md](SUBMISSION_READINESS.md) for the source package, reproducible 30-invoice synthetic benchmark, application copy, demo script, and pilot protocol.

A merchant bookkeeping workspace that reconciles a complete expected-invoice ledger against Bitcoin Cash payment outputs. The app starts with clearly marked fictional sample data and accepts CSV/JSON records, explicit review decisions, and read-only BCH mainnet transaction lookups through Blockchair.

## Product flow

1. Import invoices, including unpaid invoices.
2. Import receipt outputs or look up a real BCH transaction ID.
3. Review reused receiving addresses, conflicting references, and unassigned outputs.
4. Export a CSV report or JSON evidence report. Save a workspace JSON to resume a session.

Invoice files are processed in the browser tab, not stored in a shared database. Closing or reloading the tab resets the workspace unless the user saved and restores a workspace JSON. Transaction lookup sends only the requested transaction ID to the app's fixed Blockchair adapter.

## Import formats

Invoice CSV / JSON object fields:

- Required: `invoice_id`, `expected_bch`, `address`.
- Optional: `customer`, `due_date` (`YYYY-MM-DD`), `payment_reference` (`txid:output_index`).
- `expected_sats` is accepted instead of `expected_bch` for JSON/integration use.

Receipt fields:

- Required: `txid`, `output_index`, `amount_bch`, `address`.
- Optional: `invoice_id`, `confirmations`, `observed_at` (ISO timestamp).
- `amount_sats` is accepted instead of `amount_bch`.
- Empty confirmations are unknown. Zero confirmations are pending.

CSV templates and fictional sample files can be downloaded from the app's Guide. Up to 5,000 invoice records and 5,000 unique outputs are supported per workspace; file limits are 3 MB for imports and 6 MB for restored workspace JSON.

## Accounting rules

Amounts use integer satoshis throughout. Decimal BCH amounts have at most eight decimal places. Outputs are uniquely identified by `txid:output_index`; repeat imports never add another credit. Conflicting amounts, recipients, or explicit invoice IDs for the same output reject the import atomically.

CashAddr and supported legacy P2PKH/P2SH mainnet addresses are normalized through the standalone browser distribution of `bchaddrjs` 0.5.2, avoiding Node-only imports in the client. Explicit payment references and invoice IDs must agree with the receiving address. An address used by only one invoice in the current ledger may match automatically; users must ensure that address is actually invoice-specific. Reused addresses require review. Amount equality alone does not select an invoice.

Only receipts with at least one reported confirmation reduce outstanding amounts. Unknown and pending confirmations remain separate. Excess on one invoice never reduces another invoice's outstanding amount. Users can assign a receipt only to an invoice with the same recipient address, or exclude it, with a required note.

Imported and restored observations are file claims. A current Blockchair lookup is a provider observation, not an independent proof of blockchain inclusion. Confirmation counts may change after refresh. Imported data cannot overwrite a live provider observation. The app tracks BCH coin amounts; it does not reconcile CashToken units or nonstandard scripts.

## Development

Use the package manager and checked-in lockfile selected for this project.

```sh
pnpm install
pnpm dev
```

The project is a Vinext React app with a Cloudflare Worker-compatible build. This export contains a neutral `.openai/hosting.json` without the owning Site's project ID. A supervised Sites preview is required in managed environments.

```sh
node node_modules/typescript/bin/tsc --noEmit
node scripts/test-reconciliation.mjs
pnpm build
```

Tests compile the accounting modules into the ignored `.sites-runtime/core-tests` folder, then run 19 accounting and compatibility checks with Node's test runner.

## External data

The server endpoint `GET /api/transaction?txid=...` uses the documented Blockchair Bitcoin Cash transaction dashboard API. It validates the transaction ID and output identity, reads integer satoshi values, includes supported P2PKH/P2SH outputs, and records an observation time. Confirmation count is calculated as `tip_height - inclusion_height + 1`, with zero for mempool transactions and unknown if the required heights are unavailable.

Public Blockchair quotas, restrictions, and outages can make lookups unavailable. The app reports failures without inventing receipts; file imports remain usable.

Primary references:

- https://github.com/Blockchair/Blockchair.Support/blob/master/API_DOCUMENTATION_EN.md#link_200
- https://github.com/ealmansi/bchaddrjs

## Validation status — 7 October 2026

- TypeScript checking passed.
- The full workspace rendered successfully with React server rendering, including all eight sample invoices, totals, status labels, and the review queue.
- 19 accounting/adapter/compatibility checks passed: exact totals, duplicate imports, separate outputs in one transaction, pending counts, reused addresses, reference mismatches, manual decisions, atomic rejection, CSV parsing, workspace round trip, evidence export, provider normalization and refreshed observations.
- The adapter read a real public BCH mainnet transaction (`03601432293ea54c4852b5850f0e34f2810256001dfb48cfcb10bf0c73341008`), returning output 0 with 370,856 satoshis. This is a data-integration check, not a merchant sale or pilot result.
- The bundled browser accounting module also ran successfully without Node globals.
- Internal preview access returned an infrastructure error. Browser interaction/responsive QA and optional WebMCP validation are unavailable in this environment.
- The exported source package adds a fictional 30-invoice benchmark: all 17 scenario groups pass and all 30 invoice rows match a declarative answer key. Reimporting all 31 receipt input rows adds zero payment credit. Run `node scripts/benchmark-synthetic.mjs` to reproduce it.
- The exported package's isolated JSDOM harness passes 14 UI workflow checks, including file imports, manual assignment, reports, save/restore and simulated lookup errors. It does not verify real browser layout or downloads. Run `cd qa && npm ci --ignore-scripts && npm test` after installing the main app dependencies.
- Public access to the existing deployment was enabled on 7 October 2026 and confirmed through native access/deployment status. An independent logged-out browser check remains pending.
- Merchant adoption, a 30-invoice timed merchant pilot, and the proposed 50% review-time improvement remain unmeasured.
- BCH BLAZE entry eligibility, AI-assisted development rules, component-reuse terms, exact deadline and individual payout conditions are not established by this implementation.

## Browser agent tools

Where supported, the app feature-detects `document.modelContext` and exposes a read-only reconciliation report plus a tool that opens the import dialog. Both reuse visible app state. Unsupported browsers continue to use the regular UI. No autonomous import, review assignment, or financial transaction tool is exposed.
