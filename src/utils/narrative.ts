import type { PhaseCategory, MonthlyProjection } from '@/types'

// Collaborative, non-judgmental labels
const CATEGORY_LABELS: Record<PhaseCategory, string> = {
  career: 'Work & Career',
  education: 'Learning & Growth',
  family: 'Family Life',
  caregiving: 'Caring for Others',
  health: 'Health & Wellness',
  housing: 'Home & Living',
  financial: 'Financial Planning',
  personal: 'Personal Goals',
  relationship: 'Relationships',
  'biologic-rhythms': 'Body & Rhythms',
}

const CATEGORY_ICONS: Record<PhaseCategory, string> = {
  career: '\u{1F4BC}',    // briefcase
  education: '\u{1F393}', // grad cap
  family: '\u{1F46A}',    // family
  caregiving: '\u{1F49C}', // purple heart
  health: '\u{1F3E5}',    // hospital
  housing: '\u{1F3E0}',   // house
  financial: '\u{1F4B0}', // money bag
  personal: '\u{2B50}',   // star
  relationship: '\u{1F91D}', // handshake
  'biologic-rhythms': '\u{1F319}', // crescent moon
}

export function getCategoryLabel(category: PhaseCategory): string {
  return CATEGORY_LABELS[category] ?? category
}

export function getCategoryIcon(category: PhaseCategory): string {
  return CATEGORY_ICONS[category] ?? '\u{1F4CB}'
}

export function stressEmoji(score: number): string {
  if (score <= 20) return '\u{1F60C}' // relieved
  if (score <= 40) return '\u{1F642}' // slight smile
  if (score <= 60) return '\u{1F610}' // neutral
  if (score <= 80) return '\u{1F615}' // confused/concerned
  return '\u{1F630}' // anxious
}

export function stressNarrative(score: number): string {
  if (score <= 20) return 'a calm, manageable period'
  if (score <= 40) return 'a balanced time with some activity'
  if (score <= 60) return 'a busy period with moderate demands'
  if (score <= 80) return 'an intensive period requiring careful planning'
  return 'a very demanding period — consider support options'
}

export function financialNarrative(projection: MonthlyProjection): string {
  if (projection.netCashflow > 2000) return 'financially comfortable period'
  if (projection.netCashflow > 0) return 'modest positive cashflow'
  if (projection.netCashflow > -1000) return 'slightly drawing on savings'
  return 'significant reliance on savings or reserves'
}

export function formatDurationFriendly(months: number): string {
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  if (years === 0) return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`
  if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`
  return `${years} year${years !== 1 ? 's' : ''} and ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`
}
