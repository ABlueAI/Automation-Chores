import { useState } from 'react'
import { ChoreProvider } from './context/ChoreContext'
import { NotificationProvider } from './context/NotificationContext'
import { GroceryProvider } from './context/GroceryContext'
import ChoreApp from './pages/ChoreApp'
import GroceryView from './components/GroceryView'
import './App.css'

function App() {
  const [page, setPage] = useState<'chores' | 'grocery'>('chores')

  return (
    <NotificationProvider>
      <ChoreProvider>
        <GroceryProvider>
          {page === 'chores'
            ? <ChoreApp onGoToGrocery={() => setPage('grocery')} />
            : <GroceryView onGoToChores={() => setPage('chores')} />
          }
        </GroceryProvider>
      </ChoreProvider>
    </NotificationProvider>
  )
}

export default App
