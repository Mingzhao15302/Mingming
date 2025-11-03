#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const run = (command, args, options = {}) => {
  const child = spawn(command, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...options.env },
    shell: process.platform === 'win32'
  });
  child.on('exit', (code) => {
    if (code !== 0) {
      process.exitCode = code;
    }
  });
  return child;
};

const server = run('node', ['src/server.js', '--dev'], { env: { NODE_ENV: 'development' } });
const viteCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const frontend = run(viteCmd, ['vite', '--host'], { env: { NODE_ENV: 'development' } });

const cleanup = () => {
  server.kill('SIGINT');
  frontend.kill('SIGINT');
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
