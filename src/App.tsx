import { ChoreProvider } from './context/ChoreContext'
import { NotificationProvider } from './context/NotificationContext'
import ChoreApp from './pages/ChoreApp'
import './App.css'

function App() {
  return (
    <NotificationProvider>
      <ChoreProvider>
        <ChoreApp />
      </ChoreProvider>
    </NotificationProvider>
  )
}

export default App
