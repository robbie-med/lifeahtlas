/**
 * Longevity Engine — actuarial life tables, survival curves, care phase modeling
 *
 * Uses simplified US life table data (2021 CDC National Vital Statistics).
 * Provides: life expectancy at age, survival probability curves,
 * care phase probability estimates, and healthy life expectancy.
 */

// Simplified US period life table — probability of dying (qx) by age, male & female
// Source: condensed from CDC NVSS 2021 data at 5-year intervals, linearly interpolated
const LIFE_TABLE_QX_MALE: [number, number][] = [
  [0, 0.00600], [1, 0.00040], [5, 0.00015], [10, 0.00012],
  [15, 0.00060], [20, 0.00130], [25, 0.00160], [30, 0.00170],
  [35, 0.00200], [40, 0.00250], [45, 0.00380], [50, 0.00580],
  [55, 0.00900], [60, 0.01350], [65, 0.01900], [70, 0.02700],
  [75, 0.04200], [80, 0.06700], [85, 0.10500], [90, 0.16500],
  [95, 0.25000], [100, 0.38000], [105, 0.50000], [110, 1.0],
]

const LIFE_TABLE_QX_FEMALE: [number, number][] = [
  [0, 0.00500], [1, 0.00035], [5, 0.00012], [10, 0.00010],
  [15, 0.00030], [20, 0.00050], [25, 0.00060], [30, 0.00070],
  [35, 0.00090], [40, 0.00140], [45, 0.00220], [50, 0.00350],
  [55, 0.00550], [60, 0.00850], [65, 0.01250], [70, 0.01900],
  [75, 0.03100], [80, 0.05200], [85, 0.08800], [90, 0.14500],
  [95, 0.22000], [100, 0.35000], [105, 0.48000], [110, 1.0],
]

function interpolateQx(table: [number, number][], age: number): number {
  if (age <= table[0][0]) return table[0][1]
  if (age >= table[table.length - 1][0]) return table[table.length - 1][1]

  for (let i = 0; i < table.length - 1; i++) {
    const [a0, q0] = table[i]
    const [a1, q1] = table[i + 1]
    if (age >= a0 && age < a1) {
      const t = (age - a0) / (a1 - a0)
      return q0 + t * (q1 - q0)
    }
  }
  return table[table.length - 1][1]
}

import type { Sex } from '@/types'
export type { Sex }

/**
 * Compute survival curve from a given current age to max age
 * Returns array of { age, survivalProbability } from currentAge to 110
 */
export interface SurvivalPoint {
  age: number
  probability: number
}

export function computeSurvivalCurve(
  currentAge: number,
  sex: Sex,
  maxAge: number = 110,
): SurvivalPoint[] {
  const table = sex === 'male' ? LIFE_TABLE_QX_MALE : LIFE_TABLE_QX_FEMALE
  const points: SurvivalPoint[] = []
  let survival = 1.0

  for (let age = Math.floor(currentAge); age <= maxAge; age++) {
    points.push({ age, probability: survival })
    const qx = interpolateQx(table, age)
    survival *= (1 - qx)
  }

  return points
}

/**
 * Life expectancy at a given age (remaining years)
 * Uses the survival curve integration method
 */
export function lifeExpectancyAtAge(currentAge: number, sex: Sex): number {
  const curve = computeSurvivalCurve(currentAge, sex)
  // Approximate integral of survival curve = remaining life expectancy
  let sum = 0
  for (let i = 1; i < curve.length; i++) {
    sum += (curve[i - 1].probability + curve[i].probability) / 2
  }
  return Math.round(sum * 10) / 10
}

/**
 * Percentile ages — age at which X% of cohort has died
 */
export interface LongevityPercentiles {
  p25: number // 25% chance of dying before this age
  p50: number // median life expectancy
  p75: number // 75% chance of dying before this age
  p90: number // 90% chance of dying before this age
}

export function computePercentiles(currentAge: number, sex: Sex): LongevityPercentiles {
  const curve = computeSurvivalCurve(currentAge, sex)

  const findAge = (targetSurvival: number): number => {
    for (let i = 1; i < curve.length; i++) {
      if (curve[i].probability <= targetSurvival) {
        // Linear interpolation between points
        const prev = curve[i - 1]
        const curr = curve[i]
        const t = (prev.probability - targetSurvival) / (prev.probability - curr.probability)
        return Math.round((prev.age + t * (curr.age - prev.age)) * 10) / 10
      }
    }
    return curve[curve.length - 1].age
  }

  return {
    p25: findAge(0.75), // 25% died => 75% survive
    p50: findAge(0.50), // 50% died => 50% survive
    p75: findAge(0.25), // 75% died => 25% survive
    p90: findAge(0.10), // 90% died => 10% survive
  }
}

/**
 * Healthy life expectancy — approximate disability-free years
 * Uses a simplified model: healthy LE is ~85-90% of total LE up to age 65,
 * declining more steeply after that.
 */
