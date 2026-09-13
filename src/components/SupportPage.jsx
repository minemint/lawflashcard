import React, { useEffect, useState } from 'react'
import { ADSENSE, DONATE, SITE } from '../config.js'
import { baht, promptPayQrDataUrl, shortDate, useSupportData } from '../support.js'
import AdSlot from './AdSlot.jsx'

const PRESET_AMOUNTS = [50, 100, 300, 500]
const MEDALS = ['🥇', '🥈', '🥉']

function GoalCard({ data }) {
  if (!data) return null
  return (
    <section className="goal-card" aria-label="ยอดสนับสนุนเดือนนี้">
      <div className="goal-head">
        <h2>ยอดสนับสนุนเดือน{data.month ? ` ${data.month}` : 'นี้'}</h2>
        <span className="goal-percent">{data.percent}%</span>
      </div>
      <div className="goal-bar" role="progressbar" aria-valuenow={data.percent} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${data.percent}%` }} />
      </div>
      <p className="goal-stats">
        <b>{baht(data.raised)}</b> จากเป้าหมาย {baht(data.goal)} · ผู้สนับสนุน {data.count} คน
      </p>
      <p className="goal-note muted">
        เงินสนับสนุนทั้งหมดใช้จ่ายค่าโฮสติ้ง ค่าต่ออายุโดเมน และการอัปเดตตัวบทกฎหมายให้เป็นฉบับล่าสุด
      </p>
    </section>
  )
}

function PromptPayCard() {
  const [amount, setAmount] = useState(0)
  const [qrUrl, setQrUrl] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true
    setQrUrl(null)
    promptPayQrDataUrl(amount).then((url) => {
      if (alive) setQrUrl(url)
    })
    return () => {
      alive = false
    }
  }, [amount])

  if (!DONATE.promptpay) return null

  async function copyId() {
    try {
      await navigator.clipboard.writeText(DONATE.promptpay)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // คลิปบอร์ดถูกปิด — ผู้ใช้พิมพ์เลขเองได้จากที่แสดงบนการ์ด
    }
  }

  return (
    <section className="way-card way-promptpay">
      <h3>พร้อมเพย์</h3>
      <p className="way-note">สแกน QR ผ่านแอปธนาคาร หรือพิมพ์เลข {DONATE.promptpayName}</p>
      <div className="amount-presets" role="group" aria-label="เลือกยอดสนับสนุน">
        {PRESET_AMOUNTS.map((n) => (
          <button
            type="button"
            key={n}
            className={`chip ${amount === n ? 'active' : ''}`}
            onClick={() => setAmount(n)}
          >
            {baht(n)}
          </button>
        ))}
        <button type="button" className={`chip ${amount === 0 ? 'active' : ''}`} onClick={() => setAmount(0)}>
          กำหนดเอง
        </button>
      </div>
      <div className="qr-wrap">
        {qrUrl ? (
          <img src={qrUrl} alt={`QR พร้อมเพย์${amount > 0 ? ` ยอด ${baht(amount)}` : ' เปิดยอดเอง'}`} width={200} height={200} />
        ) : (
          <div className="qr-placeholder" aria-hidden="true">
            <div className="spinner" />
          </div>
        )}
      </div>
      <p className="way-note">
        เบอร์/เลขพร้อมเพย์ <code>{DONATE.promptpay}</code>{' '}
        <button type="button" className="btn btn-soft btn-sm" onClick={copyId}>
          {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอก'}
        </button>
      </p>
    </section>
  )
}

function WaysSection() {
  const links = (DONATE.links || []).filter((l) => l.href)
  const bank = DONATE.bank && DONATE.bank.name ? DONATE.bank : null
  const hasPromptPay = Boolean(DONATE.promptpay)

  if (!hasPromptPay && links.length === 0 && !bank) {
    return (
      <section className="way-card">
        <h3>ช่องทางสนับสนุน</h3>
        <p className="way-note">
          ยังไม่เปิดช่องทางรับสนับสนุนอย่างเป็นทางการ หากต้องการช่วยเว็บนี้ติดต่อได้ที่{' '}
          <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
        </p>
        <p className="way-note muted">กำลังใจก็ช่วยได้ — แชร์ให้เพื่อนที่ทบทวนกฎหมายใช้ ก็เป็นการสนับสนุนแล้ว 💙</p>
      </section>
    )
  }

  return (
    <div className="ways-grid">
      <PromptPayCard />
      {bank && (
        <section className="way-card">
          <h3>โอนเข้าบัญชีธนาคาร</h3>
          <p className="way-note">
            {bank.name}
            <br />
            <code>{bank.accountNo}</code>
            <br />
            {bank.accountName}
          </p>
        </section>
      )}
      {links.length > 0 && (
        <section className="way-card">
          <h3>ช่องทางอื่น ๆ</h3>
          <p className="way-note">สะดวกช่องทางไหน คลิกได้เลย</p>
          <div className="support-links">
            {links.map((l) => (
              <a key={l.id} className="btn btn-soft" href={l.href} target="_blank" rel="noopener noreferrer">
                {l.label} ↗
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Leaderboard({ data }) {
  if (!data) {
    return (
      <section className="leaderboard">
        <h2>กระดานผู้สนับสนุน</h2>
        <p className="muted lb-loading">กำลังโหลดรายชื่อ…</p>
      </section>
    )
  }
  return (
    <section className="leaderboard" aria-label="กระดานผู้สนับสนุน">
      <h2>กระดานผู้สนับสนุน{data.month ? ` — ${data.month}` : ''}</h2>
      <p className="muted">ขอบคุณทุกชื่อที่ช่วยให้บัตรมาตราอยู่ต่อไปได้ 🙏</p>
      {data.ranked.length === 0 ? (
        <p className="lb-empty">ยังไม่มีรายชื่อในเดือนนี้ — สนับสนุนแล้วแจ้งชื่อมาได้เลย ระบบจะจัดอันดับตามยอดสนับสนุน</p>
      ) : (
        <ol className="lb-list">
          {data.ranked.map((s, i) => (
            <li key={`${s.name}-${i}`} className={`lb-row ${i < 3 ? 'lb-top' : ''}`}>
              <span className={`lb-rank ${i < 3 ? `lb-rank-${i + 1}` : ''}`} aria-hidden="true">
                {i < 3 ? MEDALS[i] : i + 1}
              </span>
              <span className="lb-main">
                <span className="lb-name">{s.name || 'ไม่ระบุชื่อ'}</span>
                {s.message ? <span className="lb-msg">“{s.message}”</span> : null}
              </span>
              <span className="lb-side">
                <b className="lb-amount">{baht(s.amount)}</b>
                <span className="lb-date">{shortDate(s.date)}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export default function SupportPage({ navigate }) {
  const data = useSupportData()

  return (
    <div className="support-page">
      <div className="page-head">
        <button type="button" className="back-link" onClick={() => navigate({ name: 'home' })}>
          ← กลับหน้าแรก
        </button>
        <h1>สนับสนุนบัตรมาตรา</h1>
        <p className="muted">
          บัตรมาตราใช้ฟรี ไม่มีโฆษณากวนการทบทวน ทุกยอดสนับสนุนช่วยแบกค่าใช้จ่ายปีละครั้งของตัวบทกฎหมายและค่าเซิร์ฟเวอร์
        </p>
      </div>

      <GoalCard data={data} />
      <WaysSection />
      <Leaderboard data={data} />

      <AdSlot slotKey="support-page" slot={ADSENSE.slots.supportPage} navigate={navigate} />

      {SITE.contactEmail && (
        <p className="muted support-contact">สอบถามเรื่องการสนับสนุน: {SITE.contactEmail}</p>
      )}
    </div>
  )
}
