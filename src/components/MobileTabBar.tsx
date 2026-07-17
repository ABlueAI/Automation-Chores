import { ListChecks, CalendarDays, ShoppingCart, Cat } from 'lucide-react'
import '../styles/MobileTabBar.css'

export type Page = 'chores' | 'calendar' | 'grocery' | 'farm'

interface Props {
  page: Page
  onChange: (page: Page) => void
}

const TABS: { id: Page; label: string; Icon: typeof ListChecks }[] = [
  { id: 'chores', label: 'Chores', Icon: ListChecks },
  { id: 'calendar', label: 'Calendar', Icon: CalendarDays },
  { id: 'grocery', label: 'Grocery', Icon: ShoppingCart },
  { id: 'farm', label: 'Farm', Icon: Cat },
]

export default function MobileTabBar({ page, onChange }: Props) {
  return (
    <nav className="tab-bar">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`tab-btn${page === id ? ' active' : ''}`}
          onClick={() => onChange(id)}
          aria-label={label}
        >
          <Icon size={22} strokeWidth={page === id ? 2.4 : 1.8} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
