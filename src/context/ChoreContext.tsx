import React, { createContext, useContext, useState, useEffect } from 'react'

export interface TeamMember {
  id: string
  name: string
  email?: string
}

export interface Chore {
  id: string
  title: string
  description?: string
  dueDate: string
  assignedTo: string
  status: 'pending' | 'completed'
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
  completeChore: (id: string) => void
  addTeamMember: (member: Omit<TeamMember, 'id'>) => void
  removeTeamMember: (id: string) => void
  getChoresForDate: (date: string) => Chore[]
  getChoresForMember: (memberId: string) => Chore[]
}

const ChoreContext = createContext<ChoreContextType | undefined>(undefined)

export const useChores = () => {
  const context = useContext(ChoreContext)
  if (!context) {
    throw new Error('useChores must be used within ChoreProvider')
  }
  return context
}

export const ChoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chores, setChores] = useState<Chore[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const savedChores = localStorage.getItem('chores')
    const savedMembers = localStorage.getItem('teamMembers')
    
    if (savedChores) setChores(JSON.parse(savedChores))
    if (savedMembers) setTeamMembers(JSON.parse(savedMembers))
  }, [])

  // Save to localStorage when chores change
  useEffect(() => {
    localStorage.setItem('chores', JSON.stringify(chores))
  }, [chores])

  // Save to localStorage when team members change
  useEffect(() => {
    localStorage.setItem('teamMembers', JSON.stringify(teamMembers))
  }, [teamMembers])

  const generateRecurringChores = (baseChore: Chore, count: number = 12): Chore[] => {
    if (!baseChore.recurring) return []
    
    const chores: Chore[] = []
    const startDate = new Date(baseChore.dueDate)
    
    for (let i = 1; i <= count; i++) {
      const newDate = new Date(startDate)
      
      if (baseChore.recurring.pattern === 'daily') {
        newDate.setDate(newDate.getDate() + i)
      } else if (baseChore.recurring.pattern === 'weekly') {
        newDate.setDate(newDate.getDate() + i * 7)
      } else if (baseChore.recurring.pattern === 'monthly') {
        newDate.setMonth(newDate.getMonth() + i)
      }
      
      if (baseChore.recurring.endDate && newDate > new Date(baseChore.recurring.endDate)) {
        break
      }
      
      chores.push({
        ...baseChore,
        id: `${baseChore.id}-recur-${i}`,
        dueDate: newDate.toISOString().split('T')[0],
      })
    }
    
    return chores
  }

  const addChore = (chore: Omit<Chore, 'id' | 'createdAt'>) => {
    const id = Date.now().toString()
    const newChore: Chore = {
      ...chore,
      id,
      createdAt: new Date().toISOString(),
    }
    
    setChores(prev => [...prev, newChore])
    
    // Add recurring instances
    if (chore.recurring) {
      const recurring = generateRecurringChores(newChore)
      setChores(prev => [...prev, ...recurring])
    }
  }

  const updateChore = (id: string, updates: Partial<Chore>) => {
    setChores(prev =>
      prev.map(chore =>
        chore.id === id ? { ...chore, ...updates } : chore
      )
    )
  }

  const deleteChore = (id: string) => {
    setChores(prev => prev.filter(chore => chore.id !== id))
  }

  const completeChore = (id: string) => {
    setChores(prev =>
      prev.map(chore =>
        chore.id === id
          ? { ...chore, status: 'completed', completedAt: new Date().toISOString() }
          : chore
      )
    )
  }

  const addTeamMember = (member: Omit<TeamMember, 'id'>) => {
    const id = Date.now().toString()
    setTeamMembers(prev => [...prev, { ...member, id }])
  }

  const removeTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(member => member.id !== id))
    // Remove assignments to this member
    setChores(prev =>
      prev.map(chore =>
        chore.assignedTo === id ? { ...chore, assignedTo: '' } : chore
      )
    )
  }

  const getChoresForDate = (date: string): Chore[] => {
    return chores.filter(chore => chore.dueDate === date)
  }

  const getChoresForMember = (memberId: string): Chore[] => {
    return chores.filter(chore => chore.assignedTo === memberId)
  }

  return (
    <ChoreContext.Provider
      value={{
        chores,
        teamMembers,
        addChore,
        updateChore,
        deleteChore,
        completeChore,
        addTeamMember,
        removeTeamMember,
        getChoresForDate,
        getChoresForMember,
      }}
    >
      {children}
    </ChoreContext.Provider>
  )
}
