import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { uid } from './utils.js'

const STORAGE_KEY = 'lawflashcard.v1'
const StoreContext = createContext(null)

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data && Array.isArray(data.groups)) return data
    }
  } catch {
    // ข้อมูลใน storage เสียหาย — เริ่มใหม่ด้วยค่าว่าง
  }
  return { groups: [] }
}

export function makeCard(front, back, source = null) {
  const now = Date.now()
  return { id: uid(), front, back, status: 'new', source, createdAt: now, updatedAt: now }
}

function withCards(groups, groupId, fn) {
  return groups.map((g) => (g.id === groupId ? { ...g, cards: fn(g.cards) } : g))
}

function reducer(state, action) {
  switch (action.type) {
    case 'group:add':
      return { groups: [...state.groups, action.group] }
    case 'group:update':
      return {
        groups: state.groups.map((g) => (g.id === action.id ? { ...g, ...action.patch } : g)),
      }
    case 'group:delete':
      return { groups: state.groups.filter((g) => g.id !== action.id) }
    case 'card:add':
      return { groups: withCards(state.groups, action.groupId, (cards) => [...cards, action.card]) }
    case 'card:update':
      return {
        groups: withCards(state.groups, action.groupId, (cards) =>
          cards.map((c) =>
            c.id === action.cardId ? { ...c, ...action.patch, updatedAt: Date.now() } : c
          )
        ),
      }
    case 'card:delete':
      return {
        groups: withCards(state.groups, action.groupId, (cards) =>
          cards.filter((c) => c.id !== action.cardId)
        ),
      }
    case 'cards:setStatus':
      return {
        groups: withCards(state.groups, action.groupId, (cards) =>
          cards.map((c) =>
            action.ids.includes(c.id) ? { ...c, status: action.status, updatedAt: Date.now() } : c
          )
        ),
      }
    case 'cards:addMany':
      return {
        groups: withCards(state.groups, action.groupId, (cards) => [...cards, ...action.cards]),
      }
    default:
      return state
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadInitial)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage เต็มหรือถูกปิด — แอปยังใช้งานได้ในเซสชันนี้
    }
  }, [state])

  const api = useMemo(
    () => ({
      createGroup(name, color) {
        const group = {
          id: uid(),
          name: name.trim() || 'กลุ่มใหม่',
          color,
          createdAt: Date.now(),
          cards: [],
        }
        dispatch({ type: 'group:add', group })
        return group
      },
      updateGroup(id, patch) {
        dispatch({ type: 'group:update', id, patch })
      },
      deleteGroup(id) {
        dispatch({ type: 'group:delete', id })
      },
      addCard(groupId, front, back, source = null) {
        dispatch({ type: 'card:add', groupId, card: makeCard(front, back, source) })
      },
      updateCard(groupId, cardId, patch) {
        dispatch({ type: 'card:update', groupId, cardId, patch })
      },
      deleteCard(groupId, cardId) {
        dispatch({ type: 'card:delete', groupId, cardId })
      },
      setCardStatus(groupId, cardId, status) {
        dispatch({ type: 'cards:setStatus', groupId, ids: [cardId], status })
      },
      setCardsStatus(groupId, ids, status) {
        dispatch({ type: 'cards:setStatus', groupId, ids, status })
      },
      importCards(groupId, items) {
        const cards = items.map((it) => makeCard(it.front, it.back, it.source ?? null))
        dispatch({ type: 'cards:addMany', groupId, cards })
      },
    }),
    []
  )

  const value = useMemo(() => ({ groups: state.groups, api }), [state, api])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore ต้องอยู่ภายใต้ StoreProvider')
  return ctx
}
