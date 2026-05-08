import { useEffect, useRef, useState, useCallback } from 'react'
import { ArrowLeft, Gamepad2 } from 'lucide-react'
import { bestFoodInInventory, FOODS } from '../utils/farmUtils'

// ─── Constants ────────────────────────────────────────────────────────────────
const TS = 32
const MW = 100, MH = 100
const CW = 832, CH = 576

const BARN_TX = 35, BARN_TY = 33, BARN_TW = 30, BARN_TH = 30
const BARN_CX = BARN_TX + BARN_TW / 2   // barn center tile X
const BARN_BOT = BARN_TY + BARN_TH      // barn bottom tile row

const WATER_TX = 40, WATER_TY = 68
const FOOD_TX  = 56, FOOD_TY  = 68
const ARCADE_TX = 68, ARCADE_TY = 67

const FARMER_SPEED = 5   // tiles/sec
const CAT_SPEED    = 1.4 // tiles/sec
const S = 2              // pixel art scale (1 art-px = 2 canvas-px)

const SIGN_DEADLINE = new Date('2026-05-15T00:00:00').getTime()

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
const WALKABLE = new Set([T_GRASS, T_FLOWER, T_DIRT])

// ─── Map generation (stable via deterministic hash) ──────────────────────────
let _mapCache: Uint8Array | null = null
function buildMap(): Uint8Array {
  if (_mapCache) return _mapCache
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
  const startX = id === 'alco' ? BARN_TX - 2 : BARN_TX + BARN_TW + 1
  return {
    id, pos: { x: (startX + 0.5)*TS, y: (BARN_BOT + 1.5)*TS },
    target: { x: (startX + 0.5)*TS, y: (BARN_BOT + 1.5)*TS },
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
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(bx+8, by+8, bw, bh)

  // Roof body (viewed from above = red/dark)
  ctx.fillStyle = '#7c1d1d'
  ctx.fillRect(bx, by, bw, bh)

  // Roof planks
  ctx.fillStyle = '#8b2020'
  for (let i = 1; i < 8; i++) ctx.fillRect(bx + i*(bw/8), by, 3, bh)
  ctx.fillStyle = 'rgba(255,255,255,0.04)'
  for (let i = 1; i < 10; i++) ctx.fillRect(bx, by + i*(bh/10), bw, 2)

  // Left window
  const lw = bx + 44, lwy = by + bh - 96
  ctx.fillStyle = '#8b3a10'; ctx.fillRect(lw-4, lwy-4, 52, 4); ctx.fillRect(lw-4, lwy-4, 4, 52)
  ctx.fillStyle = '#8b3a10'; ctx.fillRect(lw+44, lwy-4, 4, 52); ctx.fillRect(lw-4, lwy+44, 52, 4)
  ctx.fillStyle = '#93c5fd'; ctx.fillRect(lw, lwy, 44, 44)
  ctx.fillStyle = '#7c1d1d'; ctx.fillRect(lw+20, lwy, 4, 44); ctx.fillRect(lw, lwy+20, 44, 4)
  ctx.fillStyle = '#bae6fd'; ctx.fillRect(lw+2, lwy+2, 8, 8)

  // Right window
  const rw = bx + bw - 88, rwy = by + bh - 96
  ctx.fillStyle = '#8b3a10'; ctx.fillRect(rw-4, rwy-4, 52, 4); ctx.fillRect(rw-4, rwy-4, 4, 52)
  ctx.fillStyle = '#8b3a10'; ctx.fillRect(rw+44, rwy-4, 4, 52); ctx.fillRect(rw-4, rwy+44, 52, 4)
  ctx.fillStyle = '#93c5fd'; ctx.fillRect(rw, rwy, 44, 44)
  ctx.fillStyle = '#7c1d1d'; ctx.fillRect(rw+20, rwy, 4, 44); ctx.fillRect(rw, rwy+20, 44, 4)
  ctx.fillStyle = '#bae6fd'; ctx.fillRect(rw+2, rwy+2, 8, 8)

  // South facade strip (makes barn look 3D from below)
  const fy = by + bh - 56
  ctx.fillStyle = '#9b2424'
  ctx.fillRect(bx, fy, bw, 56)
  ctx.fillStyle = 'rgba(0,0,0,0.08)'
  for (let i = 1; i <= 3; i++) ctx.fillRect(bx, fy + i*14, bw, 2)
  for (let i = 1; i < 10; i++) ctx.fillRect(bx + i*(bw/10), fy, 3, 56)

  // Gate
  const gw = 80, gx = bx + bw/2 - gw/2
  ctx.fillStyle = '#5c0f0f'; ctx.fillRect(gx, fy, gw, 56)
  ctx.fillStyle = '#8b3a10'
  ctx.fillRect(gx+36, fy, 8, 56)
  ctx.fillRect(gx-4, fy, 4, 56); ctx.fillRect(gx+gw, fy, 4, 56)
  ctx.fillRect(gx-4, fy-4, gw+8, 4)
  // X on left door
  ctx.fillStyle = '#7c2020'
  ctx.fillRect(gx+4, fy+25, 32, 4); ctx.fillRect(gx+16, fy+4, 4, 52)
  // X on right door
  ctx.fillRect(gx+44, fy+25, 32, 4); ctx.fillRect(gx+56, fy+4, 4, 52)

  // Sign above gate
  const sx2 = gx - 24, sy2 = fy - 48
  ctx.fillStyle = '#c8a44a'; ctx.fillRect(sx2, sy2, gw+48, 36)
  ctx.fillStyle = '#8b6914'
  ctx.fillRect(sx2, sy2, gw+48, 3); ctx.fillRect(sx2, sy2+33, gw+48, 3)
  ctx.fillRect(sx2, sy2, 3, 36); ctx.fillRect(sx2+gw+45, sy2, 3, 36)
  ctx.fillStyle = '#5c3d0e'
  ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'
  ctx.fillText('✦ MORE TO COME ✦', sx2 + (gw+48)/2, sy2+14)
  const ms = SIGN_DEADLINE - Date.now()
  const days = Math.max(0, Math.ceil(ms/86400000))
  ctx.font = '9px monospace'
  ctx.fillText(ms > 0 ? `${days}d remaining` : 'Coming soon!', sx2+(gw+48)/2, sy2+28)

  // Weather vane
  const wvx = bx + bw/2
  ctx.fillStyle = '#6b7280'; ctx.fillRect(wvx-2, by+2, 4, 28); ctx.fillRect(wvx-18, by+10, 36, 4)
  ctx.fillStyle = '#9ca3af'; ctx.fillRect(wvx-16, by+8, 14, 8); ctx.fillRect(wvx+2, by+8, 14, 8)
  ctx.fillStyle = '#fbbf24'; ctx.fillRect(wvx-2, by+2, 4, 4)
}

// ─── Object drawing ───────────────────────────────────────────────────────────
function drawWaterBowl(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  ctx.fillStyle = '#374151'; ctx.fillRect(sx+2, sy+18, 28, 10)
  ctx.fillStyle = '#1d4ed8'; ctx.fillRect(sx+4, sy+20, 24, 7)
  ctx.fillStyle = '#93c5fd'; ctx.fillRect(sx+6, sy+21, 8, 3)
  ctx.fillStyle = '#4b5563'; ctx.fillRect(sx, sy+26, 32, 5)
}

function drawFoodBowl(ctx: CanvasRenderingContext2D, sx: number, sy: number, foodId: string | null) {
  ctx.fillStyle = '#4b5563'; ctx.fillRect(sx+2, sy+18, 28, 10)
  if (foodId) {
    const food = FOODS.find(f => f.id === foodId)
    ctx.fillStyle = food?.bgColor ?? '#d4a84a'
    ctx.fillRect(sx+4, sy+20, 24, 7)
    ctx.fillStyle = '#f0e0a0'; ctx.fillRect(sx+6, sy+21, 6, 3)
    // food emoji tiny
    ctx.font = '12px serif'; ctx.textAlign = 'center'
    ctx.fillText(food?.emoji ?? '🍖', sx+16, sy+17)
  } else {
    ctx.fillStyle = '#374151'; ctx.fillRect(sx+4, sy+20, 24, 7)
  }
  ctx.fillStyle = '#6b7280'; ctx.fillRect(sx, sy+26, 32, 5)
}

function drawArcade(ctx: CanvasRenderingContext2D, sx: number, sy: number, frame: number) {
  // Cabinet
  ctx.fillStyle = '#1e293b'; ctx.fillRect(sx+4, sy+2, 24, 30)
  ctx.fillStyle = '#0f172a'; ctx.fillRect(sx+6, sy+5, 20, 14)
  // Screen glow
  ctx.fillStyle = '#15803d'; ctx.fillRect(sx+7, sy+6, 18, 12)
  ctx.fillStyle = '#4ade80'; ctx.fillRect(sx+8, sy+7, 3, 3); ctx.fillRect(sx+16, sy+11, 2, 2)
  if (frame % 60 < 30) ctx.fillRect(sx+12, sy+9, 4, 2)
  // Label strip
  ctx.fillStyle = '#fbbf24'; ctx.fillRect(sx+6, sy+20, 20, 4)
  ctx.fillStyle = '#1e293b'; ctx.font = '5px monospace'; ctx.textAlign = 'center'
  ctx.fillText('PLAY', sx+16, sy+24)
  // Buttons
  ctx.fillStyle = '#ef4444'; ctx.fillRect(sx+7, sy+26, 5, 5)
  ctx.fillStyle = '#3b82f6'; ctx.fillRect(sx+14, sy+26, 5, 5)
  ctx.fillStyle = '#22c55e'; ctx.fillRect(sx+21, sy+26, 5, 5)
  // Base
  ctx.fillStyle = '#334155'; ctx.fillRect(sx+2, sy+30, 28, 5)
  // Glow when player is near
  ctx.fillStyle = '#64748b'; ctx.fillRect(sx, sy+33, 32, 3)
}

// ─── Farmer drawing ───────────────────────────────────────────────────────────
function drawFarmer(ctx: CanvasRenderingContext2D, wx: number, wy: number, dir: Dir, frame: number, moving: boolean) {
  // wx/wy = world pixel position (center-bottom of sprite)
  const W = 12*S, H = 17*S
  const sx = Math.round(wx - W/2)
  const sy = Math.round(wy - H)

  const f = (c: string, ax: number, ay: number, aw = 1, ah = 1) => {
    ctx.fillStyle = c; ctx.fillRect(sx+ax*S, sy+ay*S, aw*S, ah*S)
  }
  const leg = moving ? Math.sin(frame*0.35)*2 : 0

  if (dir === 'down') {
    f('#d4b660', 1,0, 10,1)        // hat brim
    f('#c8a44a', 3,1, 6,3)         // hat crown
    f('#7c2d12', 3,3, 6,1)         // hat band
    f('#fcd9b2', 2,4, 8,5)         // face
    f('#1f2937', 3,5, 2,2)         // left eye
    f('#1f2937', 7,5, 2,2)         // right eye
    f('#f9a8d4', 5,7, 2,1)         // nose
    f('#fef2d5', 1,9, 2,4)         // L sleeve
    f('#fef2d5', 9,9, 2,4)         // R sleeve
    f('#3b82f6', 3,9, 6,5)         // overalls
    f('#60a5fa', 4,9, 4,2)         // bib highlight
    f('#2563eb', 4,10, 2,2)        // pocket
    ctx.fillStyle = '#2563eb'
    ctx.fillRect(sx+3*S, sy+(13+leg)*S, 3*S, 4*S)     // L leg
    ctx.fillRect(sx+6*S, sy+(13-leg)*S, 3*S, 4*S)     // R leg
    f('#7c2d12', 3, 17, 3,1)        // L boot (approx, for frame offsets use inline)
    f('#7c2d12', 6, 17, 3,1)
  } else if (dir === 'up') {
    f('#d4b660', 1,0, 10,1)
    f('#c8a44a', 3,1, 6,3)
    f('#7c2d12', 3,3, 6,1)
    f('#fcd9b2', 2,4, 8,5)         // back of head
    f('#92400e', 2,4, 8,3)         // hair visible from back
    f('#fef2d5', 1,9, 2,4)
    f('#fef2d5', 9,9, 2,4)
    f('#3b82f6', 3,9, 6,5)
    ctx.fillStyle = '#2563eb'
    ctx.fillRect(sx+3*S, sy+(13+leg)*S, 3*S, 4*S)
    ctx.fillRect(sx+6*S, sy+(13-leg)*S, 3*S, 4*S)
    f('#7c2d12', 3,17, 3,1); f('#7c2d12', 6,17, 3,1)
  } else if (dir === 'right') {
    f('#d4b660', 1,0, 10,1)
    f('#c8a44a', 3,1, 6,3)
    f('#7c2d12', 3,3, 6,1)
    f('#fcd9b2', 2,4, 8,5)
    f('#1f2937', 8,5, 2,2)         // single right eye (side profile)
    f('#f0b98a', 1,5, 2,3)         // ear on left (back)
    f('#f9a8d4', 9,7, 1,1)         // nose right side
    f('#fef2d5', 9,9, 2,4)
    f('#3b82f6', 2,9, 7,5)
    ctx.fillStyle = '#2563eb'
    ctx.fillRect(sx+3*S, sy+(13+leg)*S, 3*S, 4*S)
    ctx.fillRect(sx+5*S, sy+(13-leg)*S, 3*S, 4*S)
    f('#7c2d12', 3,17, 3,1); f('#7c2d12', 5,17, 3,1)
  } else {
    f('#d4b660', 1,0, 10,1)
    f('#c8a44a', 3,1, 6,3)
    f('#7c2d12', 3,3, 6,1)
    f('#fcd9b2', 2,4, 8,5)
    f('#1f2937', 2,5, 2,2)         // single left eye
    f('#f0b98a', 9,5, 2,3)         // ear right side
    f('#f9a8d4', 2,7, 1,1)
    f('#fef2d5', 1,9, 2,4)
    f('#3b82f6', 3,9, 7,5)
    ctx.fillStyle = '#2563eb'
    ctx.fillRect(sx+4*S, sy+(13+leg)*S, 3*S, 4*S)
    ctx.fillRect(sx+6*S, sy+(13-leg)*S, 3*S, 4*S)
    f('#7c2d12', 4,17, 3,1); f('#7c2d12', 6,17, 3,1)
  }
}

// ─── Cat drawing ──────────────────────────────────────────────────────────────
const CAT_COLORS = {
  alco: { body:'#9ca3af', belly:'#d1d5db', eye:'#fbbf24', nose:'#f9a8d4', stripe:'' },
  link: { body:'#1f2937', belly:'#f1f5f9', eye:'#10b981', nose:'#f9a8d4', stripe:'#374151' },
}

function drawCat(ctx: CanvasRenderingContext2D, wx: number, wy: number, id: CatId, dir: Dir, anim: CatAnim, frame: number, love: number) {
  const C = CAT_COLORS[id]
  const W = 12*S, H = 12*S
  const sx = Math.round(wx - W/2)
  const sy = Math.round(wy - H)
  const k = '#111827'; const w = 'rgba(255,255,255,0.55)'
  const leg = anim === 'walk' ? Math.sin(frame*0.4)*1.5 : 0

  const f = (c: string, ax: number, ay: number, aw = 1, ah = 1) => {
    ctx.fillStyle = c; ctx.fillRect(sx+ax*S, sy+ay*S, aw*S, ah*S)
  }

  if (anim === 'sleep') {
    // Curled-up blob
    f(C.body, 1,3, 10,6)
    f(C.belly, 3,4, 6,4)
    if (id === 'link' && C.stripe) { f(C.stripe,1,4,2,2); f(C.stripe,9,4,2,2) }
    // Tucked head
    f(C.body, 2,1, 4,3)
    f(C.nose, 4,3, 1,1)
    // Tail curled over
    f(C.body, 9,2, 2,4); f(C.body, 7,5, 3,2)
    // ZZZ
    ctx.fillStyle = '#93c5fd'; ctx.font = `${10}px sans-serif`
    ctx.textAlign = 'left'
    ctx.globalAlpha = 0.7 + Math.sin(frame*0.05)*0.3
    ctx.fillText('z', sx+W+2, sy+2)
    if (frame % 90 > 45) ctx.fillText('Z', sx+W+6, sy-6)
    ctx.globalAlpha = 1
    return
  }

  if (dir === 'down') {
    // Ears
    f(C.body, 1,0, 3,3); f(C.body, 8,0, 3,3)
    f(C.nose,  2,1, 1,1); f(C.nose, 9,1, 1,1)  // inner ear
    // Head
    f(C.body, 1,3, 10,5)
    // Eyes
    f(C.eye, 2,4, 2,2); f(k, 3,4, 1,2); f(w, 2,4, 1,1)
    f(C.eye, 8,4, 2,2); f(k, 9,4, 1,2); f(w, 8,4, 1,1)
    f(C.nose, 5,6, 2,1)
    if (id === 'link') { f(C.belly, 3,7, 6,1) }  // white muzzle
    // Body
    f(C.body, 2,8, 8,4)
    f(C.belly, 3,9, 6,3)
    if (id === 'link' && C.stripe) { f(C.stripe,2,9,2,2); f(C.stripe,8,9,2,2) }
    // Tail
    f(C.body, 10,7, 2,5); f(C.body, 8,11, 3,1)
    if (id === 'link') f('#f1f5f9', 8,11, 3,1)
    // Paws
    ctx.fillRect(sx+(2)*S, sy+(Math.round(12+leg))*S, 3*S, S)
    ctx.fillRect(sx+(7)*S, sy+(Math.round(12-leg))*S, 3*S, S)
    if (id === 'link') {
      f(C.nose, 8,11, 2,1)  // toe beans right paw
    }
  } else if (dir === 'up') {
    f(C.body, 2,0, 3,3); f(C.body, 7,0, 3,3)
    f(C.body, 1,3, 10,5)
    if (id === 'link' && C.stripe) { f(C.stripe,2,4,8,2) }
    f(C.body, 2,8, 8,4)
    // Tail visible from behind
    f(C.body, 10,6, 2,6); f(C.body, 8,11, 3,1)
    if (id === 'link') f('#f1f5f9', 8,11, 3,1)
    ctx.fillRect(sx+(2)*S, sy+(Math.round(12+leg))*S, 3*S, S)
    ctx.fillRect(sx+(7)*S, sy+(Math.round(12-leg))*S, 3*S, S)
  } else if (dir === 'right') {
    f(C.body, 8,0, 3,3); f(C.nose, 9,1, 1,1)
    f(C.body, 1,3, 10,5)
    f(C.eye, 8,4, 2,2); f(k, 9,4, 1,2); f(w, 8,4, 1,1)
    f(C.nose, 10,6, 1,1)
    if (id === 'link') { f(C.belly, 4,4, 5,4) }
    f(C.body, 1,8, 9,4); f(C.belly, 2,9, 6,3)
    if (id === 'link' && C.stripe) { f(C.stripe,1,9,2,2); f(C.stripe,1,11,2,2) }
    f(C.body, 0,7, 2,5); f(C.body, 0,5, 2,3)
    ctx.fillRect(sx+(3)*S, sy+(Math.round(12+leg))*S, 3*S, S)
    ctx.fillRect(sx+(6)*S, sy+(Math.round(12-leg))*S, 3*S, S)
  } else {
    f(C.body, 1,0, 3,3); f(C.nose, 2,1, 1,1)
    f(C.body, 1,3, 10,5)
    f(C.eye, 2,4, 2,2); f(k, 2,4, 1,2); f(w, 2,4, 1,1)
    f(C.nose, 1,6, 1,1)
    if (id === 'link') { f(C.belly, 3,4, 5,4) }
    f(C.body, 2,8, 9,4); f(C.belly, 4,9, 5,3)
    if (id === 'link' && C.stripe) { f(C.stripe,9,9,2,2); f(C.stripe,9,11,2,2) }
    f(C.body, 10,7, 2,5); f(C.body, 10,5, 2,3)
    ctx.fillRect(sx+(3)*S, sy+(Math.round(12+leg))*S, 3*S, S)
    ctx.fillRect(sx+(6)*S, sy+(Math.round(12-leg))*S, 3*S, S)
  }

  // Love hearts above head
  if (love > 0) {
    ctx.font = '10px serif'
    const hearts = ['❤️','🧡','💛'].slice(0, love).join('')
    ctx.fillText(hearts, sx + W/2, sy - 4)
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

  // Move toward target
  if (dist > 2) {
    const spd = CAT_SPEED * TS * dt
    cat.pos.x += (dx/dist)*spd
    cat.pos.y += (dy/dist)*spd
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
        pos:    { x: (BARN_CX+0.5)*TS, y: (BARN_BOT+8)*TS },
        target: { x: (BARN_CX+0.5)*TS, y: (BARN_BOT+8)*TS },
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
    const wx = cpos.x + gs.cam.x
    const wy = cpos.y + gs.cam.y
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

      // Move farmer
      const f = gs.farmer
      const fdx = f.target.x - f.pos.x, fdy = f.target.y - f.pos.y
      const fdist = Math.sqrt(fdx*fdx + fdy*fdy)
      if (fdist > 2) {
        const spd = FARMER_SPEED * TS * dt
        f.pos.x += (fdx/fdist)*spd; f.pos.y += (fdy/fdist)*spd
        f.moving = true; f.frame += dt*60
        if (Math.abs(fdx) > Math.abs(fdy)) f.dir = fdx > 0 ? 'right' : 'left'
        else f.dir = fdy > 0 ? 'down' : 'up'
      } else { f.pos.x = f.target.x; f.pos.y = f.target.y; f.moving = false }

      // Update cats
      for (const cat of gs.cats) updateCat(cat, gs.map, f, dt)

      // Smooth camera follow
      const targetCamX = f.pos.x - CW/2
      const targetCamY = f.pos.y - CH/2
      gs.cam.x += (targetCamX - gs.cam.x) * 0.1
      gs.cam.y += (targetCamY - gs.cam.y) * 0.1
      gs.cam.x = Math.max(0, Math.min(MW*TS - CW, gs.cam.x))
      gs.cam.y = Math.max(0, Math.min(MH*TS - CH, gs.cam.y))

      // ── Draw ──────────────────────────────────────────────────────────────
      const camX = gs.cam.x, camY = gs.cam.y
      const startTX = Math.floor(camX/TS), startTY = Math.floor(camY/TS)
      const endTX = Math.min(MW, startTX + Math.ceil(CW/TS) + 2)
      const endTY = Math.min(MH, startTY + Math.ceil(CH/TS) + 2)

      // Tiles
      for (let ty = startTY; ty < endTY; ty++) {
        for (let tx = startTX; tx < endTX; tx++) {
          const tile = gs.map[ty*MW+tx]
          if (tile === T_BARN) continue
          const sx = Math.round(tx*TS - camX), sy = Math.round(ty*TS - camY)
          drawTile(ctx, tile, sx, sy, ty*MW+tx)
        }
      }

      // Barn
      drawBarn(ctx, camX, camY)

      // Objects
      drawWaterBowl(ctx, Math.round(WATER_TX*TS - camX), Math.round(WATER_TY*TS - camY))
      drawFoodBowl(ctx, Math.round(FOOD_TX*TS - camX), Math.round(FOOD_TY*TS - camY), gs.foodBowlFood)
      ctx.save(); ctx.imageSmoothingEnabled = false
      drawArcade(ctx, Math.round(ARCADE_TX*TS - camX), Math.round(ARCADE_TY*TS - camY), gs.frame)
      ctx.restore()

      // Sort entities by Y for depth
      type Entity = { y: number; draw: () => void }
      const entities: Entity[] = []
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
      ctx.save(); ctx.imageSmoothingEnabled = false
      for (const e of entities) e.draw()
      ctx.restore()

      // HUD
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
