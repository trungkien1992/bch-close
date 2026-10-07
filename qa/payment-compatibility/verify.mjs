import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const runs = [
  { name: 'offline SDK and transaction checks', args: ['--test', '--test-reporter=tap', 'compatibility.test.mjs'] },
  { name: 'browser-target module evaluation', args: ['--experimental-vm-modules', '--disable-warning=ExperimentalWarning', 'check-browser.mjs'] },
];
const outcomes = runs.map(run => {
  const result = spawnSync(process.execPath, run.args, { encoding: 'utf8', timeout: 30_000 });
  if (result.status !== 0) {
    process.stderr.write(`${run.name} failed\n${result.stdout ?? ''}${result.stderr ?? ''}`);
    process.exit(1);
  }
  return { name: run.name, passed: true, output: result.stdout };
});
const counts = outcomes[0].output;
const tests = Number(counts.match(/^# tests (\d+)$/m)?.[1]);
const passed = Number(counts.match(/^# pass (\d+)$/m)?.[1]);
if (!tests || tests !== passed) throw new Error('Missing or inconsistent Node test totals');
const files = ['package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml', 'fixtures.mjs',
  'compatibility.test.mjs', 'check-browser.mjs', 'verify.mjs'];
const evidence = {
  schema: 'bch-close-payment-compatibility/v1',
  verifiedAt: new Date().toISOString(), node: process.version,
  stage: 'pre-event preparation; absent from the live app',
  dependencies: { wizardConnectReact: '0.2.3', wizardConnectDapp: '0.2.2', wizardConnectCore: '0.2.4',
    libauth: '3.1.0-next.2', react: '19.2.6', esbuild: '0.28.0' },
  tests: { total: tests, passed, failed: 0, transport: 'memory mock; no real relay' },
  browserTargetModuleEvaluation: { passed: true, target: 'es2022', format: 'esm',
    environment: 'Node VM with web APIs; no process, Buffer or require globals; no socket opened' },
  walletPairingVerified: false,
  validSignatureVerified: false,
  mainnetBroadcastVerified: false,
  liveUtxoProviderVerified: false,
  browserInteractionsVerified: false,
  merchantPilotCompleted: false,
  files: files.map(path => { const bytes = readFileSync(path); return {
    path: `qa/payment-compatibility/${path}`, bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  }; }),
};
mkdirSync('../../evidence', { recursive: true });
writeFileSync('../../evidence/payment-compatibility.json', JSON.stringify(evidence, null, 2) + '\n');
console.log(`PASS: ${passed}/${tests} offline checks and browser-target module evaluation. Evidence recorded.`);
