# BCH Close — proposed invoice payment upgrade

Prepared 7 October 2026. **Design only: no wallet integration, payment construction, signing or broadcast feature has been implemented.** Perform and document substantive implementation during the organizer-confirmed BCH BLAZE build period.

## Pre-event dependency preparation

The separate [compatibility harness](../qa/payment-compatibility/README.md) pins WizardConnect React 0.2.3, dapp 0.2.2, core 0.2.4 and libauth 3.1.0-next.2, with a lockfile and explicit overrides. Sixteen offline checks and an ES2022 browser-target ESM module check pass. The live app has not imported these dependencies. Mock transport forwarding `broadcast: false` is not proof of a real wallet honoring that flag. The installed hook types include `reconnecting`; handle it explicitly. Libauth requires top-level await, so use an ESM-capable build.

## Product outcome

A customer pays a BCH invoice through a connected wallet and downloads an output-specific receipt. The merchant imports that receipt into BCH Close, refreshes the transaction observation, and closes the invoice without guessing by amount. This extends the existing bookkeeping workflow and supplies a meaningful mainnet-send feature.

The measurable hypothesis is fewer missing references and less preparation/review time. Use the existing consenting-merchant pilot protocol; include file preparation time and accuracy, and report payment-completion observations separately from reconciliation time. A self-payment demonstration proves integration, not customer adoption or revenue.

## Minimal user flow

1. Open a dedicated payment screen with blank fields for invoice ID, BCH mainnet recipient and BCH amount. A merchant can prepare an invoice request file; opening it prepopulates a review screen, never starts a payment. This first version needs no shared invoice database or public customer records.
2. Connect a supported wallet through WizardConnect. Show connection state and the selected funding address. Do not request a seed phrase or BCH private key. Make the supported spending scope explicit rather than presenting one address's balance as the entire wallet balance.
3. Review invoice ID, full recipient address, payment amount, network fee, total spend, and change. Reject invalid mainnet addresses, unsupported scripts, invalid precision, insufficient funds and payment amounts below the verified dust policy.
4. The customer explicitly requests wallet approval. Freeze that payment intent while the wallet dialog is open; changing an invoice, address or amount cancels the request and requires a new review. Disable repeated clicks and keep one pending attempt.
5. The wallet signs. Validate the returned transaction against the reviewed inputs and outputs, then broadcast only after explicit customer authorization. Show a txid and observation status. A signature alone is not a successful broadcast, confirmation or paid invoice.
6. Download a receipt containing invoice ID, recipient, exact satoshis, txid and recipient output index. Import it into the merchant workspace as an unconfirmed wallet-origin record, then refresh the mainnet provider observation. Only the existing confirmation policy reduces outstanding amounts.

Sample and benchmark addresses must never become payment recipients automatically. The payment screen starts blank and requires an explicit recipient review. Imported files are untrusted input; the existing `mode: "own"` label is not proof that data is real or safe to pay. Do not add autonomous payment tools to WebMCP.

## Verified SDK shape

