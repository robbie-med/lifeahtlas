import { useMemo } from 'react'
import { computeStressScores } from '@/engine/stress-engine'
import { useLivePhases } from '@/hooks/useLiveData'
import type { MonthlyProjection, StressScore } from '@/types'

export function useStressScores(
  scenarioId: string | null,
  projections: MonthlyProjection[],
  startDate: string,
  months = 960,
): StressScore[] {
  const phases = useLivePhases(scenarioId)

  return useMemo(() => {
    if (!phases || phases.length === 0) return []
    return computeStressScores({ phases, projections, startDate, months })
  }, [phases, projections, startDate, months])
}
