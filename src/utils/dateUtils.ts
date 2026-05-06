import { Chore, TeamMember } from '../context/ChoreContext'

export const getDateString = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

export const parseDate = (dateString: string): Date => {
  return new Date(dateString + 'T00:00:00')
}

export const formatDate = (dateString: string): string => {
  const date = parseDate(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export const formatDateLong = (dateString: string): string => {
  const date = parseDate(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const getDateRange = (startDate: Date, days: number): string[] => {
  const range = []
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    range.push(getDateString(date))
  }
  return range
}

export const groupChoresByDate = (chores: Chore[]): Record<string, Chore[]> => {
  return chores.reduce(
    (acc, chore) => {
      if (!acc[chore.dueDate]) {
        acc[chore.dueDate] = []
      }
      acc[chore.dueDate].push(chore)
      return acc
    },
    {} as Record<string, Chore[]>
  )
}

export const getMemberName = (memberId: string, members: TeamMember[]): string => {
  const member = members.find(m => m.id === memberId)
  return member?.name || 'Unassigned'
}

export const isOverdue = (dueDate: string, status: string): boolean => {
  if (status === 'completed') return false
  return parseDate(dueDate) < new Date()
}

export const isToday = (dateString: string): boolean => {
  const date = parseDate(dateString)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

export const isTomorrow = (dateString: string): boolean => {
  const date = parseDate(dateString)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  )
}
