import React, { useEffect, useRef, useState } from 'react'
import { ADSENSE, houseAdAt } from '../config.js'
import { colorVars } from '../utils.js'

let adsenseRequested = false

function requestAdsense() {
  if (adsenseRequested) return
  adsenseRequested = true
  const s = document.createElement('script')
  s.async = true
  s.crossOrigin = 'anonymous'
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE.clientId)}`
  document.head.appendChild(s)
}

/** index คงที่ต่อตำแหน่งช่อง เพื่อให้แบนเนอร์โฮมสไตล์หมุนอย่างมีเหตุผล */
function slotIndex(key) {
  let h = 0
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) % 997
  return h
}

/**
 * ช่องโฆษณาแบนเนอร์
 * - ใส่ ADSENSE.clientId + slot ใน src/config.js แล้วกลายเป็นโฆษณา Google จริง
 * - ยังไม่ใส่ = แสดงแบนเนอร์โฮมสไตล์ (house ad) หมุนเวียนตาม slotKey
 */
export default function AdSlot({ slotKey, slot, navigate, variant = 'wide' }) {
  const insRef = useRef(null)
  const pushedRef = useRef(false)
  const [bannerIndex] = useState(() => slotIndex(slotKey))

  const useAdsense = Boolean(ADSENSE.clientId && slot)

  useEffect(() => {
    if (!useAdsense) return
    requestAdsense()
    const id = window.setTimeout(() => {
      try {
        if (!pushedRef.current && insRef.current) {
          ;(window.adsbygoogle = window.adsbygoogle || []).push({})
          pushedRef.current = true
        }
      } catch {
        // ส่วนขยายบล็อกโฆษณา หรือยังไม่พร้อม — ปล่อยพื้นที่ว่างไว้
      }
    }, 0)
    return () => window.clearTimeout(id)
  }, [useAdsense])

  if (useAdsense) {
    return (
      <aside className={`ad-slot ad-${variant}`} aria-label="โฆษณา">
        <span className="ad-label">โฆษณา</span>
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={ADSENSE.clientId}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </aside>
    )
  }

  const ad = houseAdAt(bannerIndex)
  return (
    <aside className={`ad-slot ad-${variant}`} aria-label="แบนเนอร์แนะนำ">
      <span className="ad-label">แนะนำ</span>
      <article className="house-ad" style={colorVars(ad.color)}>
        <div className="house-ad-text">
          <p className="house-ad-eyebrow">{ad.eyebrow}</p>
          <h3 className="house-ad-title">{ad.title}</h3>
          <p className="house-ad-body">{ad.text}</p>
        </div>
        <button
          type="button"
          className="btn btn-primary house-ad-cta"
          onClick={() => navigate({ name: ad.view })}
        >
          {ad.cta}
        </button>
      </article>
    </aside>
  )
}
