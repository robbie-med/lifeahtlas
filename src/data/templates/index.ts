import { careerTemplates } from './career'
import { childrenTemplates } from './children'
import { caregivingTemplates } from './caregiving'
import { familyTemplates } from './family'
import type { Template } from '@/types'

export const allTemplates: Template[] = [
  ...careerTemplates,
  ...childrenTemplates,
  ...familyTemplates,
  ...caregivingTemplates,
]
