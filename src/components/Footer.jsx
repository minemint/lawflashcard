import React from 'react'
import { SITE } from '../config.js'

export default function Footer({ navigate }) {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <p className="footer-brand">
          <b>{SITE.name}</b> — {SITE.tagline} · แฟลชการ์ดทบทวนกฎหมายไทยที่ใช้ฟรี
        </p>
        <nav className="footer-nav" aria-label="ลิงก์ท้ายเว็บ">
          <button type="button" className="footer-link" onClick={() => navigate({ name: 'home' })}>
            หน้าแรก
          </button>
          <button type="button" className="footer-link" onClick={() => navigate({ name: 'import' })}>
            นำเข้าจากกฎหมาย
          </button>
          <button type="button" className="footer-link" onClick={() => navigate({ name: 'support' })}>
            สนับสนุนเรา
          </button>
        </nav>
        <p className="footer-fine">
          Since {SITE.since} · สร้างโดยผู้ใช้ เพื่อผู้ทบทวนกฎหมาย · ข้อมูลการ์ดของคุณเก็บอยู่ในเบราว์เซอร์ของคุณเองเท่านั้น
          <br />
          ตัวบทกฎหมายอ้างอิงจากประมวลกฎหมายแพ่งและพาณิชย์ และประมวลกฎหมายอาญา — สำหรับทบทวนเพื่อการศึกษา ไม่ใช่คำแนะนำทางกฎหมาย
        </p>
      </div>
    </footer>
  )
}
