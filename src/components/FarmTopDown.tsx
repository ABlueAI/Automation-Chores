import { useEffect, useRef, useState, useCallback } from 'react'
import { ArrowLeft, Gamepad2 } from 'lucide-react'
import { bestFoodInInventory, FOODS } from '../utils/farmUtils'

// ─── Constants ────────────────────────────────────────────────────────────────
const TS = 32
const MW = 75, MH = 75
const CW = 832, CH = 576
const ZOOM = 0.5
const VW = Math.round(CW / ZOOM)   // 1664 — world pixels visible horizontally
const VH = Math.round(CH / ZOOM)   // 1152 — world pixels visible vertically

const BARN_TX = 26, BARN_TY = 25, BARN_TW = 22, BARN_TH = 18
const BARN_CX = BARN_TX + BARN_TW / 2   // barn center tile X
const BARN_BOT = BARN_TY + BARN_TH      // barn bottom tile row

const WATER_TX = 30, WATER_TY = 51
const FOOD_TX  = 40, FOOD_TY  = 51
const ARCADE_TX = 50, ARCADE_TY = 50

const WILLOW_TX = 50, WILLOW_TY = 20   // weeping willow — right side of barn

const FARMER_SPEED = 5   // tiles/sec
const CAT_SPEED    = 1.4 // tiles/sec
const S = 10             // pixel art scale (1 art-px = 10 canvas-px)

const SIGN_DEADLINE = new Date('2026-05-16T00:00:00').getTime()  // 6 days from May 10

// ─── Types ────────────────────────────────────────────────────────────────────
type Dir = 'down' | 'up' | 'left' | 'right'
type CatAnim = 'idle' | 'walk' | 'sleep' | 'drink' | 'eat'
type CatId = 'alco' | 'link'

interface Vec2 { x: number; y: number }

interface FarmerState {
  pos: Vec2; target: Vec2
  dir: Dir; frame: number; moving: boolean
}

interface CatState {
  id: CatId
  pos: Vec2; target: Vec2
  dir: Dir; anim: CatAnim
  frame: number; animTimer: number; stateTimer: number
  love: number          // 0‥3
  followUntil: number   // epoch ms, 0 = not following
  fedUntil: number      // epoch ms, stacking satisfaction
  chatTimer: number     // ms to show chat bubble
  asleep: boolean
}

interface GameState {
  farmer: FarmerState
  cats: CatState[]
  cam: Vec2
  map: Uint8Array
  foodBowlFood: string | null  // food id in bowl
  frame: number
  lastMs: number
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onBack: () => void
  onLaunchRunner: () => void
  inventory: Record<string, number>
  onFeedCat: (id: CatId, foodId: string) => void
  onFillBowl: (foodId: string) => void
}

// ─── Tile IDs ─────────────────────────────────────────────────────────────────
const T_GRASS  = 0
const T_FLOWER = 1
const T_DIRT   = 2
const T_FENCE  = 3
const T_BARN   = 4
const T_TREE   = 5
const WALKABLE = new Set([T_GRASS, T_FLOWER, T_DIRT])

const FARMER_HW = 28   // farmer collision half-width (world px)
const FARMER_HH = 10   // farmer collision half-height (world px, around feet)
const CAT_HW    = 14
const CAT_HH    = 8

function walkablePt(map: Uint8Array, wx: number, wy: number): boolean {
  const tx = Math.floor(wx / TS), ty = Math.floor(wy / TS)
  return tx >= 0 && tx < MW && ty >= 0 && ty < MH && WALKABLE.has(map[ty*MW+tx])
}
function canMoveTo(map: Uint8Array, cx: number, cy: number, hw: number, hh: number): boolean {
  return walkablePt(map, cx-hw, cy-hh) && walkablePt(map, cx+hw, cy-hh) &&
         walkablePt(map, cx-hw, cy+hh) && walkablePt(map, cx+hw, cy+hh)
}

// ─── Map generation (stable via deterministic hash) ──────────────────────────
let _mapCache: Uint8Array | null = null
function buildMap(): Uint8Array {
  if (_mapCache && _mapCache.length === MW * MH) return _mapCache
  const m = new Uint8Array(MW * MH).fill(T_GRASS)

  // Flowers (deterministic scatter)
  for (let i = 0; i < MW * MH; i++) {
    const h = ((i * 2654435761 + 1013904223) >>> 0)
    if (h < 0x1D000000) m[i] = T_FLOWER
  }

  // Perimeter fence
  for (let x = 0; x < MW; x++) { m[x] = T_FENCE; m[(MH-1)*MW+x] = T_FENCE }
  for (let y = 0; y < MH; y++) { m[y*MW] = T_FENCE; m[y*MW+MW-1] = T_FENCE }

  // Barn (impassable)
  for (let ty = BARN_TY; ty < BARN_TY+BARN_TH; ty++)
    for (let tx = BARN_TX; tx < BARN_TX+BARN_TW; tx++)
      m[ty*MW+tx] = T_BARN

  // Willow trunk (impassable — tripled size, right of barn)
  for (let ty = WILLOW_TY+14; ty < WILLOW_TY+21; ty++)
    for (let tx = WILLOW_TX+3; tx < WILLOW_TX+9; tx++)
      if (ty >= 1 && ty < MH-1 && tx >= 1 && tx < MW-1) m[ty*MW+tx] = T_TREE

  // Dirt path ring around barn
  for (let ty = BARN_TY-4; ty < BARN_BOT+4; ty++) {
    for (let tx = BARN_TX-4; tx < BARN_TX+BARN_TW+4; tx++) {
      if (ty < 1 || ty >= MH-1 || tx < 1 || tx >= MW-1) continue
      const inside = ty >= BARN_TY && ty < BARN_BOT && tx >= BARN_TX && tx < BARN_TX+BARN_TW
      if (!inside && (m[ty*MW+tx] === T_GRASS || m[ty*MW+tx] === T_FLOWER))
        m[ty*MW+tx] = T_DIRT
    }
  }

  // Flatten spots near objects
  for (const [ox,oy] of [[WATER_TX,WATER_TY],[FOOD_TX,FOOD_TY],[ARCADE_TX,ARCADE_TY]]) {
    for (let dy = -1; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const ti = (oy+dy)*MW+(ox+dx)
      if (ti >= 0 && ti < m.length && (m[ti] === T_GRASS || m[ti] === T_FLOWER)) m[ti] = T_DIRT
    }
  }

  _mapCache = m
  return m
}

// ─── Persistence ─────────────────────────────────────────────────────────────
const LOVE_KEY = 'farmCatLove2'
interface StoredLove { love: number; fedUntil: number; followUntil: number; lastVisit: number }
function loadLove(id: CatId): StoredLove {
  try {
    const raw = JSON.parse(localStorage.getItem(LOVE_KEY) || '{}')
    const d = raw[id] as StoredLove | undefined
    if (!d) return { love: 0, fedUntil: 0, followUntil: 0, lastVisit: Date.now() }
    // decay if no visit in 7 days
    if (Date.now() - d.lastVisit > 7*86400000) d.love = Math.max(0, d.love - 1)
    return d
  } catch { return { love: 0, fedUntil: 0, followUntil: 0, lastVisit: Date.now() } }
}
function saveLove(id: CatId, data: Partial<StoredLove>) {
  try {
    const raw = JSON.parse(localStorage.getItem(LOVE_KEY) || '{}')
    raw[id] = { ...(raw[id] || {}), ...data, lastVisit: Date.now() }
    localStorage.setItem(LOVE_KEY, JSON.stringify(raw))
  } catch { /* ignore */ }
}

