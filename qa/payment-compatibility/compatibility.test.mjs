import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EventEmitter } from 'node:events';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  RelayMsgAction, childIndexOfPathName, parseExtendedJson,
} from '@wizardconnect/core';
import { sourceOutputToRelay, transactionToHex } from '@wizardconnect/core/hdwalletv1-serialize';
import { DappConnectionManager } from '@wizardconnect/dapp';
import { useWizardConnect, WizardConnectQRDialog } from '@wizardconnect/react';
import {
  binToHex, hexToBin, decodeTransactionBch, encodeTransactionBch,
  hashTransactionUiOrder, SigningSerializationFlag,
} from '@bitauth/libauth';
import { fixtureScripts, transactionFixture, signingRequestFixture } from './fixtures.mjs';

const require = createRequire(import.meta.url);

function packageMetadata(name) {
  return JSON.parse(readFileSync(new URL('../package.json', new URL(require.resolve(name), 'file:')), 'utf8'));
}

class MemoryRelay extends EventEmitter {
  messages = [];
  sequence = 0;
  nextSequence() { return ++this.sequence; }
  async relay(message) { this.messages.push(message); }
}

function mockManager(t) {
  const manager = new DappConnectionManager('BCH Close offline probe', undefined, { session: false });
  const relay = new MemoryRelay();
  // Public SDK entry point with a memory transport. Do not initiate a real relay.
  manager.updateConnection(relay, { status: 'connecting' });
  t.after(() => manager.destroy());
  return { manager, relay };
}

function response(sequence, fields = {}) {
  return {
    action: RelayMsgAction.SignTransactionResponse,
    sequence,
    time: Math.floor(Date.now() / 1000),
    signedTransaction: '',
    ...fields,
  };
}

// Probe-only guard. Future production code must also enforce review, connection,
// output/fee checks and uncertain-broadcast state before invoking the SDK.
async function requestUnlessAlreadyCancelled(manager, request, signal) {
  signal.throwIfAborted();
  return manager.signTransaction(request, { signal });
}

test('the installed SDK and React versions match the explicit pins', () => {
  assert.equal(packageMetadata('@wizardconnect/core').version, '0.2.4');
  assert.equal(packageMetadata('@wizardconnect/dapp').version, '0.2.2');
  assert.equal(packageMetadata('@wizardconnect/react').version, '0.2.3');
  assert.equal(require('react/package.json').version, '19.2.6');
});

test('all SDK packages resolve one core and libauth version', () => {
  const corePath = require.resolve('@wizardconnect/core');
  const libauthPath = require.resolve('@bitauth/libauth');
  for (const name of ['@wizardconnect/dapp', '@wizardconnect/react']) {
    const scoped = createRequire(require.resolve(name));
    assert.equal(scoped.resolve('@wizardconnect/core'), corePath);
  }
  assert.equal(createRequire(corePath).resolve('@bitauth/libauth'), libauthPath);
});

test('the hook renders idle on React 19 without pairing or persisted state', () => {
  function Probe() {
    const wc = useWizardConnect({ dappName: 'BCH Close offline probe', persistSession: false });
    assert.equal(wc.state, 'idle');
    assert.equal(wc.manager, null);
    assert.equal(wc.uri, null);
    return React.createElement('span', null, wc.state);
  }
  assert.equal(renderToStaticMarkup(React.createElement(Probe)), '<span>idle</span>');
  assert.equal(renderToStaticMarkup(React.createElement(WizardConnectQRDialog, {
    show: false, onClose() {}, uri: '', qrUri: '',
  })), '');
});

test('named wallet paths match the documented receive/change convention', () => {
  assert.equal(childIndexOfPathName('receive'), 0);
  assert.equal(childIndexOfPathName('change'), 1);
  assert.equal(childIndexOfPathName('defi'), 7);
  assert.equal(childIndexOfPathName('unsupported'), undefined);
});

test('disabled SDK persistence has no restored wallet identity or paths', t => {
  const { manager } = mockManager(t);
  assert.equal(manager.loadStoredSession(), null);
  assert.equal(manager.walletName, null);
  assert.deepEqual(manager.getSessionPaths(), []);
  assert.equal(manager.getPubkey(0, 0n), undefined);
});

test('the SDK forwards broadcast=false and the exact unsigned request to memory transport', async t => {
  const { manager, relay } = mockManager(t);
  const request = signingRequestFixture();
  const pending = manager.signTransaction(request);
  const sent = relay.messages[0];
  assert.equal(sent.action, RelayMsgAction.SignTransactionRequest);
  assert.equal(sent.transaction.broadcast, false);
  assert.equal(sent.transaction.transaction, request.transaction.transaction);
  assert.deepEqual(sent.inputPaths, [[0, 'receive', 0]]);
  assert.equal(sent.transaction.sourceOutputs[0].valueSatoshis, 100_000n);
  // This is a mock response with unsigned fixture bytes, not a valid signature.
  relay.emit('message', response(sent.sequence, { signedTransaction: request.transaction.transaction }));
  assert.equal((await pending).signedTransaction, request.transaction.transaction);
});

