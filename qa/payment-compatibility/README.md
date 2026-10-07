# Payment dependency compatibility preparation

Prepared 7 October 2026 before an organizer-confirmed BCH BLAZE development window. This isolated harness is not imported by the live BCH Close app and does not implement a usable payment feature. Preserve these dated preparation files when documenting later qualifying work.

## Run

Use Node 22.13+ and pnpm 11.25.0. Install here, independently of the application's dependencies:

```sh
cd qa/payment-compatibility
pnpm install --frozen-lockfile --ignore-scripts
pnpm verify
```

`pnpm verify` runs the 16 offline checks and browser-target module check, then writes `evidence/payment-compatibility.json` at the repository root. Generated bundles remain in ignored `.generated/`; dependencies and bundles are excluded from the source package.

## Verified package combination

| Package | Exact version |
| --- | --- |
| @wizardconnect/react | 0.2.3 |
| @wizardconnect/dapp | 0.2.2 |
| @wizardconnect/core | 0.2.4 |
| @bitauth/libauth | 3.1.0-next.2 |
| react / react-dom | 19.2.6 |
| esbuild (check only) | 0.28.0 |

The WizardConnect packages use wildcard internal dependencies. Explicit workspace overrides and the lockfile keep one tested core/dapp combination. The libauth prerelease matches the SDK dependency and `@bch-wc2/interfaces` peer version; it is a deliberate compatibility pin, not a claim that a prerelease is production-ready.

## What these checks establish

- The real installed packages import together, resolve one core/libauth, and render the idle hook on React 19 with persistence disabled.
- A memory transport receives the SDK's transaction request, named input path and `broadcast: false` field. Mock wallet rejection and AbortSignal cancellation reject the pending request. This does not prove any wallet honors the broadcast flag.
- The preparation guard checks an already-aborted signal before invoking the SDK. The production adapter still needs connection/review state, timeout, disconnect handling and one-attempt logic.
- The SDK and libauth agree on fixture serialization. Independent hashing verifies txid display byte order. Recipient output one is distinct from change output zero, and token-bearing outputs remain visible to a future coin-only guard.
- An ES2022 browser-target ESM bundle evaluates in a Node VM with web APIs, no Node globals and no socket opened. Libauth uses top-level await, so a classic IIFE bundle is unsuitable. This is module compatibility, not actual browser interaction, pairing, layout or download QA.

All transaction bytes and output scripts are fictional. They are not valid signed transactions, are not broadcast, and must never be used as payment destinations. The 400-satoshi fixture difference checks arithmetic only; it is not a fee recommendation or dust policy.

## Integration decisions still needed

The installed React types include `reconnecting`, beyond the four states shown in the current guide. Disable new payment attempts during reconnect and retain the active attempt until its outcome is resolved. Cancel/abort pending requests deliberately; SDK manager destruction alone should not be treated as proof that a wallet request was cancelled.

Use the lower-level Electrum response or an adapter that retains inclusion height. CashScript's standard UTXO interface returns confirmed and unconfirmed outputs without enough confirmation metadata for our confirmed-only funding rule. Its documentation identifies `bch.imaginary.cash` as a default mainnet host, but we have not verified a live endpoint, token capability, browser transport, limits or uptime. No live UTXO provider is configured by this harness.

Still required: a real supported wallet, live token-aware provider, previous-output validation, transaction construction and fee/dust policy, returned-transaction validation, explicit user-approved mainnet broadcast, payment receipt import/refresh, and real browser QA. These preparation checks do not satisfy BCH BLAZE's required WizardConnect or mainnet-send features.

## Third-party notices and primary references

WizardConnect: Copyright (C) 2026 Whiterun LLC; LGPL-3.0-or-later, as declared in the installed distribution's headers and official documentation. Packages are used unmodified. This repository publishes harness code and dependency references, not the SDK distribution or generated bundle. Preserve notices, license/source access and applicable LGPL obligations when shipping the eventual app bundle.

- SDK source: https://gitlab.com/riftenlabs/lib/wizardconnect
- SDK license: https://www.gnu.org/licenses/lgpl-3.0.html
- React guide: https://docs.riftenlabs.com/wizardconnect/react/
- Protocol guide: https://docs.riftenlabs.com/wizardconnect/protocol/
- libauth source/license (MIT): https://github.com/bitauth/libauth
- CashScript provider limitations: https://cashscript.org/docs/sdk/network-provider/
- Electrum provider and browser behavior: https://cashscript.org/docs/sdk/electrum-network-provider
- Token filtering and inclusion height: https://electrum-cash-protocol.readthedocs.io/en/latest/protocol-methods.html

Project source is publicly readable; no project-wide open-source license has been assigned. This preparation directory does not change that status.
