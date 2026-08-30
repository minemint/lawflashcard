import React, { useMemo, useState } from 'react'
import { useStore } from '../store.jsx'
import { PASTELS, colorVars } from '../utils.js'
import GroupForm from './GroupForm.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'

export default function HomePage({ navigate }) {
  const { groups, api } = useStore()
  const [groupForm, setGroupForm] = useState(null) // null | { group: obj|null }
  const [deleting, setDeleting] = useState(null)

  const totals = useMemo(
    () => ({
      cards: groups.reduce((s, g) => s + g.cards.length, 0),
      known: groups.reduce((s, g) => s + g.cards.filter((c) => c.status === 'known').length, 0),
    }),
    [groups]
  )

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <h1>ทบทวนกฎหมายในแบบของคุณ</h1>
          <p>สร้างกลุ่มการ์ดเอง หรือนำเข้ามาตราจากตัวบท ป.แพ่งฯ และ ป.อาญา</p>
        </div>
        <div className="hero-actions">
          <button type="button" className="btn btn-primary" onClick={() => setGroupForm({ group: null })}>
            + สร้างกลุ่ม
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate({ name: 'import' })}>
            นำเข้าจากกฎหมาย
          </button>
        </div>
      </section>

      {groups.length === 0 ? (
        <div className="empty">
          <div className="empty-art" aria-hidden="true">
            <span style={{ background: PASTELS[0].soft }} />
            <span style={{ background: PASTELS[1].soft }} />
            <span style={{ background: PASTELS[2].soft }} />
          </div>
          <h2>ยังไม่มีกลุ่มการ์ด</h2>
          <p>
            สร้างกลุ่มแรกเพื่อเริ่มเก็บการ์ดของคุณ
            <br />
            หรือเลือกมาตราจากตัวบทกฎหมายมาสร้างการ์ดได้เลย
          </p>
          <div className="empty-actions">
            <button type="button" className="btn btn-primary" onClick={() => setGroupForm({ group: null })}>
              สร้างกลุ่มแรก
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate({ name: 'import' })}>
              นำเข้าจากกฎหมาย
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="home-stats">
            กลุ่ม {groups.length} · การ์ด {totals.cards} ใบ · จำได้แล้ว {totals.known} ใบ
          </p>
          <div className="group-grid">
            {groups.map((g) => {
              const known = g.cards.filter((c) => c.status === 'known').length
              const pct = g.cards.length ? Math.round((known / g.cards.length) * 100) : 0
              return (
                <article key={g.id} className="group-card" style={colorVars(g.color)}>
                  <button
                    type="button"
                    className="group-card-main"
                    onClick={() => navigate({ name: 'group', groupId: g.id })}
                  >
                    <span className="group-color-dot" aria-hidden="true" />
                    <h3>{g.name}</h3>
                    <p className="group-meta">การ์ด {g.cards.length} ใบ</p>
                    <div className="progress" aria-label={`จำได้ ${known} จาก ${g.cards.length} ใบ`}>
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <p className="group-meta small">
                      จำได้ {known}/{g.cards.length}
                    </p>
                  </button>
                  <div className="group-card-actions">
                    <button
                      type="button"
                      className="btn btn-soft btn-sm"
                      onClick={() => navigate({ name: 'study', groupId: g.id, scope: 'all' })}
                      disabled={g.cards.length === 0}
                    >
                      ทบทวน
                    </button>
                    <button
                      type="button"
                      className="btn btn-soft btn-sm"
                      onClick={() => navigate({ name: 'match', groupId: g.id })}
                      disabled={g.cards.length < 4}
                    >
                      จับคู่
                    </button>
                    <span className="spacer" />
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`แก้ไขกลุ่ม ${g.name}`}
                      onClick={() => setGroupForm({ group: g })}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="icon-btn danger"
                      aria-label={`ลบกลุ่ม ${g.name}`}
                      onClick={() => setDeleting(g)}
                    >
                      🗑
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}

      {groupForm && (
        <GroupForm
          initial={groupForm.group}
          onClose={() => setGroupForm(null)}
          onSubmit={(patch) => {
            if (groupForm.group) {
              api.updateGroup(groupForm.group.id, patch)
            } else {
              const color = patch.color || PASTELS[groups.length % PASTELS.length].id
              api.createGroup(patch.name, color)
            }
            setGroupForm(null)
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={`ลบกลุ่ม "${deleting.name}"`}
          message={`การ์ดทั้งหมด ${deleting.cards.length} ใบในกลุ่มนี้จะถูกลบด้วย และกู้คืนไม่ได้`}
          confirmLabel="ลบกลุ่ม"
          onConfirm={() => api.deleteGroup(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}
