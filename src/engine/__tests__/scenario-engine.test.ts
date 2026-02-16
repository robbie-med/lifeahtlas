import { describe, it, expect } from 'vitest'
import { computeScenarioDiff, formatDeltaNeutral } from '../scenario-engine'
import type { MonthlyProjection, StressScore } from '@/types'

function makeProjection(month: string, netWorth: number, cashflow = 1000): MonthlyProjection {
  return {
    month,
    totalIncome: cashflow > 0 ? cashflow : 0,
    totalExpenses: cashflow < 0 ? -cashflow : 0,
    netCashflow: cashflow,
    netWorth,
    netWorthLow: netWorth - 5000,
    netWorthHigh: netWorth + 5000,
  }
}

function makeStress(month: string, composite: number): StressScore {
  return {
    month,
    composite,
    freeTime: composite,
    financialSurplus: composite * 0.5,
    overlapCount: 20,
    caregivingLoad: 10,
    sleepProxy: 5,
    emotionalLoad: composite * 0.3,
  }
}

describe('computeScenarioDiff', () => {
  it('computes delta between two scenarios', () => {
    const aProjections = [
      makeProjection('2024-01', 100000),
      makeProjection('2054-01', 500000),
    ]
    const bProjections = [
      makeProjection('2024-01', 100000),
      makeProjection('2054-01', 800000),
    ]
    const aStress = [makeStress('2024-01', 40), makeStress('2024-06', 60)]
    const bStress = [makeStress('2024-01', 50), makeStress('2024-06', 80)]

    const diff = computeScenarioDiff(aProjections, bProjections, aStress, bStress, '2054-01')

    expect(diff.netWorthAtRetirement.a).toBe(500000)
    expect(diff.netWorthAtRetirement.b).toBe(800000)
    expect(diff.netWorthAtRetirement.delta).toBe(300000)
    expect(diff.peakStress.a).toBe(60)
    expect(diff.peakStress.b).toBe(80)
    expect(diff.peakStress.delta).toBe(20)
  })

  it('handles empty projections gracefully', () => {
    const diff = computeScenarioDiff([], [], [], [], '2054-01')
    expect(diff.netWorthAtRetirement.a).toBe(0)
    expect(diff.netWorthAtRetirement.b).toBe(0)
    expect(diff.peakStress.a).toBe(0)
  })
})

describe('formatDeltaNeutral', () => {
  it('uses neutral language', () => {
    expect(formatDeltaNeutral(14, 'months of elevated stress')).toBe(
      '14 additional months of elevated stress',
    )
    expect(formatDeltaNeutral(-5, 'months of elevated stress')).toBe(
      '5 fewer months of elevated stress',
    )
    expect(formatDeltaNeutral(0, 'months of elevated stress')).toBe(
      'No difference in months of elevated stress',
    )
  })
})
