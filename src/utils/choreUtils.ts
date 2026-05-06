import { Chore } from '../context/ChoreContext'

export const getCompletionStats = (chores: Chore[]) => {
  const total = chores.length
  const completed = chores.filter(c => c.status === 'completed').length
  const pending = total - completed
  
  return {
    total,
    completed,
    pending,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}

export const sortChoresByDate = (chores: Chore[]): Chore[] => {
  return [...chores].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
}

export const filterChoresByStatus = (chores: Chore[], status: 'pending' | 'completed'): Chore[] => {
  return chores.filter(chore => chore.status === status)
}
