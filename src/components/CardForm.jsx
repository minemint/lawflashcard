import React, { useState } from 'react'
import Modal from './Modal.jsx'

export default function CardForm({ initial = null, onSubmit, onClose }) {
  const [front, setFront] = useState(initial?.front ?? '')
  const [back, setBack] = useState(initial?.back ?? '')

  return (
    <Modal title={initial ? 'แก้ไขการ์ด' : 'เพิ่มการ์ดใหม่'} onClose={onClose} wide>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!front.trim() || !back.trim()) return
          onSubmit({ front: front.trim(), back: back.trim() })
        }}
      >
        <label className="field">
          <span className="field-label">ด้านหน้า — คำถาม / ชื่อมาตรา</span>
          <textarea
            autoFocus
            rows={2}
            value={front}
            onChange={(e) => setFront(e.target.value)}
            placeholder="เช่น มาตรา ๒๘๘"
          />
        </label>
        <label className="field">
          <span className="field-label">ด้านหลัง — คำตอบ / เนื้อหา</span>
          <textarea
            rows={6}
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="เช่น ใครฟ้องหย่า ศาลจะมีคำสั่งหย่าได้ ต้องมีเหตุอย่างใดอย่างหนึ่งต่อไปนี้…"
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button type="submit" className="btn btn-primary" disabled={!front.trim() || !back.trim()}>
            {initial ? 'บันทึก' : 'เพิ่มการ์ด'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
