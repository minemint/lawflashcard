// Convenience wrapper: scrape the Thai Civil and Commercial Code
// (ประมวลกฎหมายแพ่งและพาณิชย์).
// Equivalent to:
//   node scripts/scrape-law-book.mjs --url https://www.drthawip.com/book/export/html/1534 \
//        --out data/civil-and-commercial-code.json --last 1755

import { run } from './scrape-law-book.mjs';

const inFile = process.argv.includes('--in')
  ? process.argv[process.argv.indexOf('--in') + 1]
  : undefined;

await run({
  url: 'https://www.drthawip.com/book/export/html/1534',
  out: 'data/civil-and-commercial-code.json',
  last: 1755,
  inFile,
});
