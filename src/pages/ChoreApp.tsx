import { useState, useMemo, useEffect } from 'react'
import { useChores, Chore } from '../context/ChoreContext'
import { useNotifications } from '../context/NotificationContext'
import { ChoreList } from '../components/ChoreList'
import { AddChoreForm } from '../components/AddChoreForm'
import { TeamMemberManager } from '../components/TeamMemberManager'
import { CalendarView } from '../components/CalendarView'
import { SearchFilter, FilterState, DEFAULT_FILTERS } from '../components/SearchFilter'
import { NotificationContainer } from '../components/NotificationContainer'
import { ConfettiCelebration } from '../components/ConfettiCelebration'
import { getDateString, groupChoresByDate } from '../utils/dateUtils'
import { getCompletionStats } from '../utils/choreUtils'
import '../styles/ChoreApp.css'
import { Plus, Users, Download, Moon, Sun, Calendar, ShoppingCart } from 'lucide-react'

function BarnCatIcon() {
  return (
    <svg width="18" height="16" viewBox="0 0 26 22" fill="currentColor">
      {/* Barn body */}
      <rect x="1" y="11" width="15" height="11" rx="1"/>
      {/* Barn roof */}
      <polygon points="0,12 8.5,4 17,12"/>
      {/* Barn door */}
      <rect x="5.5" y="15" width="4" height="7" fill="white" opacity="0.25" rx="0.5"/>
      {/* Cat body beside barn */}
      <ellipse cx="22" cy="17" rx="4" ry="3.5"/>
      {/* Cat head */}
      <circle cx="22" cy="12" r="3.8"/>
      {/* Cat ears */}
      <polygon points="19,10 18,7.5 21,10"/>
      <polygon points="25,10 26,7.5 23,10"/>
      {/* Cat eyes */}
      <circle cx="20.8" cy="11.5" r="0.8" fill="white"/>
      <circle cx="23.2" cy="11.5" r="0.8" fill="white"/>
    </svg>
  )
}

interface Props {
  onGoToGrocery: () => void
  onGoToFarm: () => void
}

