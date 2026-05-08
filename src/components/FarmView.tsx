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

function AlcoCat({ petting, fed }: { petting: boolean; fed: boolean }) {
  return (
    <svg width="140" height="170" viewBox="0 0 140 170" className={`cat-svg${petting ? ' petting' : ''}${fed ? ' cat-fed' : ''}`}>
      <path d="M108,138 C138,120 148,88 126,70 C114,60 104,72 112,82" stroke="#9ca3af" strokeWidth="13" fill="none" strokeLinecap="round"/>
      <path d="M108,138 C138,120 148,88 126,70 C114,60 104,72 112,82" stroke="#d1d5db" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <ellipse cx="68" cy="112" rx="36" ry="42" fill="#9ca3af"/>
      <ellipse cx="68" cy="122" rx="20" ry="28" fill="#d1d5db"/>
      <ellipse cx="68" cy="60" rx="31" ry="30" fill="#9ca3af"/>
      <polygon points="40,42 30,12 58,34" fill="#9ca3af"/>
      <polygon points="42,40 34,18 56,33" fill="#f9a8d4"/>
      <polygon points="96,42 106,12 78,34" fill="#9ca3af"/>
      <polygon points="94,40 102,18 80,33" fill="#f9a8d4"/>
      <ellipse cx="54" cy="58" rx="10" ry="9" fill="#fbbf24"/>
      <ellipse cx="82" cy="58" rx="10" ry="9" fill="#fbbf24"/>
      <ellipse cx="54" cy="58" rx="5" ry="8" fill="#111827"/>
      <ellipse cx="82" cy="58" rx="5" ry="8" fill="#111827"/>
      <circle cx="56" cy="54" r="2.5" fill="white"/>
      <circle cx="84" cy="54" r="2.5" fill="white"/>
      <polygon points="68,70 63,76 73,76" fill="#f9a8d4"/>
      <path d="M63,76 Q68,82 73,76" stroke="#9ca3af" strokeWidth="1.5" fill="none"/>
      <line x1="28" y1="70" x2="60" y2="73" stroke="#e5e7eb" strokeWidth="1.5"/>
      <line x1="28" y1="76" x2="60" y2="76" stroke="#e5e7eb" strokeWidth="1.5"/>
      <line x1="28" y1="82" x2="60" y2="79" stroke="#e5e7eb" strokeWidth="1.5"/>
      <line x1="108" y1="70" x2="76" y2="73" stroke="#e5e7eb" strokeWidth="1.5"/>
      <line x1="108" y1="76" x2="76" y2="76" stroke="#e5e7eb" strokeWidth="1.5"/>
      <line x1="108" y1="82" x2="76" y2="79" stroke="#e5e7eb" strokeWidth="1.5"/>
      <ellipse cx="50" cy="154" rx="14" ry="9" fill="#9ca3af"/>
      <ellipse cx="86" cy="154" rx="14" ry="9" fill="#9ca3af"/>
      <ellipse cx="50" cy="154" rx="11" ry="6" fill="#d1d5db"/>
      <ellipse cx="86" cy="154" rx="11" ry="6" fill="#d1d5db"/>
      {fed && <ellipse cx="68" cy="100" rx="28" ry="8" fill="rgba(251,191,36,0.18)" />}
    </svg>
  )
}

