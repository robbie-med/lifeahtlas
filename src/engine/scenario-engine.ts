import type { MonthlyProjection, StressScore, ScenarioDiff } from '@/types'
import { getPeakStress, getRedZoneMonths, getMinimumFreeTime } from './stress-engine'

export function computeScenarioDiff(
  aProjections: MonthlyProjection[],
  bProjections: MonthlyProjection[],
  aStress: StressScore[],
  bStress: StressScore[],
  retirementMonth: string,
): ScenarioDiff {
  const aRetirement = aProjections.find((p) => p.month === retirementMonth)?.netWorth ?? 0
  const bRetirement = bProjections.find((p) => p.month === retirementMonth)?.netWorth ?? 0

  const aPeakStress = getPeakStress(aStress)
  const bPeakStress = getPeakStress(bStress)

  const aWorst = aProjections.length > 0
    ? aProjections.reduce((w, p) => (p.netCashflow < w.netCashflow ? p : w))
    : null
  const bWorst = bProjections.length > 0
    ? bProjections.reduce((w, p) => (p.netCashflow < w.netCashflow ? p : w))
    : null

  const aRedZone = getRedZoneMonths(aStress)
  const bRedZone = getRedZoneMonths(bStress)

  const aFreeMin = getMinimumFreeTime(aStress)
  const bFreeMin = getMinimumFreeTime(bStress)

  return {
    netWorthAtRetirement: {
      a: aRetirement,
      b: bRetirement,
      delta: bRetirement - aRetirement,
    },
    peakStress: {
      a: aPeakStress?.composite ?? 0,
      b: bPeakStress?.composite ?? 0,
      delta: (bPeakStress?.composite ?? 0) - (aPeakStress?.composite ?? 0),
    },
    worstMonth: {
      a: aWorst?.month ?? '',
      b: bWorst?.month ?? '',
    },
    redZoneMonths: {
      a: aRedZone,
      b: bRedZone,
      delta: bRedZone - aRedZone,
    },
    freeTimeMinimum: {
      a: aFreeMin,
      b: bFreeMin,
      delta: bFreeMin - aFreeMin,
    },
  }
}

// Format diff with neutral language
export function formatDelta(delta: number, unit: string, _higherIsBetter = true): string {
  if (delta === 0) return `Same ${unit}`
  const direction = delta > 0 ? 'more' : 'fewer'
  const abs = Math.abs(delta)
  return `${abs} ${direction} ${unit}`
}

export function formatDeltaNeutral(delta: number, label: string): string {
  if (delta === 0) return `No difference in ${label}`
  const abs = Math.abs(Math.round(delta))
  return `${abs} ${delta > 0 ? 'additional' : 'fewer'} ${label}`
}
