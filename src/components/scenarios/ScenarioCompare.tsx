import { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { computeScenarioDiff, formatDeltaNeutral } from '@/engine/scenario-engine'
import type { MonthlyProjection, StressScore } from '@/types'

interface ScenarioCompareProps {
  scenarioAName: string
  scenarioBName: string
  aProjections: MonthlyProjection[]
  bProjections: MonthlyProjection[]
  aStress: StressScore[]
  bStress: StressScore[]
  retirementMonth: string
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

export function ScenarioCompare({
  scenarioAName,
  scenarioBName,
  aProjections,
  bProjections,
  aStress,
  bStress,
  retirementMonth,
}: ScenarioCompareProps) {
  const diff = useMemo(
    () => computeScenarioDiff(aProjections, bProjections, aStress, bStress, retirementMonth),
    [aProjections, bProjections, aStress, bStress, retirementMonth],
  )

  const rows = [
    {
      label: 'Net Worth at Retirement',
      a: formatCurrency(diff.netWorthAtRetirement.a),
      b: formatCurrency(diff.netWorthAtRetirement.b),
      delta: `${diff.netWorthAtRetirement.delta >= 0 ? '+' : ''}${formatCurrency(diff.netWorthAtRetirement.delta)}`,
    },
    {
      label: 'Peak Stress',
      a: `${diff.peakStress.a}/100`,
      b: `${diff.peakStress.b}/100`,
      delta: formatDeltaNeutral(diff.peakStress.delta, 'points of peak stress'),
    },
    {
      label: 'Worst Financial Month',
      a: diff.worstMonth.a || 'N/A',
      b: diff.worstMonth.b || 'N/A',
      delta: '',
    },
    {
      label: 'High-Stress Months',
      a: `${diff.redZoneMonths.a}`,
      b: `${diff.redZoneMonths.b}`,
      delta: formatDeltaNeutral(diff.redZoneMonths.delta, 'months of elevated stress'),
    },
    {
      label: 'Minimum Free Time',
      a: `${diff.freeTimeMinimum.a}%`,
      b: `${diff.freeTimeMinimum.b}%`,
      delta: formatDeltaNeutral(diff.freeTimeMinimum.delta, 'percentage points of free time'),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Scenario Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-medium">Metric</th>
              <th className="text-right py-2 font-medium">{scenarioAName}</th>
              <th className="text-right py-2 font-medium">{scenarioBName}</th>
              <th className="text-right py-2 font-medium">Difference</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b last:border-0">
                <td className="py-2 text-muted-foreground">{row.label}</td>
                <td className="py-2 text-right">{row.a}</td>
                <td className="py-2 text-right">{row.b}</td>
                <td className="py-2 text-right text-xs text-muted-foreground">{row.delta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
