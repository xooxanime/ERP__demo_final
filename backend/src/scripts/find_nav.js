import fs from 'fs';

const code = fs.readFileSync('frontend/src/pages/teacher/Batches.jsx', 'utf8');

const occurrences = [];
const lines = code.split('\n');
lines.forEach((line, i) => {
  if (line.includes('navigate') || line.includes('courses/')) {
    occurrences.push({ lineNum: i + 1, content: line.trim() });
  }
});

console.log(JSON.stringify(occurrences, null, 2));
