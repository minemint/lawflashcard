export const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'id-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙'

export const thaiToArabic = (s) =>
  String(s).replace(/[๐-๙]/g, (d) => String(THAI_DIGITS.indexOf(d)))

export const arabicToThai = (s) =>
  String(s).replace(/[0-9]/g, (d) => THAI_DIGITS[Number(d)])

export const PASTELS = [
  { id: 'mint', label: 'มินต์', soft: '#DFEFE6', edge: '#7FB98F', deep: '#3E6B4F' },
  { id: 'peach', label: 'พีช', soft: '#FBE5D3', edge: '#E0A878', deep: '#7A5633' },
  { id: 'lavender', label: 'ลาเวนเดอร์', soft: '#E7E5F6', edge: '#9B93D6', deep: '#4F4878' },
  { id: 'sky', label: 'ฟ้า', soft: '#DCEBF6', edge: '#7FA9D2', deep: '#33506E' },
  { id: 'butter', label: 'เนย', soft: '#F8F0D6', edge: '#CDB169', deep: '#6B5C2E' },
  { id: 'rose', label: 'กุหลาบ', soft: '#F8E0E3', edge: '#D293A0', deep: '#70424B' },
]

export const pastelById = (id) => PASTELS.find((p) => p.id === id) || PASTELS[0]

export const colorVars = (colorId) => {
  const p = pastelById(colorId)
  return { '--gc': p.soft, '--gc-edge': p.edge, '--gc-deep': p.deep }
}

export function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function excerpt(text, n = 140) {
  const flat = String(text).replace(/\s+/g, ' ').trim()
  return flat.length > n ? flat.slice(0, n) + '…' : flat
}

export const STATUS_LABEL = { new: 'ใหม่', known: 'จำได้', unknown: 'ยังไม่ได้' }
