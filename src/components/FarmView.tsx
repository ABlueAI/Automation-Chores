import { useState, useCallback } from 'react'
import FarmTopDown from './FarmTopDown'
import FarmRunner from './FarmRunner'
import { type FoodDef, loadInventory, saveInventory } from '../utils/farmUtils'

interface Props {
  onGoToChores: () => void
}

type Screen = 'farm' | 'runner'

export default function FarmView({ onGoToChores }: Props) {
  const [screen, setScreen] = useState<Screen>('farm')
  const [inventory, setInventory] = useState<Record<string, number>>(loadInventory)

  const handleEarnFood = useCallback((food: FoodDef) => {
    setInventory(prev => {
      const next = { ...prev, [food.id]: (prev[food.id] || 0) + 1 }
      saveInventory(next)
      return next
    })
  }, [])

  const handleFeedCat = useCallback((_id: string, foodId: string) => {
    setInventory(prev => {
      const next = { ...prev, [foodId]: Math.max(0, (prev[foodId] || 0) - 1) }
      saveInventory(next)
      return next
    })
  }, [])

  const handleFillBowl = useCallback((foodId: string) => {
    setInventory(prev => {
      const next = { ...prev, [foodId]: Math.max(0, (prev[foodId] || 0) - 1) }
      saveInventory(next)
      return next
    })
  }, [])

  if (screen === 'runner') {
    return (
      <FarmRunner
        onBack={() => setScreen('farm')}
        onEarnFood={handleEarnFood}
      />
    )
  }

  return (
    <FarmTopDown
      onBack={onGoToChores}
      onLaunchRunner={() => setScreen('runner')}
      inventory={inventory}
      onFeedCat={handleFeedCat}
      onFillBowl={handleFillBowl}
    />
  )
}