// ─── Init helpers ─────────────────────────────────────────────────────────────
function initCat(id: CatId): CatState {
  const stored = loadLove(id)
  const startX = id === 'alco' ? BARN_TX - 1 : BARN_TX + BARN_TW
  return {
    id, pos: { x: (startX + 0.5)*TS, y: (BARN_BOT + 2)*TS },
    target: { x: (startX + 0.5)*TS, y: (BARN_BOT + 2)*TS },
    dir: 'down', anim: Math.random() < 0.7 ? 'sleep' : 'idle',
    frame: 0, animTimer: 0,
    stateTimer: Math.random() < 0.7 ? 8000 : 2000 + Math.random()*3000,
    love: stored.love, followUntil: stored.followUntil,
    fedUntil: stored.fedUntil, chatTimer: 0, asleep: Math.random() < 0.7,
  }
}

// ─── Tile drawing ─────────────────────────────────────────────────────────────
const GRASS_VARIANTS = ['#52a827','#58b02e','#5cb833','#54ae29']
const DIRT_VARIANTS  = ['#9b7a40','#906e36','#a08244','#987444']

function drawTile(ctx: CanvasRenderingContext2D, tile: number, sx: number, sy: number, idx: number) {
  if (tile === T_GRASS || tile === T_FLOWER) {
    ctx.fillStyle = GRASS_VARIANTS[idx & 3]
    ctx.fillRect(sx, sy, TS, TS)
    if (tile === T_FLOWER) {
      const ox = (idx * 7 + 5) % 20 + 4
      const oy = (idx * 13 + 3) % 20 + 4
      ctx.fillStyle = (idx & 1) ? '#fbbf24' : '#f472b6'
      ctx.fillRect(sx+ox, sy+oy, 4, 4)
      ctx.fillStyle = '#fff'
      ctx.fillRect(sx+ox+1, sy+oy-2, 2, 2)
      ctx.fillRect(sx+ox+1, sy+oy+4, 2, 2)
      ctx.fillRect(sx+ox-2, sy+oy+1, 2, 2)
      ctx.fillRect(sx+ox+4, sy+oy+1, 2, 2)
    }
  } else if (tile === T_DIRT) {
    ctx.fillStyle = DIRT_VARIANTS[idx & 3]
    ctx.fillRect(sx, sy, TS, TS)
    if ((idx * 17) % 11 === 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.fillRect(sx + (idx*9)%22+4, sy + (idx*5)%22+4, 3, 2)
    }
  } else if (tile === T_FENCE) {
    ctx.fillStyle = GRASS_VARIANTS[idx & 3]
    ctx.fillRect(sx, sy, TS, TS)
    ctx.fillStyle = '#f0f0e8'
    ctx.fillRect(sx+4,  sy,   6, TS)
    ctx.fillRect(sx+22, sy,   6, TS)
    ctx.fillRect(sx,    sy+8, TS, 5)
    ctx.fillRect(sx,    sy+20, TS, 5)
    ctx.fillStyle = '#d8d8cc'
    ctx.fillRect(sx+5,  sy, 4, 5)
    ctx.fillRect(sx+23, sy, 4, 5)
  }
}

// ─── Barn drawing ─────────────────────────────────────────────────────────────
function drawBarn(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
  const bx = BARN_TX*TS - camX
  const by = BARN_TY*TS - camY
  const bw = BARN_TW*TS
  const bh = BARN_TH*TS

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)'
  ctx.fillRect(bx+8, by+8, bw, bh)

  // ── Roof (gambrel arch suggestion, gray-brown) ────────────────────────────
  const roofH = Math.round(bh * 0.6)

  // Base roof fill
  ctx.fillStyle = '#6b6858'
  ctx.fillRect(bx, by, bw, roofH)
  // Gambrel arch: stepped layers give arch/gable silhouette
  ctx.fillStyle = '#7a786a'
  ctx.fillRect(bx+16, by, bw-32, Math.round(roofH*0.45))
  ctx.fillStyle = '#888075'
  ctx.fillRect(bx+36, by, bw-72, Math.round(roofH*0.2))

  // Horizontal roof plank lines
  ctx.fillStyle = 'rgba(0,0,0,0.13)'
  for (let i = 1; i < 12; i++) ctx.fillRect(bx, by + Math.round(i*roofH/12), bw, 2)

  // Ridge cap
  ctx.fillStyle = '#4a4840'
  ctx.fillRect(bx+20, by, bw-40, 6)
  ctx.fillRect(bx+36, by, bw-72, 4)

  // Sheen strip
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  ctx.fillRect(bx+40, by+6, bw-80, Math.round(roofH*0.38))

  // ── Walls (warm red-orange wood planks) ───────────────────────────────────
  const wallY = by + roofH
  const wallH = bh - roofH

  ctx.fillStyle = '#b84020'
  ctx.fillRect(bx, wallY, bw, wallH)

  // Horizontal plank lines
  ctx.fillStyle = '#a03818'
  for (let i = 0; i < 10; i++) ctx.fillRect(bx, wallY + Math.round(i*wallH/10), bw, 2)

  // Corner trim (darker vertical strips)
  const TRIM = 10
  ctx.fillStyle = '#8c2e14'
  ctx.fillRect(bx, wallY, TRIM, wallH)
  ctx.fillRect(bx+bw-TRIM, wallY, TRIM, wallH)

  // Top wall trim (cream band separating roof from wall)
  ctx.fillStyle = '#e8d4a0'
  ctx.fillRect(bx, wallY, bw, 5)

  // ── Windows (cream frame, blue glass) ────────────────────────────────────
  const winW = 42, winH = 32
  const winY = wallY + 10
  for (const wox of [bx+TRIM+18, bx+bw-TRIM-18-winW]) {
    ctx.fillStyle = '#e8d4a0'; ctx.fillRect(wox-4, winY-4, winW+8, winH+8)
    ctx.fillStyle = '#7cb8d4'; ctx.fillRect(wox, winY, winW, winH)
    ctx.fillStyle = '#e8d4a0'
    ctx.fillRect(wox+winW/2-2, winY, 4, winH)
    ctx.fillRect(wox, winY+winH/2-2, winW, 4)
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(wox+2, winY+2, 10, 7)
  }

  // ── Large sliding door with X bracing (center) ────────────────────────────
  const dw = Math.round(bw*0.38)
  const dh = wallH - 8
  const dx = bx + Math.round(bw/2 - dw/2), dy = wallY + 4

  // Cream door frame
  ctx.fillStyle = '#e8d4a0'; ctx.fillRect(dx-6, dy-4, dw+12, dh+6)

  // Door panel (warm wood)
  ctx.fillStyle = '#c87840'; ctx.fillRect(dx, dy, dw, dh)

  // Vertical board lines
  ctx.fillStyle = '#a86030'
  for (let i = 1; i < 6; i++) ctx.fillRect(dx + Math.round(i*dw/6), dy, 2, dh)

  // X bracing (diagonal lines — canvas path, not fillRect)
  ctx.save()
  ctx.strokeStyle = '#7a4420'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx+dw, dy+dh); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(dx+dw, dy); ctx.lineTo(dx, dy+dh); ctx.stroke()
  ctx.restore()

  // Door pull handle
  ctx.fillStyle = '#d4a060'; ctx.fillRect(dx+dw-14, dy+Math.round(dh/2)-6, 10, 12)
  ctx.fillStyle = '#a87840'; ctx.fillRect(dx+dw-12, dy+Math.round(dh/2)-4, 6, 8)

  // ── Crooked sign ON the barn door ─────────────────────────────────────────
  const signCX = dx + dw/2, signCY = dy + dh/2 - 10
  ctx.save()
  ctx.translate(signCX, signCY)
  ctx.rotate(-0.13)

  ctx.fillStyle = '#c8a44a'; ctx.fillRect(-52, -18, 104, 36)
  ctx.fillStyle = '#b8943a'
  ctx.fillRect(-52, -4, 104, 3)
  ctx.fillRect(-52, 4, 104, 3)

  ctx.fillStyle = '#8b6914'
  ctx.fillRect(-52, -18, 104, 3); ctx.fillRect(-52, 15, 104, 3)
  ctx.fillRect(-52, -18, 3, 36); ctx.fillRect(49, -18, 3, 36)

  ctx.fillStyle = '#5c3d0e'
  for (const [nx, ny] of [[-46,-13],[44,-13],[-46,10],[44,10]]) {
    ctx.fillRect(nx, ny, 4, 4)
  }

  ctx.fillStyle = '#3d2008'
  ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'
  ctx.fillText('✦ MORE TO COME ✦', 0, -4)
  const ms = SIGN_DEADLINE - Date.now()
  const days = Math.max(0, Math.ceil(ms / 86400000))
  ctx.font = '8px monospace'
  ctx.fillText(ms > 0 ? `${days} days remaining` : 'Opening soon!', 0, 11)
  ctx.restore()

  // ── Weather vane ──────────────────────────────────────────────────────────
  const wvx = bx + bw/2
  ctx.fillStyle = '#78716c'; ctx.fillRect(wvx-2, by+2, 4, 24); ctx.fillRect(wvx-16, by+10, 32, 4)
  ctx.fillStyle = '#a8a29e'; ctx.fillRect(wvx-14, by+8, 12, 8); ctx.fillRect(wvx+2, by+8, 12, 8)
  ctx.fillStyle = '#fbbf24'; ctx.fillRect(wvx-2, by, 4, 5)
}

