import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
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
  loading: boolean
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

function rowToItem(row: Record<string, unknown>): GroceryItem {
  return {
    id: row.id as string,
    name: row.name as string,
    nameEs: (row.name_es as string) ?? '',
    quantity: (row.quantity as string) ?? '1',
    category: (row.category as string) ?? 'Grocery Store Other',
    checked: (row.checked as boolean) ?? false,
    aisle: (row.aisle as string) ?? undefined,
    addedAt: row.added_at as string,
  }
}

function itemToRow(item: GroceryItem) {
  return {
    id: item.id,
    name: item.name,
    name_es: item.nameEs,
    quantity: item.quantity,
    category: item.category,
    checked: item.checked,
    aisle: item.aisle ?? null,
    added_at: item.addedAt,
  }
}

export const GroceryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<GroceryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('grocery_items').select('*').then(({ data, error }) => {
      if (error) console.error('load grocery_items:', error)
      if (data) setItems(data.map(rowToItem))
      setLoading(false)
    })
  }, [])

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
    supabase.from('grocery_items').insert(itemToRow(item)).then(({ error }) => {
      if (error) console.error('addItem:', error)
    })
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
    supabase.from('grocery_items').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('removeItem:', error)
    })
  }

  const toggleItem = (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    const checked = !item.checked
    setItems(prev => prev.map(i => (i.id === id ? { ...i, checked } : i)))
    supabase.from('grocery_items').update({ checked }).eq('id', id).then(({ error }) => {
      if (error) console.error('toggleItem:', error)
    })
  }

  const clearChecked = () => {
    const checkedIds = items.filter(i => i.checked).map(i => i.id)
    setItems(prev => prev.filter(i => !i.checked))
    if (checkedIds.length > 0) {
      supabase.from('grocery_items').delete().in('id', checkedIds).then(({ error }) => {
        if (error) console.error('clearChecked:', error)
      })
    }
  }

  const clearAll = () => {
    setItems([])
    supabase.from('grocery_items').delete().neq('id', '').then(({ error }) => {
      if (error) console.error('clearAll:', error)
    })
  }

  return (
    <GroceryContext.Provider value={{ items, loading, addItem, removeItem, toggleItem, clearChecked, clearAll }}>
      {children}
    </GroceryContext.Provider>
  )
}
