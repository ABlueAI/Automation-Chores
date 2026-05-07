import React, { createContext, useContext, useState, useEffect } from 'react'
import { findGroceryMatch } from '../utils/groceryUtils'

export interface GroceryItem {
  id: string
  name: string
  nameEs: string
  quantity: string
  category: string
  checked: boolean
  aisle?: string
  addedAt: string
}

interface GroceryContextType {
  items: GroceryItem[]
  addItem: (name: string, quantity: string) => void
  removeItem: (id: string) => void
  toggleItem: (id: string) => void
  clearChecked: () => void
  clearAll: () => void
}

const GroceryContext = createContext<GroceryContextType | undefined>(undefined)

export const useGrocery = () => {
  const ctx = useContext(GroceryContext)
  if (!ctx) throw new Error('useGrocery must be used within GroceryProvider')
  return ctx
}

export const GroceryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<GroceryItem[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('groceryItems')
    if (saved) setItems(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('groceryItems', JSON.stringify(items))
  }, [items])

  const addItem = (name: string, quantity: string) => {
    const match = findGroceryMatch(name)
    const item: GroceryItem = {
      id: Date.now().toString(),
      name: match ? match.name : name,
      nameEs: match ? match.nameEs : name,
      quantity: quantity.trim() || '1',
      category: match ? match.category : 'Grocery Store Other',
      checked: false,
      addedAt: new Date().toISOString(),
    }
    setItems(prev => [...prev, item])
  }

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

  const toggleItem = (id: string) =>
    setItems(prev => prev.map(i => (i.id === id ? { ...i, checked: !i.checked } : i)))

  const clearChecked = () => setItems(prev => prev.filter(i => !i.checked))

  const clearAll = () => setItems([])

  return (
    <GroceryContext.Provider value={{ items, addItem, removeItem, toggleItem, clearChecked, clearAll }}>
      {children}
    </GroceryContext.Provider>
  )
}
