// Fictional serialization fixtures, never real payment recipients or spendable inputs.
import { encodeTransactionBch, hexToBin, binToHex } from '@bitauth/libauth';

export const fixtureScripts = {
  recipient: hexToBin(`76a914${'11'.repeat(20)}88ac`),
  change: hexToBin(`76a914${'22'.repeat(20)}88ac`),
  funding: hexToBin(`76a914${'33'.repeat(20)}88ac`),
};

export function transactionFixture() {
  const input = {
    outpointTransactionHash: new Uint8Array(32).fill(0xaa),
    outpointIndex: 3,
    sequenceNumber: 0xffffffff,
    unlockingBytecode: new Uint8Array(),
  };
  const transaction = {
    version: 2,
    locktime: 0,
    inputs: [input],
    // Deliberately put change first so output zero cannot be treated as the receipt.
    outputs: [
      { valueSatoshis: 49_600n, lockingBytecode: fixtureScripts.change },
      { valueSatoshis: 50_000n, lockingBytecode: fixtureScripts.recipient },
    ],
  };
  const sourceOutputs = [{
    ...input,
    valueSatoshis: 100_000n,
    lockingBytecode: fixtureScripts.funding,
  }];
  return {
    transaction,
    sourceOutputs,
    unsignedHex: binToHex(encodeTransactionBch(transaction)),
    expected: { recipientVout: 1, amountSats: 50_000n, changeSats: 49_600n, feeSats: 400n },
  };
}

export function signingRequestFixture() {
  const fixture = transactionFixture();
  return {
    transaction: {
      transaction: fixture.unsignedHex,
      sourceOutputs: fixture.sourceOutputs,
      broadcast: false,
      userPrompt: 'Offline BCH Close compatibility test; no real wallet or funds.',
    },
    inputPaths: [[0, 'receive', 0]],
  };
}
