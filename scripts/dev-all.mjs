import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const nestBin = resolve(rootDir, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js');
const clientMultiScript = resolve(rootDir, 'client', 'scripts', 'dev-multi.mjs');

const extraArgs = process.argv.slice(2);
const children = [];

console.log('[Dev-All] Đang khởi động Backend (cổng 3000) + Đa cổng Frontend (5173, 5174, ...)...');

const serverProc = spawn(process.execPath, [nestBin, 'start', '--watch'], {
  cwd: rootDir,
  env: process.env,
  stdio: 'inherit',
});
children.push(serverProc);

const clientProc = spawn(process.execPath, [clientMultiScript, ...extraArgs], {
  cwd: resolve(rootDir, 'client'),
  env: process.env,
  stdio: 'inherit',
});
children.push(clientProc);

function shutdown() {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

