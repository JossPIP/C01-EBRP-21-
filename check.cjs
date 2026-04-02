const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scripts = html.match(/<script>([\s\S]*?)<\/script>/g);
if (scripts) {
  scripts.forEach((s, i) => {
    const code = s.replace(/<\/?script>/g, '');
    try {
      new Function(code);
      console.log(`Script ${i} parsed successfully.`);
    } catch (e) {
      console.error(`Error in script ${i}:`, e);
    }
  });
}
