import { v4 as uuid } from 'uuid'
import { db } from '@/db/database'
import type { Scenario } from '@/types'

export const scenarioActions = {
  async create(personId: string, name: string, description = '', isBaseline = false): Promise<Scenario> {
    const now = new Date().toISOString()
    const scenario: Scenario = {
      id: uuid(),
      personId,
      name,
      description,
      isBaseline,
      createdAt: now,
      updatedAt: now,
    }
    await db.scenarios.add(scenario)
    return scenario
  },

  async update(id: string, updates: Partial<Pick<Scenario, 'name' | 'description' | 'isBaseline'>>) {
    await db.scenarios.update(id, { ...updates, updatedAt: new Date().toISOString() })
  },

  async duplicate(id: string, newName: string): Promise<Scenario> {
    const now = new Date().toISOString()
    const original = await db.scenarios.get(id)
    if (!original) throw new Error(`Scenario ${id} not found`)

    const newScenarioId = uuid()
    const scenario: Scenario = {
      ...original,
      id: newScenarioId,
      name: newName,
      isBaseline: false,
      createdAt: now,
      updatedAt: now,
    }

    await db.transaction('rw', [db.scenarios, db.phases, db.accounts, db.incomeStreams, db.expenseRules, db.assumptions, db.debtPlans, db.savingsGoals], async () => {
      await db.scenarios.add(scenario)

      const phases = await db.phases.where('scenarioId').equals(id).toArray()
      if (phases.length > 0) {
        await db.phases.bulkAdd(
          phases.map((p) => ({ ...p, id: uuid(), scenarioId: newScenarioId, createdAt: now, updatedAt: now })),
        )
      }

      const accounts = await db.accounts.where('scenarioId').equals(id).toArray()
      if (accounts.length > 0) {
        await db.accounts.bulkAdd(
          accounts.map((a) => ({ ...a, id: uuid(), scenarioId: newScenarioId, createdAt: now })),
        )
      }

      const incomes = await db.incomeStreams.where('scenarioId').equals(id).toArray()
      if (incomes.length > 0) {
        await db.incomeStreams.bulkAdd(
          incomes.map((i) => ({ ...i, id: uuid(), scenarioId: newScenarioId, createdAt: now })),
        )
      }

      const expenses = await db.expenseRules.where('scenarioId').equals(id).toArray()
      if (expenses.length > 0) {
        await db.expenseRules.bulkAdd(
          expenses.map((e) => ({ ...e, id: uuid(), scenarioId: newScenarioId, createdAt: now })),
        )
      }

      const assumptions = await db.assumptions.where('scenarioId').equals(id).toArray()
      if (assumptions.length > 0) {
        await db.assumptions.bulkAdd(
          assumptions.map((a) => ({ ...a, id: uuid(), scenarioId: newScenarioId })),
        )
      }

      const debtPlans = await db.debtPlans.where('scenarioId').equals(id).toArray()
      if (debtPlans.length > 0) {
        await db.debtPlans.bulkAdd(
          debtPlans.map((d) => ({ ...d, id: uuid(), scenarioId: newScenarioId, createdAt: now })),
        )
      }

      const savingsGoals = await db.savingsGoals.where('scenarioId').equals(id).toArray()
      if (savingsGoals.length > 0) {
        await db.savingsGoals.bulkAdd(
          savingsGoals.map((g) => ({ ...g, id: uuid(), scenarioId: newScenarioId, createdAt: now })),
        )
      }
    })

    return scenario
  },

  async remove(id: string) {
    await db.transaction('rw', [db.scenarios, db.phases, db.accounts, db.incomeStreams, db.expenseRules, db.assumptions, db.debtPlans, db.savingsGoals], async () => {
      await db.phases.where('scenarioId').equals(id).delete()
      await db.accounts.where('scenarioId').equals(id).delete()
      await db.incomeStreams.where('scenarioId').equals(id).delete()
      await db.expenseRules.where('scenarioId').equals(id).delete()
      await db.assumptions.where('scenarioId').equals(id).delete()
      await db.debtPlans.where('scenarioId').equals(id).delete()
      await db.savingsGoals.where('scenarioId').equals(id).delete()
      await db.scenarios.delete(id)
    })
  },
}
