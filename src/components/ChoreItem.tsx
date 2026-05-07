import React from 'react'
import { Chore, TeamMember } from '../context/ChoreContext'
import { formatDate, isOverdue, getMemberName } from '../utils/dateUtils'
import '../styles/ChoreItem.css'
import { Check, Trash2 } from 'lucide-react'

interface ChoreItemProps {
  chore: Chore
  teamMembers: TeamMember[]
  onComplete: (id: string) => void
  onDelete: (id: string) => void
}

export const ChoreItem: React.FC<ChoreItemProps> = ({
  chore,
  teamMembers,
  onComplete,
  onDelete,
}) => {
  const isOverdueChore = isOverdue(chore.dueDate, chore.status)
  const memberName = getMemberName(chore.assignedTo, teamMembers)

  return (
    <div className={`chore-item ${chore.status} ${isOverdueChore ? 'overdue' : ''}`}>
      <div className="chore-item-header">
        <div className="chore-item-title">
          <h3>{chore.title}</h3>
          {chore.description && <p className="chore-description">{chore.description}</p>}
        </div>
        <div className="chore-item-actions">
          {chore.status === 'pending' && (
            <button
              className="btn-complete"
              onClick={() => onComplete(chore.id)}
              title="Mark as complete"
            >
              <Check size={18} />
            </button>
          )}
          <button
            className="btn-delete"
            onClick={() => onDelete(chore.id)}
            title="Delete chore"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      <div className="chore-item-footer">
        <span className="chore-assigned">Assigned to: {memberName}</span>
        <span className="chore-date">{formatDate(chore.dueDate)}</span>
        {chore.recurring && <span className="chore-recurring">🔄 {chore.recurring.pattern}</span>}
      </div>
    </div>
  )
}