// ─── Object drawing ───────────────────────────────────────────────────────────
function drawWaterBowl(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const k = 3   // scale-up factor (was ~32px, now ~96px wide)
  // Label above
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText('💧 Water', sx+12*k, sy+4)
  // Stand legs
  ctx.fillStyle = '#374151'
  ctx.fillRect(sx+2*k, sy+22*k, 4*k, 10*k)
  ctx.fillRect(sx+18*k, sy+22*k, 4*k, 10*k)
  // Bowl outer
  ctx.fillStyle = '#4b5563'
  ctx.fillRect(sx, sy+10*k, 24*k, 14*k)
  ctx.fillRect(sx+1*k, sy+9*k, 22*k, 3*k)  // rim
  // Water fill
  ctx.fillStyle = '#1d4ed8'
  ctx.fillRect(sx+2*k, sy+12*k, 20*k, 10*k)
  // Shimmer
  ctx.fillStyle = '#93c5fd'
  ctx.fillRect(sx+3*k, sy+13*k, 7*k, 3*k)
  ctx.fillRect(sx+14*k, sy+15*k, 4*k, 2*k)
  // Base
  ctx.fillStyle = '#6b7280'
  ctx.fillRect(sx-1*k, sy+30*k, 26*k, 4*k)
}

function drawFoodBowl(ctx: CanvasRenderingContext2D, sx: number, sy: number, foodId: string | null) {
  const k = 3
  const food = foodId ? FOODS.find(f => f.id === foodId) : null
  // Label above
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText('🍽️ Food', sx+12*k, sy+4)
  // Stand legs
  ctx.fillStyle = '#374151'
  ctx.fillRect(sx+2*k, sy+22*k, 4*k, 10*k)
  ctx.fillRect(sx+18*k, sy+22*k, 4*k, 10*k)
  // Bowl outer
  ctx.fillStyle = '#4b5563'
  ctx.fillRect(sx, sy+10*k, 24*k, 14*k)
  ctx.fillRect(sx+1*k, sy+9*k, 22*k, 3*k)
  // Fill (food or empty)
  if (food) {
    ctx.fillStyle = food.bgColor
    ctx.fillRect(sx+2*k, sy+12*k, 20*k, 10*k)
    ctx.fillStyle = '#f0e0a0'; ctx.fillRect(sx+3*k, sy+13*k, 5*k, 3*k)
    ctx.font = '26px serif'; ctx.textAlign = 'center'
    ctx.fillText(food.emoji, sx+12*k, sy+10*k)
  } else {
    ctx.fillStyle = '#2d3748'; ctx.fillRect(sx+2*k, sy+12*k, 20*k, 10*k)
  }
  // Base
  ctx.fillStyle = '#6b7280'
  ctx.fillRect(sx-1*k, sy+30*k, 26*k, 4*k)
}

function drawArcade(ctx: CanvasRenderingContext2D, sx: number, sy: number, frame: number) {
  const k = 2.8 | 0   // scale factor — 2 gives ~64px wide cabinet
  // Label above
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText('🕹️ Arcade', sx+15*k, sy+4)
  // Cabinet body
  ctx.fillStyle = '#1e293b'; ctx.fillRect(sx+2*k, sy+6*k, 26*k, 36*k)
  // Cabinet top curve suggestion
  ctx.fillStyle = '#0f172a'; ctx.fillRect(sx+3*k, sy+6*k, 24*k, 4*k)
  // Screen bezel
  ctx.fillStyle = '#0f172a'; ctx.fillRect(sx+4*k, sy+10*k, 22*k, 16*k)
  // Screen glow (green like a retro game)
  ctx.fillStyle = '#14532d'; ctx.fillRect(sx+5*k, sy+11*k, 20*k, 14*k)
  ctx.fillStyle = '#16a34a'; ctx.fillRect(sx+6*k, sy+12*k, 18*k, 12*k)
  // Screen content (animated pixel blobs = game)
  ctx.fillStyle = '#4ade80'
  ctx.fillRect(sx+7*k, sy+13*k, 3*k, 3*k)
  ctx.fillRect(sx+12*k, sy+15*k, 2*k, 2*k)
  ctx.fillRect(sx+18*k, sy+13*k, 3*k, 3*k)
  if (frame % 60 < 30) {
    ctx.fillStyle = '#86efac'
    ctx.fillRect(sx+10*k, sy+14*k, 5*k, 2*k)
    ctx.fillRect(sx+7*k, sy+17*k, 2*k, 2*k)
    ctx.fillRect(sx+17*k, sy+17*k, 2*k, 2*k)
  }
  // Marquee banner
  ctx.fillStyle = '#fbbf24'; ctx.fillRect(sx+4*k, sy+27*k, 22*k, 5*k)
  ctx.fillStyle = '#1e293b'; ctx.font = `${6*k}px monospace`; ctx.textAlign = 'center'
  ctx.fillText('CRUSH', sx+15*k, sy+31*k)
  // Control panel
  ctx.fillStyle = '#334155'; ctx.fillRect(sx+2*k, sy+32*k, 26*k, 8*k)
  // Joystick
  ctx.fillStyle = '#1e293b'; ctx.fillRect(sx+5*k, sy+33*k, 4*k, 4*k)
  ctx.fillStyle = '#64748b'; ctx.fillRect(sx+6*k, sy+32*k, 2*k, 6*k)
  // Buttons (3 colors)
  ctx.fillStyle = '#ef4444'; ctx.fillRect(sx+13*k, sy+33*k, 3*k, 3*k)
  ctx.fillStyle = '#3b82f6'; ctx.fillRect(sx+18*k, sy+33*k, 3*k, 3*k)
  ctx.fillStyle = '#22c55e'; ctx.fillRect(sx+23*k, sy+33*k, 3*k, 3*k)
  // Base
  ctx.fillStyle = '#1e293b'; ctx.fillRect(sx, sy+40*k, 30*k, 4*k)
  ctx.fillStyle = '#475569'; ctx.fillRect(sx-1*k, sy+43*k, 32*k, 3*k)
}

