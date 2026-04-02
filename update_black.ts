import fs from 'fs';

let content = fs.readFileSync('index.html', 'utf-8');

// Change zinc-900 to #ff2121
content = content.replace(/zinc-900/g, '[#ff2121]');

// Change zinc-800 to #ff2121
content = content.replace(/bg-zinc-800/g, 'bg-[#ff2121]');

fs.writeFileSync('index.html', content);
console.log('Updated index.html');
