import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const packOutput = execFileSync('npm', ['pack', '--dry-run', '--json'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
});
const [packInfo] = JSON.parse(packOutput);
const files = new Set(packInfo.files.map((file) => file.path));
const requiredFiles = [
  packageJson.main,
  packageJson.bin?.hserve,
];

for (const file of requiredFiles) {
  if (!file || !files.has(file)) {
    throw new Error(`npm pack output is missing required file: ${file}`);
  }
}

console.log(`npm pack includes ${requiredFiles.join(', ')}`);
