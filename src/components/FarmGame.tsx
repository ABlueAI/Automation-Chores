import { useEffect, useRef, useState, useCallback } from 'react'
import { ArrowLeft } from 'lucide-react'

interface Props {
  onBack: () => void
}

const W = 800
const H = 300
const GROUND = 248
const FARMER_X = 100
const FW = 32
const FH = 52
const GRAVITY = 0.65
const JUMP_FORCE = -15
const BASE_SPEED = 5

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
  g.addColorStop(0, '#87b5e8')
  g.addColorStop(0.55, '#b8d8f0')
  g.addColorStop(1, '#cde8a0')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

function drawClouds(ctx: CanvasRenderingContext2D, offset: number) {
  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  const defs = [{ bx: 80, y: 35, r: 22 }, { bx: 300, y: 22, r: 18 }, { bx: 560, y: 44, r: 26 }, { bx: 720, y: 28, r: 16 }]
  for (const d of defs) {
    const x = ((d.bx - offset * 0.25) % (W + 300) + W + 300) % (W + 300) - 80
    ctx.beginPath()
    ctx.arc(x, d.y + 12, d.r, 0, Math.PI * 2)
    ctx.arc(x + d.r * 1.1, d.y + 6, d.r * 1.3, 0, Math.PI * 2)
    ctx.arc(x + d.r * 2.4, d.y + 12, d.r * 0.9, 0, Math.PI * 2)
    ctx.arc(x + d.r * 0.5, d.y + 18, d.r * 0.8, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawHills(ctx: CanvasRenderingContext2D, offset: number) {
  ctx.fillStyle = '#8bc34a'
  ctx.beginPath()
  ctx.moveTo(0, H)
  for (let x = 0; x <= W; x += 4) {
    const y = GROUND - 28 - Math.sin((x + offset * 0.18) * 0.013) * 26 - Math.sin((x + offset * 0.18) * 0.031) * 10
    ctx.lineTo(x, y)
  }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill()

  ctx.fillStyle = '#6aa83a'
  ctx.beginPath()
  ctx.moveTo(0, H)
  for (let x = 0; x <= W; x += 4) {
    const y = GROUND - 10 - Math.sin((x + offset * 0.5) * 0.022) * 13
    ctx.lineTo(x, y)
  }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill()
}

function drawGround(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#4a8c2a'
  ctx.fillRect(0, GROUND, W, H - GROUND)
  ctx.fillStyle = '#5ea832'
  ctx.fillRect(0, GROUND, W, 5)
  ctx.fillStyle = '#2d5a18'
  ctx.fillRect(0, GROUND + 18, W, H - GROUND - 18)
}

function drawFarmer(ctx: CanvasRenderingContext2D, y: number, frame: number) {
  const x = FARMER_X
  const run = Math.sin(frame * 0.28)

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.13)'
  ctx.beginPath()
  ctx.ellipse(x + 16, GROUND + 3, 18, 4, 0, 0, Math.PI * 2)
  ctx.fill()

  // Legs
  ctx.fillStyle = '#2d5a87'
  ctx.fillRect(x + 8, y + 36 + run * 6, 7, 13)
  ctx.fillRect(x + 17, y + 36 - run * 6, 7, 13)
  // Boots
  ctx.fillStyle = '#5c3d1e'
  ctx.fillRect(x + 6, y + 47 + run * 6, 11, 6)
  ctx.fillRect(x + 15, y + 47 - run * 6, 11, 6)

  // Body
  ctx.fillStyle = '#4a90d9'
  ctx.fillRect(x + 7, y + 20, 18, 18)
  ctx.fillStyle = '#2563eb'
  ctx.fillRect(x + 10, y + 16, 12, 10)

  // Arms
  ctx.fillStyle = '#fdbcb4'
  ctx.fillRect(x + 1, y + 21 + run * 5, 6, 13)
  ctx.fillRect(x + 25, y + 21 - run * 5, 6, 13)

  // Head
  ctx.fillStyle = '#fdbcb4'
  ctx.beginPath()
  ctx.arc(x + 16, y + 13, 10, 0, Math.PI * 2)
  ctx.fill()
  // Eyes
  ctx.fillStyle = '#1f2937'
  ctx.beginPath(); ctx.arc(x + 12, y + 12, 2, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(x + 20, y + 12, 2, 0, Math.PI * 2); ctx.fill()
  // Smile
  ctx.strokeStyle = '#a0522d'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(x + 16, y + 15, 4, 0.2, Math.PI - 0.2); ctx.stroke()

  // Hat brim
  ctx.fillStyle = '#c8a44a'
  ctx.beginPath()
  ctx.ellipse(x + 16, y + 3, 17, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  // Hat top
  ctx.fillStyle = '#d4b660'
  ctx.fillRect(x + 9, y - 9, 14, 13)
  ctx.fillStyle = '#c8a44a'
  ctx.beginPath()
  ctx.ellipse(x + 16, y - 9, 7, 3, 0, 0, Math.PI * 2)
  ctx.fill()
  // Hat band
  ctx.fillStyle = '#8b6914'
  ctx.fillRect(x + 9, y + 2, 14, 3)
}

function drawHayBale(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const g = ctx.createLinearGradient(x, y, x + w, y)
  g.addColorStop(0, '#b8922a'); g.addColorStop(0.4, '#d4a84a'); g.addColorStop(1, '#a07820')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(x + 4, y); ctx.lineTo(x + w - 4, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + 4)
  ctx.lineTo(x + w, y + h - 4)
  ctx.quadraticCurveTo(x + w, y + h, x + w - 4, y + h)
  ctx.lineTo(x + 4, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - 4)
  ctx.lineTo(x, y + 4)
  ctx.quadraticCurveTo(x, y, x + 4, y)
  ctx.closePath(); ctx.fill()

  ctx.strokeStyle = 'rgba(80,50,0,0.28)'; ctx.lineWidth = 1.5
  for (let i = 1; i < 5; i++) {
    ctx.beginPath(); ctx.moveTo(x + 3, y + (h / 5) * i); ctx.lineTo(x + w - 3, y + (h / 5) * i); ctx.stroke()
  }
  ctx.strokeStyle = '#7c5a10'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(x + w * 0.35, y); ctx.lineTo(x + w * 0.35, y + h); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + w * 0.65, y); ctx.lineTo(x + w * 0.65, y + h); ctx.stroke()
  ctx.fillStyle = 'rgba(255,240,150,0.22)'
  ctx.fillRect(x + 5, y + 4, w * 0.22, h * 0.3)
}

function collides(fy: number, obs: Obstacle): boolean {
  const fx1 = FARMER_X + 7, fy1 = fy + 5
  const fx2 = FARMER_X + FW - 7, fy2 = fy + FH - 4
  const ox1 = obs.x + 5, oy1 = GROUND - obs.h + 2
  const ox2 = obs.x + obs.w - 5, oy2 = GROUND
  return fx2 > ox1 && fx1 < ox2 && fy2 > oy1 && fy1 < oy2
}

export default function FarmGame({ onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>()
  const g = useRef({
    running: false, over: false,
    score: 0, hiScore: parseInt(localStorage.getItem('farmHiScore') || '0'),
    speed: BASE_SPEED,
    fy: GROUND - FH, fvy: 0, grounded: true,
    obstacles: [] as Obstacle[],
    hillOff: 0, cloudOff: 0, frame: 0,
  })
  const [ui, setUi] = useState({ score: 0, over: false, started: false, hi: parseInt(localStorage.getItem('farmHiScore') || '0') })

  const action = useCallback(() => {
    const s = g.current
    if (!s.running) {
      Object.assign(s, { running: true, over: false, score: 0, speed: BASE_SPEED, fy: GROUND - FH, fvy: 0, grounded: true, obstacles: [], hillOff: 0, cloudOff: 0, frame: 0 })
      setUi(u => ({ ...u, started: true, over: false, score: 0 }))
    } else if (s.grounded) {
      s.fvy = JUMP_FORCE; s.grounded = false
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    function tick() {
      const s = g.current
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
          if (Math.floor(s.score) > s.hiScore) {
            s.hiScore = Math.floor(s.score)
            localStorage.setItem('farmHiScore', String(s.hiScore))
          }
          setUi(u => ({ ...u, over: true, score: Math.floor(s.score), hi: s.hiScore }))
        }
        if (s.frame % 6 === 0) setUi(u => ({ ...u, score: Math.floor(s.score) }))
      }

      drawSky(ctx)
      drawHills(ctx, s.hillOff)
      drawClouds(ctx, s.cloudOff)
      drawGround(ctx)
      for (const o of s.obstacles) drawHayBale(ctx, o.x, GROUND - o.h, o.w, o.h)
      drawFarmer(ctx, s.fy, s.running ? s.frame : 0)

      if (s.running || s.over) {
        ctx.fillStyle = 'rgba(0,0,0,0.32)'
        ctx.beginPath(); ctx.roundRect(W - 112, 8, 102, 30, 6); ctx.fill()
        ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'right'
        ctx.fillText(`${Math.floor(s.score)}m`, W - 14, 28)
      }

      if (!s.running && !s.over) {
        ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = '#fff'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('🌾 Farm Runner', W / 2, H / 2 - 26)
        ctx.font = '17px sans-serif'
        ctx.fillText('Press Space or Click to Start', W / 2, H / 2 + 12)
        ctx.fillStyle = '#fde68a'; ctx.font = '14px sans-serif'
        ctx.fillText(`Best: ${s.hiScore}m`, W / 2, H / 2 + 38)
      }

      if (s.over) {
        ctx.fillStyle = 'rgba(0,0,0,0.48)'; ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('Game Over!', W / 2, H / 2 - 28)
        ctx.font = '20px sans-serif'
        ctx.fillText(`Score: ${Math.floor(s.score)}m`, W / 2, H / 2 + 4)
        ctx.fillStyle = '#fde68a'; ctx.font = '15px sans-serif'
        ctx.fillText(`Best: ${s.hiScore}m`, W / 2, H / 2 + 28)
        ctx.fillStyle = '#fff'; ctx.font = '15px sans-serif'
        ctx.fillText('Space or Click to Restart', W / 2, H / 2 + 54)
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    tick()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); action() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [action])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', background: '#1a2a1a', padding: '20px 16px' }}>
      <div style={{ width: '100%', maxWidth: '840px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '14px' }}>
            <ArrowLeft size={16} /> Back to Farm
          </button>
          <h2 style={{ color: 'white', margin: 0, fontSize: '20px' }}>🌾 Farm Runner</h2>
          <div style={{ color: '#fde68a', fontWeight: 700, fontSize: '14px' }}>Best: {ui.hi}m</div>
        </div>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onClick={action}
          style={{ width: '100%', borderRadius: '12px', cursor: 'pointer', display: 'block', border: '2px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
        />
        {(ui.started && !ui.over) && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginTop: '10px' }}>
            Space or Click to jump — avoid the hay bales!
          </div>
        )}
      </div>
    </div>
  )
}
