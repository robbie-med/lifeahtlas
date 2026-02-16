import { v4 as uuid } from 'uuid'
import { db } from '@/db/database'
import type { Person, Sex } from '@/types'

export const personActions = {
  async create(name: string, birthDate: string, sex?: Sex): Promise<Person> {
    const now = new Date().toISOString()
    const person: Person = {
      id: uuid(),
      name,
      birthDate,
      ...(sex !== undefined ? { sex } : {}),
      createdAt: now,
      updatedAt: now,
    }
    await db.persons.add(person)
    return person
  },

  async update(id: string, updates: Partial<Pick<Person, 'name' | 'birthDate' | 'sex'>>) {
    await db.persons.update(id, { ...updates, updatedAt: new Date().toISOString() })
  },

  async remove(id: string) {
    await db.transaction('rw', [db.persons, db.scenarios, db.phases, db.accounts, db.incomeStreams, db.expenseRules, db.assumptions, db.familyMembers], async () => {
      const scenarios = await db.scenarios.where('personId').equals(id).toArray()
      const scenarioIds = scenarios.map((s) => s.id)
      await db.phases.where('scenarioId').anyOf(scenarioIds).delete()
      await db.accounts.where('scenarioId').anyOf(scenarioIds).delete()
      await db.incomeStreams.where('scenarioId').anyOf(scenarioIds).delete()
      await db.expenseRules.where('scenarioId').anyOf(scenarioIds).delete()
      await db.assumptions.where('scenarioId').anyOf(scenarioIds).delete()
      await db.scenarios.where('personId').equals(id).delete()
      await db.familyMembers.where('personId').equals(id).delete()
      await db.persons.delete(id)
    })
  },
}
