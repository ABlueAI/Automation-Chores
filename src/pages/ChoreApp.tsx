import React, { useState, useMemo } from 'react'
import { useChores } from '../context/ChoreContext'
import { useNotifications } from '../context/NotificationContext'
import { ChoreList } from '../components/ChoreList'
import { AddChoreForm } from '../components/AddChoreForm'
import { TeamMemberManager } from '../components/TeamMemberManager'
import { DatePicker } from '../components/DatePicker'
import { NotificationContainer } from '../components/NotificationContainer'
import { getDateString, groupChoresByDate } from '../utils/dateUtils'
import { getCompletionStats } from '../utils/choreUtils'
import '../styles/ChoreApp.css'
import { Plus, Users, Calendar } from 'lucide-react'

export default function ChoreApp() {
  const {
    chores,
    teamMembers,
    addChore,
    deleteChore,
    completeChore,
    addTeamMember,
    removeTeamMember,
    getChoresForDate,
  } = useChores()

  const { addNotification } = useNotifications()

  const [selectedDate, setSelectedDate] = useState(getDateString(new Date()))
  const [showAddForm, setShowAddForm] = useState(false)
  const [showTeamManager, setShowTeamManager] = useState(false)
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'all'>('day')

  const choresForSelectedDate = getChoresForDate(selectedDate)
  const stats = useMemo(() => getCompletionStats(chores), [chores])

  const handleAddChore = (choreData: any) => {
    try {
      addChore(choreData)
      addNotification(
        `Chore "${choreData.title}" added successfully!`,
        'success'
      )
      setShowAddForm(false)
    } catch (error) {
      addNotification('Failed to add chore', 'error')
    }
  }

  const handleDeleteChore = (id: string) => {
    if (window.confirm('Are you sure you want to delete this chore?')) {
      deleteChore(id)
      addNotification('Chore deleted', 'success')
    }
  }

  const handleCompleteChore = (id: string) => {
    completeChore(id)
    addNotification('Chore marked as complete! 🎉', 'success')
  }

  const handleAddTeamMember = (name: string) => {
    addTeamMember({ name })
    addNotification(`${name} added to team`, 'success')
  }

  const handleRemoveTeamMember = (id: string) => {
    const member = teamMembers.find(m => m.id === id)
    if (window.confirm(`Remove ${member?.name} from the team?`)) {
      removeTeamMember(id)
      addNotification(`${member?.name} removed from team`, 'success')
    }
  }

  const getWeekChores = () => {
    const weekChores = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(selectedDate + 'T00:00:00')
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      weekChores.push(...getChoresForDate(dateStr))
    }
    return weekChores
  }

  const displayChores =
    viewMode === 'day'
      ? choresForSelectedDate
      : viewMode === 'week'
        ? getWeekChores()
        : chores

  const choresByDate = groupChoresByDate(displayChores)

  return (
    <div className="chore-app">
      <NotificationContainer />

      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>📋 Office Chore Tracker</h1>
            <div className="stats">
              <span className="stat">
                Total: <strong>{stats.total}</strong>
              </span>
              <span className="stat">
                Completed: <strong>{stats.completed}</strong>
              </span>
              <span className="stat">
                Progress: <strong>{stats.completionRate}%</strong>
              </span>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="btn-primary"
              onClick={() => setShowAddForm(true)}
              disabled={teamMembers.length === 0}
              title={teamMembers.length === 0 ? 'Add team members first' : 'Add new chore'}
            >
              <Plus size={18} /> Add Chore
            </button>
            <button
              className="btn-secondary"
              onClick={() => setShowTeamManager(!showTeamManager)}
            >
              <Users size={18} /> Team
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <DatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />

          <div className="view-modes">
            <h3>View</h3>
            <div className="mode-buttons">
              <button
                className={`mode-btn ${viewMode === 'day' ? 'active' : ''}`}
                onClick={() => setViewMode('day')}
              >
                <Calendar size={16} /> Day
              </button>
              <button
                className={`mode-btn ${viewMode === 'week' ? 'active' : ''}`}
                onClick={() => setViewMode('week')}
              >
                📅 Week
              </button>
              <button
                className={`mode-btn ${viewMode === 'all' ? 'active' : ''}`}
                onClick={() => setViewMode('all')}
              >
                📊 All
              </button>
            </div>
          </div>

          {showTeamManager && (
            <TeamMemberManager
              members={teamMembers}
              onAdd={handleAddTeamMember}
              onRemove={handleRemoveTeamMember}
            />
          )}
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          {viewMode === 'day' && (
            <ChoreList
              chores={choresForSelectedDate}
              teamMembers={teamMembers}
              onComplete={handleCompleteChore}
              onDelete={handleDeleteChore}
              emptyMessage={`No chores scheduled for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString()}`}
            />
          )}

          {viewMode === 'week' && (
            <div className="week-view">
              {Object.entries(choresByDate).length === 0 ? (
                <div className="chore-list-empty">
                  <p>No chores scheduled for this week</p>
                </div>
              ) : (
                Object.entries(choresByDate).map(([date, dateChores]) => (
                  <div key={date} className="week-day-section">
                    <h3 className="week-date">
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </h3>
                    <ChoreList
                      chores={dateChores}
                      teamMembers={teamMembers}
                      onComplete={handleCompleteChore}
                      onDelete={handleDeleteChore}
                    />
                  </div>
                ))
              )}
            </div>
          )}

          {viewMode === 'all' && (
            <ChoreList
              chores={chores}
              teamMembers={teamMembers}
              onComplete={handleCompleteChore}
              onDelete={handleDeleteChore}
              title="All Chores"
              emptyMessage="No chores created yet"
            />
          )}
        </main>
      </div>

      {/* Add Chore Modal */}
      {showAddForm && (
        <AddChoreForm
          teamMembers={teamMembers}
          onSubmit={handleAddChore}
          onCancel={() => setShowAddForm(false)}
          initialDate={selectedDate}
        />
      )}
    </div>
  )
}
