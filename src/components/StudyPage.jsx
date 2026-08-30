import React, { useEffect, useRef, useState } from 'react'
import { useStore } from '../store.jsx'
import { colorVars, shuffle } from '../utils.js'

export default function StudyPage({ groupId, scope = 'all', navigate }) {
  const { groups, api } = useStore()
  const group = groups.find((g) => g.id === groupId)

  // ลำดับการ์ดคงที่ตลอดเซสชัน สร้างครั้งเดียวตอนเปิดหน้า
  const [order, setOrder] = useState(() => {
    if (!group) return []
    const pool = scope === 'todo' ? group.cards.filter((c) => c.status !== 'known') : group.cards
    return pool.map((c) => c.id)
  })
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [stats, setStats] = useState({ known: 0, unknown: 0 })
  const [stamp, setStamp] = useState(null)
  const lockRef = useRef(false)

  useEffect(() => {
    if (!group) navigate({ name: 'home' })
  }, [group, navigate])

  const done = idx >= order.length
  const current = done ? null : group && group.cards.find((c) => c.id === order[idx])

  function flip() {
    if (!current || lockRef.current) return
    setFlipped((f) => !f)
  }

  function nav(delta) {
    if (lockRef.current) return
    setFlipped(false)
    setIdx((i) => Math.min(Math.max(i + delta, 0), order.length))
  }

  function answer(status) {
    if (!current || lockRef.current || done) return
    lockRef.current = true
    api.setCardStatus(group.id, current.id, status)
    setStats((s) => ({ ...s, [status]: s[status] + 1 }))
    setStamp(status)
    window.setTimeout(() => {
      setStamp(null)
      setFlipped(false)
      setIdx((i) => i + 1)
      lockRef.current = false
    }, 620)
  }

  useEffect(() => {
    const onKey = (e) => {
      const t = e.target
      if (t instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return
      if (e.code === 'Space') {
        e.preventDefault()
        flip()
      } else if (e.key === 'ArrowLeft') {
        nav(-1)
      } else if (e.key === 'ArrowRight') {
        nav(1)
      } else if (e.key === '1') {
        answer('unknown')
      } else if (e.key === '2') {
        answer('known')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function reshuffle() {
    setOrder((o) => (o.length > 1 ? shuffle(o) : o))
    setIdx(0)
    setFlipped(false)
  }

  function restartTodo() {
    const todo = group ? group.cards.filter((c) => c.status !== 'known').map((c) => c.id) : []
    setOrder(todo)
    setIdx(0)
    setFlipped(false)
    setStats({ known: 0, unknown: 0 })
  }

  function restartAll() {
    setIdx(0)
    setFlipped(false)
    setStats({ known: 0, unknown: 0 })
  }

  if (!group) return null

  const pct = order.length ? Math.round((idx / order.length) * 100) : 0
  const scopeLabel = scope === 'todo' ? 'เฉพาะที่ยังไม่ได้' : 'ทั้งหมด'

  if (order.length === 0) {
    return (
      <div className="study-wrap" style={colorVars(group.color)}>
        <div className="empty">
          <h2>ไม่มีการ์ดที่จะทบทวน</h2>
          <p>{scope === 'todo' ? 'การ์ดทุกใบในกลุ่มนี้ถูกทำเครื่องหมายว่าจำได้แล้ว' : 'กลุ่มนี้ยังไม่มีการ์ด'}</p>
          <div className="empty-actions">
            {scope === 'todo' && (
              <button type="button" className="btn btn-primary" onClick={restartTodo}>
                ทบทวนที่ยังไม่ได้อีกครั้ง
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate({ name: 'group', groupId: group.id })}
            >
              กลับไปหน้ากลุ่ม
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="study-wrap" style={colorVars(group.color)}>
        <div className="study-summary">
          <div className="stamp stamp-known stamp-big" aria-hidden="true">
            จบการทบทวน
          </div>
          <h2>ผ่านการ์ดไป {order.length} ใบ</h2>
          <p className="summary-line">
            จำได้ <b>{stats.known}</b> ใบ · ยังไม่ได้ <b>{stats.unknown}</b> ใบ
          </p>
          <div className="empty-actions">
            {stats.unknown > 0 && (
              <button type="button" className="btn btn-primary" onClick={restartTodo}>
                ทบทวน {stats.unknown} ใบที่ยังไม่ได้อีกครั้ง
              </button>
            )}
            <button type="button" className="btn btn-soft" onClick={restartAll}>
              เริ่มรอบใหม่
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate({ name: 'group', groupId: group.id })}
            >
              กลับไปหน้ากลุ่ม
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="study-wrap" style={colorVars(group.color)}>
      <div className="study-topbar">
        <button
          type="button"
          className="back-link"
          onClick={() => navigate({ name: 'group', groupId: group.id })}
        >
          ← ออก
        </button>
        <span className="muted">
          {group.name} · {scopeLabel}
        </span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={reshuffle}>
          สุ่มลำดับ
        </button>
      </div>

      <div className="study-progress-row">
        <span className="progress-label">
          {idx + 1} / {order.length}
        </span>
        <div className="progress grow">
          <span style={{ width: `${pct}%` }} />
        </div>
        <span className="progress-label">
          จำได้ {stats.known} · ยังไม่ได้ {stats.unknown}
        </span>
      </div>

      <div className="study-stage">
        <div
          className={`flip-scene ${flipped ? 'flipped' : ''}`}
          onClick={flip}
          role="button"
          tabIndex={0}
          aria-label="พลิกการ์ด"
          onKeyDown={(e) => {
            if (e.key === 'Enter') flip()
          }}
        >
          <div className="study-tab">{current.front}</div>
          <div className="flip-inner">
            <div className="flip-face front">
              {current.source?.path && <p className="study-eyebrow">{current.source.path}</p>}
              <div className="study-front-text">{current.front}</div>
              <div className="study-hint">แตะการ์ด หรือกด Space เพื่อพลิกดูเนื้อหา</div>
            </div>
            <div className="flip-face back">
              {current.source?.path && <p className="study-eyebrow">{current.source.path}</p>}
              <div className="study-content">{current.back}</div>
            </div>
          </div>
          {stamp === 'known' && (
            <div className="stamp stamp-known" aria-hidden="true">
              จำได้
            </div>
          )}
          {stamp === 'unknown' && (
            <div className="stamp stamp-miss" aria-hidden="true">
              ยังไม่ได้
            </div>
          )}
        </div>
      </div>

      <div className="study-controls">
        <button type="button" className="btn btn-soft" onClick={() => nav(-1)} disabled={idx === 0}>
          ← ก่อนหน้า
        </button>
        <button type="button" className="btn btn-primary" onClick={flip}>
          {flipped ? 'ซ่อนเนื้อหา' : 'พลิกการ์ด'}
        </button>
        <button
          type="button"
          className="btn btn-soft"
          onClick={() => nav(1)}
          disabled={idx === order.length - 1}
        >
          ถัดไป →
        </button>
      </div>

      {flipped && (
        <div className="answer-row">
          <button type="button" className="btn btn-wrong" onClick={() => answer('unknown')}>
            ยังไม่ได้ <kbd>1</kbd>
          </button>
          <button type="button" className="btn btn-known" onClick={() => answer('known')}>
            จำได้ <kbd>2</kbd>
          </button>
        </div>
      )}
    </div>
  )
}
