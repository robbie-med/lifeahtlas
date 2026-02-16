import { parseISO, addMonths, format, isBefore } from 'date-fns'
import { DebtStrategy } from '@/types'
import type { DebtPlan, DebtPayoffMonth, DebtPayoffSummary } from '@/types'

interface DebtPayoffInput {
  debtPlans: DebtPlan[]
  maxMonths?: number // safety limit, default 600 (50 years)
}

interface DebtPayoffResult {
  schedule: DebtPayoffMonth[]
  summaries: DebtPayoffSummary[]
  totalInterestPaid: number
  totalPaid: number
  lastPayoffDate: string
}

/**
 * Compute a full debt payoff schedule.
 *
 * Strategies:
 * - minimum-payment: pay only the minimum on each debt
 * - fixed-payment: pay the configured monthlyPayment on each debt
 * - snowball: pay minimums on all debts, put extra toward smallest balance first
 * - avalanche: pay minimums on all debts, put extra toward highest interest rate first
 */
export function computeDebtPayoff(input: DebtPayoffInput): DebtPayoffResult {
  const { debtPlans, maxMonths = 600 } = input
  if (debtPlans.length === 0) {
    return { schedule: [], summaries: [], totalInterestPaid: 0, totalPaid: 0, lastPayoffDate: '' }
  }

  // Working state per debt
  const debts = debtPlans.map((d) => ({
    id: d.id,
    name: d.name,
    balance: d.principalBalance,
    originalBalance: d.principalBalance,
    rate: d.annualInterestRate / 100 / 12, // monthly rate
    minimum: d.minimumPayment,
    monthlyPayment: d.monthlyPayment,
    extra: d.extraPayment,
    strategy: d.strategy,
    startDate: parseISO(d.startDate),
    totalInterest: 0,
    totalPaid: 0,
    paidOff: false,
    payoffMonth: '',
    monthsToPayoff: 0,
  }))

  // For snowball/avalanche, compute total extra budget
  // (sum of all extraPayment amounts across debts — pooled)
  const isPooled = debts.some(
    (d) => d.strategy === DebtStrategy.Snowball || d.strategy === DebtStrategy.Avalanche,
  )
  const totalExtraBudget = isPooled ? debts.reduce((s, d) => s + d.extra, 0) : 0

  const schedule: DebtPayoffMonth[] = []

  // Find the earliest start date
  const earliestStart = debts.reduce(
    (min, d) => (isBefore(d.startDate, min) ? d.startDate : min),
    debts[0].startDate,
  )

  for (let m = 0; m < maxMonths; m++) {
    const currentDate = addMonths(earliestStart, m)
    const monthStr = format(currentDate, 'yyyy-MM')

    const activeDebts = debts.filter((d) => !d.paidOff && !isBefore(currentDate, d.startDate))
    if (activeDebts.length === 0) break

    // Step 1: charge interest on all active debts
    for (const debt of activeDebts) {
      const interest = debt.balance * debt.rate
      debt.balance += interest
      debt.totalInterest += interest
    }

    // Step 2: apply minimum payments
    for (const debt of activeDebts) {
      const payment = Math.min(debt.minimum, debt.balance)
      debt.balance -= payment
      debt.totalPaid += payment

      const interest = debt.balance >= 0 ? debt.balance * debt.rate / (1 + debt.rate) : 0
      schedule.push({
        month: monthStr,
        debtId: debt.id,
        debtName: debt.name,
        startingBalance: debt.balance + payment,
        payment,
        interestCharged: Math.round(interest * 100) / 100,
        principalPaid: Math.round((payment - interest) * 100) / 100,
        endingBalance: Math.round(debt.balance * 100) / 100,
        isPaidOff: debt.balance <= 0.01,
      })
    }

    // Step 3: apply extra payments based on strategy
    if (isPooled && totalExtraBudget > 0) {
      // Sort for target priority
      const sorted = [...activeDebts].filter((d) => d.balance > 0.01)
      if (debts[0].strategy === DebtStrategy.Snowball) {
        sorted.sort((a, b) => a.balance - b.balance) // smallest first
      } else {
        sorted.sort((a, b) => b.rate - a.rate) // highest rate first
      }

      let remaining = totalExtraBudget
      // Also add freed-up minimums from paid-off debts
      const paidOffMinimums = debts.filter((d) => d.paidOff).reduce((s, d) => s + d.minimum, 0)
      remaining += paidOffMinimums

      for (const debt of sorted) {
        if (remaining <= 0) break
        const extra = Math.min(remaining, debt.balance)
        debt.balance -= extra
        debt.totalPaid += extra
        remaining -= extra

        // Update last schedule entry for this debt
        const lastEntry = schedule.filter((e) => e.debtId === debt.id).pop()
        if (lastEntry) {
          lastEntry.payment += extra
          lastEntry.principalPaid += extra
          lastEntry.endingBalance = Math.round(debt.balance * 100) / 100
          lastEntry.isPaidOff = debt.balance <= 0.01
        }
      }
    } else {
      // Non-pooled: each debt gets its own extra
      for (const debt of activeDebts) {
        if (debt.balance <= 0.01) continue
        const extraForThis =
          debt.strategy === DebtStrategy.FixedPayment
            ? debt.monthlyPayment - debt.minimum
            : debt.extra
        if (extraForThis <= 0) continue
        const extra = Math.min(extraForThis, debt.balance)
        debt.balance -= extra
        debt.totalPaid += extra

        const lastEntry = schedule.filter((e) => e.debtId === debt.id).pop()
        if (lastEntry) {
          lastEntry.payment += extra
          lastEntry.principalPaid += extra
          lastEntry.endingBalance = Math.round(debt.balance * 100) / 100
          lastEntry.isPaidOff = debt.balance <= 0.01
        }
      }
    }

    // Step 4: mark paid-off debts
    for (const debt of activeDebts) {
      if (debt.balance <= 0.01 && !debt.paidOff) {
        debt.paidOff = true
        debt.balance = 0
        debt.payoffMonth = monthStr
        debt.monthsToPayoff = m + 1
      }
    }
  }

  const summaries: DebtPayoffSummary[] = debts.map((d) => ({
    debtId: d.id,
    debtName: d.name,
    originalBalance: d.originalBalance,
    totalInterestPaid: Math.round(d.totalInterest * 100) / 100,
    totalPaid: Math.round(d.totalPaid * 100) / 100,
    monthsToPayoff: d.monthsToPayoff,
    payoffDate: d.payoffMonth,
  }))

  return {
    schedule,
    summaries,
    totalInterestPaid: Math.round(debts.reduce((s, d) => s + d.totalInterest, 0) * 100) / 100,
    totalPaid: Math.round(debts.reduce((s, d) => s + d.totalPaid, 0) * 100) / 100,
    lastPayoffDate: summaries.reduce(
      (latest, s) => (s.payoffDate > latest ? s.payoffDate : latest),
      '',
    ),
  }
}
