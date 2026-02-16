import { describe, it, expect } from 'vitest'
import { computeStressScores, getPeakStress, getRedZoneMonths } from '../stress-engine'
import { PhaseCategory, CertaintyLevel, FlexibilityLevel } from '@/types'
import type { Phase, MonthlyProjection } from '@/types'

function makePhase(overrides: Partial<Phase> = {}): Phase {
  return {
    id: 'p1',
    scenarioId: 's1',
    name: 'Test',
    category: PhaseCategory.Career,
    startDate: '2024-01-01',
    endDate: '2025-01-01',
    certainty: CertaintyLevel.Confirmed,
    flexibility: FlexibilityLevel.Fixed,
    loadTimeCost: 50,
    emotionalIntensity: 40,
    caregivingHours: 0,
    notes: '',
    order: 0,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

function makeProjection(month: string, cashflow = 2000): MonthlyProjection {
  return {
    month,
    totalIncome: cashflow > 0 ? cashflow : 0,
    totalExpenses: cashflow < 0 ? Math.abs(cashflow) : 0,
    netCashflow: cashflow,
    netWorth: 50000,
    netWorthLow: 45000,
    netWorthHigh: 55000,
  }
}

describe('computeStressScores', () => {
  it('returns scores for each month', () => {
    const scores = computeStressScores({
      phases: [makePhase()],
      projections: [makeProjection('2024-01'), makeProjection('2024-02')],
      startDate: '2024-01-01',
      months: 2,
    })
    expect(scores).toHaveLength(2)
    expect(scores[0].composite).toBeGreaterThanOrEqual(0)
    expect(scores[0].composite).toBeLessThanOrEqual(100)
  })

  it('produces higher stress with overlapping high-load phases', () => {
    const lowStress = computeStressScores({
      phases: [makePhase({ loadTimeCost: 20, emotionalIntensity: 10 })],
      projections: [makeProjection('2024-06')],
      startDate: '2024-06-01',
      months: 1,
    })
    const highStress = computeStressScores({
      phases: [
        makePhase({ id: 'p1', loadTimeCost: 80, emotionalIntensity: 70, caregivingHours: 20 }),
        makePhase({ id: 'p2', loadTimeCost: 60, emotionalIntensity: 80, caregivingHours: 15, category: PhaseCategory.Caregiving }),
      ],
      projections: [makeProjection('2024-06', -2000)],
      startDate: '2024-06-01',
      months: 1,
    })

    expect(highStress[0].composite).toBeGreaterThan(lowStress[0].composite)
  })

  it('returns very low stress when no active phases', () => {
    const scores = computeStressScores({
      phases: [makePhase({ startDate: '2030-01-01', endDate: '2031-01-01' })],
      projections: [makeProjection('2024-01', 5000)],
      startDate: '2024-01-01',
      months: 1,
    })
    // No active phases, but financial surplus may contribute small amount
    expect(scores[0].composite).toBeLessThan(10)
    expect(scores[0].freeTime).toBe(0)
    expect(scores[0].overlapCount).toBe(0)
    expect(scores[0].caregivingLoad).toBe(0)
    expect(scores[0].emotionalLoad).toBe(0)
  })
})

describe('getPeakStress', () => {
  it('returns the month with highest composite score', () => {
    const scores = computeStressScores({
      phases: [makePhase({ loadTimeCost: 90, emotionalIntensity: 90, caregivingHours: 30 })],
      projections: Array.from({ length: 12 }, (_, i) =>
        makeProjection(`2024-${String(i + 1).padStart(2, '0')}`, i < 3 ? -3000 : 2000),
      ),
      startDate: '2024-01-01',
      months: 12,
    })
    const peak = getPeakStress(scores)
    expect(peak).not.toBeNull()
    expect(peak!.composite).toBe(Math.max(...scores.map((s) => s.composite)))
  })
})

describe('getRedZoneMonths', () => {
  it('counts months above threshold', () => {
    const scores = [
      { month: '2024-01', composite: 80, freeTime: 80, financialSurplus: 80, overlapCount: 80, caregivingLoad: 80, sleepProxy: 80, emotionalLoad: 80 },
      { month: '2024-02', composite: 50, freeTime: 50, financialSurplus: 50, overlapCount: 50, caregivingLoad: 50, sleepProxy: 50, emotionalLoad: 50 },
      { month: '2024-03', composite: 75, freeTime: 75, financialSurplus: 75, overlapCount: 75, caregivingLoad: 75, sleepProxy: 75, emotionalLoad: 75 },
    ]
    expect(getRedZoneMonths(scores)).toBe(2)
    expect(getRedZoneMonths(scores, 80)).toBe(1)
  })
})
