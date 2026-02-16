import { parseISO, differenceInMonths } from 'date-fns'
import { TimelineCanvas } from '@/components/timeline/TimelineCanvas'
import {
  getCategoryLabel,
  getCategoryIcon,
  stressEmoji,
  stressNarrative,
  financialNarrative,
  formatDurationFriendly,
} from '@/utils/narrative'
import { useAccessibility } from '@/hooks/useAccessibility'
import { getPeakStress } from '@/engine/stress-engine'
import type { Phase, MonthlyProjection, StressScore } from '@/types'

interface NarrativeViewProps {
  phases: Phase[]
  projections: MonthlyProjection[]
  stressScores: StressScore[]
  originDate: Date
  onPhaseClick?: (id: string) => void
}

export function NarrativeView({ phases, projections, stressScores, originDate, onPhaseClick }: NarrativeViewProps) {
  const peak = getPeakStress(stressScores)
  const currentStress = stressScores[0]
  const { showIcons, showText, showNarrative, showCharts, showNumbers } = useAccessibility()

  // Group phases by category for narrative
  const grouped = new Map<string, Phase[]>()
  for (const p of phases) {
    const list = grouped.get(p.category) ?? []
    list.push(p)
    grouped.set(p.category, list)
  }

  return (
    <div className="space-y-6">
      {showCharts && (
        <TimelineCanvas
          phases={phases}
          originDate={originDate}
          onPhaseClick={onPhaseClick}
          className="border rounded-lg"
        />
      )}

      {/* Narrative summary */}
      <div className="p-6 border rounded-lg bg-card">
        {showText && <h2 className="text-lg font-semibold mb-4">Your Life Journey</h2>}

        {showNarrative && currentStress && (
          <p className="text-sm mb-4">
            Right now, this looks like{' '}
            <span className="font-medium">{stressNarrative(currentStress.composite)}</span>{' '}
            {showIcons && stressEmoji(currentStress.composite)}
            {showNumbers && !showText && (
              <span className="font-mono ml-2">({currentStress.composite}/100)</span>
            )}
          </p>
        )}

        {/* Numeric-only: compact stress value */}
        {!showNarrative && showNumbers && currentStress && (
          <p className="text-sm mb-4 font-mono">
            Current stress: {currentStress.composite}/100
          </p>
        )}

        {showNarrative && projections.length > 0 && (
          <p className="text-sm mb-4">
            Financially, the near term appears to be a{' '}
            <span className="font-medium">{financialNarrative(projections[0])}</span>.
          </p>
        )}

        {/* Numeric-only: compact cashflow */}
        {!showNarrative && showNumbers && projections.length > 0 && (
          <p className="text-sm mb-4 font-mono">
            Cashflow: ${Math.round(projections[0].netCashflow)}/mo | Net worth: ${Math.round(projections[0].netWorth)}
          </p>
        )}

        <div className="space-y-4 mt-6">
          {Array.from(grouped.entries()).map(([category, categoryPhases]) => (
            <div key={category}>
              <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                {showIcons && <span>{getCategoryIcon(category as Phase['category'])}</span>}
                {showText && getCategoryLabel(category as Phase['category'])}
                {!showText && !showIcons && <span className="font-mono">{category}</span>}
              </h3>
              <div className="space-y-2 pl-6">
                {categoryPhases.map((phase) => {
                  const duration = differenceInMonths(
                    parseISO(phase.endDate),
                    parseISO(phase.startDate),
                  )
                  return (
                    <div
                      key={phase.id}
                      className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => onPhaseClick?.(phase.id)}
                    >
                      <span className="font-medium text-foreground">{phase.name}</span>
                      {showText && (
                        <>
                          {' \u2014 '}
                          {formatDurationFriendly(duration)}
                        </>
                      )}
                      {showNumbers && !showText && (
                        <span className="font-mono ml-2">({duration}mo, load: {phase.loadTimeCost}%)</span>
                      )}
                      {showText && phase.notes && (
                        <span className="block text-xs mt-0.5">{phase.notes}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {peak && showNarrative && (
          <p className="text-sm mt-6 text-muted-foreground">
            The most demanding period is around {peak.month}{' '}
            {showIcons && stressEmoji(peak.composite)}
            {' \u2014 '}{stressNarrative(peak.composite)}.
          </p>
        )}

        {peak && !showNarrative && showNumbers && (
          <p className="text-sm mt-6 font-mono text-muted-foreground">
            Peak: {peak.composite}/100 at {peak.month}
          </p>
        )}
      </div>
    </div>
  )
}
