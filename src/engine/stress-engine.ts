import { parseISO, addMonths, format, isWithinInterval } from 'date-fns'
import type { Phase, MonthlyProjection, StressScore } from '@/types'

// Weights for composite stress score
const WEIGHTS = {
  freeTime: 0.20,
  financialSurplus: 0.20,
  overlapCount: 0.15,
  caregivingLoad: 0.15,
  sleepProxy: 0.15,
  emotionalLoad: 0.15,
}

interface StressInput {
  phases: Phase[]
  projections: MonthlyProjection[]
  startDate: string
  months: number
}

export function computeStressScores(input: StressInput): StressScore[] {
  const { phases, projections, startDate, months } = input
  const start = parseISO(startDate)
  const scores: StressScore[] = []

  const projectionMap = new Map<string, MonthlyProjection>()
  for (const p of projections) {
    projectionMap.set(p.month, p)
  }

  for (let m = 0; m < months; m++) {
    const currentDate = addMonths(start, m)
    const monthStr = format(currentDate, 'yyyy-MM')

    // Find active phases this month
    const activePhases = phases.filter((p) => {
      const pStart = parseISO(p.startDate)
      const pEnd = parseISO(p.endDate)
      return isWithinInterval(currentDate, { start: pStart, end: pEnd })
    })

    // Free time: inverse of total loadTimeCost (0-100 → 100-0)
    const totalLoad = Math.min(
      100,
      activePhases.reduce((sum, p) => sum + p.loadTimeCost, 0),
    )
    const freeTime = clampScore(totalLoad) // higher load = higher stress component

    // Financial surplus: stress from negative cashflow
    const projection = projectionMap.get(monthStr)
    let financialSurplus = 0
    if (projection) {
      if (projection.netCashflow < 0) {
        financialSurplus = clampScore(Math.min(100, Math.abs(projection.netCashflow) / 50))
      } else {
        financialSurplus = clampScore(Math.max(0, 30 - projection.netCashflow / 200))
      }
    }

    // Overlap count: more concurrent phases = more stress
    const overlapCount = clampScore(Math.min(100, activePhases.length * 20))

    // Caregiving load: weekly hours mapped to 0-100
    const totalCaregiving = activePhases.reduce((sum, p) => sum + p.caregivingHours, 0)
    const caregivingLoad = clampScore(Math.min(100, (totalCaregiving / 40) * 100))

    // Sleep proxy: very high loads (>80%) degrade sleep
    const sleepProxy = clampScore(Math.max(0, totalLoad - 60) * 2.5)

    // Emotional load: weighted average of emotional intensity
    const emotionalLoad =
      activePhases.length > 0
        ? clampScore(
            activePhases.reduce((sum, p) => sum + p.emotionalIntensity, 0) /
              activePhases.length,
          )
        : 0

    // Composite score
    const composite = clampScore(
      freeTime * WEIGHTS.freeTime +
        financialSurplus * WEIGHTS.financialSurplus +
        overlapCount * WEIGHTS.overlapCount +
        caregivingLoad * WEIGHTS.caregivingLoad +
        sleepProxy * WEIGHTS.sleepProxy +
        emotionalLoad * WEIGHTS.emotionalLoad,
    )

    scores.push({
      month: monthStr,
      composite: Math.round(composite),
      freeTime: Math.round(freeTime),
      financialSurplus: Math.round(financialSurplus),
      overlapCount: Math.round(overlapCount),
      caregivingLoad: Math.round(caregivingLoad),
      sleepProxy: Math.round(sleepProxy),
      emotionalLoad: Math.round(emotionalLoad),
    })
  }

  return scores
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value))
}

export function getPeakStress(scores: StressScore[]): StressScore | null {
  if (scores.length === 0) return null
  return scores.reduce((peak, s) => (s.composite > peak.composite ? s : peak))
}

export function getRedZoneMonths(scores: StressScore[], threshold = 70): number {
  return scores.filter((s) => s.composite >= threshold).length
}

export function getMinimumFreeTime(scores: StressScore[]): number {
  if (scores.length === 0) return 100
  return Math.min(...scores.map((s) => 100 - s.freeTime))
}
