const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'tunnel.txt');

if (fs.existsSync(targetPath)) {
  try {
    fs.unlinkSync(targetPath);
  } catch (e) {}
}

console.log('Spawning localtunnel on port 3001...');
const child = spawn('npx', ['localtunnel', '--port', '3001'], {
  shell: true
});

child.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  const match = output.match(/your url is:\s+(https:\/\/[^\s]+)/i);
  if (match && match[1]) {
    const url = match[1].trim();
    fs.writeFileSync(targetPath, `url: ${url}`, 'utf-8');
    console.log(`[TUNNEL] Saved public URL: ${url}`);
  }
});

child.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

child.on('close', (code) => {
  console.log(`localtunnel process exited with code ${code}`);
});
