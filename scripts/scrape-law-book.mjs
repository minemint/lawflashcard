// Generic scraper for Thai law books on drthawip.com (Drupal "book" nodes).
// Downloads the printer-friendly export of a whole book and emits a flat JSON
// array of มาตรา (sections) with their container hierarchy as metadata.
//
// Usage:
//   node scripts/scrape-law-book.mjs --url https://www.drthawip.com/book/export/html/536 \
//        --out data/criminal-code.json --last 398 [--in local.html]
//
// Output schema (per article):
//   { number, number_th, part, chapter, division, subdivision, subsubdivision,
//     content, amendments: [] }

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const thaiDigits = '๐๑๒๓๔๕๖๗๘๙';
const thaiToArabic = (s) =>
  s.replace(/[๐-๙]/g, (d) => String(thaiDigits.indexOf(d)));
const arabicToThai = (s) =>
  String(s).replace(/\d/g, (d) => thaiDigits[+d]);

// canonical number form: "269/1", "335 ทวิ" (single spaces only)
const canonicalNumber = (s) => s.replace(/\s+/g, ' ').trim();

const decodeEntities = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

// HTML fragment -> plain text: <br> becomes newline, <sup>N</sup> becomes [N]
const htmlToText = (s) => {
  let t = s
    .replace(/<sup[^>]*>([\s\S]*?)<\/sup>/g, (_, inner) => `[${inner.trim()}]`)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  t = decodeEntities(t);
  // trim the heavy source indentation on every line, keep line structure
  return t
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line, i, arr) => !(line === '' && (i === 0 || arr[i - 1] === '')))
    .join('\n')
    .trim();
};

// Drop the "(มาตรา ๑ - ๑๐๖)" range suffix from book-page titles
const cleanTitle = (t) =>
  t.replace(/\s*\(มาตรา[^)]*\)\s*$/, '').replace(/\s+/g, ' ').trim();

const CONTAINERS = [
  'part',
  'chapter',
  'division',
  'subdivision',
  'subsubdivision',
];

const classifyTitle = (t) => {
  // pages that carry no มาตรา of the code itself
  if (/^(สารบัญ|พระราชบัญญัติ|พระราชกฤษฎีกา|เหตุผล)/.test(t)) return 'skip';
  if (/^(ภาค|บรรพ)\s/.test(t) || /^(ข้อความ|บท)เบื้องต้น/.test(t)) return 'part';
  if (/^ลักษณะ\s/.test(t)) return 'chapter';
  if (/^หมวด\s/.test(t)) return 'division';
  if (/^ส่วนที่\s/.test(t)) return 'subdivision';
  if (/^[๑-๙][๐-๙]*\.\s/.test(t)) return 'subsubdivision'; // "๑. บุริมสิทธิสามัญ"
  if (/^\([ก-ฮ๐-๙]+\)\s/.test(t)) return 'subsubdivision-letter'; // "(ก) ..."
  return 'other';
};

// entering a container resets every level below it (including the lettered one)
const LEVELS_BELOW = {
  part: ['chapter', 'division', 'subdivision', 'subsubdivision', 'subsubdivision-letter'],
  chapter: ['division', 'subdivision', 'subsubdivision', 'subsubdivision-letter'],
  division: ['subdivision', 'subsubdivision', 'subsubdivision-letter'],
  subdivision: ['subsubdivision', 'subsubdivision-letter'],
  subsubdivision: ['subsubdivision-letter'],
};

// มาตรา number: ๑๒๓, ๑๓๕/๑, ๓๓๕ ทวิ, ๓๓๗ ตรี
const ARTICLE_RE =
  /^มาตรา\s+([๐-๙]+(?:\s*\/\s*[๐-๙]+)?(?:\s*(?:ทวิ|ตรี|จัตวา))?)(?![๐-๙])/;

// every "มาตรา <num>" mention in a footnote, e.g. targets / range endpoints
const MENTION_RE =
  /มาตรา\s+([๐-๙]+(?:\s*\/\s*[๐-๙]+)?(?:\s*(?:ทวิ|ตรี|จัตวา))?)(?![๐-๙])/g;

const normalizeNumber = (s) => canonicalNumber(thaiToArabic(s));

