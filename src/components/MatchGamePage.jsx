import React, { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store.jsx'
import { colorVars, excerpt, formatClock, shuffle } from '../utils.js'

const PAIR_OPTIONS = [4, 6, 8, 10]

export default function MatchGamePage({ groupId, navigate }) {
  const { groups, api } = useStore()
  const group = groups.find((g) => g.id === groupId)

  const [phase, setPhase] = useState('setup') // setup | play | done
  const [pairCount, setPairCount] = useState(6)
  const [useTodo, setUseTodo] = useState(false)
  const [round, setRound] = useState(null) // { left: cards, right: cards }
  const [selL, setSelL] = useState(null)
  const [selR, setSelR] = useState(null)
  const [matched, setMatched] = useState(() => new Set())
  const [trials, setTrials] = useState(0)
  const [missed, setMissed] = useState(() => new Set())
  const [locked, setLocked] = useState(false)
  const [wrongPair, setWrongPair] = useState(null)
  const [lastPick, setLastPick] = useState(null)
  const [startedAt, setStartedAt] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [markedDone, setMarkedDone] = useState(false)

  useEffect(() => {
    if (!group) navigate({ name: 'home' })
  }, [group, navigate])

  useEffect(() => {
    if (phase !== 'play') return
    const t = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }, 500)
    return () => window.clearInterval(t)
  }, [phase, startedAt])

  const todoCards = useMemo(
    () => (group ? group.cards.filter((c) => c.status !== 'known') : []),
    [group]
  )
  const sourceCards = useTodo ? todoCards : group ? group.cards : []
  const maxPairs = Math.min(10, sourceCards.length)
  const options = PAIR_OPTIONS.filter((n) => n <= maxPairs)
  const canPlay = sourceCards.length >= 4

  if (!group) return null

  const accuracy = trials > 0 ? Math.round((matched.size / trials) * 100) : 100

  function start() {
    const picked = shuffle(sourceCards).slice(0, pairCount)
    let right = shuffle(picked)
    if (right.length > 1 && right.every((c, i) => c.id === picked[i].id)) right = shuffle(right)
    setRound({ left: shuffle(picked), right })
    setSelL(null)
    setSelR(null)
    setMatched(new Set())
    setTrials(0)
    setMissed(new Set())
    setWrongPair(null)
    setLastPick(null)
    setLocked(false)
    setMarkedDone(false)
    setStartedAt(Date.now())
    setElapsed(0)
    setPhase('play')
  }

  function resolve(lId, rId) {
    setTrials((t) => t + 1)
    if (lId === rId) {
      const nm = new Set(matched)
      nm.add(lId)
      setMatched(nm)
      setSelL(null)
      setSelR(null)
      if (nm.size === round.left.length) {
        setElapsed(Math.floor((Date.now() - startedAt) / 1000))
        setPhase('done')
      }
    } else {
      const ms = new Set(missed)
      ms.add(lId)
      ms.add(rId)
      setMissed(ms)
      setWrongPair([lId, rId])
      setLocked(true)
      window.setTimeout(() => {
        setSelL(null)
        setSelR(null)
        setWrongPair(null)
        setLocked(false)
      }, 600)
    }
  }

  function pick(side, card) {
    if (locked || phase !== 'play' || matched.has(card.id)) return
    setLastPick(card)
    if (side === 'L') {
      if (selL === card.id) {
        setSelL(null)
        return
      }
      const other = selR
      setSelL(card.id)
      if (other) resolve(card.id, other)
    } else {
      if (selR === card.id) {
        setSelR(null)
        return
      }
      const other = selL
      setSelR(card.id)
      if (other) resolve(other, card.id)
    }
  }

  function markMissed() {
    api.setCardsStatus(group.id, [...missed], 'unknown')
    setMarkedDone(true)
  }

  if (phase === 'setup') {
    return (
      <div className="match-setup" style={colorVars(group.color)}>
        <div className="page-head">
          <button
            type="button"
            className="back-link"
            onClick={() => navigate({ name: 'group', groupId: group.id })}
          >
            ← กลับ
          </button>
          <h1>
            จับคู่ — <span className="match-group-name">{group.name}</span>
          </h1>
          <p className="muted">จับคู่ "ชื่อมาตรา" กับ "เนื้อหา" ให้ถูกต้อง ให้เร็วและแม่นที่สุด</p>
        </div>

        {canPlay ? (
          <div className="setup-card">
            <div className="field">
              <span className="field-label">จำนวนคู่</span>
              <div className="segmented" role="group" aria-label="จำนวนคู่">
                {options.map((n) => (
                  <button
                    type="button"
                    key={n}
                    className={pairCount === n ? 'active' : ''}
                    onClick={() => setPairCount(n)}
                  >
                    {n} คู่
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <span className="field-label">ชุดการ์ด</span>
              <div className="segmented" role="group" aria-label="ชุดการ์ด">
                <button
                  type="button"
                  className={!useTodo ? 'active' : ''}
                  onClick={() => setUseTodo(false)}
                >
                  ทั้งกลุ่ม ({group.cards.length})
                </button>
                <button
                  type="button"
                  className={useTodo ? 'active' : ''}
                  onClick={() => setUseTodo(true)}
                  disabled={todoCards.length < 4}
                  title={todoCards.length < 4 ? 'การ์ดที่ยังไม่ได้มีไม่ถึง 4 ใบ' : undefined}
                >
                  เฉพาะที่ยังไม่ได้ ({todoCards.length})
                </button>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={start}>
                เริ่มเล่น
              </button>
            </div>
          </div>
        ) : (
          <div className="empty">
            <h2>เล่นจับคู่ยังไม่ได้</h2>
            <p>ต้องมีการ์ดอย่างน้อย 4 ใบในกลุ่มนี้ (ตอนนี้มี {group.cards.length} ใบ)</p>
            <div className="empty-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate({ name: 'group', groupId: group.id })}
              >
                กลับไปเพิ่มการ์ด
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="match-summary" style={colorVars(group.color)}>
        <div className="stamp stamp-known stamp-big" aria-hidden="true">
          จับคู่ครบ
        </div>
        <h2>ครบทั้ง {matched.size} คู่</h2>
        <dl className="summary-grid">
          <div>
            <dt>เวลา</dt>
            <dd>{formatClock(elapsed)}</dd>
          </div>
          <div>
            <dt>ลองทั้งหมด</dt>
            <dd>{trials} ครั้ง</dd>
          </div>
          <div>
            <dt>ความแม่นยำ</dt>
            <dd>{accuracy}%</dd>
          </div>
          <div>
            <dt>พลาดตอนแรก</dt>
            <dd>{missed.size} คู่</dd>
          </div>
        </dl>
        <div className="empty-actions">
          {missed.size > 0 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={markMissed}
              disabled={markedDone}
            >
              {markedDone ? 'ทำเครื่องหมายแล้ว' : `ทำเครื่องหมาย ${missed.size} ใบที่เคยพลาดเป็น "ยังไม่ได้"`}
            </button>
          )}
          <button type="button" className="btn btn-soft" onClick={() => setPhase('setup')}>
            เล่นอีกครั้ง
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
    )
  }

  return (
    <div className="match-play" style={colorVars(group.color)}>
      <div className="match-head">
        <button
          type="button"
          className="back-link"
          onClick={() => navigate({ name: 'group', groupId: group.id })}
        >
          ยกเลิก
        </button>
        <span className="match-stat">⏱ {formatClock(elapsed)}</span>
        <span className="match-stat">
          จับคู่ได้ {matched.size}/{round.left.length}
        </span>
        <span className="match-stat">แม่นยำ {accuracy}%</span>
      </div>

      <div className="match-board">
        <div className="match-col" aria-label="ด้านหน้าการ์ด">
          <p className="match-col-label">ชื่อมาตรา / คำถาม</p>
          {round.left.map((c) => (
            <button
              type="button"
              key={c.id}
              className={
                'match-tile' +
                (selL === c.id ? ' selected' : '') +
                (matched.has(c.id) ? ' matched' : '') +
                (wrongPair && wrongPair[0] === c.id ? ' wrong' : '')
              }
              onClick={() => pick('L', c)}
              disabled={matched.has(c.id)}
            >
              <span className="match-tile-front">{excerpt(c.front, 80)}</span>
              {matched.has(c.id) && <span className="match-check">✓</span>}
            </button>
          ))}
        </div>
        <div className="match-col" aria-label="ด้านหลังการ์ด">
          <p className="match-col-label">เนื้อหา / คำตอบ</p>
          {round.right.map((c) => (
            <button
              type="button"
              key={c.id}
              className={
                'match-tile tile-back' +
                (selR === c.id ? ' selected' : '') +
                (matched.has(c.id) ? ' matched' : '') +
                (wrongPair && wrongPair[1] === c.id ? ' wrong' : '')
              }
              onClick={() => pick('R', c)}
              disabled={matched.has(c.id)}
            >
              <span className="match-tile-back">{excerpt(c.back, 110)}</span>
              {matched.has(c.id) && <span className="match-check">✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="match-preview">
        {lastPick ? (
          <>
            <b>{lastPick.front}</b>
            <p>{lastPick.back}</p>
          </>
        ) : (
          <span className="muted">เลือกการ์ดฝ่ายใดฝ่ายหนึ่งเพื่อดูเนื้อหาเต็ม</span>
        )}
      </div>
    </div>
  )
}
