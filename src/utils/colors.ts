import type { PhaseCategory, CertaintyLevel } from '@/types'

// Wong colorblind-safe palette
export const CATEGORY_COLORS: Record<PhaseCategory, string> = {
  career: 'hsl(230, 65%, 55%)',
  education: 'hsl(40, 95%, 50%)',
  family: 'hsl(340, 75%, 55%)',
  caregiving: 'hsl(160, 60%, 45%)',
  health: 'hsl(0, 70%, 55%)',
  housing: 'hsl(270, 55%, 55%)',
  financial: 'hsl(25, 85%, 55%)',
  personal: 'hsl(195, 75%, 45%)',
  relationship: 'hsl(320, 65%, 55%)',
  'biologic-rhythms': 'hsl(85, 55%, 45%)',
}

export const CERTAINTY_OPACITY: Record<CertaintyLevel, number> = {
  confirmed: 1.0,
  likely: 0.8,
  possible: 0.55,
  speculative: 0.35,
}

export const CERTAINTY_DASH: Record<CertaintyLevel, string> = {
  confirmed: 'none',
  likely: '8 3',
  possible: '5 5',
  speculative: '2 4',
}

export function stressColor(score: number): string {
  if (score <= 25) return 'hsl(120, 60%, 45%)'  // green
  if (score <= 50) return 'hsl(50, 80%, 50%)'   // yellow
  if (score <= 75) return 'hsl(30, 85%, 50%)'   // orange
  return 'hsl(0, 70%, 50%)'                      // red
}
