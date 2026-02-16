import { useMemo } from 'react'
import { computeProjection } from '@/engine/financial-engine'
import { useLiveAccounts, useLiveIncomeStreams, useLiveExpenseRules } from '@/hooks/useLiveData'
import type { MonthlyProjection } from '@/types'

export function useProjection(scenarioId: string | null, startDate: string, months = 960): MonthlyProjection[] {
  const accounts = useLiveAccounts(scenarioId)
  const incomeStreams = useLiveIncomeStreams(scenarioId)
  const expenseRules = useLiveExpenseRules(scenarioId)

  return useMemo(() => {
    if (!accounts || !incomeStreams || !expenseRules) return []
    return computeProjection({
      accounts,
      incomeStreams,
      expenseRules,
      startDate,
      months,
    })
  }, [accounts, incomeStreams, expenseRules, startDate, months])
}