// (base, slash, suffix-rank) so "269/8" < "269/15" < "270" and "335" < "335 ทวิ"
const numberKey = (s) => {
  const m = s.match(/^(\d+)(?:\/(\d+))?\s*(ทวิ|ตรี|จัตวา)?$/);
  if (!m) return null;
  return [+m[1], m[2] ? +m[2] : 0, { ทวิ: 1, ตรี: 2, จัตวา: 3 }[m[3] || ''] || 0];
};
// tuple compare: -1 / 0 / 1
const cmpKey = (a, b) =>
  a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
const keyBetween = (key, lo, hi) =>
  key && lo && hi && cmpKey(key, lo) >= 0 && cmpKey(key, hi) <= 0;

// repealed provisions: "มาตรา ๑๒๗๔ - ๑๒๙๗ (ยกเลิก)" / "มาตรา ๑๒๔๖ (ยกเลิก)"
const REPEALED_RANGE_RE =
  /^มาตรา\s+([๐-๙]+)\s*-\s*([๐-๙]+)\s*\(ยกเลิก\)\s*$/;
const REPEALED_SINGLE_RE =
  /^มาตรา\s+([๐-๙]+(?:\s*\/\s*[๐-๙]+)?(?:\s*(?:ทวิ|ตรี|จัตวา))?)(?![๐-๙])\s*\(ยกเลิก\)\s*$/;

// decorative paragraphs to skip: blank, dash rules, echoed headings/signatures
const isDecorative = (text) => {
  if (!text) return true;
  if (/^[-=_\s]+$/.test(text)) return true;
  if (/^(ภาค|บรรพ|ลักษณะ|หมวด|ส่วนที่)\s+[๐-๙]/.test(text) && text.length <= 90)
    return true;
  return false;
};

