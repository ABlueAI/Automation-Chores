import React from 'react'
import { TeamMember } from '../context/ChoreContext'
import { Search, X } from 'lucide-react'
import '../styles/SearchFilter.css'

export interface FilterState {
  search: string
  status: 'all' | 'pending' | 'completed'
  priority: 'all' | 'low' | 'medium' | 'high'
  category: string
  assigneeId: string
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  status: 'all',
  priority: 'all',
  category: 'all',
  assigneeId: 'all',
}

interface SearchFilterProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  teamMembers: TeamMember[]
  categories: string[]
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  filters,
  onChange,
  teamMembers,
  categories,
}) => {
  const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch })

  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.category !== 'all' ||
    filters.assigneeId !== 'all'

  return (
    <div className="search-filter">
      <div className="search-input-wrap">
        <Search size={15} className="search-icon" />
        <input
          type="text"
          placeholder="Search chores..."
          value={filters.search}
          onChange={e => set({ search: e.target.value })}
          className="search-input"
        />
        {filters.search && (
          <button className="search-clear" onClick={() => set({ search: '' })} title="Clear">
            <X size={13} />
          </button>
        )}
      </div>

      <div className="filter-row">
        <select
          value={filters.status}
          onChange={e => set({ status: e.target.value as FilterState['status'] })}
          className="filter-select"
        >
          <option value="all">All status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={filters.priority}
          onChange={e => set({ priority: e.target.value as FilterState['priority'] })}
          className="filter-select"
        >
          <option value="all">All priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {categories.length > 0 && (
          <select
            value={filters.category}
            onChange={e => set({ category: e.target.value })}
            className="filter-select"
          >
            <option value="all">All categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}

        {teamMembers.length > 0 && (
          <select
            value={filters.assigneeId}
            onChange={e => set({ assigneeId: e.target.value })}
            className="filter-select"
          >
            <option value="all">All members</option>
            <option value="">Unassigned</option>
            {teamMembers.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        )}

        {hasActiveFilters && (
          <button
            className="filter-clear-all"
            onClick={() => onChange(DEFAULT_FILTERS)}
            title="Clear all filters"
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>
    </div>
  )
}
