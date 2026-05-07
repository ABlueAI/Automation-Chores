import React, { useState } from 'react'
import { Chore, TeamMember } from '../context/ChoreContext'
import { formatDate, isOverdue } from '../utils/dateUtils'
import '../styles/ChoreItem.css'
import { Check, Trash2, Pencil, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'

interface ChoreItemProps {
  chore: Chore
  teamMembers: TeamMember[]
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (chore: Chore) => void
  onAddNote: (id: string, note: string) => void
}

const PRIORITY_CONFIG = {
  high: { label: 'High', className: 'priority-high' },
  medium: { label: 'Medium', className: 'priority-medium' },
  low: { label: 'Low', className: 'priority-low' },
}

export const ChoreItem: React.FC<ChoreItemProps> = ({
  chore,
  teamMembers,
  onComplete,
  onDelete,
  onEdit,
  onAddNote,
}) => {
  const [showNotes, setShowNotes] = useState(false)
  const [noteInput, setNoteInput] = useState(chore.notes || '')
  const [editingNote, setEditingNote] = useState(false)

  const isOverdueChore = isOverdue(chore.dueDate, chore.status)
  const member = teamMembers.find(m => m.id === chore.assignedTo)
  const memberName = member?.name || 'Unassigned'
  const memberColor = member?.color || '#94a3b8'

  const handleSaveNote = () => {
    onAddNote(chore.id, noteInput.trim())
    setEditingNote(false)
  }

  const handleNoteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSaveNote()
    if (e.key === 'Escape') {
      setNoteInput(chore.notes || '')
      setEditingNote(false)
    }
  }

  return (
    <div
      className={`chore-item ${chore.status}${isOverdueChore ? ' overdue' : ''}${chore.priority ? ` prio-${chore.priority}` : ''}`}
    >
      {/* Left accent bar colored by member */}
      <div className="chore-member-bar" style={{ background: memberColor }} />

      <div className="chore-item-body">
        <div className="chore-item-header">
          <div className="chore-item-title">
            <div className="chore-title-row">
              <h3>{chore.title}</h3>
              <div className="chore-badges">
                {chore.priority && (
                  <span className={`badge ${PRIORITY_CONFIG[chore.priority].className}`}>
                    {PRIORITY_CONFIG[chore.priority].label}
                  </span>
                )}
                {chore.category && (
                  <span className="badge category-badge">{chore.category}</span>
                )}
                {isOverdueChore && (
                  <span className="badge overdue-badge">Overdue</span>
                )}
              </div>
            </div>
            {chore.description && (
              <p className="chore-description">{chore.description}</p>
            )}
          </div>

          <div className="chore-item-actions">
            {chore.status === 'pending' && (
              <button
                className="btn-action btn-complete"
                onClick={() => onComplete(chore.id)}
                title="Mark as complete"
              >
                <Check size={15} />
              </button>
            )}
            <button
              className="btn-action btn-edit"
              onClick={() => onEdit(chore)}
              title="Edit chore"
            >
              <Pencil size={15} />
            </button>
            <button
              className="btn-action btn-delete"
              onClick={() => onDelete(chore.id)}
              title="Delete chore"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="chore-item-footer">
          <span className="chore-assigned">
            <span
              className="member-dot"
              style={{ background: memberColor }}
              title={memberName}
            />
            {memberName}
          </span>
          <span className="chore-date">{formatDate(chore.dueDate)}</span>
          {chore.recurring && (
            <span className="chore-recurring">🔄 {chore.recurring.pattern}</span>
          )}
          {chore.completedAt && (
            <span className="chore-completed-at">
              ✓ {new Date(chore.completedAt).toLocaleDateString()}
            </span>
          )}
          <button
            className={`btn-notes-toggle ${showNotes ? 'active' : ''} ${chore.notes ? 'has-notes' : ''}`}
            onClick={() => setShowNotes(v => !v)}
            title={chore.notes ? 'View/edit note' : 'Add note'}
          >
            <MessageSquare size={13} />
            {chore.notes ? 'Note' : 'Add note'}
            {showNotes ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>

        {showNotes && (
          <div className="chore-notes-section">
            {editingNote ? (
              <div className="note-edit">
                <textarea
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  onKeyDown={handleNoteKeyDown}
                  placeholder="Add a note... (Ctrl+Enter to save)"
                  rows={3}
                  autoFocus
                />
                <div className="note-edit-actions">
                  <button
                    className="note-btn note-cancel"
                    onClick={() => { setNoteInput(chore.notes || ''); setEditingNote(false) }}
                  >
                    Cancel
                  </button>
                  <button className="note-btn note-save" onClick={handleSaveNote}>
                    Save Note
                  </button>
                </div>
              </div>
            ) : (
              <div className="note-view" onClick={() => setEditingNote(true)}>
                {chore.notes
                  ? <p className="note-text">{chore.notes}</p>
                  : <p className="note-placeholder">Click to add a note...</p>
                }
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
