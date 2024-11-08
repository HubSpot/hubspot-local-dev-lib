import { spawn, exec as _exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const exec = promisify(_exec);

export async function build(): Promise<void> {
  // Remove the current dist dir
  fs.rmSync('dist', { recursive: true, force: true });

  // Build typescript
  await new Promise(resolve => {
    const childProcess = spawn('yarn', ['tsc'], {
      stdio: 'inherit',
    });

    childProcess.on('close', code => {
      if (code !== 0) {
        process.exit(code || 1);
      }
      resolve('');
    });
  });

  // Copy remaining files
  fs.cpSync('lang', 'dist/lang', { recursive: true });
  fs.cpSync('README.md', 'dist/README.md');
  fs.cpSync('LICENSE', 'dist/LICENSE');

  // Remove postinstall from built package.json
  exec('npm pkg delete scripts.postinstall', { cwd: './dist' });
}

build();
