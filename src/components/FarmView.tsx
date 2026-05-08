import { useState, useCallback } from 'react'
import { ArrowLeft, Gamepad2 } from 'lucide-react'
import FarmGame from './FarmGame'
import { type FoodDef, FOODS, loadInventory, saveInventory, loadCatFed, saveCatFed, isFed, fedTimeLeft, bestFoodInInventory } from '../utils/farmUtils'
import '../styles/FarmView.css'

interface Props {
  onGoToChores: () => void
}

const ALCO_MESSAGES = [
  'Alco purrs softly... 💛',
  'Alco closes his golden eyes 😸',
  'Alco nuzzles your hand! 💛',
  'Alco kneads contentedly 💛',
  'Alco accepts your offering 😌',
]
const LINK_MESSAGES = [
  'Link trills happily! 💚',
  'Link headbutts your hand 🐾',
  'Link shows off his pink toes! 💚',
  'Link chirps at you 😊',
  'Link is very pleased 💚',
]
const FEED_MESSAGES: Record<string, string[]> = {
  kibble:     ['Alco sniffs it.', 'Fine. It\'s food.'],
  canned:     ['Acceptable.', 'They eat it quickly.'],
  tuna:       ['Eyes go wide! 😻', 'Gone in seconds!'],
  salmon:     ['A grateful head-bump! 😻', 'Pure joy.'],
  shrimp:     ['Absolutely delighted! 🎉', 'Best day ever!'],
  chicken:    ['Rolling on the floor! 😹', 'So so happy!'],
  lobster:    ['Pure ecstasy! ✨', 'This is the greatest moment.'],
  golden_rat: ['LEGENDARY FEAST! 👑🌟', 'A week of happiness secured!'],
}

// ── Pixel Art Cats ──────────────────────────────────────────────────────────

function AlcoCat({ petting, fed }: { petting: boolean; fed: boolean }) {
  // viewBox 0 0 112 128  |  display 140×160  |  pixel size = 8
  return (
    <svg width="140" height="160" viewBox="0 0 112 128"
      className={`cat-svg${petting ? ' petting' : ''}${fed ? ' cat-fed' : ''}`}>
      {/* Ears */}
      <rect x={16} y={0}  width={16} height={20} fill="#6b7280"/>
      <rect x={80} y={0}  width={16} height={20} fill="#6b7280"/>
      <rect x={20} y={8}  width={8}  height={8}  fill="#f9a8d4"/>
      <rect x={84} y={8}  width={8}  height={8}  fill="#f9a8d4"/>
      {/* Head */}
      <rect x={8}  y={16} width={96} height={52} fill="#9ca3af"/>
      {/* Left eye */}
      <rect x={20} y={28} width={16} height={16} fill="#fbbf24"/>
      <rect x={28} y={28} width={8}  height={16} fill="#111827"/>
      <rect x={20} y={28} width={8}  height={8}  fill="rgba(255,255,255,0.5)"/>
      {/* Right eye */}
      <rect x={76} y={28} width={16} height={16} fill="#fbbf24"/>
      <rect x={84} y={28} width={8}  height={16} fill="#111827"/>
      <rect x={76} y={28} width={8}  height={8}  fill="rgba(255,255,255,0.5)"/>
      {/* Nose */}
      <rect x={48} y={48} width={16} height={8}  fill="#f9a8d4"/>
      {/* Mouth */}
      <rect x={36} y={56} width={10} height={4}  fill="#6b7280"/>
      <rect x={66} y={56} width={10} height={4}  fill="#6b7280"/>
      {/* Whiskers */}
      <rect x={0}  y={46} width={22} height={2}  fill="#d1d5db"/>
      <rect x={0}  y={54} width={22} height={2}  fill="#d1d5db"/>
      <rect x={90} y={46} width={22} height={2}  fill="#d1d5db"/>
      <rect x={90} y={54} width={22} height={2}  fill="#d1d5db"/>
      {/* Body */}
      <rect x={12} y={68} width={88} height={52} fill="#9ca3af"/>
      {/* Belly */}
      <rect x={24} y={76} width={64} height={40} fill="#d1d5db"/>
      {/* Tail */}
      <rect x={96} y={52} width={14} height={48} fill="#9ca3af"/>
      <rect x={80} y={88} width={18} height={14} fill="#9ca3af"/>
      {/* Paws */}
      <rect x={12} y={116} width={30} height={12} fill="#9ca3af"/>
      <rect x={70} y={116} width={30} height={12} fill="#9ca3af"/>
      <rect x={12} y={116} width={30} height={6}  fill="#d1d5db"/>
      <rect x={70} y={116} width={30} height={6}  fill="#d1d5db"/>
      {fed && <rect x={8} y={68} width={96} height={6} fill="rgba(251,191,36,0.28)"/>}
    </svg>
  )
}

