import React, { useState } from 'react'
import Modal from './Modal.jsx'
import { PASTELS } from '../utils.js'

export default function GroupForm({ initial = null, onSubmit, onClose }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? PASTELS[0].id)

  return (
    <Modal title={initial ? 'แก้ไขกลุ่ม' : 'สร้างกลุ่มใหม่'} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          onSubmit({ name: name.trim(), color })
        }}
      >
        <label className="field">
          <span className="field-label">ชื่อกลุ่ม</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น ป.อาญา — ความผิดเกี่ยวกับชีวิต"
          />
        </label>
        <div className="field">
          <span className="field-label">สีประจำกลุ่ม</span>
          <div className="swatches">
            {PASTELS.map((p) => (
              <button
                type="button"
                key={p.id}
                className={`swatch ${color === p.id ? 'active' : ''}`}
                style={{ background: p.soft, borderColor: p.edge }}
                onClick={() => setColor(p.id)}
                aria-label={`สี${p.label}`}
                aria-pressed={color === p.id}
                title={p.label}
              >
                {color === p.id && <span style={{ color: p.deep }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            {initial ? 'บันทึก' : 'สร้างกลุ่ม'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
