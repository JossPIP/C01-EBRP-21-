import fs from 'fs';

let content = fs.readFileSync('index.html', 'utf-8');

// Minify the questions array slightly to save tokens in the chat output
content = content.replace(/    \{\n        "id":/g, '    { "id":');
content = content.replace(/,\n        "text":/g, ', "text":');
content = content.replace(/,\n        "context":/g, ', "context":');
content = content.replace(/,\n        "options": \[\n            "/g, ', "options": ["');
content = content.replace(/",\n            "/g, '", "');
content = content.replace(/"\n        \],\n        "answer":/g, '"], "answer":');
content = content.replace(/,\n        "explanation":/g, ', "explanation":');
content = content.replace(/\"\n    \},/g, '"} ,');

fs.writeFileSync('index_minified.html', content);
console.log('Minified questions array');
