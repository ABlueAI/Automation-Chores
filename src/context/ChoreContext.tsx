import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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
  loading: boolean
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

function rowToChore(row: Record<string, unknown>): Chore {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? undefined,
    dueDate: row.due_date as string,
    startTime: (row.start_time as string) ?? undefined,
    estimatedMinutes: (row.estimated_minutes as number) ?? undefined,
    assignedTo: (row.assigned_to as string) ?? '',
    status: row.status as 'pending' | 'completed',
    priority: (row.priority as 'low' | 'medium' | 'high') ?? undefined,
    category: (row.category as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    tokensEarned: (row.tokens_earned as number) ?? undefined,
    recurring: (row.recurring as Chore['recurring']) ?? undefined,
    createdAt: row.created_at as string,
    completedAt: (row.completed_at as string) ?? undefined,
  }
}

function choreToRow(chore: Chore) {
  return {
    id: chore.id,
    title: chore.title,
    description: chore.description ?? null,
    due_date: chore.dueDate,
    start_time: chore.startTime ?? null,
    estimated_minutes: chore.estimatedMinutes ?? null,
    assigned_to: chore.assignedTo || null,
    status: chore.status,
    priority: chore.priority ?? null,
    category: chore.category ?? null,
    notes: chore.notes ?? null,
    tokens_earned: chore.tokensEarned ?? null,
    recurring: chore.recurring ?? null,
    created_at: chore.createdAt,
    completed_at: chore.completedAt ?? null,
  }
}

function rowToMember(row: Record<string, unknown>): TeamMember {
  return {
    id: row.id as string,
    name: row.name as string,
    email: (row.email as string) ?? undefined,
    color: (row.color as string) ?? undefined,
    tokens: (row.tokens as number) ?? 0,
  }
}

function memberToRow(member: TeamMember) {
  return {
    id: member.id,
    name: member.name,
    email: member.email ?? null,
    color: member.color ?? null,
    tokens: member.tokens,
  }
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: choresData, error: ce }, { data: membersData, error: me }] = await Promise.all([
        supabase.from('chores').select('*'),
        supabase.from('team_members').select('*'),
      ])
      if (ce) console.error('load chores:', ce)
      if (me) console.error('load members:', me)
      if (choresData) setChores(choresData.map(rowToChore))
      if (membersData) setTeamMembers(membersData.map(rowToMember))
      setLoading(false)
    }
    load()
  }, [])

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
    const all = [newChore, ...recurring]
    setChores(prev => [...prev, ...all])
    supabase.from('chores').insert(all.map(choreToRow)).then(({ error }) => {
      if (error) console.error('addChore:', error)
    })
  }

  const updateChore = (id: string, updates: Partial<Chore>) => {
    setChores(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)))
    const chore = chores.find(c => c.id === id)
    if (chore) {
      const updated = { ...chore, ...updates }
      supabase.from('chores').update(choreToRow(updated)).eq('id', id).then(({ error }) => {
        if (error) console.error('updateChore:', error)
      })
    }
  }

  const deleteChore = (id: string) => {
    setChores(prev => prev.filter(c => c.id !== id))
    supabase.from('chores').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('deleteChore:', error)
    })
  }

  const completeChore = (id: string): number => {
    const chore = chores.find(c => c.id === id)
    if (!chore) return 0
    const tokens = calcTokens(chore)
    const completedAt = new Date().toISOString()

    setChores(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, status: 'completed', completedAt, tokensEarned: tokens }
          : c
      )
    )
    supabase.from('chores').update({
      status: 'completed',
      completed_at: completedAt,
      tokens_earned: tokens,
    }).eq('id', id).then(({ error }) => {
      if (error) console.error('completeChore:', error)
    })

    if (chore.assignedTo) {
      const member = teamMembers.find(m => m.id === chore.assignedTo)
      const newTokens = (member?.tokens ?? 0) + tokens
      setTeamMembers(prev =>
        prev.map(m => m.id === chore.assignedTo ? { ...m, tokens: newTokens } : m)
      )
      supabase.from('team_members').update({ tokens: newTokens })
        .eq('id', chore.assignedTo)
        .then(({ error }) => {
          if (error) console.error('completeChore tokens:', error)
        })
    }

    return tokens
  }

  const addTeamMember = (member: Omit<TeamMember, 'id' | 'tokens'>) => {
    const id = Date.now().toString()
    const newMember: TeamMember = { ...member, id, tokens: 0 }
    setTeamMembers(prev => [...prev, newMember])
    supabase.from('team_members').insert(memberToRow(newMember)).then(({ error }) => {
      if (error) console.error('addTeamMember:', error)
    })
  }

  const removeTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id))
    setChores(prev => prev.map(c => (c.assignedTo === id ? { ...c, assignedTo: '' } : c)))
    supabase.from('team_members').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('removeTeamMember:', error)
    })
    supabase.from('chores').update({ assigned_to: null })
      .eq('assigned_to', id)
      .then(({ error }) => {
        if (error) console.error('removeTeamMember chores:', error)
      })
  }

  const getChoresForDate = (date: string) => chores.filter(c => c.dueDate === date)
  const getChoresForMember = (memberId: string) => chores.filter(c => c.assignedTo === memberId)

  return (
    <ChoreContext.Provider
      value={{
        chores, teamMembers, loading, addChore, updateChore, deleteChore, completeChore,
        addTeamMember, removeTeamMember, getChoresForDate, getChoresForMember,
      }}
    >
      {children}
    </ChoreContext.Provider>
  )
}
