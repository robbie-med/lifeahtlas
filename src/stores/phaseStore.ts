import { v4 as uuid } from 'uuid'
import { addMonths, formatISO } from 'date-fns'
import { db } from '@/db/database'
import { CertaintyLevel, FlexibilityLevel } from '@/types'
import type { Phase, Template } from '@/types'

export const phaseActions = {
  async create(phase: Omit<Phase, 'id' | 'createdAt' | 'updatedAt'>): Promise<Phase> {
    const now = new Date().toISOString()
    const newPhase: Phase = {
      ...phase,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    }
    await db.phases.add(newPhase)
    return newPhase
  },

  async update(id: string, updates: Partial<Phase>) {
    await db.phases.update(id, { ...updates, updatedAt: new Date().toISOString() })
  },

  async remove(id: string) {
    await db.phases.delete(id)
  },

  async applyTemplate(scenarioId: string, template: Template, startDate: Date): Promise<Phase[]> {
    const now = new Date().toISOString()
    const existingCount = await db.phases.where('scenarioId').equals(scenarioId).count()

    const phases: Phase[] = template.phases.map((tp, i) => {
      const phaseStart = addMonths(startDate, tp.offsetMonths)
      const phaseEnd = addMonths(phaseStart, tp.durationMonths)
      return {
        id: uuid(),
        scenarioId,
        name: tp.name,
        category: tp.category,
        startDate: formatISO(phaseStart, { representation: 'date' }),
        endDate: formatISO(phaseEnd, { representation: 'date' }),
        certainty: tp.certainty as CertaintyLevel,
        flexibility: tp.flexibility as FlexibilityLevel,
        loadTimeCost: tp.loadTimeCost,
        emotionalIntensity: tp.emotionalIntensity,
        caregivingHours: tp.caregivingHours,
        notes: tp.notes,
        templateId: template.id,
        order: existingCount + i,
        createdAt: now,
        updatedAt: now,
      }
    })

    await db.phases.bulkAdd(phases)
    return phases
  },
}
