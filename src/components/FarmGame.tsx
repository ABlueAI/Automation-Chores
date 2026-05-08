import { useEffect, useRef, useState, useCallback } from 'react'
import { ArrowLeft } from 'lucide-react'
import { pickFood, type FoodDef } from '../utils/farmUtils'

interface Props {
  onBack: () => void
  onEarnFood: (food: FoodDef) => void
}

const W = 800, H = 300, GROUND = 248
const FARMER_X = 100, FW = 32, FH = 52
const GRAVITY = 0.65, JUMP_FORCE = -15, BASE_SPEED = 5

interface Obstacle { x: number; w: number; h: number }

function spawnObstacle(obstacles: Obstacle[]) {
  const last = obstacles[obstacles.length - 1]
  const gap = 320 + Math.random() * 200
  const startX = last ? last.x + last.w + gap : W + 120 + Math.random() * 150
  const configs = [{ w: 48, h: 36 }, { w: 62, h: 48 }, { w: 36, h: 28 }]
  const cfg = configs[Math.floor(Math.random() * configs.length)]
  obstacles.push({ x: startX, ...cfg })
}

function drawSky(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#87b5e8'); g.addColorStop(0.55, '#b8d8f0'); g.addColorStop(1, '#cde8a0')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
}

function drawClouds(ctx: CanvasRenderingContext2D, offset: number) {
  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  for (const d of [{ bx: 80, y: 35, r: 22 }, { bx: 300, y: 22, r: 18 }, { bx: 560, y: 44, r: 26 }, { bx: 720, y: 28, r: 16 }]) {
    const x = ((d.bx - offset * 0.25) % (W + 300) + W + 300) % (W + 300) - 80
    ctx.beginPath()
    ctx.arc(x, d.y + 12, d.r, 0, Math.PI * 2)
    ctx.arc(x + d.r * 1.1, d.y + 6, d.r * 1.3, 0, Math.PI * 2)
    ctx.arc(x + d.r * 2.4, d.y + 12, d.r * 0.9, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawHills(ctx: CanvasRenderingContext2D, offset: number) {
  ctx.fillStyle = '#8bc34a'; ctx.beginPath(); ctx.moveTo(0, H)
  for (let x = 0; x <= W; x += 4) ctx.lineTo(x, GROUND - 28 - Math.sin((x + offset * 0.18) * 0.013) * 26 - Math.sin((x + offset * 0.18) * 0.031) * 10)
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill()
  ctx.fillStyle = '#6aa83a'; ctx.beginPath(); ctx.moveTo(0, H)
  for (let x = 0; x <= W; x += 4) ctx.lineTo(x, GROUND - 10 - Math.sin((x + offset * 0.5) * 0.022) * 13)
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill()
}

function drawGround(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#4a8c2a'; ctx.fillRect(0, GROUND, W, H - GROUND)
  ctx.fillStyle = '#5ea832'; ctx.fillRect(0, GROUND, W, 5)
  ctx.fillStyle = '#2d5a18'; ctx.fillRect(0, GROUND + 18, W, H - GROUND - 18)
}

function drawFarmer(ctx: CanvasRenderingContext2D, y: number, frame: number) {
  const x = FARMER_X, run = Math.sin(frame * 0.28)
  ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.beginPath(); ctx.ellipse(x + 16, GROUND + 3, 18, 4, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#2d5a87'; ctx.fillRect(x + 8, y + 36 + run * 6, 7, 13); ctx.fillRect(x + 17, y + 36 - run * 6, 7, 13)
  ctx.fillStyle = '#5c3d1e'; ctx.fillRect(x + 6, y + 47 + run * 6, 11, 6); ctx.fillRect(x + 15, y + 47 - run * 6, 11, 6)
  ctx.fillStyle = '#4a90d9'; ctx.fillRect(x + 7, y + 20, 18, 18)
  ctx.fillStyle = '#2563eb'; ctx.fillRect(x + 10, y + 16, 12, 10)
  ctx.fillStyle = '#fdbcb4'; ctx.fillRect(x + 1, y + 21 + run * 5, 6, 13); ctx.fillRect(x + 25, y + 21 - run * 5, 6, 13)
  ctx.fillStyle = '#fdbcb4'; ctx.beginPath(); ctx.arc(x + 16, y + 13, 10, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#1f2937'
  ctx.beginPath(); ctx.arc(x + 12, y + 12, 2, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(x + 20, y + 12, 2, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = '#a0522d'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + 16, y + 15, 4, 0.2, Math.PI - 0.2); ctx.stroke()
  ctx.fillStyle = '#c8a44a'; ctx.beginPath(); ctx.ellipse(x + 16, y + 3, 17, 4, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#d4b660'; ctx.fillRect(x + 9, y - 9, 14, 13)
  ctx.fillStyle = '#c8a44a'; ctx.beginPath(); ctx.ellipse(x + 16, y - 9, 7, 3, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#8b6914'; ctx.fillRect(x + 9, y + 2, 14, 3)
}

function drawHayBale(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const g = ctx.createLinearGradient(x, y, x + w, y)
  g.addColorStop(0, '#b8922a'); g.addColorStop(0.4, '#d4a84a'); g.addColorStop(1, '#a07820')
  ctx.fillStyle = g
  ctx.beginPath(); ctx.moveTo(x + 4, y); ctx.lineTo(x + w - 4, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + 4); ctx.lineTo(x + w, y + h - 4)
  ctx.quadraticCurveTo(x + w, y + h, x + w - 4, y + h); ctx.lineTo(x + 4, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - 4); ctx.lineTo(x, y + 4)
  ctx.quadraticCurveTo(x, y, x + 4, y); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = 'rgba(80,50,0,0.28)'; ctx.lineWidth = 1.5
  for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x + 3, y + (h / 5) * i); ctx.lineTo(x + w - 3, y + (h / 5) * i); ctx.stroke() }
  ctx.strokeStyle = '#7c5a10'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(x + w * 0.35, y); ctx.lineTo(x + w * 0.35, y + h); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + w * 0.65, y); ctx.lineTo(x + w * 0.65, y + h); ctx.stroke()
  ctx.fillStyle = 'rgba(255,240,150,0.22)'; ctx.fillRect(x + 5, y + 4, w * 0.22, h * 0.3)
}

function collides(fy: number, obs: Obstacle) {
  return (FARMER_X + FW - 7) > (obs.x + 5) && (FARMER_X + 7) < (obs.x + obs.w - 5) &&
    (fy + FH - 4) > (GROUND - obs.h + 2) && (fy + 5) < GROUND
}

export default function FarmGame({ onBack, onEarnFood }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>()
  const gs = useRef({
    running: false, over: false,
    score: 0, hiScore: parseInt(localStorage.getItem('farmHiScore') || '0'),
    speed: BASE_SPEED, fy: GROUND - FH, fvy: 0, grounded: true,
    obstacles: [] as Obstacle[], hillOff: 0, cloudOff: 0, frame: 0,
  })
  const [phase, setPhase] = useState<'idle' | 'playing' | 'reveal'>('idle')
  const [finalScore, setFinalScore] = useState(0)
  const [earnedFood, setEarnedFood] = useState<FoodDef | null>(null)
  const [hiScore, setHiScore] = useState(parseInt(localStorage.getItem('farmHiScore') || '0'))
  const [, setLiveScore] = useState(0)
  const [showFood, setShowFood] = useState(false)

  const startOrJump = useCallback(() => {
    const s = gs.current
    if (s.over || !s.running) {
      Object.assign(s, { running: true, over: false, score: 0, speed: BASE_SPEED, fy: GROUND - FH, fvy: 0, grounded: true, obstacles: [], hillOff: 0, cloudOff: 0, frame: 0 })
      setPhase('playing'); setLiveScore(0); setShowFood(false); setEarnedFood(null)
    } else if (s.grounded) {
      s.fvy = JUMP_FORCE; s.grounded = false
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    function tick() {
      const s = gs.current
      if (s.running && !s.over) {
        s.frame++
        s.score += s.speed * 0.02
        s.speed = Math.min(BASE_SPEED + s.score * 0.012, 20)
        s.hillOff += s.speed; s.cloudOff += s.speed * 0.35
        s.fvy += GRAVITY; s.fy += s.fvy
        if (s.fy >= GROUND - FH) { s.fy = GROUND - FH; s.fvy = 0; s.grounded = true }
        s.obstacles = s.obstacles.filter(o => o.x > -200).map(o => ({ ...o, x: o.x - s.speed }))
        while (s.obstacles.length < 3) spawnObstacle(s.obstacles)
        if (s.obstacles.some(o => collides(s.fy, o))) {
          s.over = true; s.running = false
          const score = Math.floor(s.score)
          if (score > s.hiScore) { s.hiScore = score; localStorage.setItem('farmHiScore', String(score)); setHiScore(score) }
          const food = pickFood(score)
          onEarnFood(food)
          setFinalScore(score); setEarnedFood(food); setPhase('reveal')
          setTimeout(() => setShowFood(true), 900)
        }
        if (s.frame % 6 === 0) setLiveScore(Math.floor(s.score))
      }
      drawSky(ctx); drawHills(ctx, s.hillOff); drawClouds(ctx, s.cloudOff); drawGround(ctx)
      for (const o of s.obstacles) drawHayBale(ctx, o.x, GROUND - o.h, o.w, o.h)
      drawFarmer(ctx, s.fy, s.running ? s.frame : 0)
      if (s.running) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.roundRect(W - 112, 8, 102, 30, 6); ctx.fill()
        ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'right'
        ctx.fillText(`${Math.floor(s.score)}m`, W - 14, 28)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    tick()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [onEarnFood])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); if (phase !== 'reveal') startOrJump() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [startOrJump, phase])

  const rarityStyle: Record<string, { border: string; bg: string; shadow: string }> = {
    common:    { border: '#9ca3af', bg: 'linear-gradient(135deg,#f9fafb,#f3f4f6)', shadow: '0 0 20px rgba(156,163,175,0.3)' },
    uncommon:  { border: '#22c55e', bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', shadow: '0 0 24px rgba(34,197,94,0.4)' },
    rare:      { border: '#3b82f6', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', shadow: '0 0 28px rgba(59,130,246,0.5)' },
    epic:      { border: '#8b5cf6', bg: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', shadow: '0 0 32px rgba(139,92,246,0.6)' },
    legendary: { border: '#f59e0b', bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)', shadow: '0 0 40px rgba(245,158,11,0.7), 0 0 80px rgba(245,158,11,0.3)' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', background: '#1a2a1a', padding: '20px 16px' }}>
      <div style={{ width: '100%', maxWidth: '840px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '14px' }}>
            <ArrowLeft size={16} /> Back to Farm
          </button>
          <h2 style={{ color: 'white', margin: 0, fontSize: '20px' }}>🌾 Farm Runner</h2>
          <div style={{ color: '#fde68a', fontWeight: 700, fontSize: '14px' }}>Best: {hiScore}m</div>
        </div>

        <div style={{ position: 'relative' }}>
          <canvas ref={canvasRef} width={W} height={H} onClick={() => { if (phase !== 'reveal') startOrJump() }}
            style={{ width: '100%', borderRadius: '12px', cursor: 'pointer', display: 'block', border: '2px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
          />

          {/* Start overlay */}
          {phase === 'idle' && (
            <div onClick={startOrJump} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.42)', borderRadius: '10px', cursor: 'pointer', gap: '10px' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>🌾 Farm Runner</div>
              <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)' }}>Click or press Space to start</div>
              <div style={{ fontSize: '13px', color: '#fde68a' }}>Earn food for your cats! 🐾</div>
              {hiScore > 0 && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Best: {hiScore}m</div>}
            </div>
          )}

          {/* Score while playing */}
          {phase === 'playing' && (
            <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.0)', pointerEvents: 'none' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textAlign: 'right' }}>Jump: Space / Click</div>
            </div>
          )}

          {/* Food reveal overlay */}
          {phase === 'reveal' && earnedFood && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', borderRadius: '10px', gap: '6px' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'white', marginBottom: '2px' }}>Game Over!</div>
              <div style={{ fontSize: '16px', color: '#fde68a' }}>You ran <strong>{finalScore}m</strong></div>

              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                {finalScore >= 450 ? '⭐ Amazing run! Look what you earned...' :
                 finalScore >= 300 ? '🔥 Great distance! You earned...' :
                 finalScore >= 150 ? '💪 Solid run! You earned...' :
                 finalScore >= 50  ? '👍 Not bad! You earned...' :
                 '🌱 Keep practicing! You earned...'}
              </div>

              {!showFood ? (
                <div style={{ fontSize: '42px', animation: 'spin 0.8s linear infinite' }}>🎁</div>
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                  padding: '18px 28px', borderRadius: '14px',
                  border: `2px solid ${earnedFood.color}`,
                  background: rarityStyle[earnedFood.rarity].bg,
                  boxShadow: rarityStyle[earnedFood.rarity].shadow,
                  animation: 'foodReveal 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                }}>
                  <div style={{ fontSize: '48px', lineHeight: 1 }}>{earnedFood.emoji}</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#111' }}>
                    {earnedFood.name} <span style={{ fontSize: '14px', fontWeight: 600, color: '#555' }}>({earnedFood.nameEs})</span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: earnedFood.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{earnedFood.rarityLabel}</div>
                  <div style={{ fontSize: '12px', color: '#555', textAlign: 'center', maxWidth: '180px' }}>{earnedFood.description}</div>
                  <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
                    Feeds a cat for {earnedFood.feedHours >= 168 ? '1 week 🌟' : earnedFood.feedHours >= 24 ? `${Math.round(earnedFood.feedHours / 24)}d` : `${earnedFood.feedHours}h`}
                  </div>
                </div>
              )}

              {showFood && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button onClick={startOrJump} style={{ padding: '8px 18px', background: '#4a8c2a', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                    Play Again
                  </button>
                  <button onClick={onBack} style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', color: 'white', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                    Back to Farm
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {phase === 'playing' && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '10px' }}>
            Avoid the hay bales! 🌾 Better scores earn rarer food for your cats.
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes foodReveal { from { transform: scale(0.3) rotate(-10deg); opacity: 0; } to { transform: scale(1) rotate(0deg); opacity: 1; } }
      `}</style>
    </div>
  )
}