function LinkCat({ petting, fed }: { petting: boolean; fed: boolean }) {
  return (
    <svg width="140" height="160" viewBox="0 0 112 128"
      className={`cat-svg${petting ? ' petting' : ''}${fed ? ' cat-fed' : ''}`}>
      {/* Ears */}
      <rect x={16} y={0}  width={16} height={20} fill="#1f2937"/>
      <rect x={80} y={0}  width={16} height={20} fill="#1f2937"/>
      <rect x={20} y={8}  width={8}  height={8}  fill="#f9a8d4"/>
      <rect x={84} y={8}  width={8}  height={8}  fill="#f9a8d4"/>
      {/* Head */}
      <rect x={8}  y={16} width={96} height={52} fill="#1f2937"/>
      {/* Tabby forehead stripes */}
      <rect x={8}  y={20} width={96} height={4}  fill="#374151"/>
      <rect x={8}  y={30} width={96} height={4}  fill="#374151"/>
      {/* White muzzle */}
      <rect x={28} y={44} width={56} height={24} fill="#f1f5f9"/>
      {/* Left eye */}
      <rect x={20} y={28} width={16} height={16} fill="#10b981"/>
      <rect x={28} y={28} width={8}  height={16} fill="#111827"/>
      <rect x={20} y={28} width={8}  height={8}  fill="rgba(255,255,255,0.5)"/>
      {/* Right eye */}
      <rect x={76} y={28} width={16} height={16} fill="#10b981"/>
      <rect x={84} y={28} width={8}  height={16} fill="#111827"/>
      <rect x={76} y={28} width={8}  height={8}  fill="rgba(255,255,255,0.5)"/>
      {/* Nose — pink */}
      <rect x={48} y={48} width={16} height={8}  fill="#f9a8d4"/>
      {/* Mouth */}
      <rect x={36} y={56} width={10} height={4}  fill="#9ca3af"/>
      <rect x={66} y={56} width={10} height={4}  fill="#9ca3af"/>
      {/* Whiskers */}
      <rect x={0}  y={46} width={22} height={2}  fill="#9ca3af"/>
      <rect x={0}  y={54} width={22} height={2}  fill="#9ca3af"/>
      <rect x={90} y={46} width={22} height={2}  fill="#9ca3af"/>
      <rect x={90} y={54} width={22} height={2}  fill="#9ca3af"/>
      {/* Body */}
      <rect x={12} y={68} width={88} height={52} fill="#1f2937"/>
      {/* White chest */}
      <rect x={24} y={76} width={64} height={40} fill="#f1f5f9"/>
      {/* Tabby stripes on sides */}
      <rect x={12} y={76} width={12} height={6}  fill="#374151"/>
      <rect x={12} y={90} width={12} height={6}  fill="#374151"/>
      <rect x={12} y={104} width={12} height={6} fill="#374151"/>
      <rect x={88} y={76} width={12} height={6}  fill="#374151"/>
      <rect x={88} y={90} width={12} height={6}  fill="#374151"/>
      <rect x={88} y={104} width={12} height={6} fill="#374151"/>
      {/* Tail */}
      <rect x={96} y={52} width={14} height={48} fill="#1f2937"/>
      <rect x={80} y={88} width={18} height={14} fill="#1f2937"/>
      <rect x={80} y={96} width={18} height={8}  fill="#f1f5f9"/>
      {/* Left paw */}
      <rect x={12} y={116} width={30} height={12} fill="#1f2937"/>
      <rect x={12} y={116} width={30} height={6}  fill="#374151"/>
      {/* Right paw — white with pink toe beans */}
      <rect x={70} y={116} width={30} height={12} fill="#f1f5f9"/>
      <rect x={70} y={116} width={30} height={5}  fill="#1f2937"/>
      <rect x={72} y={118} width={6}  height={5}  fill="#f9a8d4"/>
      <rect x={80} y={118} width={6}  height={5}  fill="#f9a8d4"/>
      <rect x={88} y={118} width={6}  height={5}  fill="#f9a8d4"/>
      {fed && <rect x={8} y={68} width={96} height={6} fill="rgba(16,185,129,0.28)"/>}
    </svg>
  )
}

