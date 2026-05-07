import React, { useState, useEffect } from 'react'
import '../styles/ConfettiCelebration.css'

const MESSAGES = [
  'Good Job!',
  'Great Work!',
  'Excellent!',
  'Amazing!',
  'Fantastic!',
  '¡Trabajo Bueno! 😊',
  '¡Muy Bien!',
  '¡Excelente!',
  'Awesome!',
  'Well Done!',
  'Keep It Up!',
  '¡Así Se Hace!',
]

const COLORS = [
  '#2563eb', '#f59e0b', '#ef4444', '#10b981',
  '#8b5cf6', '#ec4899', '#f97316', '#06b6d4',
  '#ffd700', '#ff6b6b', '#4ade80', '#a78bfa',
]

const TOKEN_INFO: Record<number, { label: string; stars: string }> = {
  3: { label: 'Early Bird!', stars: '⭐⭐⭐' },
  2: { label: 'Right on Time!', stars: '⭐⭐' },
  1: { label: 'Completed!', stars: '⭐' },
}

interface ConfettiPiece {
  id: number
  x: number
  color: string
  delay: number
  duration: number
  w: number
  h: number
  rot: number
  circle: boolean
}

function makePieces(n = 90): ConfettiPiece[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 0.9,
    duration: 2.2 + Math.random() * 1.6,
    w: 6 + Math.random() * 9,
    h: 4 + Math.random() * 11,
    rot: Math.random() * 360,
    circle: Math.random() > 0.55,
  }))
}

interface Props {
  tokens: number
  memberName: string
  onDone: () => void
}

export const ConfettiCelebration: React.FC<Props> = ({ tokens, memberName, onDone }) => {
  const [pieces] = useState(makePieces)
  const [message] = useState(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)])

  useEffect(() => {
    const t = setTimeout(onDone, 3600)
    return () => clearTimeout(t)
  }, [onDone])

  const info = TOKEN_INFO[tokens] ?? TOKEN_INFO[1]

  return (
    <div className="confetti-overlay" onClick={onDone}>
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.x}%`,
            background: p.color,
            width: p.w,
            height: p.circle ? p.w : p.h,
            borderRadius: p.circle ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}

      <div className="confetti-card" onClick={e => e.stopPropagation()}>
        <div className="confetti-emoji">🎉</div>
        <div className="confetti-message">{message}</div>
        {memberName && <div className="confetti-member">{memberName}</div>}
        <div className="confetti-token-box">
          <div className="token-stars">{info.stars}</div>
          <div className="token-label">{info.label}</div>
          <div className="token-award">+{tokens} token{tokens !== 1 ? 's' : ''} earned</div>
        </div>
        <p className="confetti-hint">Tap anywhere to close</p>
      </div>
    </div>
  )
}
