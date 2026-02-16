import { describe, it, expect } from 'vitest'
import {
  computeSurvivalCurve,
  lifeExpectancyAtAge,
  computePercentiles,
  healthyLifeExpectancy,
  computeCareNeedsCurve,
  expectedCareCosts,
} from '../longevity-engine'

describe('longevity-engine', () => {
  it('survival curve starts at 1.0 and monotonically decreases', () => {
    const curve = computeSurvivalCurve(30, 'male')
    expect(curve[0].probability).toBe(1.0)
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].probability).toBeLessThanOrEqual(curve[i - 1].probability)
    }
    // Should reach near 0 by age 110
    expect(curve[curve.length - 1].probability).toBeLessThan(0.01)
  })

  it('life expectancy at birth is in plausible range', () => {
    const maleLEAtBirth = lifeExpectancyAtAge(0, 'male')
    const femaleLEAtBirth = lifeExpectancyAtAge(0, 'female')
    // US male LE ~74-78, female ~79-83
    expect(maleLEAtBirth).toBeGreaterThan(70)
    expect(maleLEAtBirth).toBeLessThan(85)
    expect(femaleLEAtBirth).toBeGreaterThan(75)
    expect(femaleLEAtBirth).toBeLessThan(90)
    // Women live longer on average
    expect(femaleLEAtBirth).toBeGreaterThan(maleLEAtBirth)
  })

  it('life expectancy at age 65 is shorter remaining than at birth', () => {
    const leAt65 = lifeExpectancyAtAge(65, 'male')
    // Remaining LE at 65 should be ~15-22 years
    expect(leAt65).toBeGreaterThan(12)
    expect(leAt65).toBeLessThan(25)
  })

  it('percentiles are ordered correctly', () => {
    const p = computePercentiles(0, 'female')
    expect(p.p25).toBeLessThan(p.p50)
    expect(p.p50).toBeLessThan(p.p75)
    expect(p.p75).toBeLessThan(p.p90)
    // Median should be close to life expectancy
    expect(p.p50).toBeGreaterThan(75)
    expect(p.p50).toBeLessThan(95)
  })

  it('healthy life expectancy is less than total life expectancy', () => {
    const total = lifeExpectancyAtAge(30, 'male')
    const healthy = healthyLifeExpectancy(30, 'male')
    expect(healthy).toBeLessThan(total)
    expect(healthy).toBeGreaterThan(total * 0.5) // At least 50% of total
  })

  it('care needs probabilities sum to ~100% at each age', () => {
    const curve = computeCareNeedsCurve(60, 'female')
    for (const point of curve) {
      const total = point.independentLiving + point.lightAssistance + point.moderateAssistance + point.fullCare
      expect(total).toBeGreaterThan(99)
      expect(total).toBeLessThan(101)
    }
  })

  it('care need for full care increases with age', () => {
    const curve = computeCareNeedsCurve(60, 'male')
    const at65 = curve.find((c) => c.age === 65)!
    const at85 = curve.find((c) => c.age === 85)!
    expect(at85.fullCare).toBeGreaterThan(at65.fullCare)
    expect(at85.independentLiving).toBeLessThan(at65.independentLiving)
  })

  it('expected care costs returns positive total', () => {
    const { totalExpected, yearlyExpected } = expectedCareCosts(30, 'female')
    expect(totalExpected).toBeGreaterThan(0)
    expect(yearlyExpected.length).toBeGreaterThan(0)
    // Women have higher expected costs (live longer, higher disability rates)
    const maleCosts = expectedCareCosts(30, 'male')
    expect(totalExpected).toBeGreaterThan(maleCosts.totalExpected)
  })
})
