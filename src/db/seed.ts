import { db } from './database'
import { allTemplates } from '@/data/templates'

export async function seedDatabase() {
  const count = await db.templates.count()
  if (count > 0) return // already seeded

  await db.templates.bulkAdd(allTemplates)
}
