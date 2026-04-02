const fs = require('fs');

const data1 = fs.readFileSync('./src/data1.ts', 'utf8');
const data2 = fs.readFileSync('./src/data2.ts', 'utf8');

// Extract the arrays
const array1Match = data1.match(/export const questionsPart1 = (\[[\s\S]*\]);/);
const array2Match = data2.match(/export const questionsPart2 = (\[[\s\S]*\]);/);

if (!array1Match || !array2Match) {
  console.error("Could not find arrays");
  process.exit(1);
}

const arr1 = eval(array1Match[1]);
const arr2 = eval(array2Match[1]);

const combined = [...arr1, ...arr2];

const questionsStr = `const questions = ${JSON.stringify(combined, null, 4)};`;

let indexHtml = fs.readFileSync('index.html', 'utf8');

indexHtml = indexHtml.replace('<script src="./data.js"></script>', `<script>\n${questionsStr}\n</script>`);

fs.writeFileSync('index.html', indexHtml);
console.log("Done!");