export default function ChoreApp({ onGoToGrocery, onGoToFarm }: Props) {
  const {
    chores,
    teamMembers,
    loading,
    addChore,
    updateChore,
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
  const [editingChore, setEditingChore] = useState<Chore | null>(null)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [celebration, setCelebration] = useState<{ tokens: number; memberName: string } | null>(null)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : ''
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

  const choresForSelectedDate = getChoresForDate(selectedDate)
  const stats = useMemo(() => getCompletionStats(chores), [chores])

  const allCategories = useMemo(() => {
    const cats = new Set(chores.map(c => c.category).filter(Boolean) as string[])
    return Array.from(cats).sort()
  }, [chores])

  const applyFilters = (list: Chore[]): Chore[] => {
    return list.filter(c => {
      if (filters.search && !c.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !(c.description || '').toLowerCase().includes(filters.search.toLowerCase())) return false
      if (filters.status !== 'all' && c.status !== filters.status) return false
      if (filters.priority !== 'all' && c.priority !== filters.priority) return false
      if (filters.category !== 'all' && c.category !== filters.category) return false
      if (filters.assigneeId !== 'all' && c.assignedTo !== filters.assigneeId) return false
      return true
    })
  }

  const getWeekChores = () => {
    const result: Chore[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(selectedDate + 'T00:00:00')
      date.setDate(date.getDate() + i)
      result.push(...getChoresForDate(date.toISOString().split('T')[0]))
    }
    return result
  }

  const baseChores =
    viewMode === 'day' ? choresForSelectedDate :
    viewMode === 'week' ? getWeekChores() :
    chores

  const displayChores = applyFilters(baseChores)
  const choresByDate = groupChoresByDate(displayChores)

  const overdueCount = useMemo(
    () => chores.filter(c => c.status === 'pending' && new Date(c.dueDate + 'T00:00:00') < new Date(getDateString(new Date()) + 'T00:00:00')).length,
    [chores]
  )

  const handleAddChore = (choreData: Omit<Chore, 'id' | 'createdAt'>) => {
    addChore(choreData)
    addNotification(`"${choreData.title}" added!`, 'success')
    setShowAddForm(false)
  }

  const handleEditSubmit = (choreData: Omit<Chore, 'id' | 'createdAt'>) => {
    if (!editingChore) return
    updateChore(editingChore.id, choreData)
    addNotification(`"${choreData.title}" updated!`, 'success')
    setEditingChore(null)
  }

  const handleDeleteChore = (id: string) => {
    if (window.confirm('Delete this chore?')) {
      deleteChore(id)
      addNotification('Chore deleted', 'success')
    }
  }

  const handleCompleteChore = (id: string) => {
    const chore = chores.find(c => c.id === id)
    const member = teamMembers.find(m => m.id === chore?.assignedTo)
    const tokens = completeChore(id)
    setCelebration({ tokens, memberName: member?.name || '' })
  }

  const handleAddNote = (id: string, note: string) => {
    updateChore(id, { notes: note || undefined })
    addNotification('Note saved', 'success')
  }

  const handleAddTeamMember = (name: string, color: string) => {
    addTeamMember({ name, color })
    addNotification(`${name} added to team`, 'success')
  }

  const handleRemoveTeamMember = (id: string) => {
    const member = teamMembers.find(m => m.id === id)
    if (window.confirm(`Remove ${member?.name} from the team?`)) {
      removeTeamMember(id)
      addNotification(`${member?.name} removed from team`, 'success')
    }
  }

  const exportToCSV = () => {
    const headers = ['Title', 'Description', 'Due Date', 'Assigned To', 'Status', 'Priority', 'Category', 'Recurring', 'Notes', 'Created', 'Completed']
    const rows = chores.map(c => {
      const member = teamMembers.find(m => m.id === c.assignedTo)
      return [
        c.title,
        c.description || '',
        c.dueDate,
        member?.name || 'Unassigned',
        c.status,
        c.priority || '',
        c.category || '',
        c.recurring?.pattern || '',
        c.notes || '',
        c.createdAt.split('T')[0],
        c.completedAt ? c.completedAt.split('T')[0] : '',
      ]
    })
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chores-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addNotification(`Exported ${chores.length} chores to CSV`, 'success')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '16px', color: 'var(--text-secondary)' }}>
        Loading chores...
      </div>
    )
  }

  return (
    <div className="chore-app">
      <NotificationContainer />

      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Office Chore Tracker</h1>
            <div className="stats">
              <span className="stat">
                <span className="stat-num">{stats.total}</span> Total
              </span>
              <span className="stat">
                <span className="stat-num">{stats.completed}</span> Done
              </span>
              <span className="stat">
                <span className="stat-num">{stats.completionRate}%</span> Rate
              </span>
              {overdueCount > 0 && (
                <span className="stat stat-overdue">
                  <span className="stat-num">{overdueCount}</span> Overdue
                </span>
              )}
            </div>
          </div>

          <div className="header-actions">
            <button
              className="btn-header"
              onClick={() => setDarkMode(d => !d)}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              className="btn-header"
              onClick={exportToCSV}
              title="Export to CSV"
              disabled={chores.length === 0}
            >
              <Download size={16} /> Export
            </button>
            <button
              className="btn-header"
              onClick={onGoToFarm}
              title="Go to Our Farm"
            >
              <BarnCatIcon /> Farm
            </button>
            <button
              className="btn-header"
              onClick={onGoToGrocery}
              title="Go to Grocery List"
            >
              <ShoppingCart size={16} /> Grocery
            </button>
            <button
              className="btn-header"
              onClick={() => setShowTeamManager(v => !v)}
            >
              <Users size={16} /> Team
            </button>
            <button
              className="btn-header btn-header-primary"
              onClick={() => setShowAddForm(true)}
              disabled={teamMembers.length === 0}
              title={teamMembers.length === 0 ? 'Add team members first' : 'Add new chore'}
            >
              <Plus size={16} /> Add Chore
            </button>
          </div>
        </div>
      </header>

      <div className="app-container">
        <aside className="sidebar">
          <CalendarView
            selectedDate={selectedDate}
            onDateChange={date => { setSelectedDate(date); setViewMode('day') }}
            chores={chores}
          />

          <div className="view-modes">
            <h3>View</h3>
            <div className="mode-buttons">
              <button
                className={`mode-btn ${viewMode === 'day' ? 'active' : ''}`}
                onClick={() => setViewMode('day')}
              >
                <Calendar size={15} /> Day
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

        <main className="main-content">
          <SearchFilter
            filters={filters}
            onChange={setFilters}
            teamMembers={teamMembers}
            categories={allCategories}
          />

          {viewMode === 'day' && (
            <ChoreList
              chores={displayChores}
              teamMembers={teamMembers}
              onComplete={handleCompleteChore}
              onDelete={handleDeleteChore}
              onEdit={setEditingChore}
              onAddNote={handleAddNote}
              emptyMessage={`No chores for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
            />
          )}

          {viewMode === 'week' && (
            <div className="week-view">
              {Object.keys(choresByDate).length === 0 ? (
                <div className="chore-list-empty">
                  <div className="empty-icon">📅</div>
                  <p>No chores this week</p>
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
                      onEdit={setEditingChore}
                      onAddNote={handleAddNote}
                    />
                  </div>
                ))
              )}
            </div>
          )}

          {viewMode === 'all' && (
            <ChoreList
              chores={displayChores}
              teamMembers={teamMembers}
              onComplete={handleCompleteChore}
              onDelete={handleDeleteChore}
              onEdit={setEditingChore}
              onAddNote={handleAddNote}
              title={`All Chores (${displayChores.length})`}
              emptyMessage="No chores match your filters"
            />
          )}
        </main>
      </div>

      {celebration && (
        <ConfettiCelebration
          tokens={celebration.tokens}
          memberName={celebration.memberName}
          onDone={() => setCelebration(null)}
        />
      )}

      {(showAddForm || editingChore) && (
        <AddChoreForm
          teamMembers={teamMembers}
          onSubmit={editingChore ? handleEditSubmit : handleAddChore}
          onCancel={() => { setShowAddForm(false); setEditingChore(null) }}
          initialDate={selectedDate}
          editingChore={editingChore || undefined}
        />
      )}
    </div>
  )
}
