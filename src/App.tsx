import { useState } from 'react'
import { ChoreProvider } from './context/ChoreContext'
import { NotificationProvider } from './context/NotificationContext'
import { GroceryProvider } from './context/GroceryContext'
import ChoreApp from './pages/ChoreApp'
import GroceryView from './components/GroceryView'
import FarmView from './components/FarmView'
import './App.css'

function App() {
  const [page, setPage] = useState<'chores' | 'grocery' | 'farm'>('chores')

  return (
    <NotificationProvider>
      <ChoreProvider>
        <GroceryProvider>
          {page === 'chores'
            ? <ChoreApp onGoToGrocery={() => setPage('grocery')} onGoToFarm={() => setPage('farm')} />
            : page === 'grocery'
            ? <GroceryView onGoToChores={() => setPage('chores')} />
            : <FarmView onGoToChores={() => setPage('chores')} />
          }
        </GroceryProvider>
      </ChoreProvider>
    </NotificationProvider>
  )
}

export default App
