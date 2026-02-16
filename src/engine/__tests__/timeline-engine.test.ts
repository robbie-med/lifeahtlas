import { describe, it, expect } from 'vitest'
import {
  dateToPixel,
  pixelToDate,
  getPhaseLayout,
  getVisiblePhases,
  getAxisTicks,
  clampPixelsPerDay,
} from '../timeline-engine'
import { PhaseCategory, CertaintyLevel, FlexibilityLevel } from '@/types'
import type { Phase } from '@/types'

const origin = new Date('2024-01-01')

function makePhase(overrides: Partial<Phase> = {}): Phase {
  return {
    id: 'p1',
    scenarioId: 's1',
    name: 'Test Phase',
    category: PhaseCategory.Career,
    startDate: '2024-06-01',
    endDate: '2025-06-01',
    certainty: CertaintyLevel.Confirmed,
    flexibility: FlexibilityLevel.Fixed,
    loadTimeCost: 50,
    emotionalIntensity: 30,
    caregivingHours: 0,
    notes: '',
    order: 0,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

describe('dateToPixel / pixelToDate', () => {
  it('converts date to pixel correctly', () => {
    const date = new Date('2024-07-01')
    const ppd = 1
    const px = dateToPixel(date, origin, ppd)
    // Jan 1 to Jul 1 = 182 days
    expect(px).toBe(182)
  })

  it('round-trips correctly', () => {
    const ppd = 2
    const px = 364
    const date = pixelToDate(px, origin, ppd)
    const backPx = dateToPixel(date, origin, ppd)
    expect(backPx).toBe(px)
  })
})

describe('getPhaseLayout', () => {
  it('assigns rows by category', () => {
    const phases = [
      makePhase({ id: 'p1', category: PhaseCategory.Career }),
      makePhase({ id: 'p2', category: PhaseCategory.Family, startDate: '2024-03-01', endDate: '2025-03-01' }),
    ]
    const layouts = getPhaseLayout(phases, origin, 1)
    expect(layouts).toHaveLength(2)
    expect(layouts[0].row).not.toBe(layouts[1].row)
  })

  it('computes positive width', () => {
    const layouts = getPhaseLayout([makePhase()], origin, 1)
    expect(layouts[0].width).toBeGreaterThan(0)
  })
})

describe('getVisiblePhases', () => {
  it('filters out off-screen phases', () => {
    const layouts = getPhaseLayout(
      [
        makePhase({ id: 'p1', startDate: '2024-06-01', endDate: '2025-06-01' }),
        makePhase({ id: 'p2', startDate: '2030-01-01', endDate: '2031-01-01' }),
      ],
      origin,
      1,
    )
    const visible = getVisiblePhases(layouts, { offsetX: 0, offsetY: 0, pixelsPerDay: 1 }, 600)
    // Only the first phase should be visible (within first 600px = 600 days from origin)
    expect(visible.length).toBe(1)
    expect(visible[0].phase.id).toBe('p1')
  })
})

describe('getAxisTicks', () => {
  it('returns ticks for year view', () => {
    const ticks = getAxisTicks(origin, { offsetX: 0, offsetY: 0, pixelsPerDay: 1 }, 800)
    expect(ticks.length).toBeGreaterThan(0)
    expect(ticks.some((t) => t.isMajor)).toBe(true)
  })
})

describe('clampPixelsPerDay', () => {
  it('clamps to min', () => {
    expect(clampPixelsPerDay(0.001)).toBe(0.01)
  })

  it('clamps to max', () => {
    expect(clampPixelsPerDay(200)).toBe(100)
  })

  it('passes through valid values', () => {
    expect(clampPixelsPerDay(5)).toBe(5)
  })
})
