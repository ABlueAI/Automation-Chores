import { useState } from 'react'
import { ChoreProvider } from './context/ChoreContext'
import { NotificationProvider } from './context/NotificationContext'
import { GroceryProvider } from './context/GroceryContext'
import ChoreApp from './pages/ChoreApp'
import GroceryView from './components/GroceryView'
import FarmView from './components/FarmView'
import MobileTabBar, { Page } from './components/MobileTabBar'
import './App.css'

function App() {
  const [page, setPage] = useState<Page>('chores')

  return (
    <NotificationProvider>
      <ChoreProvider>
        <GroceryProvider>
          {/* chores + calendar are one component so date/view state survives tab switches */}
          {(page === 'chores' || page === 'calendar') && (
            <ChoreApp
              tab={page === 'calendar' ? 'calendar' : 'list'}
              onDatePicked={() => setPage('chores')}
            />
          )}
          {page === 'grocery' && <GroceryView onGoToChores={() => setPage('chores')} />}
          {page === 'farm' && <FarmView onGoToChores={() => setPage('chores')} />}
          <MobileTabBar page={page} onChange={setPage} />
        </GroceryProvider>
      </ChoreProvider>
    </NotificationProvider>
  )
}

export default App
