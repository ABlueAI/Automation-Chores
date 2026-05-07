import React, { createContext, useContext, useState, useEffect } from 'react'

export interface TeamMember {
  id: string
  name: string
  email?: string
  color?: string
  tokens: number
}

export interface Chore {
  id: string
  title: string
  description?: string
  dueDate: string
  startTime?: string
  estimatedMinutes?: number
  assignedTo: string
  status: 'pending' | 'completed'
  priority?: 'low' | 'medium' | 'high'
  category?: string
  notes?: string
  tokensEarned?: number
  recurring?: {
    pattern: 'daily' | 'weekly' | 'monthly'
    endDate?: string
  }
  createdAt: string
  completedAt?: string
}

interface ChoreContextType {
  chores: Chore[]
  teamMembers: TeamMember[]
  addChore: (chore: Omit<Chore, 'id' | 'createdAt'>) => void
  updateChore: (id: string, updates: Partial<Chore>) => void
  deleteChore: (id: string) => void
  completeChore: (id: string) => number
  addTeamMember: (member: Omit<TeamMember, 'id' | 'tokens'>) => void
  removeTeamMember: (id: string) => void
  getChoresForDate: (date: string) => Chore[]
  getChoresForMember: (memberId: string) => Chore[]
}

const ChoreContext = createContext<ChoreContextType | undefined>(undefined)

export const useChores = () => {
  const context = useContext(ChoreContext)
  if (!context) throw new Error('useChores must be used within ChoreProvider')
  return context
}

function calcTokens(chore: Chore): number {
  const now = new Date()

  if (chore.startTime) {
    const startDT = new Date(`${chore.dueDate}T${chore.startTime}:00`)
    if (chore.estimatedMinutes) {
      const endDT = new Date(startDT.getTime() + chore.estimatedMinutes * 60_000)
      if (now < startDT) return 3
      if (now <= endDT) return 2
      return 1
    }
    const dueDateEnd = new Date(`${chore.dueDate}T23:59:59`)
    if (now < startDT) return 3
    if (now <= dueDateEnd) return 2
    return 1
  }

  const dueDateStart = new Date(`${chore.dueDate}T00:00:00`)
  const dueDateEnd = new Date(`${chore.dueDate}T23:59:59`)
  if (now < dueDateStart) return 3
  if (now <= dueDateEnd) return 2
  return 1
}

export const ChoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chores, setChores] = useState<Chore[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  useEffect(() => {
    const savedChores = localStorage.getItem('chores')
    const savedMembers = localStorage.getItem('teamMembers')
    if (savedChores) setChores(JSON.parse(savedChores))
    if (savedMembers) {
      const members = JSON.parse(savedMembers)
      // Migrate existing members that don't have tokens
      setTeamMembers(members.map((m: TeamMember) => ({ ...m, tokens: m.tokens ?? 0 })))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('chores', JSON.stringify(chores))
  }, [chores])

  useEffect(() => {
    localStorage.setItem('teamMembers', JSON.stringify(teamMembers))
  }, [teamMembers])

  const generateRecurringChores = (baseChore: Chore, count = 12): Chore[] => {
    if (!baseChore.recurring) return []
    const result: Chore[] = []
    const startDate = new Date(baseChore.dueDate)
    for (let i = 1; i <= count; i++) {
      const newDate = new Date(startDate)
      if (baseChore.recurring.pattern === 'daily') newDate.setDate(newDate.getDate() + i)
      else if (baseChore.recurring.pattern === 'weekly') newDate.setDate(newDate.getDate() + i * 7)
      else if (baseChore.recurring.pattern === 'monthly') newDate.setMonth(newDate.getMonth() + i)
      if (baseChore.recurring.endDate && newDate > new Date(baseChore.recurring.endDate)) break
      result.push({ ...baseChore, id: `${baseChore.id}-recur-${i}`, dueDate: newDate.toISOString().split('T')[0] })
    }
    return result
  }

  const addChore = (chore: Omit<Chore, 'id' | 'createdAt'>) => {
    const id = Date.now().toString()
    const newChore: Chore = { ...chore, id, createdAt: new Date().toISOString() }
    const recurring = chore.recurring ? generateRecurringChores(newChore) : []
    setChores(prev => [...prev, newChore, ...recurring])
  }

  const updateChore = (id: string, updates: Partial<Chore>) => {
    setChores(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)))
  }

  const deleteChore = (id: string) => {
    setChores(prev => prev.filter(c => c.id !== id))
  }

  const completeChore = (id: string): number => {
    const chore = chores.find(c => c.id === id)
    if (!chore) return 0
    const tokens = calcTokens(chore)

    setChores(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, status: 'completed', completedAt: new Date().toISOString(), tokensEarned: tokens }
          : c
      )
    )

    if (chore.assignedTo) {
      setTeamMembers(prev =>
        prev.map(m =>
          m.id === chore.assignedTo ? { ...m, tokens: (m.tokens || 0) + tokens } : m
        )
      )
    }

    return tokens
  }

  const addTeamMember = (member: Omit<TeamMember, 'id' | 'tokens'>) => {
    const id = Date.now().toString()
    setTeamMembers(prev => [...prev, { ...member, id, tokens: 0 }])
  }

  const removeTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id))
    setChores(prev => prev.map(c => (c.assignedTo === id ? { ...c, assignedTo: '' } : c)))
  }

  const getChoresForDate = (date: string) => chores.filter(c => c.dueDate === date)
  const getChoresForMember = (memberId: string) => chores.filter(c => c.assignedTo === memberId)

  return (
    <ChoreContext.Provider
      value={{
        chores, teamMembers, addChore, updateChore, deleteChore, completeChore,
        addTeamMember, removeTeamMember, getChoresForDate, getChoresForMember,
      }}
    >
      {children}
    </ChoreContext.Provider>
  )
}
