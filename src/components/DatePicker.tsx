import React from 'react'
import '../styles/DatePicker.css'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DatePickerProps {
  selectedDate: string
  onDateChange: (date: string) => void
}

export const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onDateChange }) => {
  const handlePrevDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() - 1)
    onDateChange(date.toISOString().split('T')[0])
  }

  const handleNextDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + 1)
    onDateChange(date.toISOString().split('T')[0])
  }

  const handleToday = () => {
    const today = new Date()
    onDateChange(today.toISOString().split('T')[0])
  }

  const dateObj = new Date(selectedDate + 'T00:00:00')
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="date-picker">
      <button onClick={handlePrevDay} className="btn-nav-date" title="Previous day">
        <ChevronLeft size={20} />
      </button>

      <div className="date-display">
        <input
          type="date"
          value={selectedDate}
          onChange={e => onDateChange(e.target.value)}
          className="date-input"
        />
        <span className="date-text">{formattedDate}</span>
      </div>

      <button onClick={handleNextDay} className="btn-nav-date" title="Next day">
        <ChevronRight size={20} />
      </button>

      <button onClick={handleToday} className="btn-today">
        Today
      </button>
    </div>
  )
}
