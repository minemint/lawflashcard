import React, { useState } from 'react'
import HomePage from './components/HomePage.jsx'
import GroupPage from './components/GroupPage.jsx'
import StudyPage from './components/StudyPage.jsx'
import MatchGamePage from './components/MatchGamePage.jsx'
import LawImportPage from './components/LawImportPage.jsx'

export default function App() {
  const [view, setView] = useState({ name: 'home' })

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <button className="brand" onClick={() => setView({ name: 'home' })}>
            <span className="brand-mark" aria-hidden="true" />
            บัตรมาตรา
          </button>
          <span className="brand-sub">ทบทวนกฎหมายด้วยการ์ด</span>
        </div>
      </header>
      <main className="page">
        {view.name === 'home' && <HomePage navigate={setView} />}
        {view.name === 'group' && (
          <GroupPage key={`g-${view.groupId}`} groupId={view.groupId} navigate={setView} />
        )}
        {view.name === 'study' && (
          <StudyPage
            key={`s-${view.groupId}-${view.scope}`}
            groupId={view.groupId}
            scope={view.scope}
            navigate={setView}
          />
        )}
        {view.name === 'match' && (
          <MatchGamePage key={`m-${view.groupId}`} groupId={view.groupId} navigate={setView} />
        )}
        {view.name === 'import' && (
          <LawImportPage
            key={`i-${view.groupId ?? 'new'}`}
            groupId={view.groupId}
            navigate={setView}
          />
        )}
      </main>
    </div>
  )
}
