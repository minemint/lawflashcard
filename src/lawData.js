import { thaiToArabic, arabicToThai } from './utils.js'

const BASE = import.meta.env.BASE_URL

export const LAW_CODES = [
  {
    id: 'civil',
    shortName: 'ป.แพ่งและพาณิชย์',
    longName: 'ประมวลกฎหมายแพ่งและพาณิชย์',
    file: `${BASE}data/civil-and-commercial-code.json`,
  },
  {
    id: 'criminal',
    shortName: 'ป.อาญา',
    longName: 'ประมวลกฎหมายอาญา',
    file: `${BASE}data/criminal-code.json`,
  },
]

const cache = new Map()

export async function loadLaw(codeId) {
  if (!cache.has(codeId)) {
    const code = LAW_CODES.find((c) => c.id === codeId)
    const res = await fetch(code.file)
    if (!res.ok) throw new Error(`โหลด${code.shortName}ไม่สำเร็จ`)
    cache.set(codeId, await res.json())
  }
  return cache.get(codeId)
}

export function articlePath(a) {
  return [a.part, a.chapter, a.division].filter(Boolean).join(' · ')
}

export function searchArticles(articles, query) {
  const raw = query.trim()
  if (!raw) return articles
  const arabic = thaiToArabic(raw)
  const thai = arabicToThai(raw)
  return articles.filter(
    (a) =>
      a.number.includes(arabic) ||
      (a.number_th || '').includes(raw) ||
      a.content.includes(raw) ||
      a.content.includes(arabic) ||
      a.content.includes(thai)
  )
}
