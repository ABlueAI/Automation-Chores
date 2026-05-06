import React, { useState } from 'react'
import { Chore, TeamMember } from '../context/ChoreContext'
import { getDateString } from '../utils/dateUtils'
import '../styles/AddChoreForm.css'
import { X } from 'lucide-react'

interface AddChoreFormProps {
  teamMembers: TeamMember[]
  onSubmit: (chore: Omit<Chore, 'id' | 'createdAt'>) => void
  onCancel: () => void
  initialDate?: string
}

export const AddChoreForm: React.FC<AddChoreFormProps> = ({
  teamMembers,
  onSubmit,
  onCancel,
  initialDate,
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState(initialDate || getDateString(new Date()))
  const [assignedTo, setAssignedTo] = useState('')
  const [recurringPattern, setRecurringPattern] = useState<'daily' | 'weekly' | 'monthly' | ''>('')
  const [recurringEndDate, setRecurringEndDate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      alert('Please enter a chore title')
      return
    }

    if (!assignedTo) {
      alert('Please assign this chore to a team member')
      return
    }

    const chore: Omit<Chore, 'id' | 'createdAt'> = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate,
      assignedTo,
      status: 'pending',
      recurring: recurringPattern
        ? {
            pattern: recurringPattern as 'daily' | 'weekly' | 'monthly',
            endDate: recurringEndDate || undefined,
          }
        : undefined,
    }

    onSubmit(chore)
    resetForm()
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setDueDate(initialDate || getDateString(new Date()))
    setAssignedTo('')
    setRecurringPattern('')
    setRecurringEndDate('')
  }

  return (
    <div className="add-chore-form-overlay">
      <div className="add-chore-form">
        <div className="form-header">
          <h2>Add New Chore</h2>
          <button className="btn-close" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Chore Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Clean kitchen, Water plants"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add details about this chore..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dueDate">Due Date *</label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="assignedTo">Assign To *</label>
            <select
              id="assignedTo"
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              required
            >
              <option value="">Select a team member...</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="recurring">Make Recurring?</label>
            <select
              id="recurring"
              value={recurringPattern}
              onChange={e => setRecurringPattern(e.target.value as any)}
            >
              <option value="">No, one-time chore</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {recurringPattern && (
            <div className="form-group">
              <label htmlFor="recurringEndDate">Recurring End Date (optional)</label>
              <input
                id="recurringEndDate"
                type="date"
                value={recurringEndDate}
                onChange={e => setRecurringEndDate(e.target.value)}
              />
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Create Chore
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