// ── Pixel Art Barn ───────────────────────────────────────────────────────────

function PixelBarn() {
  return (
    <svg width="380" height="300" viewBox="0 0 380 300" className="farm-barn-svg">
      {/* Roof */}
      <polygon points="0,128 190,24 380,128" fill="#374151"/>
      <polygon points="4,128 190,30 376,128" fill="#4b5563"/>
      {/* Roof shingle lines */}
      {[60,80,100,118].map(y => (
        <rect key={y} x={Math.round((y-24)/104*190)} y={y} width={Math.round(380-(y-24)/104*380)} height={3} fill="rgba(0,0,0,0.18)"/>
      ))}
      {/* Ridge cap */}
      <rect x={180} y={20} width={20} height={12} fill="#1f2937"/>
      {/* Weather vane pole */}
      <rect x={188} y={0}  width={4}  height={24} fill="#6b7280"/>
      <rect x={174} y={6}  width={32} height={4}  fill="#6b7280"/>
      <polygon points="188,2 176,12 188,12" fill="#9ca3af"/>
      <polygon points="192,2 204,12 192,12" fill="#9ca3af"/>

      {/* Main barn body */}
      <rect x={0}   y={124} width={380} height={176} fill="#7c1d1d"/>
      {/* Wood plank lines */}
      {[148,172,196,220,244,268].map(y => (
        <rect key={y} x={0} y={y} width={380} height={3} fill="rgba(0,0,0,0.15)"/>
      ))}
      {/* Vertical plank shadows */}
      {[60,120,180,240,300].map(x => (
        <rect key={x} x={x} y={124} width={4} height={176} fill="rgba(0,0,0,0.12)"/>
      ))}

      {/* Loft door */}
      <rect x={148} y={134} width={84} height={66} fill="#5c0f0f"/>
      <rect x={144} y={130} width={4}  height={74} fill="#8b3a10"/>
      <rect x={232} y={130} width={4}  height={74} fill="#8b3a10"/>
      <rect x={144} y={130} width={92} height={4}  fill="#8b3a10"/>
      <rect x={148} y={162} width={84} height={4}  fill="#7c2020"/>
      <rect x={186} y={134} width={8}  height={66} fill="#7c2020"/>

      {/* Left window */}
      <rect x={24}  y={154} width={52} height={44} fill="#93c5fd"/>
      <rect x={24}  y={154} width={52} height={4}  fill="#6ab0f5"/>
      <rect x={48}  y={154} width={4}  height={44} fill="#8b3a10"/>
      <rect x={24}  y={174} width={52} height={4}  fill="#8b3a10"/>
      <rect x={20}  y={150} width={4}  height={52} fill="#8b3a10"/>
      <rect x={76}  y={150} width={4}  height={52} fill="#8b3a10"/>
      <rect x={20}  y={150} width={60} height={4}  fill="#8b3a10"/>
      <rect x={20}  y={198} width={60} height={4}  fill="#8b3a10"/>

      {/* Right window */}
      <rect x={304} y={154} width={52} height={44} fill="#93c5fd"/>
      <rect x={304} y={154} width={52} height={4}  fill="#6ab0f5"/>
      <rect x={328} y={154} width={4}  height={44} fill="#8b3a10"/>
      <rect x={304} y={174} width={52} height={4}  fill="#8b3a10"/>
      <rect x={300} y={150} width={4}  height={52} fill="#8b3a10"/>
      <rect x={356} y={150} width={4}  height={52} fill="#8b3a10"/>
      <rect x={300} y={150} width={60} height={4}  fill="#8b3a10"/>
      <rect x={300} y={198} width={60} height={4}  fill="#8b3a10"/>

      {/* Main doors */}
      <rect x={92}  y={216} width={76} height={84} fill="#5c0f0f"/>
      <rect x={212} y={216} width={76} height={84} fill="#5c0f0f"/>
      {/* Door frames */}
      <rect x={88}  y={212} width={4}  height={88} fill="#8b3a10"/>
      <rect x={168} y={212} width={8}  height={88} fill="#8b3a10"/>
      <rect x={288} y={212} width={4}  height={88} fill="#8b3a10"/>
      <rect x={88}  y={212} width={204} height={4} fill="#8b3a10"/>
      {/* Door X crosses */}
      <rect x={92}  y={250} width={76} height={4}  fill="#7c2020"/>
      <rect x={128} y={216} width={4}  height={84} fill="#7c2020"/>
      <rect x={212} y={250} width={76} height={4}  fill="#7c2020"/>
      <rect x={248} y={216} width={4}  height={84} fill="#7c2020"/>

      {/* Ground shadow under barn */}
      <rect x={0} y={296} width={380} height={4} fill="rgba(0,0,0,0.25)"/>
    </svg>
  )
}