// ─── Weeping willow (tripled size) ────────────────────────────────────────────
function drawWillow(ctx: CanvasRenderingContext2D, sx: number, sy: number, frame: number) {
  const k = 3
  const sw = 4*TS*k, sh = 7*TS*k
  const cx = sx + sw/2

  // Ground roots / soil
  ctx.fillStyle = '#7a5c28'
  ctx.fillRect(cx-18*k, sy+sh-14*k, 36*k, 8*k)
  ctx.fillRect(cx-10*k, sy+sh-6*k,  20*k, 6*k)

  // Trunk
  ctx.fillStyle = '#5c3d14'
  ctx.fillRect(cx-16*k, sy+sh-70*k, 32*k, 66*k)
  ctx.fillStyle = '#6b4a1a'
  ctx.fillRect(cx-12*k, sy+sh-70*k, 8*k, 66*k)
  ctx.fillRect(cx+4*k,  sy+sh-48*k, 6*k, 48*k)
  ctx.fillStyle = '#4a2f0a'
  for (let i = 0; i < 6; i++) ctx.fillRect(cx-16*k, sy+sh-70*k+i*11*k, 32*k, 2*k)

  // Main branches
  ctx.fillStyle = '#5c3d14'
  ctx.fillRect(cx-36*k, sy+sh-110*k, 24*k, 10*k)
  ctx.fillRect(cx+12*k, sy+sh-110*k, 24*k, 10*k)
  ctx.fillRect(cx-20*k, sy+sh-130*k, 16*k, 8*k)
  ctx.fillRect(cx+4*k,  sy+sh-130*k, 16*k, 8*k)
  ctx.fillRect(cx-8*k,  sy+sh-150*k, 16*k, 6*k)

  // Canopy core dome
  ctx.fillStyle = '#1a5c1a'
  ctx.fillRect(cx-60*k, sy+20*k, 120*k, 80*k)
  ctx.fillRect(cx-50*k, sy+8*k,  100*k, 30*k)
  ctx.fillStyle = '#246b24'
  ctx.fillRect(cx-54*k, sy+14*k, 108*k, 70*k)
  ctx.fillStyle = '#2d7a2d'
  ctx.fillRect(cx-44*k, sy+10*k, 88*k, 50*k)

  // Drooping frond curtains
  const frondColors = ['#2d8b2d', '#34a334', '#246b24', '#1a5c1a', '#3a9e3a']
  const frondCount = 36
  for (let i = 0; i < frondCount; i++) {
    const fx = sx + 8*k + i * (sw - 16*k) / (frondCount - 1)
    const baseY = sy + 38*k + ((i * 17 + 7) % 30)*k
    const dropLen = (55 + ((i * 13 + 3) % 55))*k + Math.sin(frame * 0.018 + i * 0.65) * 8*k
    ctx.fillStyle = frondColors[i % frondColors.length]
    ctx.fillRect(fx, baseY, 4*k, dropLen)
    ctx.fillStyle = '#4aad4a'
    ctx.fillRect(fx-3*k, baseY+dropLen-8*k, 10*k, 8*k)
  }

  // Bird's nests
  const nests: [number, number][] = [
    [cx-40*k, sy+sh-118*k],
    [cx+24*k, sy+sh-118*k],
    [cx-8*k,  sy+sh-142*k],
  ]
  for (const [nx, ny] of nests) {
    ctx.fillStyle = '#8b6914'; ctx.fillRect(nx, ny, 18*k, 10*k)
    ctx.fillStyle = '#a07820'; ctx.fillRect(nx+2*k, ny+2*k, 14*k, 7*k)
    ctx.fillStyle = '#c8a44a'; ctx.fillRect(nx+4*k, ny+4*k, 10*k, 4*k)
    ctx.fillStyle = '#d4ecd4'
    ctx.fillRect(nx+3*k, ny+2*k, 5*k, 4*k)
    ctx.fillRect(nx+9*k, ny+2*k, 5*k, 4*k)
    if (nx === nests[0][0]) {
      const blink = frame % 120 < 8
      ctx.fillStyle = '#374151'
      ctx.fillRect(nx+18*k, ny-7*k, 7*k, 5*k)
      ctx.fillRect(nx+22*k, ny-9*k, 4*k, 3*k)
      if (!blink) { ctx.fillStyle = '#fbbf24'; ctx.fillRect(nx+25*k, ny-8*k, 2*k, k) }
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(nx+22*k, ny-6*k, 3*k, 2*k)
    }
  }
}