function LinkCat({ petting, fed }: { petting: boolean; fed: boolean }) {
  return (
    <svg width="140" height="170" viewBox="0 0 140 170" className={`cat-svg${petting ? ' petting' : ''}${fed ? ' cat-fed' : ''}`}>
      <path d="M108,138 C136,122 145,90 124,72 C112,62 102,74 110,84" stroke="#111827" strokeWidth="13" fill="none" strokeLinecap="round"/>
      <path d="M124,72 C112,62 102,74 110,84" stroke="#f9fafb" strokeWidth="7" fill="none" strokeLinecap="round"/>
      <ellipse cx="68" cy="112" rx="38" ry="44" fill="#1f2937"/>
      <ellipse cx="68" cy="122" rx="22" ry="30" fill="#f1f5f9"/>
      <ellipse cx="68" cy="60" rx="33" ry="31" fill="#1f2937"/>
      <ellipse cx="68" cy="68" rx="18" ry="14" fill="#f1f5f9"/>
      <polygon points="38,42 28,10 58,34" fill="#1f2937"/>
      <polygon points="40,40 32,16 56,33" fill="#f9a8d4"/>
      <polygon points="98,42 108,10 78,34" fill="#1f2937"/>
      <polygon points="96,40 104,16 80,33" fill="#f9a8d4"/>
      <path d="M46,36 Q58,30 70,33" stroke="#374151" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M50,28 Q62,22 74,25" stroke="#374151" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <ellipse cx="54" cy="57" rx="10" ry="9" fill="#10b981"/>
      <ellipse cx="82" cy="57" rx="10" ry="9" fill="#10b981"/>
      <ellipse cx="54" cy="57" rx="5" ry="8" fill="#111827"/>
      <ellipse cx="82" cy="57" rx="5" ry="8" fill="#111827"/>
      <circle cx="56" cy="53" r="2.5" fill="white"/>
      <circle cx="84" cy="53" r="2.5" fill="white"/>
      <polygon points="68,70 63,76 73,76" fill="#f9a8d4"/>
      <path d="M63,76 Q68,82 73,76" stroke="#9ca3af" strokeWidth="1.5" fill="none"/>
      <line x1="28" y1="70" x2="60" y2="73" stroke="#cbd5e1" strokeWidth="1.5"/>
      <line x1="28" y1="76" x2="60" y2="76" stroke="#cbd5e1" strokeWidth="1.5"/>
      <line x1="28" y1="82" x2="60" y2="79" stroke="#cbd5e1" strokeWidth="1.5"/>
      <line x1="108" y1="70" x2="76" y2="73" stroke="#cbd5e1" strokeWidth="1.5"/>
      <line x1="108" y1="76" x2="76" y2="76" stroke="#cbd5e1" strokeWidth="1.5"/>
      <line x1="108" y1="82" x2="76" y2="79" stroke="#cbd5e1" strokeWidth="1.5"/>
      <ellipse cx="50" cy="154" rx="14" ry="9" fill="#1f2937"/>
      <ellipse cx="50" cy="154" rx="11" ry="6" fill="#374151"/>
      <ellipse cx="86" cy="154" rx="14" ry="9" fill="#f1f5f9"/>
      <circle cx="81" cy="153" r="3.5" fill="#f9a8d4"/>
      <circle cx="86" cy="156" r="3" fill="#f9a8d4"/>
      <circle cx="91" cy="153" r="3" fill="#f9a8d4"/>
      {fed && <ellipse cx="68" cy="100" rx="28" ry="8" fill="rgba(16,185,129,0.18)" />}
    </svg>
  )
}

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

  // Refresh fed status every minute
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
        <div className="farm-clouds">
          <div className="cloud cloud-1" /><div className="cloud cloud-2" /><div className="cloud cloud-3" />
        </div>

        <div className="farm-fence-row">
          <svg className="farm-fence-svg" viewBox="0 0 900 70" preserveAspectRatio="xMidYMid slice">
            {Array.from({ length: 28 }, (_, i) => (
              <g key={i} transform={`translate(${i * 32}, 0)`}>
                <rect x="3" y="10" width="14" height="54" rx="2" fill="#8b6914"/>
                <polygon points="10,2 3,10 17,10" fill="#a07820"/>
                <rect x="4" y="11" width="4" height="52" rx="1" fill="#a07820"/>
              </g>
            ))}
            <rect x="0" y="22" width="900" height="8" rx="3" fill="#a07820"/>
            <rect x="0" y="42" width="900" height="8" rx="3" fill="#a07820"/>
          </svg>
        </div>

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
