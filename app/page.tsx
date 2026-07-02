'use client'

import { useState, useEffect, useRef } from 'react'

type Status = 'todo' | 'inProgress' | 'done'

type Todo = {
  id: string
  text: string
  status: Status
  urgent: boolean
  deadline?: string // 'YYYY-MM-DD'
}

const SECTIONS: { key: Status; label: string; emoji: string }[] = [
  { key: 'todo',       label: '未着手', emoji: '📋' },
  { key: 'inProgress', label: '着手中', emoji: '⚡' },
  { key: 'done',       label: '完了',   emoji: '✅' },
]

const NEXT_STATUS: Record<Status, Status> = {
  todo:       'inProgress',
  inProgress: 'done',
  done:       'todo',
}

const NEXT_LABEL: Record<Status, string> = {
  todo:       '着手中にする →',
  inProgress: '完了にする →',
  done:       '未着手に戻す →',
}

const P = {
  bg:        '#FFF0F5',
  card:      '#FFFAFC',
  accent:    '#FDE68A',
  accentFg:  '#9A6C00',
  urgentBar: '#FB923C',
  del:       '#FECDD3',
  delFg:     '#BE185D',
  sep:       '#FCDDE8',
  textPri:   '#6B2D47',
  textSec:   '#C08098',
}

const STATUS_STYLE: Record<Status, {
  colBg: string; border: string; topBar: string
  badgeBg: string; badgeFg: string; emptyText: string
}> = {
  todo: {
    colBg: '#F5F3FF', border: '#C4B5FD', topBar: '#8B5CF6',
    badgeBg: '#EDE9FE', badgeFg: '#5B21B6', emptyText: '#A78BFA',
  },
  inProgress: {
    colBg: '#FFFBEB', border: '#FDE68A', topBar: '#F59E0B',
    badgeBg: '#FEF3C7', badgeFg: '#92400E', emptyText: '#FCD34D',
  },
  done: {
    colBg: '#F0FDF4', border: '#86EFAC', topBar: '#22C55E',
    badgeBg: '#DCFCE7', badgeFg: '#15803D', emptyText: '#86EFAC',
  },
}

function deadlineColor(dl: string) {
  const today = new Date().toISOString().split('T')[0]
  if (dl < today)  return '#BE185D'
  if (dl === today) return '#D97706'
  return '#C08098'
}

