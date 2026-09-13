import React, { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store.jsx'
import { colorVars, excerpt, STATUS_LABEL } from '../utils.js'
import { ADSENSE } from '../config.js'
import AdSlot from './AdSlot.jsx'
import CardForm from './CardForm.jsx'
import GroupForm from './GroupForm.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'

const FILTERS = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'new', label: 'ใหม่' },
  { id: 'unknown', label: 'ยังไม่ได้' },
  { id: 'known', label: 'จำได้' },
]

export default function GroupPage({ groupId, navigate }) {
  const { groups, api } = useStore()
  const group = groups.find((g) => g.id === groupId)
  const [filter, setFilter] = useState('all')
  const [cardForm, setCardForm] = useState(null) // null | { card: obj|null }
  const [editGroup, setEditGroup] = useState(false)
  const [deletingCard, setDeletingCard] = useState(null)
  const [deletingGroup, setDeletingGroup] = useState(false)

  useEffect(() => {
    if (!group) navigate({ name: 'home' })
  }, [group, navigate])

  const counts = useMemo(() => {
    const c = { all: 0, new: 0, unknown: 0, known: 0 }
    if (group) {
      c.all = group.cards.length
      for (const card of group.cards) c[card.status] = (c[card.status] || 0) + 1
    }
    return c
  }, [group])

  if (!group) return null

  const todoCount = group.cards.length - counts.known
  const visible = filter === 'all' ? group.cards : group.cards.filter((c) => c.status === filter)

  return (
    <div style={colorVars(group.color)}>
      <div className="page-head">
        <button type="button" className="back-link" onClick={() => navigate({ name: 'home' })}>
          ← กลุ่มทั้งหมด
        </button>
        <div className="title-row">
          <span className="group-color-dot" aria-hidden="true" />
          <h1>{group.name}</h1>
          <button type="button" className="icon-btn" aria-label="แก้ไขกลุ่ม" onClick={() => setEditGroup(true)}>
            ✎
          </button>
          <button type="button" className="icon-btn danger" aria-label="ลบกลุ่ม" onClick={() => setDeletingGroup(true)}>
            🗑
          </button>
        </div>
        <p className="stats-row">
          ทั้งหมด {counts.all} · ใหม่ {counts.new} · ยังไม่ได้ {counts.unknown} · จำได้ {counts.known}
        </p>
      </div>

      <AdSlot slotKey="group-top" slot={ADSENSE.slots.groupTop} navigate={navigate} />

      <div className="toolbar">
        <button type="button" className="btn btn-primary" onClick={() => setCardForm({ card: null })}>
          + เพิ่มการ์ด
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => navigate({ name: 'import', groupId: group.id })}
        >
          นำเข้าจากกฎหมาย
        </button>
        <span className="toolbar-sep" />
        <button
          type="button"
          className="btn btn-soft"
          onClick={() => navigate({ name: 'study', groupId: group.id, scope: 'all' })}
          disabled={group.cards.length === 0}
        >
          ทบทวนทั้งหมด
        </button>
        <button
          type="button"
          className="btn btn-soft"
          onClick={() => navigate({ name: 'study', groupId: group.id, scope: 'todo' })}
          disabled={todoCount === 0}
        >
          ทบทวนที่ยังไม่ได้
        </button>
        <button
          type="button"
          className="btn btn-soft"
          onClick={() => navigate({ name: 'match', groupId: group.id })}
          disabled={group.cards.length < 4}
        >
          จับคู่
        </button>
      </div>

      {group.cards.length > 0 && (
        <div className="filter-chips" role="group" aria-label="กรองการ์ดตามสถานะ">
          {FILTERS.map((f) => (
            <button
              type="button"
              key={f.id}
              className={`chip ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label} {counts[f.id]}
            </button>
          ))}
        </div>
      )}

      {group.cards.length === 0 ? (
        <div className="empty">
          <h2>กลุ่มนี้ยังไม่มีการ์ด</h2>
          <p>เพิ่มการ์ดด้วยตัวเอง หรือเลือกมาตราจากตัวบทกฎหมายมาสร้างการ์ด</p>
          <div className="empty-actions">
            <button type="button" className="btn btn-primary" onClick={() => setCardForm({ card: null })}>
              + เพิ่มการ์ด
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate({ name: 'import', groupId: group.id })}
            >
              นำเข้าจากกฎหมาย
            </button>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <p className="muted empty-filter">ไม่มีการ์ดในสถานะนี้</p>
      ) : (
        <ul className="card-list">
          {visible.map((c) => (
            <li key={c.id} className="card-row">
              <div className="card-row-main">
                <div className="card-row-front">{c.front}</div>
                <div className="card-row-back">{excerpt(c.back, 160)}</div>
              </div>
              <span className={`pill pill-${c.status}`}>{STATUS_LABEL[c.status]}</span>
              <div className="card-row-actions">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="แก้ไขการ์ด"
                  onClick={() => setCardForm({ card: c })}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="icon-btn danger"
                  aria-label="ลบการ์ด"
                  onClick={() => setDeletingCard(c)}
                >
                  🗑
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {cardForm && (
        <CardForm
          initial={cardForm.card}
          onClose={() => setCardForm(null)}
          onSubmit={(patch) => {
            if (cardForm.card) api.updateCard(group.id, cardForm.card.id, patch)
            else api.addCard(group.id, patch.front, patch.back)
            setCardForm(null)
          }}
        />
      )}

      {editGroup && (
        <GroupForm
          initial={group}
          onClose={() => setEditGroup(false)}
          onSubmit={(patch) => {
            api.updateGroup(group.id, patch)
            setEditGroup(false)
          }}
        />
      )}

      {deletingCard && (
        <ConfirmDialog
          title="ลบการ์ดใบนี้"
          message={`ลบ "${excerpt(deletingCard.front, 60)}" ออกจากกลุ่ม และกู้คืนไม่ได้`}
          confirmLabel="ลบการ์ด"
          onConfirm={() => api.deleteCard(group.id, deletingCard.id)}
          onClose={() => setDeletingCard(null)}
        />
      )}

      {deletingGroup && (
        <ConfirmDialog
          title={`ลบกลุ่ม "${group.name}"`}
          message={`การ์ดทั้งหมด ${group.cards.length} ใบในกลุ่มนี้จะถูกลบด้วย และกู้คืนไม่ได้`}
          confirmLabel="ลบกลุ่ม"
          onConfirm={() => {
            api.deleteGroup(group.id)
            navigate({ name: 'home' })
          }}
          onClose={() => setDeletingGroup(false)}
        />
      )}
    </div>
  )
}
