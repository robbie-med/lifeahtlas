import { useMemo } from 'react'
import { parseISO, differenceInMonths } from 'date-fns'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCategoryLabel, getCategoryIcon } from '@/utils/narrative'
import { CATEGORY_COLORS, CERTAINTY_OPACITY } from '@/utils/colors'
import { useLiveAssumptions, useLiveIncomeStreams, useLiveExpenseRules } from '@/hooks/useLiveData'
import type { Phase } from '@/types'

interface PhaseDrilldownProps {
  phase: Phase
  scenarioId: string
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${Math.round(value)}`
}

export function PhaseDrilldown({ phase, scenarioId }: PhaseDrilldownProps) {
  const assumptions = useLiveAssumptions(scenarioId)
  const incomes = useLiveIncomeStreams(scenarioId)
  const expenses = useLiveExpenseRules(scenarioId)

  const duration = differenceInMonths(parseISO(phase.endDate), parseISO(phase.startDate))

  // Find income/expenses linked to this phase
  const linkedIncome = useMemo(
    () => incomes?.filter((i) => i.phaseId === phase.id) ?? [],
    [incomes, phase.id],
  )
  const linkedExpenses = useMemo(
    () => expenses?.filter((e) => e.phaseId === phase.id) ?? [],
    [expenses, phase.id],
  )

  // Sensitivity analysis: what happens if key values shift by +/-20%
  const sensitivity = useMemo(() => {
    const items: { variable: string; base: number; unit: string; lowImpact: string; highImpact: string }[] = []

    // Time sensitivity
    items.push({
      variable: 'Duration',
      base: duration,
      unit: 'months',
      lowImpact: `${Math.round(duration * 0.8)}mo (-20%)`,
      highImpact: `${Math.round(duration * 1.2)}mo (+20%)`,
    })

    // Cost sensitivity from linked expenses
    const totalMonthlyExpense = linkedExpenses.reduce((s, e) => s + e.monthlyAmount, 0)
    if (totalMonthlyExpense > 0) {
      items.push({
        variable: 'Monthly Costs',
        base: totalMonthlyExpense,
        unit: '$/mo',
        lowImpact: `${formatCurrency(totalMonthlyExpense * 0.8)}/mo saves ${formatCurrency(totalMonthlyExpense * 0.2 * duration)} total`,
        highImpact: `${formatCurrency(totalMonthlyExpense * 1.2)}/mo adds ${formatCurrency(totalMonthlyExpense * 0.2 * duration)} total`,
      })
    }

    // Load sensitivity
    items.push({
      variable: 'Time Load',
      base: phase.loadTimeCost,
      unit: '%',
      lowImpact: `${Math.round(phase.loadTimeCost * 0.8)}% — more free time`,
      highImpact: `${Math.round(phase.loadTimeCost * 1.2)}% — less free time, higher stress`,
    })

    if (phase.caregivingHours > 0) {
      items.push({
        variable: 'Caregiving Hours',
        base: phase.caregivingHours,
        unit: 'hrs/wk',
        lowImpact: `${Math.round(phase.caregivingHours * 0.8)} hrs/wk`,
        highImpact: `${Math.round(phase.caregivingHours * 1.2)} hrs/wk — significant stress increase`,
      })
    }

    return items
  }, [duration, linkedExpenses, phase])

  const color = CATEGORY_COLORS[phase.category]
  const opacity = CERTAINTY_OPACITY[phase.certainty]

  return (
    <div className="space-y-3">
      {/* Phase overview */}
      <div className="flex items-start gap-3">
        <div
          className="w-3 h-12 rounded-sm shrink-0 mt-0.5"
          style={{ backgroundColor: color, opacity }}
        />
        <div>
          <h3 className="text-base font-semibold">{phase.name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="secondary" className="text-[10px]">
              {getCategoryIcon(phase.category)} {getCategoryLabel(phase.category)}
            </Badge>
            <Badge variant="outline" className="text-[10px]">{phase.certainty}</Badge>
            <Badge variant="outline" className="text-[10px]">{phase.flexibility}</Badge>
            <span className="text-xs text-muted-foreground">
              {phase.startDate} to {phase.endDate} ({duration}mo)
            </span>
          </div>
        </div>
      </div>

      {/* Key variables */}
      <Card>
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-xs">Variables</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time Load</span>
              <span className="font-mono">{phase.loadTimeCost}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Emotional Intensity</span>
              <span className="font-mono">{phase.emotionalIntensity}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Caregiving</span>
              <span className="font-mono">{phase.caregivingHours} hrs/wk</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-mono">{duration} months</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Linked financials */}
      {(linkedIncome.length > 0 || linkedExpenses.length > 0) && (
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs">Linked Financials</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1 text-xs space-y-1">
            {linkedIncome.map((i) => (
              <div key={i.id} className="flex justify-between">
                <span className="text-green-600">+ {i.name}</span>
                <span className="font-mono">{formatCurrency(i.monthlyAmount)}/mo</span>
              </div>
            ))}
            {linkedExpenses.map((e) => (
              <div key={e.id} className="flex justify-between">
                <span className="text-red-600">- {e.name}</span>
                <span className="font-mono">{formatCurrency(e.monthlyAmount)}/mo</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Assumptions */}
      {assumptions && assumptions.length > 0 && (
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs">Scenario Assumptions</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1 text-xs space-y-1">
            {assumptions.map((a) => (
              <div key={a.id} className="flex justify-between">
                <span className="text-muted-foreground">{a.key}</span>
                <span className="font-mono">{a.value} {a.unit}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sensitivity analysis */}
      <Card>
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-xs">Sensitivity Analysis (\u00B120%)</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-1 font-medium">Variable</th>
                <th className="text-right py-1 font-medium">Base</th>
                <th className="text-left py-1 pl-2 font-medium">-20%</th>
                <th className="text-left py-1 font-medium">+20%</th>
              </tr>
            </thead>
            <tbody>
              {sensitivity.map((s) => (
                <tr key={s.variable} className="border-b last:border-0">
                  <td className="py-1">{s.variable}</td>
                  <td className="py-1 text-right font-mono">{s.base} {s.unit}</td>
                  <td className="py-1 pl-2 text-muted-foreground">{s.lowImpact}</td>
                  <td className="py-1 text-muted-foreground">{s.highImpact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Notes */}
      {phase.notes && (
        <div className="text-xs text-muted-foreground p-3 border rounded-lg">
          {phase.notes}
        </div>
      )}
    </div>
  )
}
