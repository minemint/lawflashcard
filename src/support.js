import { useEffect, useMemo, useState } from 'react'
import { DONATE } from './config.js'

const BASE = import.meta.env.BASE_URL
const FILE = `${BASE}data/supporters.json`

let cached = null
let inflight = null

function fetchSupporters() {
  if (cached) return Promise.resolve(cached)
  if (!inflight) {
    inflight = fetch(FILE)
      .then((res) => {
        if (!res.ok) throw new Error('โหลดข้อมูลผู้สนับสนุนไม่สำเร็จ')
        return res.json()
      })
      .then((data) => {
        cached = data
        return data
      })
      .catch(() => null)
  }
  return inflight
}

/**
 * ข้อมูลผู้สนับสนุนรายเดือน (จาก public/data/supporters.json)
 * คืน null ระหว่างโหลด และคืน null เมื่อโหลดไม่ได้ — UI ต้องรองรับทั้งสองกรณี
 */
export function useSupportData() {
  const [data, setData] = useState(cached)
  useEffect(() => {
    let alive = true
    fetchSupporters().then((d) => {
      if (alive) setData(d)
    })
    return () => {
      alive = false
    }
  }, [])
  return useMemo(() => summarize(data), [data])
}

function summarize(data) {
  if (!data) return null
  const goal = Number(data.goal) > 0 ? Number(data.goal) : DONATE.monthlyGoal
  const supporters = (data.supporters || []).map((s) => ({
    ...s,
    amount: Number(s.amount) || 0,
  }))
  const raised = supporters.reduce((sum, s) => sum + s.amount, 0)
  const ranked = [...supporters].sort(
    (a, b) => b.amount - a.amount || new Date(b.date || 0) - new Date(a.date || 0)
  )
  return {
    month: data.month || '',
    goal,
    raised,
    percent: goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0,
    count: supporters.length,
    ranked,
  }
}

export const summaryIfLoaded = summarize

export const baht = (n) => '฿' + Number(n || 0).toLocaleString('th-TH')

/** วันที่แบบสั้น ไทย เช่น 5 ก.ย. 69 — ไม่แสดงอะไรถ้าไม่มีข้อมูล */
export function shortDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

/**
 * QR พร้อมเพย์เป็น data URL — คืน null ถ้าไม่ได้ตั้งค่า promptpay ใน config.js
 * amount เป็น 0/undefined = QR แบบเปิดยอดเองที่ตู้/แอป
 */
export async function promptPayQrDataUrl(amount) {
  if (!DONATE.promptpay) return null
  const [generatePayload, QRCode] = await Promise.all([
    import('promptpay-qr'),
    import('qrcode'),
  ])
  const payload = generatePayload.default(DONATE.promptpay, {
    amount: Number(amount) > 0 ? Number(amount) : undefined,
  })
  return QRCode.default.toDataURL(payload, {
    width: 480,
    margin: 1,
    color: { dark: '#33323f', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })
}
