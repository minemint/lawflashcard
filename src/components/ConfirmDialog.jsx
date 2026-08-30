import React from 'react'
import Modal from './Modal.jsx'

export default function ConfirmDialog({ title, message, confirmLabel = 'ยืนยัน', onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="confirm-message">{message}</p>
      <div className="modal-actions">
        <button type="button" className="btn" onClick={onClose}>
          ยกเลิก
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