function fmtDate(dl: string) {
  return new Date(dl + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Home() {
  const [todos, setTodos]                 = useState<Todo[]>([])
  const [inputText, setInputText]         = useState('')
  const [inputDeadline, setInputDeadline] = useState('')
  const [loading, setLoading]             = useState(true)
  const [submitting, setSubmitting]       = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // DBからTodoを取得
  useEffect(() => {
    fetch('/api/todos')
      .then(r => r.json())
      .then((data: Todo[]) => {
        setTodos(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const add = async () => {
    const text = inputText.trim()
    if (!text || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          status:   'todo',
          urgent:   false,
          deadline: inputDeadline || null,
        }),
      })
      const newTodo: Todo = await res.json()
      setTodos(prev => [...prev, newTodo])
      setInputText('')
      setInputDeadline('')
      inputRef.current?.focus()
    } finally {
      setSubmitting(false)
    }
  }

  // 楽観的更新: UIをすぐに変更してからAPIを叩く
  const updateTodo = async (id: string, data: Partial<Todo>) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  const cycleStatus = (id: string) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return
    updateTodo(id, { status: NEXT_STATUS[todo.status] })
  }

  const toggleUrgent = (id: string) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return
    updateTodo(id, { urgent: !todo.urgent })
  }

  const setDeadline = (id: string, dl: string) =>
    updateTodo(id, { deadline: dl || undefined })

  const remove = async (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/todos/${id}`, { method: 'DELETE' })
  }

  const clearDone = async () => {
    const doneIds = todos.filter(t => t.status === 'done').map(t => t.id)
    setTodos(prev => prev.filter(t => t.status !== 'done'))
    await Promise.all(doneIds.map(id =>
      fetch(`/api/todos/${id}`, { method: 'DELETE' })
    ))
  }

  const urgentCount = todos.filter(t => t.urgent && t.status !== 'done').length
  const doneCount   = todos.filter(t => t.status === 'done').length

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: P.bg,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div className="max-w-5xl mx-auto px-6 pt-12 pb-24">

        {/* ── Header ── */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold" style={{ color: P.textPri, letterSpacing: '-0.5px' }}>
            ✨ My Tasks
          </h1>
          {loading ? (
            <p className="mt-1 text-sm" style={{ color: P.textSec }}>読み込み中… 🌸</p>
          ) : todos.length === 0 ? (
            <p className="mt-1 text-sm" style={{ color: P.textSec }}>Let&apos;s add something to do! 🎀</p>
          ) : (
            <div className="mt-3 space-y-2">
              {/* ステータス別カウント */}
              <div className="flex items-center gap-3 flex-wrap">
                {SECTIONS.map(s => {
                  const count = todos.filter(t => t.status === s.key).length
                  const st = STATUS_STYLE[s.key]
                  return (
                    <span
                      key={s.key}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: st.badgeBg, color: st.badgeFg }}
                    >
                      {s.emoji} {s.label} {count}
                    </span>
                  )
                })}
                {urgentCount > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C' }}>
                    🔥 緊急 {urgentCount}
                  </span>
                )}
              </div>
              {/* 進捗バー */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F3E8FF' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${todos.length > 0 ? Math.round(doneCount / todos.length * 100) : 0}%`,
                      backgroundColor: '#22C55E',
                    }}
                  />
                </div>
                <span className="text-xs font-semibold flex-shrink-0" style={{ color: P.textSec }}>
                  {todos.length > 0 ? Math.round(doneCount / todos.length * 100) : 0}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Add form ── */}
        <div
          className="rounded-2xl mb-8 overflow-hidden"
          style={{ backgroundColor: P.card, boxShadow: '0 2px 12px rgba(255,182,193,0.25)' }}
        >
          {/* タスク名 */}
          <div className="flex items-center px-4 pt-3 pb-2 gap-3">
            <div
              className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: P.accent }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke={P.accentFg} strokeWidth={2.5} strokeLinecap="round" className="w-3 h-3">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && add()}
              placeholder="Add a new task… 🌸"
              className="flex-1 text-base outline-none bg-transparent"
              style={{ color: P.textPri }}
            />
            {inputText.trim() && (
              <button onClick={add} className="text-sm font-semibold flex-shrink-0" style={{ color: P.accentFg }}>
                Add ✚
              </button>
            )}
          </div>
          {/* 〆切 */}
          <div
            className="flex items-center gap-2 px-4 pb-3"
            style={{ borderTop: `1px solid ${P.sep}` }}
          >
            <span className="text-xs pt-2" style={{ color: P.textSec }}>📅 Deadline</span>
            <input
              type="date"
              value={inputDeadline}
              onChange={e => setInputDeadline(e.target.value)}
              className="text-xs outline-none bg-transparent pt-2"
              style={{ color: inputDeadline ? P.accentFg : P.textSec }}
            />
          </div>
        </div>

        {/* ── Kanban ── */}
        {loading ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 animate-pulse">🌸</div>
            <p className="text-sm" style={{ color: P.textSec }}>データを読み込んでいます…</p>
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🌷</div>
            <p className="font-semibold" style={{ color: P.textPri }}>No tasks yet!</p>
            <p className="text-sm mt-1" style={{ color: P.textSec }}>Add your first task above 💕</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 items-start">
            {SECTIONS.map(section => {
              const items  = todos.filter(t => t.status === section.key)
              const sorted = [...items].sort((a, b) => Number(b.urgent) - Number(a.urgent))

              const st = STATUS_STYLE[section.key]
              return (
                <div key={section.key}>
                  {/* カラムヘッダー */}
                  <div
                    className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl"
                    style={{ backgroundColor: st.badgeBg }}
                  >
                    <span className="text-base">{section.emoji}</span>
                    <span className="text-sm font-bold flex-1" style={{ color: st.badgeFg }}>
                      {section.label}
                    </span>
                    <span
                      className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: st.topBar, color: '#fff' }}
                    >
                      {items.length}
                    </span>
                  </div>

                  {/* カラム本体 */}
                  <div
                    className="rounded-2xl p-2 space-y-2"
                    style={{
                      backgroundColor: st.colBg,
                      border: `1.5px solid ${st.border}`,
                      borderTop: `3px solid ${st.topBar}`,
                      minHeight: '160px',
                    }}
                  >
                    {sorted.length === 0 ? (
                      <div className="flex items-center justify-center py-10">
                        <span className="text-sm" style={{ color: st.emptyText }}>— タスクなし —</span>
                      </div>
                    ) : (
                      sorted.map(todo => (
                        <div
                          key={todo.id}
                          className="rounded-xl px-3 py-2.5"
                          style={{
                            backgroundColor: P.card,
                            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                            borderLeft: `3px solid ${todo.urgent ? P.urgentBar : st.topBar}`,
                            opacity: todo.status === 'done' ? 0.75 : 1,
                          }}
                        >
                          {/* テキスト行 */}
                          <div className="flex items-start gap-2">
                            <span
                              className="flex-1 text-sm leading-snug break-all"
                              style={{
                                color: todo.status === 'done' ? P.textSec : P.textPri,
                                textDecoration: todo.status === 'done' ? 'line-through' : 'none',
                              }}
                            >
                              {todo.urgent && <span className="mr-1">🔥</span>}
                              {todo.text}
                            </span>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              {/* 緊急ボタン */}
                              <button
                                onClick={() => toggleUrgent(todo.id)}
                                className="text-sm leading-none transition-all duration-150 hover:scale-110"
                                style={{ opacity: todo.urgent ? 1 : 0.2 }}
                                title={todo.urgent ? '緊急解除' : '緊急にする'}
                              >
                                🔥
                              </button>
                              {/* 削除 */}
                              <button
                                onClick={() => remove(todo.id)}
                                className="w-4 h-4 rounded-full flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
                                style={{ backgroundColor: P.del }}
                                aria-label="削除"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke={P.delFg} strokeWidth={3} strokeLinecap="round" className="w-2 h-2">
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* 〆切行 */}
                          <div className="flex items-center gap-1 mt-1.5">
                            <span className="text-xs" style={{ color: todo.deadline ? deadlineColor(todo.deadline) : P.textSec }}>
                              📅
                            </span>
                            <div className="relative flex items-center">
                              {todo.deadline ? (
                                <span className="text-xs font-medium" style={{ color: deadlineColor(todo.deadline) }}>
                                  {fmtDate(todo.deadline)}
                                  {todo.deadline < new Date().toISOString().split('T')[0] && ' ⚠️'}
                                  {todo.deadline === new Date().toISOString().split('T')[0] && ' · 今日'}
                                </span>
                              ) : (
                                <span className="text-xs" style={{ color: P.textSec }}>締め切りを設定</span>
                              )}
                              <input
                                type="date"
                                value={todo.deadline ?? ''}
                                onChange={e => setDeadline(todo.id, e.target.value)}
                                className="absolute inset-0 cursor-pointer"
                                style={{ opacity: 0, width: '100%', height: '100%' }}
                                title="締め切りを設定"
                              />
                            </div>
                          </div>

                          {/* ステータス変更ボタン */}
                          <button
                            onClick={() => cycleStatus(todo.id)}
                            className="mt-2 w-full text-xs font-semibold py-1 rounded-lg transition-opacity hover:opacity-70"
                            style={{ backgroundColor: st.badgeBg, color: st.badgeFg }}
                          >
                            {NEXT_LABEL[todo.status]}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Clear done ── */}
        {doneCount > 0 && (
          <div className="mt-7 text-center">
            <button
              onClick={clearDone}
              className="text-sm transition-opacity hover:opacity-70"
              style={{ color: P.delFg }}
            >
              🗑️ 完了タスクをすべて削除
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
