import fs from 'fs';

let content = fs.readFileSync('index.html', 'utf-8');

// Revert progress bar and timer background
content = content.replace(/<div class="w-full bg-\[#ff2121\] rounded-full h-3 overflow-hidden">/g, '<div class="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">');
content = content.replace(/<div class="flex items-center gap-3 px-6 py-3 bg-\[#ff2121\]\/80 border border-white\/10 rounded-2xl shadow-inner">/g, '<div class="flex items-center gap-3 px-6 py-3 bg-zinc-800/80 border border-white/10 rounded-2xl shadow-inner">');

fs.writeFileSync('index.html', content);
console.log('Reverted some red backgrounds');
