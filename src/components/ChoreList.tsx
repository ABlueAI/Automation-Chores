import React from 'react'
import { Chore, TeamMember } from '../context/ChoreContext'
import { ChoreItem } from './ChoreItem'
import '../styles/ChoreList.css'

interface ChoreListProps {
  chores: Chore[]
  teamMembers: TeamMember[]
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  title?: string
  emptyMessage?: string
}

export const ChoreList: React.FC<ChoreListProps> = ({
  chores,
  teamMembers,
  onComplete,
  onDelete,
  title,
  emptyMessage = 'No chores for this date',
}) => {
  if (chores.length === 0) {
    return (
      <div className="chore-list-empty">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="chore-list">
      {title && <h2 className="chore-list-title">{title}</h2>}
      <div className="chore-list-items">
        {chores.map(chore => (
          <ChoreItem
            key={chore.id}
            chore={chore}
            teamMembers={teamMembers}
            onComplete={onComplete}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}
