import React, { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store.jsx'
import { LAW_CODES, loadLaw, articlePath, searchArticles } from '../lawData.js'
import { excerpt, PASTELS } from '../utils.js'

const PAGE_SIZE = 250
const NEW_GROUP = '__new__'

export default function LawImportPage({ groupId = null, navigate }) {
  const { groups, api } = useStore()
  const [codeId, setCodeId] = useState('civil')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [articles, setArticles] = useState([])
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [selected, setSelected] = useState(() => new Set())
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [target, setTarget] = useState(groupId ?? NEW_GROUP)
  const [newName, setNewName] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query), 200)
    return () => window.clearTimeout(t)
  }, [query])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const list = await loadLaw(codeId)
        if (!cancelled) setArticles(list)
      } catch {
        if (!cancelled) setError('โหลดตัวบทกฎหมายไม่สำเร็จ ตรวจการเชื่อมต่อแล้วลองใหม่')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [codeId, reloadKey])

  const filtered = useMemo(() => searchArticles(articles, debounced), [articles, debounced])
  const visible = filtered.slice(0, limit)

  const rows = useMemo(() => {
    const out = []
    let lastKey = null
    for (const a of visible) {
      const key = articlePath(a)
      if (key && key !== lastKey) {
        out.push({ header: key })
        lastKey = key
      }
      out.push({ article: a })
    }
    return out
  }, [visible])

  function toggle(number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(number)) next.delete(number)
      else next.add(number)
      return next
    })
  }

  function toggleVisible() {
    setSelected((prev) => {
      const next = new Set(prev)
      const allShown = visible.every((a) => next.has(a.number))
      for (const a of visible) {
        if (allShown) next.delete(a.number)
        else next.add(a.number)
      }
      return next
    })
  }

  function doImport() {
    if (selected.size === 0) return
    const chosen = articles.filter((a) => selected.has(a.number))
    const items = chosen.map((a) => ({
      front: `มาตรา ${a.number_th || a.number}`,
      back: a.content,
      source: { code: codeId, number: a.number, path: articlePath(a) },
    }))
    let gid = target
    if (target === NEW_GROUP) {
      const law = LAW_CODES.find((c) => c.id === codeId)
      const color = PASTELS[groups.length % PASTELS.length].id
      const g = api.createGroup(newName.trim() || `${law.shortName} — มาตราที่เลือก`, color)
      gid = g.id
    }
    api.importCards(gid, items)
    navigate({ name: 'group', groupId: gid })
  }

  const allShownSelected = visible.length > 0 && visible.every((a) => selected.has(a.number))
  const law = LAW_CODES.find((c) => c.id === codeId)
  const canImport = selected.size > 0

  return (
    <div className="import-page">
      <div className="page-head">
        <button
          type="button"
          className="back-link"
          onClick={() => navigate(groupId ? { name: 'group', groupId } : { name: 'home' })}
        >
          ← กลับ
        </button>
        <h1>นำเข้าจากกฎหมาย</h1>
        <div className="code-tabs" role="tablist" aria-label="เลือกประมวลกฎหมาย">
          {LAW_CODES.map((c) => (
            <button
              type="button"
              key={c.id}
              role="tab"
              aria-selected={codeId === c.id}
              className={`code-tab ${codeId === c.id ? 'active' : ''}`}
              onClick={() => {
                setCodeId(c.id)
                setSelected(new Set())
                setLimit(PAGE_SIZE)
              }}
            >
              {c.shortName}
            </button>
          ))}
        </div>
        <p className="muted">{law.longName}</p>
      </div>

      <div className="search-row">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setLimit(PAGE_SIZE)
          }}
          placeholder={`ค้นหาเลขมาตรา (เช่น 347 หรือ ๓๔๗) หรือคำจากเนื้อหาของ${law.shortName}`}
          aria-label="ค้นหามาตรา"
        />
      </div>

      {loading ? (
        <div className="import-state">
          <div className="spinner" aria-hidden="true" />
          กำลังโหลดตัวบท…
        </div>
      ) : error ? (
        <div className="import-state">
          <p>{error}</p>
          <button type="button" className="btn btn-soft" onClick={() => setReloadKey((k) => k + 1)}>
            ลองใหม่
          </button>
        </div>
      ) : (
        <div className="law-list-wrap">
          <div className="law-list-toolbar">
            <label className="check-all">
              <input type="checkbox" checked={allShownSelected} onChange={toggleVisible} />
              เลือกทั้งหมดที่แสดง
            </label>
            <span className="muted">พบ {filtered.length} มาตรา</span>
          </div>
          <div className="law-list">
            {rows.map((row, i) =>
              row.header !== undefined ? (
                <div className="law-header" key={`h-${i}-${row.header}`}>
                  {row.header}
                </div>
              ) : (
                <label
                  key={row.article.number}
                  className={`law-row ${selected.has(row.article.number) ? 'checked' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(row.article.number)}
                    onChange={() => toggle(row.article.number)}
                  />
                  <span className="law-num">
                    มาตรา {row.article.number_th || row.article.number}
                    {row.article.repealed && <em className="repealed-badge">ยกเลิก</em>}
                  </span>
                  <span className="law-excerpt">{excerpt(row.article.content, 120)}</span>
                </label>
              )
            )}
            {filtered.length === 0 && (
              <div className="import-state">ไม่พบมาตราที่ตรงกับ "{query}"</div>
            )}
            {filtered.length > limit && (
              <button type="button" className="btn btn-ghost load-more" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
                แสดงเพิ่มอีก {Math.min(PAGE_SIZE, filtered.length - limit)} มาตรา
              </button>
            )}
          </div>
        </div>
      )}

      <div className="import-footer">
        <span className="import-count">เลือกแล้ว {selected.size} มาตรา</span>
        <div className="import-target">
          <label className="visually-hidden" htmlFor="target-select">
            กลุ่มปลายทาง
          </label>
          <select id="target-select" value={target} onChange={(e) => setTarget(e.target.value)}>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                กลุ่ม: {g.name}
              </option>
            ))}
            <option value={NEW_GROUP}>+ สร้างกลุ่มใหม่</option>
          </select>
          {target === NEW_GROUP && (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`ชื่อกลุ่มใหม่ (เช่น ${law.shortName} — มาตราที่เลือก)`}
            />
          )}
        </div>
        <button type="button" className="btn btn-primary" onClick={doImport} disabled={!canImport}>
          นำเข้า {selected.size > 0 ? `${selected.size} ใบ` : ''}
        </button>
      </div>
    </div>
  )
}
