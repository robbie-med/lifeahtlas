import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { Person, Scenario, Phase, Account, IncomeStream, ExpenseRule, Assumption, Template, DebtPlan, SavingsGoal, FamilyMember } from '@/types'

export function useLivePersons(): Person[] | undefined {
  return useLiveQuery(() => db.persons.toArray())
}

export function useLivePerson(id: string | null): Person | undefined {
  return useLiveQuery(() => (id ? db.persons.get(id) : undefined), [id])
}

export function useLiveScenarios(personId: string | null): Scenario[] | undefined {
  return useLiveQuery(
    () => (personId ? db.scenarios.where('personId').equals(personId).toArray() : []),
    [personId],
  )
}

export function useLiveScenario(id: string | null): Scenario | undefined {
  return useLiveQuery(() => (id ? db.scenarios.get(id) : undefined), [id])
}

export function useLivePhases(scenarioId: string | null): Phase[] | undefined {
  return useLiveQuery(
    () =>
      scenarioId
        ? db.phases.where('scenarioId').equals(scenarioId).sortBy('order')
        : [],
    [scenarioId],
  )
}

export function useLiveAccounts(scenarioId: string | null): Account[] | undefined {
  return useLiveQuery(
    () => (scenarioId ? db.accounts.where('scenarioId').equals(scenarioId).toArray() : []),
    [scenarioId],
  )
}

export function useLiveIncomeStreams(scenarioId: string | null): IncomeStream[] | undefined {
  return useLiveQuery(
    () => (scenarioId ? db.incomeStreams.where('scenarioId').equals(scenarioId).toArray() : []),
    [scenarioId],
  )
}

export function useLiveExpenseRules(scenarioId: string | null): ExpenseRule[] | undefined {
  return useLiveQuery(
    () => (scenarioId ? db.expenseRules.where('scenarioId').equals(scenarioId).toArray() : []),
    [scenarioId],
  )
}

export function useLiveAssumptions(scenarioId: string | null): Assumption[] | undefined {
  return useLiveQuery(
    () => (scenarioId ? db.assumptions.where('scenarioId').equals(scenarioId).toArray() : []),
    [scenarioId],
  )
}

export function useLiveDebtPlans(scenarioId: string | null): DebtPlan[] | undefined {
  return useLiveQuery(
    () => (scenarioId ? db.debtPlans.where('scenarioId').equals(scenarioId).toArray() : []),
    [scenarioId],
  )
}

export function useLiveSavingsGoals(scenarioId: string | null): SavingsGoal[] | undefined {
  return useLiveQuery(
    () => (scenarioId ? db.savingsGoals.where('scenarioId').equals(scenarioId).toArray() : []),
    [scenarioId],
  )
}

export function useLiveTemplates(): Template[] | undefined {
  return useLiveQuery(() => db.templates.toArray())
}

export function useLiveTemplatesByGroup(group: string): Template[] | undefined {
  return useLiveQuery(() => db.templates.where('group').equals(group).toArray(), [group])
}

export function useLiveFamilyMembers(personId: string | null): FamilyMember[] | undefined {
  return useLiveQuery(
    () => (personId ? db.familyMembers.where('personId').equals(personId).toArray() : []),
    [personId],
  )
}