// ─── Farmer drawing (cute chibi kid-friendly) ─────────────────────────────────
function drawFarmer(ctx: CanvasRenderingContext2D, wx: number, wy: number, dir: Dir, frame: number, moving: boolean) {
  const W = 12*S, H = 17*S
  const sx = Math.round(wx - W/2)
  const sy = Math.round(wy - H)
  const f = (c: string, ax: number, ay: number, aw = 1, ah = 1) => {
    ctx.fillStyle = c; ctx.fillRect(sx+ax*S, sy+ay*S, aw*S, ah*S)
  }
  const leg = moving ? Math.sin(frame*0.35)*1.5 : 0

  // Shared palette
  const HAT   = '#e8c94a'   // bright straw hat
  const HATB  = '#a07818'   // hat band
  const BRIM  = '#f0d860'   // hat brim lighter
  const SKIN  = '#ffd5a8'   // face
  const SKIN2 = '#ffc990'   // slightly darker for chin
  const EYE   = '#1a1a3e'   // eye dark
  const GLARE = '#ffffff'
  const BLUSH = '#ffaabb'   // rosy cheeks
  const SHIRT = '#e8f0ff'   // white-ish shirt
  const OVR   = '#4a90e2'   // overalls bright blue
  const OVR2  = '#6aacf8'   // bib highlight
  const BOOT  = '#6b3a1e'

  const drawHat = () => {
    f(HAT,  3,0, 6,1)         // hat top
    f(HAT,  2,1, 8,2)         // hat crown
    f(HATB, 2,2, 8,1)         // band
    f(BRIM, 1,3, 10,1)        // wide brim
    f(HAT,  0,3, 1,1)         // brim shadow L
    f(HAT, 11,3, 1,1)         // brim shadow R
  }

  if (dir === 'down') {
    drawHat()
    // Round face
    f(SKIN,  2,4, 8,6)
    f(SKIN2, 2,4, 8,1)        // forehead shade
    // Big cute eyes (2×2 + glare dot)
    f(EYE,   3,5, 2,2); f(GLARE, 3,5, 1,1)
    f(EYE,   7,5, 2,2); f(GLARE, 7,5, 1,1)
    // Rosy cheeks
    f(BLUSH, 2,7, 2,1)
    f(BLUSH, 8,7, 2,1)
    // Happy mouth (U-shape)
    f(SKIN2, 4,8, 4,1)
    f(EYE,   4,8, 1,1)
    f(EYE,   7,8, 1,1)
    f(EYE,   5,9, 2,1)
    // Shirt peek + overalls
    f(SHIRT, 3,10, 6,1)
    f(OVR,   2,11, 8,5)
    f(OVR2,  4,11, 4,2)       // bib sheen
    // Legs (waddle)
    ctx.fillStyle = OVR
    ctx.fillRect(sx+3*S, sy+Math.round(16+leg)*S, 2*S, 1*S)
    ctx.fillRect(sx+7*S, sy+Math.round(16-leg)*S, 2*S, 1*S)
    f(BOOT, 2,17, 4,1); f(BOOT, 6,17, 4,1)

  } else if (dir === 'up') {
    drawHat()
    // Back of head (hair)
    f(SKIN, 2,4, 8,5)
    f('#c07830', 2,4, 8,3)    // warm brown hair
    f('#a06020', 2,4, 8,1)    // hair darker top row
    f(SHIRT, 3,10, 6,1)
    f(OVR,   2,11, 8,5)
    ctx.fillStyle = OVR
    ctx.fillRect(sx+3*S, sy+Math.round(16+leg)*S, 2*S, 1*S)
    ctx.fillRect(sx+7*S, sy+Math.round(16-leg)*S, 2*S, 1*S)
    f(BOOT, 2,17, 4,1); f(BOOT, 6,17, 4,1)

  } else if (dir === 'right') {
    drawHat()
    f(SKIN, 2,4, 8,6)
    f(SKIN, 1,5, 2,4)         // ear
    f(SKIN2, 2,5, 1,2)        // ear shadow
    // Single eye on right side
    f(EYE,   8,5, 2,2); f(GLARE, 8,5, 1,1)
    f(BLUSH, 8,7, 2,1)
    f(SHIRT, 3,10, 6,1)
    f(OVR,   2,11, 8,5)
    f(OVR2,  4,11, 4,2)
    ctx.fillStyle = OVR
    ctx.fillRect(sx+3*S, sy+Math.round(16+leg)*S, 2*S, 1*S)
    ctx.fillRect(sx+6*S, sy+Math.round(16-leg)*S, 2*S, 1*S)
    f(BOOT, 2,17, 4,1); f(BOOT, 5,17, 4,1)

  } else {   // left
    drawHat()
    f(SKIN, 2,4, 8,6)
    f(SKIN, 9,5, 2,4)         // ear
    f(SKIN2,10,5, 1,2)
    f(EYE,   2,5, 2,2); f(GLARE, 3,5, 1,1)
    f(BLUSH, 2,7, 2,1)
    f(SHIRT, 3,10, 6,1)
    f(OVR,   2,11, 8,5)
    f(OVR2,  4,11, 4,2)
    ctx.fillStyle = OVR
    ctx.fillRect(sx+3*S, sy+Math.round(16+leg)*S, 2*S, 1*S)
    ctx.fillRect(sx+6*S, sy+Math.round(16-leg)*S, 2*S, 1*S)
    f(BOOT, 2,17, 4,1); f(BOOT, 6,17, 4,1)
  }
}

// ─── Cat drawing (Stardew Valley-style: round head, pointed ears, expressive) ─
const CAT_COLORS = {
  alco: { body:'#a0aab8', belly:'#dde2e8', eye:'#f59e0b', nose:'#f9a8d4', ear:'#d4a0a8', stripe:'#8894a4' },
  link: { body:'#2a3444', belly:'#e8eef5', eye:'#10b981', nose:'#f9a8d4', ear:'#6a405a', stripe:'#3d4e62' },
}

