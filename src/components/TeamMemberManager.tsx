import React, { useState } from 'react'
import { TeamMember } from '../context/ChoreContext'
import '../styles/TeamMemberManager.css'
import { Trash2, Plus } from 'lucide-react'

interface TeamMemberManagerProps {
  members: TeamMember[]
  onAdd: (name: string) => void
  onRemove: (id: string) => void
}

export const TeamMemberManager: React.FC<TeamMemberManagerProps> = ({ members, onAdd, onRemove }) => {
  const [newMemberName, setNewMemberName] = useState('')

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMemberName.trim()) {
      onAdd(newMemberName.trim())
      setNewMemberName('')
    }
  }

  return (
    <div className="team-member-manager">
      <h3>Team Members</h3>

      <form onSubmit={handleAddMember} className="add-member-form">
        <input
          type="text"
          value={newMemberName}
          onChange={e => setNewMemberName(e.target.value)}
          placeholder="Add new team member..."
          className="member-input"
        />
        <button type="submit" className="btn-add-member">
          <Plus size={18} />
        </button>
      </form>

      <div className="members-list">
        {members.length === 0 ? (
          <p className="no-members">No team members yet. Add one to get started!</p>
        ) : (
          members.map(member => (
            <div key={member.id} className="member-item">
              <span className="member-name">{member.name}</span>
              <button
                className="btn-remove-member"
                onClick={() => onRemove(member.id)}
                title="Remove member"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
