import React from 'react'
import { baht, useSupportData } from '../support.js'

/** แถบย่อ "ยอดสนับสนุนเดือนนี้" บนหน้าแรก — แสดงเมื่อโหลดข้อมูลได้เท่านั้น */
export default function SupportStrip({ navigate }) {
  const data = useSupportData()
  if (!data || data.ranked.length === 0) return null

  return (
    <button type="button" className="support-strip" onClick={() => navigate({ name: 'support' })}>
      <span className="support-strip-bar" aria-hidden="true">
        <span style={{ width: `${data.percent}%` }} />
      </span>
      <span className="support-strip-text">
        ผู้สนับสนุนเดือนนี้ <b>{baht(data.raised)}</b> / {baht(data.goal)} ({data.percent}%) · ดูกระดานผู้สนับสนุน →
      </span>
    </button>
  )
}
