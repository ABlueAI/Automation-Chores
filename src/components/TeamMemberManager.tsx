import React, { useState } from 'react'
import { TeamMember } from '../context/ChoreContext'
import '../styles/TeamMemberManager.css'
import { Trash2, Plus } from 'lucide-react'

export const MEMBER_COLORS = [
  '#2563eb', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

interface TeamMemberManagerProps {
  members: TeamMember[]
  onAdd: (name: string, color: string) => void
  onRemove: (id: string) => void
}

export const TeamMemberManager: React.FC<TeamMemberManagerProps> = ({
  members,
  onAdd,
  onRemove,
}) => {
  const [newMemberName, setNewMemberName] = useState('')
  const [selectedColor, setSelectedColor] = useState(MEMBER_COLORS[0])

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMemberName.trim()) {
      onAdd(newMemberName.trim(), selectedColor)
      setNewMemberName('')
      // Cycle to next unused color
      const usedColors = members.map(m => m.color)
      const nextColor = MEMBER_COLORS.find(c => !usedColors.includes(c)) || MEMBER_COLORS[0]
      setSelectedColor(nextColor)
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
          placeholder="Add team member..."
          className="member-input"
        />
        <button type="submit" className="btn-add-member" title="Add member">
          <Plus size={18} />
        </button>
      </form>

      <div className="color-picker-row">
        <span className="color-picker-label">Color:</span>
        {MEMBER_COLORS.map(color => (
          <button
            key={color}
            type="button"
            className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
            style={{ background: color }}
            onClick={() => setSelectedColor(color)}
            title={color}
          />
        ))}
      </div>

      <div className="members-list">
        {members.length === 0 ? (
          <p className="no-members">No team members yet. Add one to get started!</p>
        ) : (
          members.map(member => (
            <div key={member.id} className="member-item">
              <span
                className="member-color-dot"
                style={{ background: member.color || '#94a3b8' }}
              />
              <span className="member-name">{member.name}</span>
              <span className="member-tokens" title="Total tokens earned">
                ⭐ {member.tokens ?? 0}
              </span>
              <button
                className="btn-remove-member"
                onClick={() => onRemove(member.id)}
                title="Remove member"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
