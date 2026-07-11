const { execSync, spawn } = require('child_process');

execSync('npm run build', { stdio: 'inherit' });

const electron = spawn(require('electron'), ['.'], { stdio: 'inherit' });
electron.on('close', (code) => process.exit(code ?? 0));
