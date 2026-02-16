import { parseISO, addMonths, format, isBefore, isAfter } from 'date-fns'
import type { Account, IncomeStream, ExpenseRule, MonthlyProjection } from '@/types'

interface FinancialInput {
  accounts: Account[]
  incomeStreams: IncomeStream[]
  expenseRules: ExpenseRule[]
  startDate: string // ISO date
  months: number // typically 960 for 80 years
  inflationDefault?: number // default annual inflation %
}

export function computeProjection(input: FinancialInput): MonthlyProjection[] {
  const { accounts, incomeStreams, expenseRules, startDate, months } = input
  const start = parseISO(startDate)
  const projections: MonthlyProjection[] = []

  // Initial net worth from accounts
  let netWorth = accounts.reduce((sum, a) => {
    return a.type === 'debt' ? sum - Math.abs(a.balance) : sum + a.balance
  }, 0)

  // Track account balances for interest
  const balances = accounts.map((a) => ({
    balance: a.type === 'debt' ? -Math.abs(a.balance) : a.balance,
    monthlyRate: a.interestRate / 100 / 12,
  }))

  for (let m = 0; m < months; m++) {
    const currentDate = addMonths(start, m)
    const monthStr = format(currentDate, 'yyyy-MM')
    const yearFraction = m / 12

    // Income for this month
    let totalIncome = 0
    for (const stream of incomeStreams) {
      const streamStart = parseISO(stream.startDate)
      const streamEnd = parseISO(stream.endDate)
      if (isBefore(currentDate, streamStart) || isAfter(currentDate, streamEnd)) continue

      const growthFactor = Math.pow(1 + stream.annualGrowthRate / 100, yearFraction)
      totalIncome += stream.monthlyAmount * growthFactor
    }

    // Expenses for this month
    let totalExpenses = 0
    for (const rule of expenseRules) {
      const ruleStart = parseISO(rule.startDate)
      const ruleEnd = parseISO(rule.endDate)
      if (isBefore(currentDate, ruleStart) || isAfter(currentDate, ruleEnd)) continue

      const inflationFactor = Math.pow(1 + rule.annualInflationRate / 100, yearFraction)
      totalExpenses += rule.monthlyAmount * inflationFactor
    }

    const netCashflow = totalIncome - totalExpenses

    // Apply interest to accounts
    let interestEarned = 0
    for (const bal of balances) {
      const interest = bal.balance * bal.monthlyRate
      bal.balance += interest
      interestEarned += interest
    }

    netWorth += netCashflow + interestEarned

    // Uncertainty bands: widen over time
    const uncertaintySpread = Math.sqrt(m + 1) * 500
    const netWorthLow = netWorth - uncertaintySpread
    const netWorthHigh = netWorth + uncertaintySpread

    projections.push({
      month: monthStr,
      totalIncome: Math.round(totalIncome),
      totalExpenses: Math.round(totalExpenses),
      netCashflow: Math.round(netCashflow),
      netWorth: Math.round(netWorth),
      netWorthLow: Math.round(netWorthLow),
      netWorthHigh: Math.round(netWorthHigh),
    })
  }

  return projections
}

export function computeNetWorthAtMonth(projections: MonthlyProjection[], monthStr: string): number {
  const proj = projections.find((p) => p.month === monthStr)
  return proj?.netWorth ?? 0
}

export function findWorstMonth(projections: MonthlyProjection[]): MonthlyProjection | null {
  if (projections.length === 0) return null
  return projections.reduce((worst, p) =>
    p.netCashflow < worst.netCashflow ? p : worst,
  )
}
