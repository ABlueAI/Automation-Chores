import React, { useState, useMemo } from 'react'
import { Chore } from '../context/ChoreContext'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import '../styles/CalendarView.css'

interface CalendarViewProps {
  selectedDate: string
  onDateChange: (date: string) => void
  chores: Chore[]
}

const TODAY = new Date().toISOString().split('T')[0]

export const CalendarView: React.FC<CalendarViewProps> = ({ selectedDate, onDateChange, chores }) => {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(selectedDate + 'T00:00:00')
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const calendarDays = useMemo(() => {
    const { year, month } = viewMonth
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDow = firstDay.getDay()
    const days: (string | null)[] = []
    for (let i = 0; i < startDow; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(
        `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      )
    }
    return days
  }, [viewMonth])

  const choreCountByDate = useMemo(() => {
    const counts: Record<string, { total: number; pending: number }> = {}
    chores.forEach(c => {
      if (!counts[c.dueDate]) counts[c.dueDate] = { total: 0, pending: 0 }
      counts[c.dueDate].total++
      if (c.status === 'pending') counts[c.dueDate].pending++
    })
    return counts
  }, [chores])

  const prevMonth = () =>
    setViewMonth(p => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 })

  const nextMonth = () =>
    setViewMonth(p => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 })

  const goToToday = () => {
    const d = new Date()
    setViewMonth({ year: d.getFullYear(), month: d.getMonth() })
    onDateChange(TODAY)
  }

  const monthLabel = new Date(viewMonth.year, viewMonth.month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <button className="cal-nav-btn" onClick={prevMonth} title="Previous month">
          <ChevronLeft size={16} />
        </button>
        <span className="cal-month-title">{monthLabel}</span>
        <button className="cal-nav-btn" onClick={nextMonth} title="Next month">
          <ChevronRight size={16} />
        </button>
      </div>

      <button className="cal-today-btn" onClick={goToToday}>
        Today
      </button>

      <div className="calendar-grid">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="cal-day-header">{d}</div>
        ))}

        {calendarDays.map((dateStr, i) => {
          if (!dateStr) return <div key={`e-${i}`} className="cal-day empty" />
          const counts = choreCountByDate[dateStr]
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === TODAY
          const hasPending = (counts?.pending ?? 0) > 0
          const hasCompleted = (counts?.total ?? 0) - (counts?.pending ?? 0) > 0

          return (
            <div
              key={dateStr}
              className={`cal-day${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}`}
              onClick={() => onDateChange(dateStr)}
              title={counts ? `${counts.total} chore${counts.total !== 1 ? 's' : ''}` : undefined}
            >
              <span className="cal-day-num">
                {new Date(dateStr + 'T00:00:00').getDate()}
              </span>
              {(hasPending || hasCompleted) && (
                <div className="cal-dots">
                  {hasPending && <span className="cal-dot pending" />}
                  {hasCompleted && <span className="cal-dot done" />}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="cal-legend">
        <span className="cal-legend-item">
          <span className="cal-dot pending" /> Pending
        </span>
        <span className="cal-legend-item">
          <span className="cal-dot done" /> Done
        </span>
      </div>
    </div>
  )
}
