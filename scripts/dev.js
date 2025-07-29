#!/usr/bin/env node

const { spawn } = require('child_process');
const chalk = require('chalk');

// Install chalk if not present
try {
  require('chalk');
} catch (e) {
  console.log('Installing chalk...');
  const install = spawn('npm', ['install', 'chalk'], { stdio: 'inherit' });
  install.on('close', () => {
    runTurbo();
  });
  return;
}

runTurbo();

function runTurbo() {
  const turbo = spawn('npx', ['turbo', 'dev'], { stdio: ['inherit', 'pipe', 'pipe'] });

  turbo.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.includes('[frontend]')) {
        console.log(chalk.green(line));
      } else if (line.includes('[backend]')) {
        console.log(chalk.blue(line));
      } else {
        console.log(line);
      }
    });
  });

  turbo.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.includes('[frontend]')) {
        console.error(chalk.green(line));
      } else if (line.includes('[backend]')) {
        console.error(chalk.blue(line));
      } else {
        console.error(line);
      }
    });
  });

  turbo.on('close', (code) => {
    process.exit(code);
  });
}