export function parse(html) {
  // Book pages appear in DFS order; depth from class="section-N" gives parents.
  const nodeRe =
    /<div id="node-(\d+)" class="section-(\d)">\s*<h1 class="book-heading">([^<]*)<\/h1>/g;
  const nodes = [];
  let m;
  while ((m = nodeRe.exec(html))) {
    nodes.push({ id: m[1], depth: +m[2], title: decodeEntities(m[3]).trim(), bodyStart: nodeRe.lastIndex });
  }
  for (let i = 0; i < nodes.length; i++) {
    const end = i + 1 < nodes.length ? nodes[i + 1].bodyStart : html.length;
    let chunk = html.slice(nodes[i].bodyStart, end);
    // only the node's own body (before its hit counter / closing tags)
    const counterAt = chunk.indexOf('<ul class="links inline">');
    if (counterAt !== -1) chunk = chunk.slice(0, counterAt);
    nodes[i].paragraphs = [...chunk.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(
      (p) => htmlToText(p[1]),
    );
  }

  const articles = [];
  const ctx = {};
  let current = null;

  const pushCurrent = () => {
    if (current) articles.push(current);
    current = null;
  };

  // merge the numbered and lettered sub-levels into one readable string
  const subSub = () =>
    [ctx.subsubdivision, ctx['subsubdivision-letter']].filter(Boolean).join(' ') || null;

  for (const node of nodes) {
    const kind = classifyTitle(node.title);
    if (kind !== 'other') {
      pushCurrent();
      if (kind === 'skip') {
        for (const k of [...CONTAINERS, 'subsubdivision-letter']) ctx[k] = null;
      } else if (kind === 'subsubdivision-letter') {
        ctx['subsubdivision-letter'] = cleanTitle(node.title);
      } else {
        ctx[kind] = cleanTitle(node.title);
        for (const below of LEVELS_BELOW[kind] || []) ctx[below] = null;
      }
    }
    // only pages inside a บรรพ/ภาค carry มาตรา text (พ.ร.บ. / เหตุผล pages do not)
    if (!ctx.part) continue;

    for (const paragraph of node.paragraphs) {
      if (isDecorative(paragraph)) continue;

      // Footnote blocks start with a [N] marker (converted from <sup>) and may
      // pack several amendment notes in one paragraph — split on the markers.
      if (/^\[[๐-๙]+\]/.test(paragraph)) {
        const notes = paragraph
          .split(/\[[๐-๙]+\]/)
          .map((s) => s.trim())
          .filter(Boolean);
        for (const note of notes) {
          const mentions = [...note.matchAll(MENTION_RE)].map((x) =>
            normalizeNumber(x[1]),
          );
          if (mentions.length >= 2 && /ถึง/.test(note)) {
            // range note: attach to every article between the endpoints
            const lo = numberKey(mentions[0]);
            const hi = numberKey(mentions[1]);
            for (const a of [...articles, current].filter(Boolean))
              if (keyBetween(numberKey(a.number), lo, hi))
                (a.amendments ||= []).push(note);
          } else if (mentions.length >= 1) {
            const art = articles.find((a) => a.number === mentions[0]) || current;
            if (art) (art.amendments ||= []).push(note);
          } else if (current) {
            (current.amendments ||= []).push(note);
          }
        }
        continue;
      }

      const repealedRange = paragraph.match(REPEALED_RANGE_RE);
      if (repealedRange) {
        pushCurrent();
        const lo = +thaiToArabic(repealedRange[1]);
        const hi = +thaiToArabic(repealedRange[2]);
        for (let n = lo; n <= hi; n++)
          articles.push({
            number: String(n),
            number_th: arabicToThai(n),
            part: ctx.part,
            chapter: ctx.chapter,
            division: ctx.division,
            subdivision: ctx.subdivision,
            subsubdivision: subSub(),
            content: '(ยกเลิก)',
            repealed: true,
            amendments: [],
          });
        continue;
      }

      const repealedSingle = paragraph.match(REPEALED_SINGLE_RE);
      if (repealedSingle) {
        pushCurrent();
        const numberTh = canonicalNumber(repealedSingle[1]);
        articles.push({
          number: thaiToArabic(numberTh),
          number_th: numberTh,
          part: ctx.part,
          chapter: ctx.chapter,
          division: ctx.division,
          subdivision: ctx.subdivision,
          subsubdivision: subSub(),
          content: '(ยกเลิก)',
          repealed: true,
          amendments: [],
        });
        continue;
      }

      const art = paragraph.match(ARTICLE_RE);
      if (art) {
        pushCurrent();
        const numberTh = canonicalNumber(art[1]);
        current = {
          number: thaiToArabic(numberTh),
          number_th: numberTh,
          part: ctx.part,
          chapter: ctx.chapter,
          division: ctx.division,
          subdivision: ctx.subdivision,
          subsubdivision: subSub(),
          content: paragraph
            .slice(art[0].length)
            .trim()
            // drop a leading footnote-reference marker like "[๑]"
            .replace(/^\[[๐-๙]+\]\s*/, ''),
          amendments: [],
        };
      } else if (current) {
        current.content += '\n' + paragraph;
      }
    }
  }
  pushCurrent();
  return articles;
}

export function validate(articles, lastNumber) {
  const problems = [];
  const baseNums = new Set(
    articles.map((a) => parseInt(a.number, 10)).filter((n) => !Number.isNaN(n)),
  );
  for (let n = 1; n <= lastNumber; n++)
    if (!baseNums.has(n)) problems.push(`missing มาตรา ${n}`);
  for (const a of articles)
    if (!a.content) problems.push(`empty content: มาตรา ${a.number}`);
  return problems;
}

export async function run({ url, out, last, inFile }) {
  let html;
  if (inFile) {
    html = fs.readFileSync(path.resolve(ROOT, inFile), 'utf8');
  } else {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
    html = await res.text();
  }

  const articles = parse(html);
  const problems = validate(articles, last);
  const outFile = path.resolve(ROOT, out);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(articles, null, 2), 'utf8');

  console.log(`articles: ${articles.length}`);
  console.log(`first:    ${articles[0]?.number}  last: ${articles.at(-1)?.number}`);
  console.log(`amended:  ${articles.filter((a) => a.amendments.length).length}`);
  console.log(`output:   ${outFile} (${fs.statSync(outFile).size} bytes)`);
  if (problems.length) {
    console.log(`PROBLEMS (${problems.length}):`);
    for (const p of problems) console.log('  - ' + p);
    process.exitCode = 1;
  } else {
    console.log(`validation: base มาตรา 1..${last} all present, no empty content`);
  }
}

// CLI entry (wrappers import run() instead)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (name) => {
    const i = process.argv.indexOf(`--${name}`);
    return i !== -1 ? process.argv[i + 1] : undefined;
  };
  const url = arg('url');
  const out = arg('out');
  const last = arg('last');
  if (!url || !out || !last) {
    console.error('usage: scrape-law-book.mjs --url URL --out FILE --last N [--in FILE]');
    process.exit(2);
  }
  await run({ url, out, last: +last, inFile: arg('in') });
}