// ── Component state ──────────────────────────────────────────────────────────

interface PetState { petting: boolean; message: string; heartKey: number }
const IDLE: PetState = { petting: false, message: '', heartKey: 0 }

export default function FarmView({ onGoToChores }: Props) {
  const [showGame, setShowGame] = useState(false)
  const [alco, setAlco] = useState<PetState>(IDLE)
  const [link, setLink] = useState<PetState>(IDLE)
  const [inventory, setInventory] = useState<Record<string, number>>(loadInventory)
  const [catFed, setCatFed] = useState(loadCatFed)
  const [feedMsg, setFeedMsg] = useState<{ cat: string; text: string } | null>(null)
  const [, forceUpdate] = useState(0)

  const pet = (who: 'alco' | 'link') => {
    const msgs = who === 'alco' ? ALCO_MESSAGES : LINK_MESSAGES
    const msg = msgs[Math.floor(Math.random() * msgs.length)]
    const setter = who === 'alco' ? setAlco : setLink
    setter({ petting: true, message: msg, heartKey: Date.now() })
    setTimeout(() => setter(s => ({ ...s, petting: false })), 600)
    setTimeout(() => setter(s => ({ ...s, message: '' })), 1800)
  }

  const feedCat = (cat: 'alco' | 'link') => {
    const best = bestFoodInInventory(inventory)
    if (!best) return
    const fedUntil = new Date(Date.now() + best.feedHours * 3600000).toISOString()
    const newFed = { ...catFed, [cat]: fedUntil }
    const newInv = { ...inventory, [best.id]: Math.max(0, (inventory[best.id] || 0) - 1) }
    setCatFed(newFed); saveCatFed(newFed)
    setInventory(newInv); saveInventory(newInv)
    const msgs = FEED_MESSAGES[best.id] || ['Nom nom!']
    setFeedMsg({ cat, text: msgs[Math.floor(Math.random() * msgs.length)] })
    setTimeout(() => setFeedMsg(null), 2200)
  }

  const handleEarnFood = useCallback((food: FoodDef) => {
    setInventory(prev => {
      const next = { ...prev, [food.id]: (prev[food.id] || 0) + 1 }
      saveInventory(next)
      return next
    })
  }, [])

  const totalFood = Object.values(inventory).reduce((s, n) => s + n, 0)
  const hasBest = !!bestFoodInInventory(inventory)

  useState(() => { const id = setInterval(() => forceUpdate(n => n + 1), 60000); return () => clearInterval(id) })

  if (showGame) return <FarmGame onBack={() => setShowGame(false)} onEarnFood={handleEarnFood} />

  return (
    <div className="farm-app">
      <header className="farm-header">
        <div className="farm-header-content">
          <button className="btn-farm-back" onClick={onGoToChores}>
            <ArrowLeft size={16} /> Back to Chores
          </button>
          <h1>🐾 Our Farm</h1>
          <button className="btn-farm-play" onClick={() => setShowGame(true)}>
            <Gamepad2 size={16} /> Play Game
          </button>
        </div>
      </header>

      <div className="farm-scene">
        {/* Clouds */}
        <div className="farm-clouds">
          <div className="cloud cloud-1"/><div className="cloud cloud-2"/><div className="cloud cloud-3"/>
        </div>

        {/* Flying birds */}
        <div className="farm-birds">
          <div className="pixel-bird bird-1"/>
          <div className="pixel-bird bird-2"/>
          <div className="pixel-bird bird-3"/>
          <div className="pixel-bird bird-4"/>
          <div className="pixel-bird bird-5"/>
        </div>

        {/* Barn background */}
        <div className="farm-barn">
          <PixelBarn />
        </div>

        {/* Fence */}
        <div className="farm-fence-row">
          <svg className="farm-fence-svg" viewBox="0 0 900 70" preserveAspectRatio="xMidYMid slice">
            {Array.from({ length: 28 }, (_, i) => (
              <g key={i} transform={`translate(${i * 32}, 0)`}>
                <rect x="3" y="10" width="14" height="54" rx="1" fill="#8b5a1e"/>
                <polygon points="10,2 3,10 17,10" fill="#a06828"/>
                <rect x="4" y="11" width="4" height="52" rx="0" fill="#a06828"/>
              </g>
            ))}
            <rect x="0" y="22" width="900" height="8" rx="2" fill="#a06828"/>
            <rect x="0" y="42" width="900" height="8" rx="2" fill="#a06828"/>
          </svg>
        </div>

        {/* Animals + Pantry */}
        <div className="farm-animals-area">

          {/* Alco */}
          <div className="animal-wrapper">
            <div className="animal-card" onClick={() => pet('alco')} role="button" aria-label="Pet Alco">
              {alco.message && (
                <div key={alco.heartKey} className="heart-layer">
                  {[0,1,2,3,4].map(i => <span key={i} className="floating-heart" style={{ left: `${15 + i * 17}%`, animationDelay: `${i * 0.12}s` }}>💛</span>)}
                </div>
              )}
              <AlcoCat petting={alco.petting} fed={isFed(catFed, 'alco')} />
              <div className="animal-name">Alco</div>
              {isFed(catFed, 'alco')
                ? <div className="fed-status fed-status--ok">🍽 Fed · {fedTimeLeft(catFed, 'alco')} left</div>
                : <div className="fed-status fed-status--hungry">😿 Hungry</div>
              }
              {alco.message && <div className="pet-message">{alco.message}</div>}
              {!alco.message && <div className="pet-hint">Click to pet</div>}
            </div>
            {feedMsg?.cat === 'alco' ? (
              <div className="feed-reaction">{feedMsg.text}</div>
            ) : hasBest && !isFed(catFed, 'alco') ? (
              <button className="btn-feed" onClick={() => feedCat('alco')}>🍽 Feed best food</button>
            ) : null}
          </div>

          {/* Pantry */}
          <div className="pantry">
            <div className="pantry-title">🏠 Pantry</div>
            {totalFood === 0 ? (
              <div className="pantry-empty">
                <div style={{ fontSize: '28px' }}>🎮</div>
                <div>Play the game to<br/>earn cat food!</div>
              </div>
            ) : (
              <div className="pantry-grid">
                {FOODS.filter(f => (inventory[f.id] || 0) > 0).map(food => (
                  <div key={food.id} className={`pantry-item rarity-${food.rarity}`} title={`${food.name} (${food.nameEs}) — ${food.rarityLabel}`}>
                    <span className="pantry-emoji">{food.emoji}</span>
                    <span className="pantry-count">×{inventory[food.id]}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="pantry-hint">Earn food by playing →</div>
          </div>

          {/* Link */}
          <div className="animal-wrapper">
            <div className="animal-card" onClick={() => pet('link')} role="button" aria-label="Pet Link">
              {link.message && (
                <div key={link.heartKey} className="heart-layer">
                  {[0,1,2,3,4].map(i => <span key={i} className="floating-heart" style={{ left: `${15 + i * 17}%`, animationDelay: `${i * 0.12}s` }}>💚</span>)}
                </div>
              )}
              <LinkCat petting={link.petting} fed={isFed(catFed, 'link')} />
              <div className="animal-name">Link</div>
              {isFed(catFed, 'link')
                ? <div className="fed-status fed-status--ok">🍽 Fed · {fedTimeLeft(catFed, 'link')} left</div>
                : <div className="fed-status fed-status--hungry">😿 Hungry</div>
              }
              {link.message && <div className="pet-message">{link.message}</div>}
              {!link.message && <div className="pet-hint">Click to pet</div>}
            </div>
            {feedMsg?.cat === 'link' ? (
              <div className="feed-reaction">{feedMsg.text}</div>
            ) : hasBest && !isFed(catFed, 'link') ? (
              <button className="btn-feed" onClick={() => feedCat('link')}>🍽 Feed best food</button>
            ) : null}
          </div>
        </div>

        <div className="farm-ground-strip" />
      </div>
    </div>
  )
}
