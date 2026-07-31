import fs from 'fs';

const code = fs.readFileSync('frontend/src/pages/teacher/Dashboard.jsx', 'utf8');

const occurrences = [];
const lines = code.split('\n');
lines.forEach((line, i) => {
  if (line.includes('navigate') || line.includes('/teacher/')) {
    occurrences.push({ lineNum: i + 1, content: line.trim() });
  }
});

console.log(JSON.stringify(occurrences, null, 2));
