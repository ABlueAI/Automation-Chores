import React, { useState, useEffect } from 'react'
import { Chore, TeamMember } from '../context/ChoreContext'
import { getDateString } from '../utils/dateUtils'
import '../styles/AddChoreForm.css'
import { X } from 'lucide-react'

export const CATEGORIES = [
  'Kitchen',
  'Bathroom',
  'Office',
  'Common Area',
  'Outdoor',
  'Equipment',
  'Groceries',
  'Other',
]

interface AddChoreFormProps {
  teamMembers: TeamMember[]
  onSubmit: (chore: Omit<Chore, 'id' | 'createdAt'>) => void
  onCancel: () => void
  initialDate?: string
  editingChore?: Chore
}

export const AddChoreForm: React.FC<AddChoreFormProps> = ({
  teamMembers,
  onSubmit,
  onCancel,
  initialDate,
  editingChore,
}) => {
  const isEdit = !!editingChore

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState(initialDate || getDateString(new Date()))
  const [assignedTo, setAssignedTo] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | ''>('')
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [startTime, setStartTime] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [recurringPattern, setRecurringPattern] = useState<'daily' | 'weekly' | 'monthly' | ''>('')
  const [recurringEndDate, setRecurringEndDate] = useState('')

  useEffect(() => {
    if (editingChore) {
      setTitle(editingChore.title)
      setDescription(editingChore.description || '')
      setDueDate(editingChore.dueDate)
      setAssignedTo(editingChore.assignedTo)
      setPriority(editingChore.priority || '')
      setCategory(editingChore.category || '')
      setNotes(editingChore.notes || '')
      setStartTime(editingChore.startTime || '')
      setEstimatedMinutes(editingChore.estimatedMinutes ? String(editingChore.estimatedMinutes) : '')
      setRecurringPattern(editingChore.recurring?.pattern || '')
      setRecurringEndDate(editingChore.recurring?.endDate || '')
    }
  }, [editingChore])

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
      status: editingChore?.status || 'pending',
      startTime: startTime || undefined,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
      priority: priority || undefined,
      category: category || undefined,
      notes: notes.trim() || undefined,
      recurring: recurringPattern
        ? { pattern: recurringPattern, endDate: recurringEndDate || undefined }
        : undefined,
    }

    onSubmit(chore)
  }

  return (
    <div className="add-chore-form-overlay">
      <div className="add-chore-form">
        <div className="form-header">
          <h2>{isEdit ? 'Edit Chore' : 'Add New Chore'}</h2>
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
              rows={2}
            />
          </div>

          <div className="form-row">
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
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
              >
                <option value="">No priority</option>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">Start Time</label>
              <input
                id="startTime"
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="estimatedMinutes">Duration (min)</label>
              <input
                id="estimatedMinutes"
                type="number"
                min="1"
                max="1440"
                value={estimatedMinutes}
                onChange={e => setEstimatedMinutes(e.target.value)}
                placeholder="e.g. 30"
              />
            </div>
          </div>

          <div className="form-row">
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
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="">No category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {!isEdit && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="recurring">Recurring?</label>
                <select
                  id="recurring"
                  value={recurringPattern}
                  onChange={e => setRecurringPattern(e.target.value as any)}
                >
                  <option value="">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {recurringPattern && (
                <div className="form-group">
                  <label htmlFor="recurringEndDate">End Date (optional)</label>
                  <input
                    id="recurringEndDate"
                    type="date"
                    value={recurringEndDate}
                    onChange={e => setRecurringEndDate(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {isEdit && (
            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add any notes about this chore..."
                rows={2}
              />
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              {isEdit ? 'Save Changes' : 'Create Chore'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