export function healthyLifeExpectancy(currentAge: number, sex: Sex): number {
  const totalLE = lifeExpectancyAtAge(currentAge, sex)
  // Approximate: healthy years are total LE minus expected disability years
  // Disability years increase with age
  const expectedDisabilityYears = currentAge < 50
    ? totalLE * 0.12
    : currentAge < 65
      ? totalLE * 0.15
      : currentAge < 75
        ? totalLE * 0.25
        : totalLE * 0.35

  return Math.round((totalLE - expectedDisabilityYears) * 10) / 10
}

/**
 * Care needs probability by age — estimates the likelihood of needing
 * various levels of care assistance
 */
export interface CareNeedsProbability {
  age: number
  independentLiving: number   // % chance of full independence
  lightAssistance: number     // some help with IADLs
  moderateAssistance: number  // help with some ADLs
  fullCare: number            // nursing/full-time care
}

export function computeCareNeedsCurve(
  startAge: number,
  sex: Sex,
): CareNeedsProbability[] {
  const points: CareNeedsProbability[] = []

  for (let age = Math.floor(startAge); age <= 100; age++) {
    // Simplified model based on epidemiological studies
    // Women have higher disability rates but live longer
    const genderFactor = sex === 'female' ? 1.15 : 1.0

    let independent: number
    let light: number
    let moderate: number
    let full: number

    if (age < 60) {
      independent = 0.95
      light = 0.03
      moderate = 0.015
      full = 0.005
    } else if (age < 70) {
      const t = (age - 60) / 10
      independent = 0.95 - t * 0.12 * genderFactor
      light = 0.03 + t * 0.06 * genderFactor
      moderate = 0.015 + t * 0.04 * genderFactor
      full = 0.005 + t * 0.02 * genderFactor
    } else if (age < 80) {
      const t = (age - 70) / 10
      independent = (0.83 - t * 0.25) * (2 - genderFactor)
      light = 0.09 + t * 0.10 * genderFactor
      moderate = 0.055 + t * 0.10 * genderFactor
      full = 0.025 + t * 0.05 * genderFactor
    } else if (age < 90) {
      const t = (age - 80) / 10
      independent = (0.58 - t * 0.30) * (2 - genderFactor)
      light = 0.19 + t * 0.05
      moderate = 0.155 + t * 0.15 * genderFactor
      full = 0.075 + t * 0.10 * genderFactor
    } else {
      const t = Math.min((age - 90) / 10, 1)
      independent = Math.max(0.28 - t * 0.20, 0.05)
      light = 0.24 - t * 0.05
      moderate = 0.305 + t * 0.05
      full = 0.175 + t * 0.20
    }

    // Normalize to sum to 1
    const total = independent + light + moderate + full
    points.push({
      age,
      independentLiving: Math.round((independent / total) * 1000) / 10,
      lightAssistance: Math.round((light / total) * 1000) / 10,
      moderateAssistance: Math.round((moderate / total) * 1000) / 10,
      fullCare: Math.round((full / total) * 1000) / 10,
    })
  }

  return points
}

/**
 * Estimate care costs at various stages (monthly, in today's dollars)
 */
export interface CareCostEstimate {
  independentLiving: number
  lightAssistance: number
  moderateAssistance: number
  fullCare: number
}

export function getCareCostEstimates(): CareCostEstimate {
  return {
    independentLiving: 0,
    lightAssistance: 1500,    // ~$18K/yr for part-time help
    moderateAssistance: 4500, // ~$54K/yr for regular aide
    fullCare: 9000,           // ~$108K/yr nursing facility average
  }
}

/**
 * Expected total care costs from a given age to end of life
 * Integrates care probabilities × costs × survival probability
 */
export function expectedCareCosts(
  currentAge: number,
  sex: Sex,
): { totalExpected: number; yearlyExpected: { age: number; cost: number }[] } {
  const survival = computeSurvivalCurve(currentAge, sex)
  const careNeeds = computeCareNeedsCurve(currentAge, sex)
  const costs = getCareCostEstimates()

  const yearlyExpected: { age: number; cost: number }[] = []
  let totalExpected = 0

  for (let i = 0; i < careNeeds.length; i++) {
    const cn = careNeeds[i]
    const sp = survival.find((s) => s.age === cn.age)
    if (!sp) continue

    // Expected annual cost = survival prob × sum(care prob × care cost × 12)
    const annualCost = sp.probability * (
      (cn.lightAssistance / 100) * costs.lightAssistance * 12 +
      (cn.moderateAssistance / 100) * costs.moderateAssistance * 12 +
      (cn.fullCare / 100) * costs.fullCare * 12
    )

    yearlyExpected.push({ age: cn.age, cost: Math.round(annualCost) })
    totalExpected += annualCost
  }

  return { totalExpected: Math.round(totalExpected), yearlyExpected }
}