function drawCat(ctx: CanvasRenderingContext2D, wx: number, wy: number, id: CatId, dir: Dir, anim: CatAnim, frame: number, love: number) {
  const C = CAT_COLORS[id]
  const W = 12*S, H = 12*S
  const sx = Math.round(wx - W/2)
  const sy = Math.round(wy - H)
  const PUP = '#111827'
  const GLR = 'rgba(255,255,255,0.8)'
  const leg = anim === 'walk' ? Math.sin(frame*0.4)*1.5 : 0

  const f = (c: string, ax: number, ay: number, aw = 1, ah = 1) => {
    ctx.fillStyle = c; ctx.fillRect(sx+ax*S, sy+ay*S, aw*S, ah*S)
  }

  // ── Sleep pose ────────────────────────────────────────────────────────────
  if (anim === 'sleep') {
    // Tail curled around right side (behind body)
    f(C.body, 8,1, 3,8)
    f(C.body, 6,8, 3,1)
    // Main body oval (curled up)
    f(C.body,  2,2, 8,8)
    f(C.body,  1,3, 10,6)
    f(C.belly, 3,4, 5,4)
    // Head tucked at top-left
    f(C.body, 1,1, 5,3)
    f(C.body, 2,0, 3,2)
    // Ear nub
    f(C.body, 2,0, 2,1); f(C.ear, 2,0, 1,1)
    // Closed eye (horizontal line)
    ctx.fillStyle = PUP
    ctx.fillRect(sx+2*S, sy+2*S, 3*S, S)
    // Nose
    f(C.nose, 3,3, 1,1)
    // Link stripe
    if (id === 'link') { f(C.stripe,2,5,3,2) }
    // Zzz
    ctx.fillStyle = '#93c5fd'; ctx.font = `${S*2}px sans-serif`
    ctx.textAlign = 'left'
    ctx.globalAlpha = 0.65 + Math.sin(frame*0.04)*0.35
    ctx.fillText('z', sx+W+S, sy+S)
    if (frame % 80 > 40) ctx.fillText('Z', sx+W+S*2, sy-S)
    ctx.globalAlpha = 1
    return
  }

  // ── Facing down (front, sitting) ──────────────────────────────────────────
  if (dir === 'down') {
    // Ear tips pointing UP
    f(C.body, 2,0, 1,1); f(C.ear, 2,0, 1,1)
    f(C.body, 9,0, 1,1); f(C.ear, 9,0, 1,1)
    // Ear bases
    f(C.body, 1,1, 3,2); f(C.ear, 2,1, 1,1)
    f(C.body, 8,1, 3,2); f(C.ear, 9,1, 1,1)
    // Round head + wider mid
    f(C.body, 1,2, 10,6)
    f(C.body, 0,3, 12,4)
    // Muzzle patch + nose
    if (id === 'link') f(C.belly, 3,6, 6,2)
    f(C.nose, 5,6, 2,1)
    // Eyes (2×2 iris, pupil, glare)
    f(C.eye, 2,3, 2,2); f(PUP, 3,3, 1,2); f(GLR, 2,3, 1,1)
    f(C.eye, 8,3, 2,2); f(PUP, 8,3, 1,2); f(GLR, 8,3, 1,1)
    // Body
    f(C.body, 2,8, 8,3)
    f(C.belly, 3,8, 6,3)
    if (id === 'link') { f(C.stripe,2,9,2,2); f(C.stripe,8,9,2,2) }
    // Tail (curls to right, visible from front)
    f(C.body,10,7, 2,4); f(C.body, 9,10,2,1)
    // Front paws
    ctx.fillStyle = C.body
    ctx.fillRect(sx+2*S, sy+Math.round(11+leg)*S, 3*S, S)
    ctx.fillRect(sx+7*S, sy+Math.round(11-leg)*S, 3*S, S)
    if (id === 'link') { f(C.nose,2,11,1,1); f(C.nose,4,11,1,1); f(C.nose,7,11,1,1); f(C.nose,9,11,1,1) }

  // ── Facing up (back) — tail straight up from center ───────────────────────
  } else if (dir === 'up') {
    // Ears visible from back
    f(C.body, 2,0, 1,1); f(C.ear, 2,0, 1,1)
    f(C.body, 9,0, 1,1); f(C.ear, 9,0, 1,1)
    f(C.body, 1,1, 3,2); f(C.ear, 2,1, 1,1)
    f(C.body, 8,1, 3,2); f(C.ear, 9,1, 1,1)
    // Back of head + body
    f(C.body, 1,2, 10,6)
    f(C.body, 0,3, 12,4)
    if (id === 'link') f(C.stripe, 2,4, 8,2)
    f(C.body, 2,8, 8,3)
    f(C.belly, 3,9, 6,2)
    // Tail STRAIGHT UP from center-back (Stardew Valley signature)
    f(C.body, 4,0, 4,1)   // tail base (wide)
    f(C.body, 5,0, 2,7)   // tail shaft rising from back
    // Paws
    ctx.fillStyle = C.body
    ctx.fillRect(sx+2*S, sy+Math.round(11+leg)*S, 3*S, S)
    ctx.fillRect(sx+7*S, sy+Math.round(11-leg)*S, 3*S, S)

  // ── Facing right — head at right, tail at LEFT going UP ───────────────────
  } else if (dir === 'right') {
    // Tail at LEFT end, curves UP (Stardew Valley signature)
    f(C.body, 1,0, 2,2)   // tail tip (slightly offset at top)
    f(C.body, 0,2, 2,4)   // tail shaft rising up
    f(C.body, 1,5, 2,1)   // tail base connecting to body

    // Ear at RIGHT/front, pointing UP
    f(C.body, 9,0, 2,1);  f(C.ear, 9,0, 1,1)
    f(C.body, 8,1, 3,2);  f(C.ear, 9,1, 1,1)

    // Head (right side, cols 8-11)
    f(C.body, 8,2, 4,5)

    // Body (horizontal, cols 1-8)
    f(C.body, 1,2, 7,4)
    f(C.body, 0,3, 12,2)  // wider mid-row for roundness

    // Belly (lighter underside)
    f(C.belly, 2,3, 6,2)
    if (id === 'link') f(C.belly, 9,4, 2,1)

    // Eye (single, right side of head)
    f(C.eye, 9,3, 2,2); f(PUP, 9,3, 1,2); f(GLR, 9,3, 1,1)

    // Nose/muzzle (front tip of head)
    f(C.body, 11,4, 1,1)
    f(C.nose, 11,4, 1,1)

    // Link stripe
    if (id === 'link') { f(C.stripe, 2,3, 2,2); f(C.stripe, 4,2, 2,1) }

    // 4 legs (alternating walk animation)
    ctx.fillStyle = C.body
    ctx.fillRect(sx+2*S, sy+(6+Math.round(leg))*S, 2*S, 2*S)
    ctx.fillRect(sx+4*S, sy+(6-Math.round(leg))*S, 2*S, 2*S)
    ctx.fillRect(sx+6*S, sy+(6+Math.round(leg))*S, 2*S, 2*S)
    ctx.fillRect(sx+8*S, sy+(6-Math.round(leg))*S, 2*S, 2*S)

  // ── Facing left — head at left, tail at RIGHT going UP ────────────────────
  } else {
    // Tail at RIGHT end, curves UP
    f(C.body, 9,0, 2,2)   // tail tip
    f(C.body,10,2, 2,4)   // tail shaft
    f(C.body, 9,5, 2,1)   // tail base

    // Ear at LEFT/front, pointing UP
    f(C.body, 1,0, 2,1);  f(C.ear, 1,0, 1,1)
    f(C.body, 1,1, 3,2);  f(C.ear, 2,1, 1,1)

    // Head (left side, cols 0-3)
    f(C.body, 0,2, 4,5)

    // Body (horizontal, cols 3-10)
    f(C.body, 4,2, 7,4)
    f(C.body, 0,3, 12,2)

    // Belly
    f(C.belly, 4,3, 6,2)
    if (id === 'link') f(C.belly, 1,4, 2,1)

    // Eye (single, left side of head)
    f(C.eye, 1,3, 2,2); f(PUP, 1,3, 1,2); f(GLR, 2,3, 1,1)

    // Nose/muzzle (front tip of head)
    f(C.body, 0,4, 1,1)
    f(C.nose, 0,4, 1,1)

    // Link stripe
    if (id === 'link') { f(C.stripe, 8,3, 2,2); f(C.stripe, 6,2, 2,1) }

    // 4 legs
    ctx.fillStyle = C.body
    ctx.fillRect(sx+2*S, sy+(6+Math.round(leg))*S, 2*S, 2*S)
    ctx.fillRect(sx+4*S, sy+(6-Math.round(leg))*S, 2*S, 2*S)
    ctx.fillRect(sx+6*S, sy+(6+Math.round(leg))*S, 2*S, 2*S)
    ctx.fillRect(sx+8*S, sy+(6-Math.round(leg))*S, 2*S, 2*S)
  }

  // Love hearts above head
  if (love > 0) {
    ctx.font = `${S*1.2}px serif`; ctx.textAlign = 'center'
    const hearts = ['❤️','🧡','💛'].slice(0, love).join('')
    ctx.fillText(hearts, sx + W/2, sy - S/2)
  }
}

// ─── Chat bubble ─────────────────────────────────────────────────────────────
function drawChatBubble(ctx: CanvasRenderingContext2D, wx: number, wy: number, love: number, id: CatId) {
  const lines = [
    love === 0 ? `${id === 'alco' ? 'Alco' : 'Link'} tolerates you.` : '',
    love === 1 ? `${id === 'alco' ? 'Alco' : 'Link'} likes you! ❤️` : '',
    love === 2 ? `${id === 'alco' ? 'Alco' : 'Link'} loves you! ❤️❤️` : '',
    love === 3 ? `${id === 'alco' ? 'Alco' : 'Link'} adores you! ❤️❤️❤️` : '',
  ].filter(Boolean)
  const text = lines[0] || ''
  const bw = 120, bh = 28
  const bx = wx - bw/2, by = wy - 60
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 6); ctx.fill(); ctx.stroke()
  // tail
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.beginPath(); ctx.moveTo(wx-6, by+bh); ctx.lineTo(wx+6, by+bh); ctx.lineTo(wx, by+bh+8); ctx.closePath(); ctx.fill()
  ctx.fillStyle = '#374151'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText(text, wx, by + 17)
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
function drawHUD(ctx: CanvasRenderingContext2D, inventory: Record<string, number>, cats: CatState[]) {
  // Inventory panel top-left
  const foods = FOODS.filter(f => (inventory[f.id] || 0) > 0)
  if (foods.length > 0) {
    const pw = foods.length*36 + 12, ph = 40
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.roundRect(8, 8, pw, ph, 8); ctx.fill()
    ctx.fillStyle = '#fde68a'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left'
    ctx.fillText('PANTRY', 14, 22)
    foods.forEach((food, i) => {
      ctx.font = '14px serif'; ctx.textAlign = 'center'
      ctx.fillText(food.emoji, 14 + i*36 + 14, 40)
      ctx.fillStyle = '#fde68a'; ctx.font = 'bold 9px sans-serif'
      ctx.fillText(`×${inventory[food.id]}`, 14 + i*36 + 14, 50)
      ctx.fillStyle = '#fde68a'
    })
  }

  // Cat status panel top-right
  const px = CW - 150
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.roundRect(px, 8, 142, 68, 8); ctx.fill()
  cats.forEach((cat, i) => {
    const cy = 28 + i*32
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left'
    ctx.fillText(cat.id === 'alco' ? '🐱 Alco' : '🐈 Link', px+8, cy)
    const hearts = '❤️'.repeat(cat.love) + '🤍'.repeat(3 - cat.love)
    ctx.font = '10px serif'; ctx.fillText(hearts, px+8, cy+13)
    // Fed status
    const now = Date.now()
    if (cat.fedUntil > now) {
      const ms = cat.fedUntil - now
      const d = Math.floor(ms/86400000)
      const h = Math.floor((ms%86400000)/3600000)
      ctx.fillStyle = '#86efac'; ctx.font = '8px sans-serif'
      ctx.fillText(d > 0 ? `Fed: ${d}d ${h}h` : `Fed: ${h}h`, px+82, cy+4)
    }
  })

  // Controls hint bottom
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.roundRect(CW/2-140, CH-28, 280, 22, 5); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText('Click tile to move  •  Click cat to pet  •  Double-click cat to feed', CW/2, CH-13)
}

