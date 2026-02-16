import { describe, it, expect } from 'vitest'
import { computeProjection, findWorstMonth } from '../financial-engine'
import { CertaintyLevel } from '@/types'

describe('computeProjection', () => {
  it('computes 80 years (960 months) in under 200ms', () => {
    const start = performance.now()
    const projections = computeProjection({
      accounts: [
        { id: 'a1', scenarioId: 's1', name: 'Checking', type: 'checking', balance: 10000, interestRate: 1, createdAt: '' },
        { id: 'a2', scenarioId: 's1', name: 'Retirement', type: 'retirement', balance: 50000, interestRate: 7, createdAt: '' },
      ],
      incomeStreams: [
        { id: 'i1', scenarioId: 's1', name: 'Salary', monthlyAmount: 8000, startDate: '2024-01-01', endDate: '2059-12-31', annualGrowthRate: 3, certainty: CertaintyLevel.Likely, createdAt: '' },
      ],
      expenseRules: [
        { id: 'e1', scenarioId: 's1', name: 'Living', monthlyAmount: 5000, startDate: '2024-01-01', endDate: '2104-01-01', annualInflationRate: 2.5, category: 'living', isRequired: true, createdAt: '' },
      ],
      startDate: '2024-01-01',
      months: 960,
    })
    const elapsed = performance.now() - start

    expect(projections).toHaveLength(960)
    expect(elapsed).toBeLessThan(200)
  })

  it('starts with correct net worth from accounts', () => {
    const projections = computeProjection({
      accounts: [
        { id: 'a1', scenarioId: 's1', name: 'Savings', type: 'savings', balance: 25000, interestRate: 0, createdAt: '' },
        { id: 'a2', scenarioId: 's1', name: 'Debt', type: 'debt', balance: 5000, interestRate: 0, createdAt: '' },
      ],
      incomeStreams: [],
      expenseRules: [],
      startDate: '2024-01-01',
      months: 1,
    })
    // 25000 - 5000 = 20000 net worth
    expect(projections[0].netWorth).toBe(20000)
  })

  it('computes uncertainty bands that widen over time', () => {
    const projections = computeProjection({
      accounts: [],
      incomeStreams: [
        { id: 'i1', scenarioId: 's1', name: 'Income', monthlyAmount: 5000, startDate: '2024-01-01', endDate: '2034-01-01', annualGrowthRate: 0, certainty: CertaintyLevel.Confirmed, createdAt: '' },
      ],
      expenseRules: [],
      startDate: '2024-01-01',
      months: 120,
    })
    const early = projections[5]
    const late = projections[100]
    const earlySpread = early.netWorthHigh - early.netWorthLow
    const lateSpread = late.netWorthHigh - late.netWorthLow
    expect(lateSpread).toBeGreaterThan(earlySpread)
  })
})

describe('findWorstMonth', () => {
  it('returns the month with lowest net cashflow', () => {
    const projections = computeProjection({
      accounts: [],
      incomeStreams: [
        { id: 'i1', scenarioId: 's1', name: 'Income', monthlyAmount: 5000, startDate: '2024-06-01', endDate: '2025-12-01', annualGrowthRate: 0, certainty: CertaintyLevel.Confirmed, createdAt: '' },
      ],
      expenseRules: [
        { id: 'e1', scenarioId: 's1', name: 'Rent', monthlyAmount: 3000, startDate: '2024-01-01', endDate: '2025-12-01', annualInflationRate: 0, category: 'housing', isRequired: true, createdAt: '' },
      ],
      startDate: '2024-01-01',
      months: 24,
    })
    const worst = findWorstMonth(projections)
    expect(worst).not.toBeNull()
    // Before income starts, cashflow is -3000
    expect(worst!.netCashflow).toBe(-3000)
  })
})
