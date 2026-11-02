import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(__dirname, '..');
const viteBin = resolve(clientRoot, 'node_modules', 'vite', 'bin', 'vite.js');

const BASE_PORT = 5173;
const rawArgs = process.argv.slice(2);

/**
 * Hỗ trợ:
 * - Mặc định (không truyền tham số): mở 2 cổng 5173, 5174
 * - Truyền 1 số nhỏ (ví dụ: `npm run dev:multi -- 3`): mở 3 cổng liên tiếp 5173, 5174, 5175
 * - Truyền danh sách cổng (ví dụ: `npm run dev:multi -- 5173 5174 5175`): mở đúng các cổng đó
 */
function resolveTargetPorts(args) {
  if (args.length === 0) {
    return [BASE_PORT, BASE_PORT + 1];
  }
  if (args.length === 1) {
    const num = Number(args[0]);
    if (Number.isInteger(num) && num >= 1 && num <= 20) {
      return Array.from({ length: num }, (_, idx) => BASE_PORT + idx);
    }
  }
  const explicitPorts = args
    .map((val) => Number(val))
    .filter((port) => Number.isInteger(port) && port >= 1024 && port <= 65535);
  return explicitPorts.length > 0 ? explicitPorts : [BASE_PORT, BASE_PORT + 1];
}

const ports = resolveTargetPorts(rawArgs);
const children = [];

console.log(
  `[Multi-Client] Đang khởi động ${ports.length} cổng Frontend độc lập: ${ports
    .map((p) => `http://localhost:${p}`)
    .join(' , ')}`,
);

for (const port of ports) {
  const child = spawn(
    process.execPath,
    [viteBin, '--port', String(port), '--strictPort'],
    {
      cwd: clientRoot,
      env: {
        ...process.env,
        VITE_PORT: String(port),
      },
      stdio: 'inherit',
    },
  );
  children.push(child);
}

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

