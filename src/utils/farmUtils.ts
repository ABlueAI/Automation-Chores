export interface FoodDef {
  id: string
  name: string
  nameEs: string
  emoji: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  rarityLabel: string
  color: string
  bgColor: string
  glowColor: string
  description: string
  feedHours: number  // how long this food keeps a cat fed
}

export const FOODS: FoodDef[] = [
  {
    id: 'kibble', name: 'Kibble', nameEs: 'Croquetas', emoji: '🐾', rarity: 'common',
    rarityLabel: 'Common', color: '#9ca3af', bgColor: '#f3f4f6', glowColor: 'rgba(156,163,175,0.4)',
    description: 'Dry kibble — a humble meal.', feedHours: 2,
  },
  {
    id: 'canned', name: 'Canned Bits', nameEs: 'Comida Enlatada', emoji: '🥫', rarity: 'common',
    rarityLabel: 'Common', color: '#9ca3af', bgColor: '#f3f4f6', glowColor: 'rgba(156,163,175,0.4)',
    description: 'Tasty canned food. They\'ll accept it.', feedHours: 4,
  },
  {
    id: 'tuna', name: 'Fresh Tuna', nameEs: 'Atún Fresco', emoji: '🐟', rarity: 'uncommon',
    rarityLabel: 'Uncommon', color: '#22c55e', bgColor: '#dcfce7', glowColor: 'rgba(34,197,94,0.4)',
    description: 'A nice chunk of fresh tuna.', feedHours: 12,
  },
  {
    id: 'salmon', name: 'Grilled Salmon', nameEs: 'Salmón a la Plancha', emoji: '🍣', rarity: 'uncommon',
    rarityLabel: 'Uncommon', color: '#22c55e', bgColor: '#dcfce7', glowColor: 'rgba(34,197,94,0.4)',
    description: 'Lightly grilled. Fancy for a Tuesday.', feedHours: 18,
  },
  {
    id: 'shrimp', name: 'Shrimp Platter', nameEs: 'Plato de Camarones', emoji: '🦐', rarity: 'rare',
    rarityLabel: 'Rare', color: '#3b82f6', bgColor: '#dbeafe', glowColor: 'rgba(59,130,246,0.5)',
    description: 'A whole platter! Very impressive.', feedHours: 36,
  },
  {
    id: 'chicken', name: 'Roast Chicken', nameEs: 'Pollo Asado', emoji: '🍗', rarity: 'rare',
    rarityLabel: 'Rare', color: '#3b82f6', bgColor: '#dbeafe', glowColor: 'rgba(59,130,246,0.5)',
    description: 'Golden roasted perfection.', feedHours: 48,
  },
  {
    id: 'lobster', name: 'Lobster Tail', nameEs: 'Cola de Langosta', emoji: '🦞', rarity: 'epic',
    rarityLabel: 'Epic', color: '#8b5cf6', bgColor: '#ede9fe', glowColor: 'rgba(139,92,246,0.6)',
    description: 'An extravagant feast. Worth every point.', feedHours: 96,
  },
  {
    id: 'golden_rat', name: 'Golden Rat', nameEs: 'Rata Dorada', emoji: '🐀', rarity: 'legendary',
    rarityLabel: 'Legendary ✨', color: '#f59e0b', bgColor: '#fef3c7', glowColor: 'rgba(245,158,11,0.7)',
    description: 'The ultimate prize. Keeps a cat fed for a full week!', feedHours: 168,
  },
]

export const FOOD_MAP = Object.fromEntries(FOODS.map(f => [f.id, f]))

interface TierEntry { weight: number; food: FoodDef }
const T: Record<string, TierEntry[]> = {
  tier0: [  // 0–49m
    { weight: 60, food: FOOD_MAP['kibble'] },
    { weight: 40, food: FOOD_MAP['canned'] },
  ],
  tier1: [  // 50–149m
    { weight: 20, food: FOOD_MAP['kibble'] },
    { weight: 20, food: FOOD_MAP['canned'] },
    { weight: 35, food: FOOD_MAP['tuna'] },
    { weight: 25, food: FOOD_MAP['salmon'] },
  ],
  tier2: [  // 150–299m
    { weight: 10, food: FOOD_MAP['tuna'] },
    { weight: 10, food: FOOD_MAP['salmon'] },
    { weight: 45, food: FOOD_MAP['shrimp'] },
    { weight: 35, food: FOOD_MAP['chicken'] },
  ],
  tier3: [  // 300–449m
    { weight: 25, food: FOOD_MAP['shrimp'] },
    { weight: 30, food: FOOD_MAP['chicken'] },
    { weight: 45, food: FOOD_MAP['lobster'] },
  ],
  tier4: [  // 450m+
    { weight: 75, food: FOOD_MAP['lobster'] },
    { weight: 25, food: FOOD_MAP['golden_rat'] },
  ],
}

function weightedPick(entries: TierEntry[]): FoodDef {
  const total = entries.reduce((s, e) => s + e.weight, 0)
  let roll = Math.random() * total
  for (const e of entries) {
    roll -= e.weight
    if (roll <= 0) return e.food
  }
  return entries[entries.length - 1].food
}

export function pickFood(score: number): FoodDef {
  if (score >= 450) return weightedPick(T.tier4)
  if (score >= 300) return weightedPick(T.tier3)
  if (score >= 150) return weightedPick(T.tier2)
  if (score >= 50)  return weightedPick(T.tier1)
  return weightedPick(T.tier0)
}

// ── Storage helpers (localStorage) ──

export function loadInventory(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem('farmFoodCounts') || '{}') } catch { return {} }
}

export function saveInventory(inv: Record<string, number>) {
  localStorage.setItem('farmFoodCounts', JSON.stringify(inv))
}

export function loadCatFed(): Record<string, string | null> {
  try { return JSON.parse(localStorage.getItem('farmCatFed') || '{}') } catch { return {} }
}

export function saveCatFed(fed: Record<string, string | null>) {
  localStorage.setItem('farmCatFed', JSON.stringify(fed))
}

export function isFed(fed: Record<string, string | null>, cat: string): boolean {
  const until = fed[cat]
  return !!until && new Date(until) > new Date()
}

export function fedTimeLeft(fed: Record<string, string | null>, cat: string): string | null {
  const until = fed[cat]
  if (!until || new Date(until) <= new Date()) return null
  const ms = new Date(until).getTime() - Date.now()
  const h = Math.floor(ms / 3600000)
  const d = Math.floor(h / 24)
  if (d >= 1) return `${d}d ${h % 24}h`
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function bestFoodInInventory(inv: Record<string, number>): FoodDef | null {
  return FOODS.filter(f => (inv[f.id] || 0) > 0).sort((a, b) => b.feedHours - a.feedHours)[0] ?? null
}
