// Convenience wrapper: scrape the Thai Criminal Code (ประมวลกฎหมายอาญา).
// Equivalent to:
//   node scripts/scrape-law-book.mjs --url https://www.drthawip.com/book/export/html/536 \
//        --out data/criminal-code.json --last 398

import { run } from './scrape-law-book.mjs';

const inFile = process.argv.includes('--in')
  ? process.argv[process.argv.indexOf('--in') + 1]
  : undefined;

await run({
  url: 'https://www.drthawip.com/book/export/html/536',
  out: 'data/criminal-code.json',
  last: 398,
  inFile,
});
