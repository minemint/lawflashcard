import React, { useEffect, useState } from 'react'
import HomePage from './components/HomePage.jsx'
import GroupPage from './components/GroupPage.jsx'
import StudyPage from './components/StudyPage.jsx'
import MatchGamePage from './components/MatchGamePage.jsx'
import LawImportPage from './components/LawImportPage.jsx'
import SupportPage from './components/SupportPage.jsx'
import Footer from './components/Footer.jsx'
import SupportStrip from './components/SupportStrip.jsx'
import { useStore } from './store.jsx'
import { useSupportData } from './support.js'
import { SITE } from './config.js'

const BASE_TITLE = `${SITE.name} — แฟลชการ์ดทบทวนกฎหมาย ป.แพ่ง ป.อาญา ฟรี`

export function parseHash() {
  const seg = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  switch (seg[0]) {
    case 'group':
      return seg[1] ? { name: 'group', groupId: seg[1] } : { name: 'home' }
    case 'study':
      return seg[1]
        ? { name: 'study', groupId: seg[1], scope: seg[2] === 'todo' ? 'todo' : 'all' }
        : { name: 'home' }
    case 'match':
      return seg[1] ? { name: 'match', groupId: seg[1] } : { name: 'home' }
    case 'import':
      return seg[1] ? { name: 'import', groupId: seg[1] } : { name: 'import' }
    case 'support':
      return { name: 'support' }
    default:
      return { name: 'home' }
  }
}

export function toHash(view) {
  switch (view.name) {
    case 'group':
      return `#/group/${view.groupId}`
    case 'study':
      return `#/study/${view.groupId}/${view.scope === 'todo' ? 'todo' : 'all'}`
    case 'match':
      return `#/match/${view.groupId}`
    case 'import':
      return view.groupId ? `#/import/${view.groupId}` : '#/import'
    case 'support':
      return '#/support'
    default:
      return '#/'
  }
}

function titleFor(view, groups) {
  const group = view.groupId ? groups.find((g) => g.id === view.groupId) : null
  if (view.name === 'study' && group) return `ทบทวน ${group.name} · ${SITE.name}`
  if (view.name === 'match' && group) return `จับคู่ ${group.name} · ${SITE.name}`
  if (view.name === 'group' && group) return `${group.name} · ${SITE.name}`
  if (view.name === 'import') return `นำเข้ามาตราจากกฎหมาย · ${SITE.name}`
  if (view.name === 'support') return `สนับสนุนเรา · ${SITE.name}`
  return BASE_TITLE
}

function TopNav({ view, navigate }) {
  const support = useSupportData()
  const active = (name) => view.name === name || (name === 'home' && view.name === 'home')

  return (
    <nav className="top-nav" aria-label="เมนูหลัก">
      <button
        type="button"
        className={`top-nav-link ${active('home') ? 'current' : ''}`}
        onClick={() => navigate({ name: 'home' })}
      >
        หน้าแรก
      </button>
      <button
        type="button"
        className={`top-nav-link ${view.name === 'import' ? 'current' : ''}`}
        onClick={() => navigate({ name: 'import' })}
      >
        นำเข้ากฎหมาย
      </button>
      <a
        href="#/support"
        className={`support-link ${view.name === 'support' ? 'current' : ''}`}
        aria-label="หน้าสนับสนุนเรา"
      >
        <span className="support-heart" aria-hidden="true">
          ♥
        </span>
        สนับสนุนเรา
        {support && support.count > 0 && (
          <span className="support-pct" title={`เป้าหมายเดือนนี้ทำได้ ${support.percent}%`}>
            {support.percent}%
          </span>
        )}
      </a>
    </nav>
  )
}

export default function App() {
  const { groups } = useStore()
  const [view, setView] = useState(parseHash)
  const viewKey = toHash(view)

  // hash เป็นแหล่งความจริงเดียว — navigate แค่เปลี่ยน hash แล้วให้ event ดึงกลับ
  useEffect(() => {
    const onHash = () => setView(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = (next) => {
    const hash = toHash(next)
    if (window.location.hash === hash) setView(parseHash())
    else window.location.hash = hash
  }

  useEffect(() => {
    document.title = titleFor(view, groups)
  }, [view, groups])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [viewKey])

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <button className="brand" onClick={() => navigate({ name: 'home' })}>
            <span className="brand-mark" aria-hidden="true" />
            บัตรมาตรา
          </button>
          <TopNav view={view} navigate={navigate} />
        </div>
      </header>
      <main className="page">
        {view.name === 'home' && <HomePage navigate={navigate} />}
        {view.name === 'group' && (
          <GroupPage key={`g-${view.groupId}`} groupId={view.groupId} navigate={navigate} />
        )}
        {view.name === 'study' && (
          <StudyPage
            key={`s-${view.groupId}-${view.scope}`}
            groupId={view.groupId}
            scope={view.scope}
            navigate={navigate}
          />
        )}
        {view.name === 'match' && (
          <MatchGamePage key={`m-${view.groupId}`} groupId={view.groupId} navigate={navigate} />
        )}
        {view.name === 'import' && (
          <LawImportPage
            key={`i-${view.groupId ?? 'new'}`}
            groupId={view.groupId}
            navigate={navigate}
          />
        )}
        {view.name === 'support' && <SupportPage navigate={navigate} />}
      </main>
      {view.name === 'home' && <SupportStrip navigate={navigate} />}
      <Footer navigate={navigate} />
    </div>
  )
}
