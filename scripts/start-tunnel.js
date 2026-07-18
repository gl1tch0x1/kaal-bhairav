const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'tunnel.txt');

if (fs.existsSync(targetPath)) {
  try {
    fs.unlinkSync(targetPath);
  } catch (e) {}
}

console.log('Spawning tunnelmole on port 3001...');
const child = spawn('npx', ['--yes', 'tunnelmole', '3001'], {
  shell: true
});

child.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  const match = output.match(/(https:\/\/[a-zA-Z0-9.-]+\.tunnelmole\.net)/i);
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
  console.log(`tunnelmole process exited with code ${code}`);
  if (code !== 0) {
    console.log('Falling back to localtunnel...');
    const ltChild = spawn('npx', ['--yes', 'localtunnel', '--port', '3001'], {
      shell: true
    });
    ltChild.stdout.on('data', (ltData) => {
      const ltOutput = ltData.toString();
      process.stdout.write(ltOutput);
      const ltMatch = ltOutput.match(/your url is:\s+(https:\/\/[^\s]+)/i);
      if (ltMatch && ltMatch[1]) {
        const url = ltMatch[1].trim();
        fs.writeFileSync(targetPath, `url: ${url}`, 'utf-8');
        console.log(`[TUNNEL] Saved public URL (localtunnel fallback): ${url}`);
      }
    });
    ltChild.stderr.on('data', (ltData) => {
      process.stderr.write(ltData.toString());
    });
  }
});
