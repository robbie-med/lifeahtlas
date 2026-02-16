import { v4 as uuid } from 'uuid'
import { db } from '@/db/database'
import type { Account, IncomeStream, ExpenseRule, DebtPlan, SavingsGoal, Assumption } from '@/types'

export const financialActions = {
  // Accounts
  async createAccount(account: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
    const newAccount: Account = {
      ...account,
      id: uuid(),
      createdAt: new Date().toISOString(),
    }
    await db.accounts.add(newAccount)
    return newAccount
  },

  async updateAccount(id: string, updates: Partial<Account>) {
    await db.accounts.update(id, updates)
  },

  async removeAccount(id: string) {
    await db.accounts.delete(id)
  },

  // Income Streams
  async createIncome(income: Omit<IncomeStream, 'id' | 'createdAt'>): Promise<IncomeStream> {
    const newIncome: IncomeStream = {
      ...income,
      id: uuid(),
      createdAt: new Date().toISOString(),
    }
    await db.incomeStreams.add(newIncome)
    return newIncome
  },

  async updateIncome(id: string, updates: Partial<IncomeStream>) {
    await db.incomeStreams.update(id, updates)
  },

  async removeIncome(id: string) {
    await db.incomeStreams.delete(id)
  },

  // Expense Rules
  async createExpense(expense: Omit<ExpenseRule, 'id' | 'createdAt'>): Promise<ExpenseRule> {
    const newExpense: ExpenseRule = {
      ...expense,
      id: uuid(),
      createdAt: new Date().toISOString(),
    }
    await db.expenseRules.add(newExpense)
    return newExpense
  },

  async updateExpense(id: string, updates: Partial<ExpenseRule>) {
    await db.expenseRules.update(id, updates)
  },

  async removeExpense(id: string) {
    await db.expenseRules.delete(id)
  },

  // Debt Plans
  async createDebtPlan(plan: Omit<DebtPlan, 'id' | 'createdAt'>): Promise<DebtPlan> {
    const newPlan: DebtPlan = {
      ...plan,
      id: uuid(),
      createdAt: new Date().toISOString(),
    }
    await db.debtPlans.add(newPlan)
    return newPlan
  },

  async updateDebtPlan(id: string, updates: Partial<DebtPlan>) {
    await db.debtPlans.update(id, updates)
  },

  async removeDebtPlan(id: string) {
    await db.debtPlans.delete(id)
  },

  // Savings Goals
  async createSavingsGoal(goal: Omit<SavingsGoal, 'id' | 'createdAt'>): Promise<SavingsGoal> {
    const newGoal: SavingsGoal = {
      ...goal,
      id: uuid(),
      createdAt: new Date().toISOString(),
    }
    await db.savingsGoals.add(newGoal)
    return newGoal
  },

  async updateSavingsGoal(id: string, updates: Partial<SavingsGoal>) {
    await db.savingsGoals.update(id, updates)
  },

  async removeSavingsGoal(id: string) {
    await db.savingsGoals.delete(id)
  },

  // Assumptions
  async createAssumption(assumption: Omit<Assumption, 'id'>): Promise<Assumption> {
    const newAssumption: Assumption = {
      ...assumption,
      id: uuid(),
    }
    await db.assumptions.add(newAssumption)
    return newAssumption
  },

  async updateAssumption(id: string, updates: Partial<Assumption>) {
    await db.assumptions.update(id, updates)
  },

  async removeAssumption(id: string) {
    await db.assumptions.delete(id)
  },
}