test('wallet rejection rejects the request rather than fabricating a successful response', async t => {
  const { manager, relay } = mockManager(t);
  const pending = manager.signTransaction(signingRequestFixture());
  const rejected = assert.rejects(pending, /Declined in offline fixture/);
  relay.emit('message', response(relay.messages[0].sequence, { error: 'Declined in offline fixture' }));
  await rejected;
});

test('AbortSignal cancellation rejects and sends sign_cancel for the same request', async t => {
  const { manager, relay } = mockManager(t);
  const controller = new AbortController();
  const pending = manager.signTransaction(signingRequestFixture(), { signal: controller.signal });
  const rejected = assert.rejects(pending, error => error.name === 'AbortError');
  controller.abort('User cancelled offline fixture');
  await rejected;
  assert.equal(relay.messages[1].action, RelayMsgAction.SignCancel);
  assert.equal(relay.messages[1].sequence, relay.messages[0].sequence);
});

test('a pre-cancelled application attempt never reaches the SDK transport', async t => {
  const { manager, relay } = mockManager(t);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(requestUnlessAlreadyCancelled(manager, signingRequestFixture(), controller.signal),
    error => error.name === 'AbortError');
  assert.equal(relay.messages.length, 0);
});

test('a request without a connected transport fails promptly', async () => {
  const manager = new DappConnectionManager('offline probe', undefined, { session: false });
  try { await assert.rejects(manager.signTransaction(signingRequestFixture()), /Not connected/); }
  finally { manager.destroy(); }
});

test('SDK source-output serialization preserves BigInt beyond the JS number range', () => {
  const source = { ...transactionFixture().sourceOutputs[0], valueSatoshis: 9_007_199_254_740_993n };
  // A wire-format edge case only; this is above the BCH supply and is never spendable.
  const relayValue = sourceOutputToRelay(source);
  assert.equal(relayValue.valueSatoshis, '<bigint: 9007199254740993n>');
  assert.equal(parseExtendedJson(JSON.stringify(relayValue)).valueSatoshis, source.valueSatoshis);
  assert.equal(relayValue.outpointIndex, 3);
  assert.equal(relayValue.lockingBytecode, binToHex(fixtureScripts.funding));
});

test('SDK transaction encoding agrees with libauth and places the recipient at output one', () => {
  const fixture = transactionFixture();
  const sdkHex = transactionToHex(fixture.transaction.inputs, fixture.transaction.outputs, 2, 0);
  assert.equal(sdkHex, fixture.unsignedHex);
  const decoded = decodeTransactionBch(hexToBin(sdkHex));
  assert.notEqual(typeof decoded, 'string');
  const matches = decoded.outputs.map((output, index) => ({ output, index }))
    .filter(({ output }) => binToHex(output.lockingBytecode) === binToHex(fixtureScripts.recipient));
  assert.equal(matches.length, 1);
  assert.equal(matches[0].index, fixture.expected.recipientVout);
  assert.equal(matches[0].output.valueSatoshis, fixture.expected.amountSats);
  assert.equal(decoded.outputs[0].valueSatoshis, fixture.expected.changeSats);
  const outputTotal = decoded.outputs.reduce((sum, output) => sum + output.valueSatoshis, 0n);
  assert.equal(fixture.sourceOutputs[0].valueSatoshis - outputTotal, fixture.expected.feeSats);
});

test('libauth txid byte order agrees with an independent double-SHA256 calculation', () => {
  const bytes = hexToBin(transactionFixture().unsignedHex);
  const first = createHash('sha256').update(bytes).digest();
  const expected = createHash('sha256').update(first).digest().reverse().toString('hex');
  assert.equal(binToHex(hashTransactionUiOrder(bytes)), expected);
});

test('BCH token decoding exposes token-bearing outputs for the future coin-only guard', () => {
  const fixture = transactionFixture();
  fixture.transaction.outputs[1].token = { category: new Uint8Array(32).fill(0xbb), amount: 7n };
  const decoded = decodeTransactionBch(encodeTransactionBch(fixture.transaction));
  assert.notEqual(typeof decoded, 'string');
  assert.equal(decoded.outputs[1].token.amount, 7n);
  assert.equal(decoded.outputs[1].valueSatoshis, 50_000n);
  assert.equal(decoded.outputs[0].token, undefined);
});

test('truncated transaction bytes produce a decoder error', () => {
  const bytes = hexToBin(transactionFixture().unsignedHex);
  assert.equal(typeof decodeTransactionBch(bytes.subarray(0, bytes.length - 1)), 'string');
});

test('the pinned transaction library supports the protocol-required sighash flags', () => {
  const flags = SigningSerializationFlag.allOutputs | SigningSerializationFlag.forkId |
    SigningSerializationFlag.utxos;
  assert.equal(flags, 0x61);
});
