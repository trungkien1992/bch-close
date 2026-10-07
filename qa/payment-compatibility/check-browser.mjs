// Module-bundle compatibility only. This is not browser interaction or layout QA.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';
import { build } from 'esbuild';

mkdirSync('.generated', { recursive: true });
await build({
  stdin: {
    contents: `
      import { useWizardConnect, WizardConnectQRDialog } from '@wizardconnect/react';
      import { DappConnectionManager } from '@wizardconnect/dapp';
      import { decodeTransactionBch, hexToBin } from '@bitauth/libauth';
      globalThis.__bchCloseDependencyProbe = {
        hook: typeof useWizardConnect, dialog: typeof WizardConnectQRDialog,
        manager: typeof DappConnectionManager,
        truncatedTransactionIsError: typeof decodeTransactionBch(hexToBin('02000000')) === 'string'
      };
    `,
    resolveDir: process.cwd(), sourcefile: 'offline-browser-entry.mjs', loader: 'js',
  },
  bundle: true, platform: 'browser', format: 'esm', target: 'es2022',
  outfile: '.generated/dependency-probe.mjs',
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'warning',
});

let openedSockets = 0;
const context = {
  console, Uint8Array, TextEncoder, TextDecoder, URL,
  AbortController, AbortSignal, DOMException, crypto: webcrypto, atob, btoa,
  setTimeout, clearTimeout, setInterval, clearInterval,
  WebSocket: class { constructor() { ++openedSockets; throw new Error('Offline probe forbids sockets'); } },
};
vm.createContext(context);
const module = new vm.SourceTextModule(readFileSync('.generated/dependency-probe.mjs', 'utf8'), {
  context,
  initializeImportMeta(meta) { meta.url = 'https://offline.invalid/dependency-probe.mjs'; },
});
await module.link(specifier => { throw new Error(`Unexpected external import: ${specifier}`); });
await module.evaluate({ timeout: 10_000 });
assert.equal(context.__bchCloseDependencyProbe.hook, 'function');
assert.equal(context.__bchCloseDependencyProbe.dialog, 'function');
assert.equal(context.__bchCloseDependencyProbe.manager, 'function');
assert.equal(context.__bchCloseDependencyProbe.truncatedTransactionIsError, true);
assert.equal(openedSockets, 0);
assert.equal('process' in context, false);
assert.equal('Buffer' in context, false);
assert.equal('require' in context, false);
console.log('PASS: browser-target bundle evaluates without Node globals or opening a socket.');