// ─── Cat AI ───────────────────────────────────────────────────────────────────
const CAT_WANDER_TILES: [number, number][] = []
;(function buildWanderTiles() {
  // Tiles along the perimeter of the barn (dirt path ring)
  for (let tx = BARN_TX-3; tx < BARN_TX+BARN_TW+3; tx++) {
    CAT_WANDER_TILES.push([tx, BARN_TY-3])
    CAT_WANDER_TILES.push([tx, BARN_BOT+2])
  }
  for (let ty = BARN_TY-2; ty < BARN_BOT+2; ty++) {
    CAT_WANDER_TILES.push([BARN_TX-3, ty])
    CAT_WANDER_TILES.push([BARN_TX+BARN_TW+2, ty])
  }
})()

function updateCat(cat: CatState, map: Uint8Array, farmer: FarmerState, dt: number) {
  cat.frame += dt * 60
  cat.animTimer -= dt * 1000
  cat.stateTimer -= dt * 1000
  if (cat.chatTimer > 0) cat.chatTimer -= dt * 1000

  const now = Date.now()
  const following = cat.love >= 3 && cat.followUntil > now
  const px = cat.pos.x, py = cat.pos.y
  const tx = cat.target.x, ty = cat.target.y
  const dx = tx - px, dy = ty - py
  const dist = Math.sqrt(dx*dx + dy*dy)

  // Move toward target with collision
  if (dist > 2) {
    const spd = CAT_SPEED * TS * dt
    const vx = (dx/dist)*spd, vy = (dy/dist)*spd
    if (canMoveTo(map, cat.pos.x + vx, cat.pos.y, CAT_HW, CAT_HH)) cat.pos.x += vx
    if (canMoveTo(map, cat.pos.x, cat.pos.y + vy, CAT_HW, CAT_HH)) cat.pos.y += vy
    cat.anim = 'walk'
    if (Math.abs(dx) > Math.abs(dy)) cat.dir = dx > 0 ? 'right' : 'left'
    else cat.dir = dy > 0 ? 'down' : 'up'
  } else {
    cat.pos.x = tx; cat.pos.y = ty
    if (cat.anim === 'walk') cat.anim = 'idle'
  }

  // Change AI state when timer expires
  if (cat.stateTimer <= 0) {
    if (following) {
      // Follow farmer
      cat.asleep = false
      cat.anim = 'walk'
      const farmerPos = farmer.pos
      const angle = Math.random() * Math.PI * 2
      cat.target = { x: farmerPos.x + Math.cos(angle)*40, y: farmerPos.y + Math.sin(angle)*40 }
      cat.stateTimer = 800 + Math.random()*600
    } else if (cat.asleep) {
      // Chance to wake up
      if (Math.random() < 0.1) {
        cat.asleep = false
        cat.anim = 'idle'
        cat.stateTimer = 3000 + Math.random()*5000
      } else {
        cat.anim = 'sleep'
        cat.stateTimer = 4000 + Math.random()*6000
      }
    } else {
      const roll = Math.random()
      if (roll < 0.4) {
        // Wander to a random barn-perimeter tile
        const wanderTo = CAT_WANDER_TILES[Math.floor(Math.random()*CAT_WANDER_TILES.length)]
        cat.target = { x: (wanderTo[0]+0.5)*TS, y: (wanderTo[1]+0.5)*TS }
        cat.anim = 'walk'
        cat.stateTimer = 2000 + Math.random()*3000
      } else if (roll < 0.7) {
        // Go sleep
        cat.asleep = true
        cat.anim = 'sleep'
        cat.stateTimer = 8000 + Math.random()*12000
      } else if (roll < 0.85 && WATER_TY) {
        // Go to water bowl
        cat.target = { x: (WATER_TX+0.5)*TS, y: (WATER_TY+0.5)*TS }
        cat.anim = 'walk'
        cat.stateTimer = 3000 + Math.random()*2000
      } else {
        cat.anim = 'idle'
        cat.stateTimer = 2000 + Math.random()*3000
      }
    }
  }
  void map  // suppress unused warning
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FarmTopDown({ onBack, onLaunchRunner, inventory, onFeedCat, onFillBowl }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>()
  const gsRef     = useRef<GameState | null>(null)
  const lastClickRef = useRef<{ time: number; wx: number; wy: number }>({ time: 0, wx: 0, wy: 0 })
  const invRef    = useRef(inventory)
  invRef.current  = inventory

  const [, forceRender] = useState(0)

  // Init game state once
  if (!gsRef.current) {
    const map = buildMap()
    gsRef.current = {
      farmer: {
        pos:    { x: (BARN_CX+0.5)*TS, y: (BARN_BOT+5)*TS },
        target: { x: (BARN_CX+0.5)*TS, y: (BARN_BOT+5)*TS },
        dir: 'up', frame: 0, moving: false,
      },
      cats: [initCat('alco'), initCat('link')],
      cam: { x: 0, y: 0 },
      map,
      foodBowlFood: null,
      frame: 0,
      lastMs: performance.now(),
    }
  }

  const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Vec2 => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const scaleX = CW / rect.width, scaleY = CH / rect.height
    return { x: (e.clientX - rect.left)*scaleX, y: (e.clientY - rect.top)*scaleY }
  }, [])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const gs = gsRef.current!
    const cpos = getCanvasPos(e)
    const wx = cpos.x / ZOOM + gs.cam.x
    const wy = cpos.y / ZOOM + gs.cam.y
    const now = Date.now()
    const last = lastClickRef.current
    const dbl = now - last.time < 350 && Math.abs(wx-last.wx) < 30 && Math.abs(wy-last.wy) < 30
    lastClickRef.current = { time: now, wx, wy }

    // Check click on cats
    for (const cat of gs.cats) {
      const dx = wx - cat.pos.x, dy = wy - cat.pos.y
      if (Math.sqrt(dx*dx+dy*dy) < 24) {
        if (dbl) {
          // Double-click = feed best food
          const best = bestFoodInInventory(invRef.current)
          if (best) {
            const MAX_FED = now + 30*24*3600000
            const base = cat.fedUntil > now ? cat.fedUntil : now
            cat.fedUntil = Math.min(base + best.feedHours*3600000, MAX_FED)
            cat.asleep = false; cat.chatTimer = 2500
            cat.love = Math.min(3, cat.love + 1)
            saveLove(cat.id, { love: cat.love, fedUntil: cat.fedUntil, followUntil: cat.followUntil })
            onFeedCat(cat.id, best.id)
            if (cat.love >= 3) {
              const midnight = new Date(); midnight.setHours(24,0,0,0)
              cat.followUntil = midnight.getTime()
              saveLove(cat.id, { followUntil: cat.followUntil })
            }
          }
        } else {
          // Single click = pet
          cat.asleep = false
          cat.love = Math.min(3, cat.love + 1)
          cat.chatTimer = 2500
          saveLove(cat.id, { love: cat.love, fedUntil: cat.fedUntil, followUntil: cat.followUntil })
          if (cat.love >= 3) {
            const midnight = new Date(); midnight.setHours(24,0,0,0)
            cat.followUntil = midnight.getTime()
            saveLove(cat.id, { followUntil: cat.followUntil })
          }
        }
        forceRender(n => n+1)
        return
      }
    }

    // Check arcade
    const arcX = (ARCADE_TX+0.5)*TS, arcY = (ARCADE_TY+0.5)*TS
    if (Math.abs(wx-arcX) < 28 && Math.abs(wy-arcY) < 28) { onLaunchRunner(); return }

    // Check food bowl
    const fbX = (FOOD_TX+0.5)*TS, fbY = (FOOD_TY+0.5)*TS
    if (Math.abs(wx-fbX) < 24 && Math.abs(wy-fbY) < 24) {
      const best = bestFoodInInventory(invRef.current)
      if (best) { gs.foodBowlFood = best.id; onFillBowl(best.id) }
      return
    }

    // Move farmer to clicked tile
    const tx = Math.floor(wx/TS), ty = Math.floor(wy/TS)
    if (tx >= 0 && tx < MW && ty >= 0 && ty < MH && WALKABLE.has(gs.map[ty*MW+tx])) {
      gs.farmer.target = { x: (tx+0.5)*TS, y: (ty+0.5)*TS }
    }
  }, [getCanvasPos, onFeedCat, onFillBowl, onLaunchRunner])

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    function tick(nowMs: number) {
      const gs = gsRef.current!
      const dt = Math.min((nowMs - gs.lastMs) / 1000, 0.05)
      gs.lastMs = nowMs
      gs.frame++

      // Move farmer with X/Y separated collision
      const f = gs.farmer
      const fdx = f.target.x - f.pos.x, fdy = f.target.y - f.pos.y
      const fdist = Math.sqrt(fdx*fdx + fdy*fdy)
      if (fdist > 2) {
        const spd = FARMER_SPEED * TS * dt
        const vx = (fdx/fdist)*spd, vy = (fdy/fdist)*spd
        if (canMoveTo(gs.map, f.pos.x + vx, f.pos.y, FARMER_HW, FARMER_HH)) f.pos.x += vx
        if (canMoveTo(gs.map, f.pos.x, f.pos.y + vy, FARMER_HW, FARMER_HH)) f.pos.y += vy
        f.moving = true; f.frame += dt*60
        if (Math.abs(fdx) > Math.abs(fdy)) f.dir = fdx > 0 ? 'right' : 'left'
        else f.dir = fdy > 0 ? 'down' : 'up'
      } else { f.pos.x = f.target.x; f.pos.y = f.target.y; f.moving = false }

      // Update cats
      for (const cat of gs.cats) updateCat(cat, gs.map, f, dt)

      // Smooth camera follow (tracks in world coords, visible area = VW×VH)
      const targetCamX = f.pos.x - VW/2
      const targetCamY = f.pos.y - VH/2
      gs.cam.x += (targetCamX - gs.cam.x) * 0.1
      gs.cam.y += (targetCamY - gs.cam.y) * 0.1
      gs.cam.x = Math.max(0, Math.min(MW*TS - VW, gs.cam.x))
      gs.cam.y = Math.max(0, Math.min(MH*TS - VH, gs.cam.y))

      // ── Draw ──────────────────────────────────────────────────────────────
      const camX = gs.cam.x, camY = gs.cam.y
      const startTX = Math.floor(camX/TS), startTY = Math.floor(camY/TS)
      const endTX = Math.min(MW, startTX + Math.ceil(VW/TS) + 2)
      const endTY = Math.min(MH, startTY + Math.ceil(VH/TS) + 2)

      // ── World drawing (all scaled by ZOOM) ────────────────────────────────
      ctx.save()
      ctx.scale(ZOOM, ZOOM)
      ctx.imageSmoothingEnabled = false

      // Tiles
      for (let ty = startTY; ty < endTY; ty++) {
        for (let tx = startTX; tx < endTX; tx++) {
          const tile = gs.map[ty*MW+tx]
          if (tile === T_BARN) continue
          const sx = Math.round(tx*TS - camX), sy = Math.round(ty*TS - camY)
          // T_TREE trunk area: draw grass underneath so willow sits on green
          drawTile(ctx, tile === T_TREE ? T_GRASS : tile, sx, sy, ty*MW+tx)
        }
      }

      // Barn
      drawBarn(ctx, camX, camY)

      // Objects
      drawWaterBowl(ctx, Math.round(WATER_TX*TS - camX), Math.round(WATER_TY*TS - camY))
      drawFoodBowl(ctx, Math.round(FOOD_TX*TS - camX), Math.round(FOOD_TY*TS - camY), gs.foodBowlFood)
      drawArcade(ctx, Math.round(ARCADE_TX*TS - camX), Math.round(ARCADE_TY*TS - camY), gs.frame)

      // Sort entities + willow by Y for depth
      type Entity = { y: number; draw: () => void }
      const entities: Entity[] = []
      const willowWorldY = (WILLOW_TY + 21) * TS   // tripled willow bottom for z-sort
      entities.push({
        y: willowWorldY,
        draw: () => drawWillow(ctx, Math.round(WILLOW_TX*TS - camX), Math.round(WILLOW_TY*TS - camY), gs.frame),
      })
      entities.push({
        y: f.pos.y,
        draw: () => drawFarmer(ctx, Math.round(f.pos.x - camX), Math.round(f.pos.y - camY), f.dir, f.frame, f.moving),
      })
      for (const cat of gs.cats) {
        const scx = Math.round(cat.pos.x - camX), scy = Math.round(cat.pos.y - camY)
        entities.push({
          y: cat.pos.y,
          draw: () => {
            drawCat(ctx, scx, scy, cat.id, cat.dir, cat.anim, Math.round(cat.frame), cat.love)
            if (cat.chatTimer > 0) drawChatBubble(ctx, scx, scy, cat.love, cat.id)
          },
        })
      }
      entities.sort((a, b) => a.y - b.y)
      for (const e of entities) e.draw()

      ctx.restore()   // back to 1:1 scale for HUD

      // HUD (drawn in canvas px, not scaled)
      ctx.save()
      drawHUD(ctx, invRef.current, gs.cats)
      ctx.restore()

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#1a1a2e', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', height:'44px', background:'rgba(0,0,0,0.6)', flexShrink:0, gap:12 }}>
        <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:7, color:'white', cursor:'pointer', fontSize:13 }}>
          <ArrowLeft size={14}/> Chores
        </button>
        <span style={{ color:'#fde68a', fontWeight:700, fontSize:15 }}>🐾 Our Farm</span>
        <button onClick={onLaunchRunner} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:'#fbbf24', border:'none', borderRadius:7, color:'#1a1a00', cursor:'pointer', fontSize:13, fontWeight:700 }}>
          <Gamepad2 size={14}/> Runner
        </button>
      </div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
        <canvas
          ref={canvasRef}
          width={CW} height={CH}
          onClick={handleClick}
          style={{ width:'100%', maxWidth:CW, maxHeight:'100%', imageRendering:'pixelated', cursor:'crosshair', display:'block' }}
        />
      </div>
    </div>
  )
}
