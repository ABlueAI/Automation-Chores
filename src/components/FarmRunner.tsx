import { useState, useCallback, useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import { pickFood, type FoodDef } from '../utils/farmUtils'

interface Props {
  onBack: () => void
  onEarnFood: (food: FoodDef) => void
}

const GRID = 7
const MAX_MOVES = 20

const ANIMALS = [
  { id: 0, emoji: '🐄', color: '#f3f4f6', border: '#9ca3af', name: 'Cow' },
  { id: 1, emoji: '🐷', color: '#fee2e2', border: '#f87171', name: 'Pig' },
  { id: 2, emoji: '🐔', color: '#fef9c3', border: '#fbbf24', name: 'Chicken' },
  { id: 3, emoji: '🐑', color: '#dcfce7', border: '#4ade80', name: 'Sheep' },
  { id: 4, emoji: '🦆', color: '#dbeafe', border: '#60a5fa', name: 'Duck' },
  { id: 5, emoji: '🐰', color: '#f3e8ff', border: '#c084fc', name: 'Rabbit' },
]
const N = ANIMALS.length

type Grid = number[][]   // -1 = empty, 0-5 = animal

function mkGrid(): Grid {
  const g: Grid = []
  for (let r = 0; r < GRID; r++) {
    g[r] = []
    for (let c = 0; c < GRID; c++) {
      let v: number
      do { v = Math.floor(Math.random() * N) } while (
        (c >= 2 && g[r][c-1] === v && g[r][c-2] === v) ||
        (r >= 2 && g[r-1][c] === v && g[r-2][c] === v)
      )
      g[r][c] = v
    }
  }
  return g
}

function findMatches(g: Grid): Set<string> {
  const s = new Set<string>()
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID - 2; c++) {
      const v = g[r][c]
      if (v < 0) continue
      if (v === g[r][c+1] && v === g[r][c+2]) {
        let len = 3
        while (c+len < GRID && g[r][c+len] === v) len++
        for (let i = 0; i < len; i++) s.add(`${r},${c+i}`)
      }
    }
  }
  for (let c = 0; c < GRID; c++) {
    for (let r = 0; r < GRID - 2; r++) {
      const v = g[r][c]
      if (v < 0) continue
      if (v === g[r+1][c] && v === g[r+2][c]) {
        let len = 3
        while (r+len < GRID && g[r+len][c] === v) len++
        for (let i = 0; i < len; i++) s.add(`${r+i},${c}`)
      }
    }
  }
  return s
}

function applyGravity(g: Grid): Grid {
  const next = g.map(row => [...row])
  for (let c = 0; c < GRID; c++) {
    let w = GRID - 1
    for (let r = GRID - 1; r >= 0; r--) {
      if (next[r][c] >= 0) { next[w][c] = next[r][c]; if (w !== r) next[r][c] = -1; w-- }
    }
    while (w >= 0) { next[w][c] = Math.floor(Math.random() * N); w-- }
  }
  return next
}

function clearMatches(g: Grid, ms: Set<string>): Grid {
  return g.map((row, r) => row.map((v, c) => ms.has(`${r},${c}`) ? -1 : v))
}