The official [React integration guide](https://docs.riftenlabs.com/wizardconnect/react/) documents `@wizardconnect/react`, `useWizardConnect`, `WizardConnectQRDialog`, connection state, and access to a `DappConnectionManager`. Its session persistence can be disabled with `persistSession: false`. Use that option for the first payment demo; keep pairing information out of invoice/receipt exports.

The official [dapp integration guide](https://docs.riftenlabs.com/wizardconnect/dapp/) documents `manager.signTransaction` with a BCH transaction, signing source outputs and `inputPaths`. Each path tuple identifies the input index, named wallet path and address index. Cancellation uses an `AbortSignal`. The adapter must construct a transaction; WizardConnect is not documented as a simple address-and-amount send API. Use an app-specific adapter and preserve the SDK's cancellation semantics.

The official [protocol guide](https://docs.riftenlabs.com/wizardconnect/protocol/) defines a response with signed transaction hex or an error and requires wallets to use `SIGHASH_ALL | SIGHASH_FORKID | SIGHASH_UTXOS`. A successful response does not contain an independently verified confirmation. Prefer signing without wallet broadcast, checking the reviewed transaction, then app broadcast; first confirm that the pinned SDK and selected wallet honor that option. If the wallet broadcasts itself, observation and duplicate-retry handling still apply.

The SDK's overview and connection-URI descriptions disagree about QR direction; the current dapp and React guides show the dapp displaying the pairing URI for the wallet to scan. Confirm actual behavior with the pinned release and target wallet rather than copying overview text into the UI.

## Funding and transaction construction

Limit the first implementation to confirmed, token-free P2PKH coin inputs from a displayed funding address derived through the connected wallet. Require supported receive and change paths; do not silently scan or spend all HD addresses. Report the limitation and allow the participant to fund the selected address using their wallet.

A candidate provider route is the [Electrum Cash protocol](https://electrum-cash-protocol.readthedocs.io/en/latest/protocol-methods.html): address/scripthash `listunspent` supports an explicit `exclude_tokens` filter. Fetch and decode each selected previous transaction so amount, locking script and absence of token data agree with the selected output. Fail on disagreement or missing data.

The [CashToken capability documentation](https://electrum-cash-protocol.readthedocs.io/en/latest/protocol-basics.html) describes `server.features().cashtokens` and token-aware responses. Require a compatible server and protocol version; absence of a token field from an incapable server is not sufficient evidence of a coin-only output. The live mainnet endpoint, browser-compatible transport, availability and rate limits remain to be verified. No unverified host is hard-coded in this design.

Select a maintained BCH transaction library and pin its actual version after inspecting its supported transaction types. Keep amounts as integer satoshis. Construct explicit recipient and change outputs; calculate fee from serialized transaction size under a verified fee policy, cap total fees, and handle dust change without silently adding a large fee. Recheck selected outpoints before requesting the signature. Reject token-bearing or unsupported inputs instead of treating their BCH value as freely spendable.

## Receipt and accounting changes

| Existing structure | Planned change |
| --- | --- |
| `Invoice` (`id`, `expectedSats`, `address`, `reference`) | Retain exact expected amounts and recipient checks. Record the payment's explicit invoice association and verified recipient output; never infer the invoice from amount alone. |
| `Receipt.source` currently sample/import/blockchair | Add a wallet-origin provenance type and migrate saved workspace validation deliberately. A wallet result starts with unknown/zero confirmations, never a fabricated confirmed count. |
| `mergeReceipts` preserves provider observations | Keep provider observations authoritative for confirmation refresh. Reject conflicting recipient, amount or explicit invoice claims atomically. |
| Receipt identity `txid:vout` | Decode the signed transaction to identify the recipient output. Confirm this output against provider data; do not assume output zero. Exclude payer change from the merchant's invoice credit. |
| CSV/JSON report and saved workspace | Preserve payment origin, output identity and observation time. Do not include relay credentials, connection URI secrets or xpubs in payment receipts or merchant reports. |

Keep the customer payment receipt separate from merchant-private review notes. Cancelling before signing creates no receipt. After a possible broadcast, mark uncertain outcomes explicitly and look up the original txid before allowing another payment attempt. Do not promise cancellation can reverse an already broadcast payment.

## Acceptance evidence

| Check | Required result |
| --- | --- |
| Pairing and disconnect | Real supported wallet connects in a desktop/mobile rehearsal; cancellation/disconnect clears the pairing and disables sending |
| Amount and output validation | Independent transaction decode confirms recipient amount, change and bounded fee; invalid precision/network/script and token inputs are rejected |
| Wallet rejection and cancellation | No fabricated payment receipt or paid status; UI can recover without a duplicate request |
| Broadcast uncertainty and retry | Original txid checked before any new attempt; repeated response/import cannot double-credit an invoice |
| Mainnet proof | Participant approves a small payment to an address they control or explicitly approve; record actual txid, recipient output, observation and eventual confirmation |
| Accounting regression | Existing accounting checks and fictional benchmark continue to pass; wallet-origin/import/provider refresh preserves provenance and deduplication |
| Public demo | Independent access, real wallet interaction, small-screen review and actual receipt downloads verified |
| Practical value | Consenting merchant pilot measures preparation plus review time, amount/assignment errors and follow-up use; publish only approved aggregate results |

SDK documentation supports the design, not an integration claim. A pinned SDK combination is now available in the preparation harness. Outstanding implementation dependencies are tested real wallet behavior, a live token-aware mainnet UTXO provider, transaction construction/fee policy, and actual browser access. Current synthetic/DOM results cannot stand in for any of those checks.
