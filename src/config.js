/**
 * การตั้งค่ารวมของเว็บ — แก้ค่าในไฟล์นี้ที่เดียว
 *
 * 1) Google AdSense: ใส่รหัสผู้เผยแพร่ใน ADSENSE.clientId (เช่น "ca-pub-1234567890123456")
 *    แล้วช่องโฆษณาทุกจุดจะเปลี่ยนจากแบนเนอร์โฮมสไตล์เป็นโฆษณาจริงของ Google อัตโนมัติ
 *    (อย่าลืมเอาคอมเมนต์ meta "google-adsense-account" ใน index.html และบรรทัดใน public/ads.txt ออกด้วย)
 *
 * 2) ระบบสนับสนุน/บริจาค: แก้ข้อมูลเป้าหมายและช่องทางรับเงินใน DONATE
 *    รายชื่อผู้สนับสนุนแก้ได้ที่ public/data/supporters.json
 */

export const SITE = {
  name: 'บัตรมาตรา',
  tagline: 'ทบทวนกฎหมายด้วยการ์ด',
  url: 'https://minemint.github.io/lawflashcard/',
  since: 2026,
  contactEmail: 'contact@example.com',
}

export const ADSENSE = {
  // เว้นว่างไว้ก่อน = ยังไม่ใช้โฆษณาจริง ระบบจะแสดงแบนเนอร์โฮมสไตล์แทน
  clientId: '',
  slots: {
    homeTop: '', // data-ad-slot ของหน้าแรก (แถบบน)
    homeBottom: '', // data-ad-slot ของหน้าแรก (แถบล่าง)
    groupTop: '', // data-ad-slot ของหน้ากลุ่ม
    importTop: '', // data-ad-slot ของหน้านำเข้ากฎหมาย
    supportPage: '', // data-ad-slot ของหน้าสนับสนุน
  },
}

export const DONATE = {
  /** เป้าหมายยอดสนับสนุนต่อเดือน (บาท) — ข้อมูลรายเดือนอยู่ที่ public/data/supporters.json */
  monthlyGoal: 3000,
  /** พร้อมเพย์: เบอร์โทร (0xxxxxxxxx) หรือเลขบัตรประชาชน 13 หลัก — เว้นว่าง = ซ่อน QR */
  promptpay: '',
  promptpayName: 'บัตรมาตรา',
  /** บัญชีธนาคารสำรอง (แสดงเมื่อกรอกครบ) */
  bank: { name: '', accountNo: '', accountName: '' },
  /** ลิงก์รับเงินอื่น ๆ เช่น Ko-fi / TrueMoney / PayPal — เว้นว่าง = ซ่อน */
  links: [
    { id: 'kofi', label: 'Ko-fi', href: '' },
    { id: 'truemoney', label: 'TrueMoney Wallet', href: '' },
  ],
}

/** แบนเนอร์โฮมสไตล์ (house ads) ใช้เมื่อยังไม่ได้ใส่รหัส AdSense */
export const HOUSE_ADS = [
  {
    id: 'import-law',
    eyebrow: 'ฟีเจอร์เด่น',
    title: 'นำเข้ามาตราจากตัวบทกฎหมายโดยตรง',
    text: 'เลือกมาตราจาก ป.แพ่งฯ และ ป.อาญา เป็นการ์ดได้ในคลิกเดียว ไม่ต้องพิมพ์เอง',
    cta: 'ไปหน้านำเข้า',
    view: 'import',
    color: 'sky',
  },
  {
    id: 'match-game',
    eyebrow: 'พักสมองแบบมีสาระ',
    title: 'มินิเกมจับคู่มาตรา',
    text: 'ท่องจำสนุกขึ้นด้วยการจับคู่หัวข้อกับเนื้อหามาตรา จับเวลา นับคะแนน',
    cta: 'ลองเล่นเลย',
    view: 'match',
    color: 'butter',
  },
  {
    id: 'support-us',
    eyebrow: 'สนับสนุนเรา',
    title: 'ช่วยให้บัตรมาตราเติบโตต่อไป',
    text: 'ค่าโฮสติ้งและการอัปเดตตัวบทกฎหมายทุกปี มาจากผู้ใช้อย่างคุณ',
    cta: 'ดูวิธีสนับสนุน',
    view: 'support',
    color: 'mint',
  },
]

/** เลือกแบนเนอร์โฮมสไตล์แบบหมุนเวียนตามตำแหน่งช่อง */
export const houseAdAt = (index) => HOUSE_ADS[index % HOUSE_ADS.length]
