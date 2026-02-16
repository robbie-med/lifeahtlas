import { parseISO, addMonths, format, isAfter } from 'date-fns'
import type { SavingsGoal, SavingsProjectionMonth } from '@/types'

export function computeSavingsProjection(goals: SavingsGoal[]): SavingsProjectionMonth[] {
  const result: SavingsProjectionMonth[] = []

  for (const goal of goals) {
    const start = parseISO(goal.startDate)
    const target = parseISO(goal.targetDate)
    let balance = goal.currentBalance
    const monthlyRate = goal.annualReturnRate / 100 / 12

    let d = start
    while (!isAfter(d, target)) {
      const growth = balance * monthlyRate
      balance += growth + goal.monthlyContribution
      const percentComplete = goal.targetAmount > 0
        ? Math.min(100, (balance / goal.targetAmount) * 100)
        : 100

      result.push({
        month: format(d, 'yyyy-MM'),
        goalId: goal.id,
        goalName: goal.name,
        balance: Math.round(balance),
        contribution: goal.monthlyContribution,
        growth: Math.round(growth),
        percentComplete: Math.round(percentComplete * 10) / 10,
      })

      d = addMonths(d, 1)
    }
  }

  return result
}

export function getRetirementReadiness(
  goals: SavingsGoal[],
  projection: SavingsProjectionMonth[],
): {
  totalRetirementSaved: number
  monthlyRetirementIncome: number // 4% rule estimate
  retirementGoals: { name: string; balance: number; target: number; percent: number }[]
} {
  const retirementGoals = goals.filter((g) => g.type === 'retirement')
  const summaries = retirementGoals.map((g) => {
    const goalMonths = projection.filter((p) => p.goalId === g.id)
    const lastMonth = goalMonths.length > 0 ? goalMonths[goalMonths.length - 1] : null
    return {
      name: g.name,
      balance: lastMonth?.balance ?? g.currentBalance,
      target: g.targetAmount,
      percent: lastMonth?.percentComplete ?? 0,
    }
  })

  const totalRetirementSaved = summaries.reduce((s, g) => s + g.balance, 0)
  // 4% safe withdrawal rate → monthly
  const monthlyRetirementIncome = Math.round((totalRetirementSaved * 0.04) / 12)

  return { totalRetirementSaved, monthlyRetirementIncome, retirementGoals: summaries }
}
