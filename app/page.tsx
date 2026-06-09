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
  { key: 'todo',       label: 'Not Started', emoji: '📋' },
  { key: 'inProgress', label: 'In Progress',  emoji: '⚡' },
  { key: 'done',       label: 'Done',         emoji: '✅' },
]

const NEXT_STATUS: Record<Status, Status> = {
  todo:       'inProgress',
  inProgress: 'done',
  done:       'todo',
}

const P = {
  bg:        '#FFF0F5',
  card:      '#FFFAFC',
  colBg:     '#FFF5F8',
  accent:    '#FDE68A',
  accentFg:  '#9A6C00',
  done:      '#BBF7D0',
  doneFg:    '#16A34A',
  inProg:    '#FDE68A',
  inProgFg:  '#9A6C00',
  urgentBar: '#FB923C',
  del:       '#FECDD3',
  delFg:     '#BE185D',
  sep:       '#FCDDE8',
  textPri:   '#6B2D47',
  textSec:   '#C08098',
}

function deadlineColor(dl: string) {
  const today = new Date().toISOString().split('T')[0]
  if (dl < today)  return '#BE185D' // 期限切れ
  if (dl === today) return '#D97706' // 今日
  return '#C08098'                  // 将来
}

function fmtDate(dl: string) {
  return new Date(dl + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Home() {
  const [todos, setTodos]               = useState<Todo[]>([])
  const [inputText, setInputText]       = useState('')
  const [inputDeadline, setInputDeadline] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('todos')
    if (!saved) return
    const parsed = JSON.parse(saved)
    setTodos(parsed.map((t: Todo & { done?: boolean }) => ({
      id:       t.id,
      text:     t.text,
      urgent:   t.urgent ?? false,
      deadline: t.deadline,
      status:   t.status ?? (t.done ? 'done' : 'todo'),
    })))
  }, [])

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  const add = () => {
    const text = inputText.trim()
    if (!text) return
    setTodos(prev => [...prev, {
      id:       crypto.randomUUID(),
      text,
      status:   'todo',
      urgent:   false,
      deadline: inputDeadline || undefined,
    }])
    setInputText('')
    setInputDeadline('')
    inputRef.current?.focus()
  }

  const cycleStatus  = (id: string) =>
    setTodos(prev => prev.map(t => t.id === id ? { ...t, status: NEXT_STATUS[t.status] } : t))

  const toggleUrgent = (id: string) =>
    setTodos(prev => prev.map(t => t.id === id ? { ...t, urgent: !t.urgent } : t))

  const setDeadline  = (id: string, dl: string) =>
    setTodos(prev => prev.map(t => t.id === id ? { ...t, deadline: dl || undefined } : t))

  const remove = (id: string) =>
    setTodos(prev => prev.filter(t => t.id !== id))

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
          <p className="mt-1 text-sm" style={{ color: P.textSec }}>
            {todos.length === 0
              ? "Let's add something to do! 🎀"
              : [
                  `${doneCount} of ${todos.length} done`,
                  urgentCount > 0 ? `🔥 ${urgentCount} urgent` : null,
                ].filter(Boolean).join(' · ')}
          </p>
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
              onKeyDown={e => e.key === 'Enter' && add()}
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
        {todos.length === 0 ? (
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

              return (
                <div key={section.key}>
                  {/* カラムヘッダー */}
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className="text-sm font-semibold" style={{ color: P.textSec }}>
                      {section.emoji} {section.label}
                    </span>
                    <span
                      className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: P.accent, color: P.accentFg }}
                    >
                      {items.length}
                    </span>
                  </div>

                  {/* カラム本体 */}
                  <div
                    className="rounded-2xl p-2 space-y-2"
                    style={{
                      backgroundColor: P.colBg,
                      border: `1.5px solid ${P.sep}`,
                      minHeight: '160px',
                    }}
                  >
                    {sorted.length === 0 ? (
                      <div className="flex items-center justify-center py-10">
                        <span className="text-sm" style={{ color: P.textSec }}>— empty —</span>
                      </div>
                    ) : (
                      sorted.map(todo => (
                        <div
                          key={todo.id}
                          className="rounded-xl px-3 py-2.5"
                          style={{
                            backgroundColor: P.card,
                            boxShadow: '0 1px 6px rgba(255,182,193,0.2)',
                            borderLeft: `3px solid ${todo.urgent ? P.urgentBar : 'transparent'}`,
                          }}
                        >
                          {/* テキスト行 */}
                          <div className="flex items-start gap-2">
                            {/* ステータス円 */}
                            <button
                              onClick={() => cycleStatus(todo.id)}
                              className="mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200"
                              style={
                                todo.status === 'done'
                                  ? { backgroundColor: P.done }
                                  : todo.status === 'inProgress'
                                  ? { backgroundColor: P.inProg }
                                  : { backgroundColor: 'transparent', border: `2px solid ${P.accent}` }
                              }
                              title={`Move → ${NEXT_STATUS[todo.status]}`}
                            >
                              {todo.status === 'done' && (
                                <svg viewBox="0 0 24 24" fill="none" stroke={P.doneFg} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                              {todo.status === 'inProgress' && (
                                <svg viewBox="0 0 24 24" fill={P.inProgFg} className="w-2.5 h-2.5">
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                              )}
                            </button>

                            <span
                              className="flex-1 text-sm leading-snug break-all"
                              style={{
                                color: todo.status === 'done' ? P.textSec : P.textPri,
                                textDecoration: todo.status === 'done' ? 'line-through' : 'none',
                              }}
                            >
                              {todo.text}
                            </span>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              {/* 緊急ボタン */}
                              <button
                                onClick={() => toggleUrgent(todo.id)}
                                className="text-sm leading-none transition-all duration-150 hover:scale-110"
                                style={{ opacity: todo.urgent ? 1 : 0.2 }}
                                title={todo.urgent ? 'Remove urgent' : 'Mark urgent'}
                              >
                                🔥
                              </button>
                              {/* 削除 */}
                              <button
                                onClick={() => remove(todo.id)}
                                className="w-4 h-4 rounded-full flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
                                style={{ backgroundColor: P.del }}
                                aria-label="Delete"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke={P.delFg} strokeWidth={3} strokeLinecap="round" className="w-2 h-2">
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* 〆切行 */}
                          <div className="flex items-center gap-1 mt-2 ml-7">
                            <span className="text-xs" style={{ color: todo.deadline ? deadlineColor(todo.deadline) : P.textSec }}>
                              📅
                            </span>
                            {todo.deadline ? (
                              <span className="text-xs font-medium" style={{ color: deadlineColor(todo.deadline) }}>
                                {fmtDate(todo.deadline)}
                                {todo.deadline < new Date().toISOString().split('T')[0] && ' ⚠️'}
                                {todo.deadline === new Date().toISOString().split('T')[0] && ' · Today'}
                              </span>
                            ) : null}
                            <input
                              type="date"
                              value={todo.deadline ?? ''}
                              onChange={e => setDeadline(todo.id, e.target.value)}
                              className="text-xs outline-none bg-transparent"
                              style={{
                                color: 'transparent',
                                width: todo.deadline ? '16px' : '72px',
                                cursor: 'pointer',
                              }}
                              title="Set deadline"
                            />
                            {!todo.deadline && (
                              <span className="text-xs pointer-events-none -ml-[72px]" style={{ color: P.textSec }}>
                                Set deadline
                              </span>
                            )}
                          </div>
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
              onClick={() => setTodos(prev => prev.filter(t => t.status !== 'done'))}
              className="text-sm transition-opacity hover:opacity-70"
              style={{ color: P.delFg }}
            >
              🗑️ Clear all done
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
