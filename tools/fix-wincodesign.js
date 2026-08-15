const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const cacheDir = path.join(process.env.LOCALAPPDATA, 'electron-builder', 'Cache', 'winCodeSign');
const targetDir = path.join(cacheDir, 'winCodeSign-2.6.0');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const zips = fs.existsSync(cacheDir) ? fs.readdirSync(cacheDir).filter(f => f.endsWith('.7z')) : [];
const zip7za = path.join(process.cwd(), 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe');

if (zips.length > 0 && fs.existsSync(zip7za)) {
  const archive = path.join(cacheDir, zips[0]);
  try {
    execSync(`"${zip7za}" x -y -bd -o"${targetDir}" "${archive}"`, { stdio: 'ignore' });
  } catch (e) {}
}

console.log('winCodeSign verificado em:', targetDir);
