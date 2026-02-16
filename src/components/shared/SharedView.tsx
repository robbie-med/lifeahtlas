import { TimelineCanvas } from '@/components/timeline/TimelineCanvas'
import { CashflowChart } from '@/components/financial/CashflowChart'
import { StressGauge } from '@/components/stress/StressGauge'
import { getCategoryLabel, getCategoryIcon, stressEmoji, stressNarrative } from '@/utils/narrative'
import { useAccessibility } from '@/hooks/useAccessibility'
import { getPeakStress, getRedZoneMonths } from '@/engine/stress-engine'
import type { Phase, MonthlyProjection, StressScore } from '@/types'

interface SharedViewProps {
  phases: Phase[]
  projections: MonthlyProjection[]
  stressScores: StressScore[]
  originDate: Date
  onPhaseClick?: (id: string) => void
}

export function SharedView({ phases, projections, stressScores, originDate, onPhaseClick }: SharedViewProps) {
  const peak = getPeakStress(stressScores)
  const redMonths = getRedZoneMonths(stressScores)
  const { showIcons, showText, showNarrative, showCharts, showNumbers } = useAccessibility()

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {showCharts && <CashflowChart projections={projections} />}

        {/* Text-only fallback: cashflow summary */}
        {!showCharts && projections.length > 0 && (
          <div className="border rounded-lg p-4 text-xs space-y-1">
            <h3 className="text-sm font-medium mb-2">Cashflow</h3>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Income</span>
              <span className="font-mono">${Math.round(projections[0].totalIncome)}/mo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expenses</span>
              <span className="font-mono">${Math.round(projections[0].totalExpenses)}/mo</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Net</span>
              <span className="font-mono">${Math.round(projections[0].netCashflow)}/mo</span>
            </div>
          </div>
        )}

        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-4">
            {showCharts && <StressGauge score={peak?.composite ?? 0} label="Peak" size={80} />}
            <div className="text-sm space-y-1">
              {showNumbers && (
                <p>
                  {showIcons && stressEmoji(peak?.composite ?? 0)}{' '}
                  {showText && 'Peak stress is around '}
                  <span className="font-medium">{peak?.month ?? 'N/A'}</span>
                  {!showText && showNumbers && (
                    <span className="font-mono ml-1">({peak?.composite ?? 0}/100)</span>
                  )}
                </p>
              )}
              {showNarrative && (
                <p className="text-muted-foreground">
                  {stressNarrative(peak?.composite ?? 0)}
                </p>
              )}
              {showNumbers && (
                <p className="text-muted-foreground">
                  {redMonths} month{redMonths !== 1 ? 's' : ''}{showText ? ' of elevated demand' : ''}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {showText && <h3 className="text-sm font-medium">Active Life Phases</h3>}
            {phases.slice(0, 8).map((phase) => (
              <div
                key={phase.id}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent/50 rounded px-2 py-1 transition-colors"
                onClick={() => onPhaseClick?.(phase.id)}
              >
                {showIcons && <span>{getCategoryIcon(phase.category)}</span>}
                {showText && <span className="font-medium">{phase.name}</span>}
                {showText && (
                  <span className="text-muted-foreground text-xs">
                    {getCategoryLabel(phase.category)}
                  </span>
                )}
                {!showText && showNumbers && (
                  <span className="font-mono text-xs">{phase.name} ({phase.loadTimeCost}%)</span>
                )}
              </div>
            ))}
            {phases.length > 8 && showText && (
              <p className="text-xs text-muted-foreground pl-2">
                +{phases.length - 8} more phases
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