export default function FarmRunner({ onBack, onEarnFood }: Props) {
  const [grid, setGrid] = useState<Grid>(mkGrid)
  const [sel, setSel] = useState<[number,number] | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(MAX_MOVES)
  const [phase, setPhase] = useState<'playing' | 'cascade' | 'over'>('playing')
  const [earnedFood, setEarnedFood] = useState<FoodDef | null>(null)
  const [shaking, setShaking] = useState<string | null>(null)   // "r,c" of bad swap
  const cascadeRef = useRef<Grid | null>(null)
  const scoreRef = useRef(0)
  scoreRef.current = score

  // Cascade effect: when matched set is non-empty, wait 380ms then collapse
  useEffect(() => {
    if (matched.size === 0) return
    const t = setTimeout(() => {
      const g = cascadeRef.current!
      const cleared = clearMatches(g, matched)
      const dropped = applyGravity(cleared)
      setMatched(new Set())
      cascadeRef.current = dropped
      const next = findMatches(dropped)
      if (next.size > 0) {
        setScore(s => s + next.size * 10)
        setMatched(next)
      } else {
        setGrid(dropped)
        cascadeRef.current = null
        setPhase(p => p === 'cascade' ? 'playing' : p)
      }
    }, 380)
    return () => clearTimeout(t)
  }, [matched])

  // Check game over after each move
  useEffect(() => {
    if (moves <= 0 && phase !== 'over') {
      const food = pickFood(scoreRef.current)
      setEarnedFood(food)
      onEarnFood(food)
      setPhase('over')
    }
  }, [moves, phase, onEarnFood])

  const handleClick = useCallback((r: number, c: number) => {
    if (phase !== 'playing') return
    if (sel === null) { setSel([r, c]); return }
    const [sr, sc] = sel
    if (sr === r && sc === c) { setSel(null); return }
    if (Math.abs(r - sr) + Math.abs(c - sc) !== 1) { setSel([r, c]); return }
    setSel(null)

    const next = grid.map(row => [...row])
    const tmp = next[sr][sc]; next[sr][sc] = next[r][c]; next[r][c] = tmp
    const ms = findMatches(next)
    if (ms.size > 0) {
      cascadeRef.current = next
      setScore(s => s + ms.size * 10)
      setMoves(m => m - 1)
      setMatched(ms)
      setPhase('cascade')
    } else {
      // invalid swap — flash red then revert
      const key = `${r},${c}`
      setShaking(key)
      setTimeout(() => setShaking(null), 300)
    }
  }, [phase, sel, grid])

  const reset = useCallback(() => {
    setGrid(mkGrid())
    setSel(null)
    setMatched(new Set())
    setScore(0)
    setMoves(MAX_MOVES)
    setPhase('playing')
    setEarnedFood(null)
    cascadeRef.current = null
  }, [])

  const cellPx = Math.min(64, Math.floor((Math.min(typeof window !== 'undefined' ? window.innerWidth : 480, 480) - 48) / GRID))

  // ── Game over screen ──────────────────────────────────────────────────────
  if (phase === 'over') {
    return (
      <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'linear-gradient(160deg,#1a2e1a 0%,#2d5a2d 100%)', alignItems:'center', justifyContent:'center', gap:0, padding:24 }}>
        <div style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:24, padding:36, textAlign:'center', maxWidth:360, width:'100%' }}>
          <div style={{ fontSize:72, marginBottom:8 }}>{earnedFood?.emoji ?? '🎉'}</div>
          <h2 style={{ color:'#fde68a', margin:'0 0 6px', fontSize:26, fontWeight:800 }}>Farm Crush!</h2>
          <p style={{ color:'#86efac', margin:'0 0 2px', fontSize:16 }}>Score: <strong style={{color:'#fde68a'}}>{score}</strong></p>
          {earnedFood && (
            <p style={{ color:'#d1fae5', margin:'6px 0 24px', fontSize:15 }}>
              You earned <strong>{earnedFood.emoji} {earnedFood.name}</strong>!<br/>
              <span style={{fontSize:12, color:'rgba(209,250,229,0.7)'}}>{earnedFood.rarityLabel} · goes to pantry</span>
            </p>
          )}
          <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
            <button onClick={onBack} style={{ padding:'10px 22px', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, color:'white', cursor:'pointer', fontSize:14 }}>
              ← Farm
            </button>
            <button onClick={reset} style={{ padding:'10px 22px', background:'#fbbf24', border:'none', borderRadius:10, color:'#1a1a00', cursor:'pointer', fontSize:14, fontWeight:800 }}>
              Play Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Game screen ───────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'linear-gradient(160deg,#1a2e1a 0%,#2d5a2d 100%)', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', height:52, background:'rgba(0,0,0,0.5)', flexShrink:0, gap:12 }}>
        <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'white', cursor:'pointer', fontSize:13 }}>
          <ArrowLeft size={14}/> Farm
        </button>
        <span style={{ color:'#fde68a', fontWeight:800, fontSize:17 }}>🌾 Farm Crush</span>
        <div style={{ display:'flex', gap:14, alignItems:'center' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:9, textTransform:'uppercase', letterSpacing:1 }}>Moves</div>
            <div style={{ color: moves <= 5 ? '#f87171' : '#fde68a', fontWeight:800, fontSize:18, lineHeight:1 }}>{moves}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:9, textTransform:'uppercase', letterSpacing:1 }}>Score</div>
            <div style={{ color:'#86efac', fontWeight:800, fontSize:18, lineHeight:1 }}>{score}</div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div style={{ textAlign:'center', padding:'6px 0', fontSize:12, color:'rgba(255,255,255,0.45)' }}>
        Swap adjacent animals to match 3+ in a row or column
      </div>

      {/* Grid */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:12 }}>
        <div style={{
          display:'grid',
          gridTemplateColumns:`repeat(${GRID}, ${cellPx}px)`,
          gap:3,
          background:'rgba(0,0,0,0.35)',
          padding:10,
          borderRadius:18,
          boxShadow:'0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}>
          {grid.map((row, r) => row.map((v, c) => {
            const isSel   = sel !== null && sel[0] === r && sel[1] === c
            const isMatch = matched.has(`${r},${c}`)
            const isShake = shaking === `${r},${c}`
            const a       = v >= 0 ? ANIMALS[v] : null
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleClick(r, c)}
                style={{
                  width:  cellPx,
                  height: cellPx,
                  background: isMatch ? '#fbbf24'
                             : isSel   ? 'rgba(255,255,255,0.45)'
                             : (a?.color ?? '#1f2937'),
                  border: isSel   ? '2.5px solid white'
                        : isShake ? '2.5px solid #f87171'
                        : `2px solid ${a?.border ?? '#374151'}`,
                  borderRadius: 10,
                  fontSize: Math.round(cellPx * 0.52),
                  cursor: 'pointer',
                  transition: 'transform 0.12s, opacity 0.12s, background 0.2s',
                  transform: isMatch ? 'scale(1.18)' : isSel ? 'scale(1.1)' : isShake ? 'scale(0.88)' : 'scale(1)',
                  opacity: isMatch ? 0.45 : 1,
                  display: 'flex', alignItems:'center', justifyContent:'center',
                  boxShadow: isSel ? '0 0 14px rgba(255,255,255,0.7)' : '0 2px 6px rgba(0,0,0,0.3)',
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                {v >= 0 ? ANIMALS[v].emoji : ''}
              </button>
            )
          }))}
        </div>
      </div>

      {/* Animal legend */}
      <div style={{ padding:'6px 16px 14px', display:'flex', justifyContent:'center', gap:6, flexWrap:'wrap' }}>
        {ANIMALS.map(a => (
          <span key={a.id} style={{
            background:'rgba(0,0,0,0.3)',
            border:`1px solid ${a.border}`,
            borderRadius:8, padding:'3px 8px',
            color:'white', fontSize:12,
          }}>
            {a.emoji} {a.name}
          </span>
        ))}
      </div>
    </div>
  )
}
