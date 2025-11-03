#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

const processes = [];

function run(command, args, options) {
  const proc = spawn(command, args, { stdio: 'inherit', ...options });
  processes.push(proc);
  proc.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Command ${command} ${args.join(' ')} exited with code ${code}`);
    }
    shutdown(code);
  });
}

function shutdown(code = 0) {
  while (processes.length) {
    const child = processes.pop();
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

run('node', ['server/server.js'], { cwd: rootDir });
run('npx', ['vite', '--host', '--config', 'web/vite.config.js'], { cwd: rootDir, shell: true });
