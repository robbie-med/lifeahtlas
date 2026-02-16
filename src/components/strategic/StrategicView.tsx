import { TimelineCanvas } from '@/components/timeline/TimelineCanvas'
import { CashflowChart } from '@/components/financial/CashflowChart'
import { ProjectionView } from '@/components/financial/ProjectionView'
import { StressTimeline } from '@/components/stress/StressTimeline'
import { StressGauge } from '@/components/stress/StressGauge'
import { AssumptionsTable } from '@/components/strategic/AssumptionsTable'
import { useAccessibility } from '@/hooks/useAccessibility'
import { getPeakStress, getRedZoneMonths } from '@/engine/stress-engine'
import { getCategoryLabel } from '@/utils/narrative'
import type { Phase, MonthlyProjection, StressScore } from '@/types'

interface StrategicViewProps {
  phases: Phase[]
  projections: MonthlyProjection[]
  stressScores: StressScore[]
  originDate: Date
  scenarioId: string
  onPhaseClick?: (id: string) => void
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${Math.round(value)}`
}

export function StrategicView({ phases, projections, stressScores, originDate, scenarioId, onPhaseClick }: StrategicViewProps) {
  const peak = getPeakStress(stressScores)
  const redMonths = getRedZoneMonths(stressScores)
  const { showCharts, showText, showNumbers } = useAccessibility()

  return (
    <div className="space-y-4">
      {showCharts && (
        <TimelineCanvas
          phases={phases}
          originDate={originDate}
          stressScores={stressScores}
          onPhaseClick={onPhaseClick}
          className="border rounded-lg"
        />
      )}

      {/* Text-only fallback: phase list table */}
      {!showCharts && (
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2">Phases</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-1 font-medium">Name</th>
                <th className="text-left py-1 font-medium">Category</th>
                <th className="text-left py-1 font-medium">Start</th>
                <th className="text-left py-1 font-medium">End</th>
                <th className="text-right py-1 font-medium">Load</th>
                <th className="text-right py-1 font-medium">Intensity</th>
                <th className="text-left py-1 font-medium">Certainty</th>
              </tr>
            </thead>
            <tbody>
              {phases.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-0 hover:bg-accent/30 cursor-pointer"
                  onClick={() => onPhaseClick?.(p.id)}
                >
                  <td className="py-1 font-medium">{p.name}</td>
                  <td className="py-1">{getCategoryLabel(p.category)}</td>
                  <td className="py-1 font-mono">{p.startDate}</td>
                  <td className="py-1 font-mono">{p.endDate}</td>
                  <td className="py-1 text-right font-mono">{p.loadTimeCost}%</td>
                  <td className="py-1 text-right font-mono">{p.emotionalIntensity}%</td>
                  <td className="py-1">{p.certainty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CashflowChart projections={projections} />
          <ProjectionView projections={projections} />
        </div>
      )}

      {/* Text-only fallback: financial summary table */}
      {!showCharts && projections.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2">Financial Summary</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Net Worth</span>
              <span className="font-mono">{formatCurrency(projections[0].netWorth)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Cashflow</span>
              <span className="font-mono">{formatCurrency(projections[0].netCashflow)}/mo</span>
            </div>
            {projections.length > 120 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Net Worth (10yr)</span>
                <span className="font-mono">{formatCurrency(projections[120].netWorth)}</span>
              </div>
            )}
            {projections.length > 360 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Net Worth (30yr)</span>
                <span className="font-mono">{formatCurrency(projections[360].netWorth)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <StressTimeline scores={stressScores} className="lg:col-span-2" />
          <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
            <StressGauge score={peak?.composite ?? 0} label="Peak Stress" />
            <div className="text-center space-y-1">
              {showNumbers && (
                <p className="text-sm">
                  <span className="font-medium">{redMonths}</span>{' '}
                  {showText && <span className="text-muted-foreground">high-stress months</span>}
                </p>
              )}
              {peak && showNumbers && (
                <p className="text-xs text-muted-foreground">
                  Peak month: {peak.month}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Text-only fallback: stress summary */}
      {!showCharts && (
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2">Stress Summary</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Peak Stress Score</span>
              <span className="font-mono">{peak?.composite ?? 0}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Peak Month</span>
              <span className="font-mono">{peak?.month ?? 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">High-Stress Months</span>
              <span className="font-mono">{redMonths}</span>
            </div>
          </div>
        </div>
      )}

      <AssumptionsTable scenarioId={scenarioId} />
    </div>
  )
}
