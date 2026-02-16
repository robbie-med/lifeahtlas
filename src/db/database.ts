import Dexie, { type Table } from 'dexie'
import type { Person, Household, Scenario, Phase, Account, IncomeStream, ExpenseRule, Assumption, Template, DebtPlan, SavingsGoal, FamilyMember } from '@/types'

export class LifeAhtlasDB extends Dexie {
  persons!: Table<Person, string>
  households!: Table<Household, string>
  scenarios!: Table<Scenario, string>
  phases!: Table<Phase, string>
  accounts!: Table<Account, string>
  incomeStreams!: Table<IncomeStream, string>
  expenseRules!: Table<ExpenseRule, string>
  assumptions!: Table<Assumption, string>
  templates!: Table<Template, string>
  debtPlans!: Table<DebtPlan, string>
  savingsGoals!: Table<SavingsGoal, string>
  familyMembers!: Table<FamilyMember, string>

  constructor() {
    super('LifeAhtlasDB')

    this.version(1).stores({
      persons: 'id, name',
      households: 'id',
      scenarios: 'id, personId, isBaseline',
      phases: 'id, scenarioId, category, startDate, endDate, [scenarioId+category]',
      accounts: 'id, scenarioId',
      incomeStreams: 'id, scenarioId, phaseId',
      expenseRules: 'id, scenarioId, phaseId',
      assumptions: 'id, scenarioId, key',
      templates: 'id, group',
    })

    this.version(2).stores({
      persons: 'id, name',
      households: 'id',
      scenarios: 'id, personId, isBaseline',
      phases: 'id, scenarioId, category, startDate, endDate, [scenarioId+category]',
      accounts: 'id, scenarioId',
      incomeStreams: 'id, scenarioId, phaseId',
      expenseRules: 'id, scenarioId, phaseId',
      assumptions: 'id, scenarioId, key',
      templates: 'id, group',
      debtPlans: 'id, scenarioId',
    })

    this.version(3).stores({
      persons: 'id, name',
      households: 'id',
      scenarios: 'id, personId, isBaseline',
      phases: 'id, scenarioId, category, startDate, endDate, [scenarioId+category]',
      accounts: 'id, scenarioId',
      incomeStreams: 'id, scenarioId, phaseId',
      expenseRules: 'id, scenarioId, phaseId',
      assumptions: 'id, scenarioId, key',
      templates: 'id, group',
      debtPlans: 'id, scenarioId',
      savingsGoals: 'id, scenarioId, type',
    })

    this.version(4).stores({
      persons: 'id, name',
      households: 'id',
      scenarios: 'id, personId, isBaseline',
      phases: 'id, scenarioId, category, startDate, endDate, [scenarioId+category], familyMemberId',
      accounts: 'id, scenarioId',
      incomeStreams: 'id, scenarioId, phaseId',
      expenseRules: 'id, scenarioId, phaseId',
      assumptions: 'id, scenarioId, key',
      templates: 'id, group',
      debtPlans: 'id, scenarioId',
      savingsGoals: 'id, scenarioId, type',
      familyMembers: 'id, personId, relationship',
    })
  }
}

export const db = new LifeAhtlasDB()
