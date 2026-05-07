import React, { useState, useMemo } from 'react'
import { useGrocery } from '../context/GroceryContext'
import { getSuggestions } from '../utils/groceryUtils'
import { GROCERY_CATEGORIES_ORDER, CATEGORY_ICONS } from '../utils/groceryUtils'
import { Plus, Trash2, ShoppingCart, ArrowLeft, CheckSquare, X } from 'lucide-react'
import '../styles/GroceryView.css'

interface Props {
  onGoToChores: () => void
}

const GroceryView: React.FC<Props> = ({ onGoToChores }) => {
  const { items, addItem, removeItem, toggleItem, clearChecked, clearAll } = useGrocery()

  const [nameInput, setNameInput] = useState('')
  const [qtyInput, setQtyInput] = useState('')
  const [preview, setPreview] = useState<{ name: string; nameEs: string; category: string } | null>(null)

  const suggestions = useMemo(() => getSuggestions(nameInput, 6), [nameInput])

  const handleNameChange = (val: string) => {
    setNameInput(val)
    const sugs = getSuggestions(val, 1)
    if (sugs.length > 0) {
      setPreview({ name: sugs[0].name, nameEs: sugs[0].nameEs, category: sugs[0].category })
    } else if (val.trim()) {
      setPreview({ name: val, nameEs: val, category: 'Grocery Store Other' })
    } else {
      setPreview(null)
    }
  }

  const handleSelectSuggestion = (name: string) => {
    setNameInput(name)
    const sugs = getSuggestions(name, 1)
    if (sugs.length > 0) {
      setPreview({ name: sugs[0].name, nameEs: sugs[0].nameEs, category: sugs[0].category })
    }
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameInput.trim()) return
    addItem(nameInput.trim(), qtyInput.trim())
    setNameInput('')
    setQtyInput('')
    setPreview(null)
  }

  const grouped = useMemo(() => {
    const map: Record<string, typeof items> = {}
    items.forEach(item => {
      if (!map[item.category]) map[item.category] = []
      map[item.category].push(item)
    })
    return map
  }, [items])

  const orderedCategories = [
    ...GROCERY_CATEGORIES_ORDER.filter(c => grouped[c]),
    ...Object.keys(grouped).filter(c => !GROCERY_CATEGORIES_ORDER.includes(c)),
  ]

  const checkedCount = items.filter(i => i.checked).length
  const totalCount = items.length

  return (
    <div className="grocery-app">
      {/* Header */}
      <header className="grocery-header">
        <div className="grocery-header-content">
          <div className="grocery-header-left">
            <button className="btn-back" onClick={onGoToChores}>
              <ArrowLeft size={16} /> Chores
            </button>
            <div className="grocery-title">
              <ShoppingCart size={22} />
              <h1>Grocery List</h1>
            </div>
          </div>
          <div className="grocery-header-right">
            {totalCount > 0 && (
              <span className="grocery-progress">
                {checkedCount}/{totalCount} items
              </span>
            )}
            {checkedCount > 0 && (
              <button className="btn-gh btn-gh-clear" onClick={clearChecked} title="Clear checked items">
                <CheckSquare size={15} /> Clear Checked ({checkedCount})
              </button>
            )}
            {totalCount > 0 && (
              <button className="btn-gh btn-gh-danger" onClick={() => { if (window.confirm('Clear entire list?')) clearAll() }} title="Clear all">
                <X size={15} /> Clear All
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="grocery-container">
        {/* Add Item Panel */}
        <aside className="grocery-sidebar">
          <div className="grocery-add-panel">
            <h2>Add Item</h2>
            <form onSubmit={handleAdd} className="grocery-add-form">
              <div className="grocery-input-wrap">
                <input
                  type="text"
                  list="grocery-suggestions"
                  value={nameInput}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. Milk, Bread, Eggs..."
                  className="grocery-name-input"
                  autoComplete="off"
                />
                {suggestions.length > 0 && nameInput.length > 1 && (
                  <div className="grocery-suggestions-dropdown">
                    {suggestions.map(s => (
                      <button
                        key={s.name}
                        type="button"
                        className="suggestion-item"
                        onClick={() => handleSelectSuggestion(s.name)}
                      >
                        <span className="sug-icon">{CATEGORY_ICONS[s.category] || '📦'}</span>
                        <span className="sug-name">{s.name}</span>
                        <span className="sug-es">({s.nameEs})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="text"
                value={qtyInput}
                onChange={e => setQtyInput(e.target.value)}
                placeholder="Qty (e.g. 2, 1 lb)"
                className="grocery-qty-input"
              />

              {preview && (
                <div className="grocery-preview">
                  <span className="preview-icon">{CATEGORY_ICONS[preview.category] || '📦'}</span>
                  <div className="preview-info">
                    <span className="preview-name">{preview.name} <span className="preview-es">({preview.nameEs})</span></span>
                    <span className="preview-cat">{preview.category}</span>
                  </div>
                </div>
              )}

              <button type="submit" className="btn-add-grocery" disabled={!nameInput.trim()}>
                <Plus size={16} /> Add to List
              </button>
            </form>
          </div>

          {/* Category summary */}
          {orderedCategories.length > 0 && (
            <div className="grocery-category-summary">
              <h3>Sections</h3>
              {orderedCategories.map(cat => {
                const catItems = grouped[cat]
                const done = catItems.filter(i => i.checked).length
                return (
                  <a key={cat} href={`#cat-${cat.replace(/\s+/g, '-')}`} className="summary-row">
                    <span className="summary-icon">{CATEGORY_ICONS[cat] || '📦'}</span>
                    <span className="summary-label">{cat.replace('Grocery Store ', '')}</span>
                    <span className="summary-count">{done}/{catItems.length}</span>
                  </a>
                )
              })}
            </div>
          )}
        </aside>

        {/* Items List */}
        <main className="grocery-main">
          {totalCount === 0 ? (
            <div className="grocery-empty">
              <div className="grocery-empty-icon">🛒</div>
              <h3>Your list is empty</h3>
              <p>Start typing an item on the left to add it to your list.</p>
            </div>
          ) : (
            orderedCategories.map(cat => (
              <section
                key={cat}
                id={`cat-${cat.replace(/\s+/g, '-')}`}
                className="grocery-section"
              >
                <div className="grocery-section-header">
                  <span className="section-icon">{CATEGORY_ICONS[cat] || '📦'}</span>
                  <h2 className="section-title">{cat.replace('Grocery Store ', '')}</h2>
                  <span className="section-count">
                    {grouped[cat].filter(i => i.checked).length}/{grouped[cat].length}
                  </span>
                </div>

                <div className="grocery-items">
                  {grouped[cat].map(item => (
                    <div key={item.id} className={`grocery-item ${item.checked ? 'checked' : ''}`}>
                      <label className="grocery-item-check">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleItem(item.id)}
                        />
                        <span className="checkmark" />
                      </label>

                      <div className="grocery-item-info">
                        <span className="grocery-item-name">
                          {item.name}
                          {item.nameEs && item.nameEs !== item.name && (
                            <span className="grocery-item-es"> ({item.nameEs})</span>
                          )}
                        </span>
                        {item.quantity && item.quantity !== '1' && (
                          <span className="grocery-item-qty">{item.quantity}</span>
                        )}
                        {item.aisle && (
                          <span className="grocery-item-aisle">Aisle {item.aisle}</span>
                        )}
                      </div>

                      <button
                        className="btn-remove-grocery"
                        onClick={() => removeItem(item.id)}
                        title="Remove item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </main>
      </div>
    </div>
  )
}

export default GroceryView
