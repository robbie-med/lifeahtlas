import { create } from 'zustand'
import { PresentationMode, AccessibilityMode, ZoomLevel } from '@/types'
import type { ViewportState } from '@/types'

const ZOOM_PRESETS: Record<ZoomLevel, number> = {
  [ZoomLevel.Decade]: 0.05,
  [ZoomLevel.Year]: 1,
  [ZoomLevel.Month]: 10,
  [ZoomLevel.Week]: 50,
}

interface UIState {
  presentationMode: PresentationMode
  accessibilityMode: AccessibilityMode
  zoomLevel: ZoomLevel
  viewport: ViewportState
  selectedPhaseId: string | null
  selectedScenarioId: string | null
  compareScenarioId: string | null
  sidebarOpen: boolean

  setPresentationMode: (mode: PresentationMode) => void
  setAccessibilityMode: (mode: AccessibilityMode) => void
  setZoomLevel: (level: ZoomLevel) => void
  setViewport: (viewport: Partial<ViewportState>) => void
  setPixelsPerDay: (ppd: number) => void
  selectPhase: (id: string | null) => void
  selectScenario: (id: string | null) => void
  setCompareScenario: (id: string | null) => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  presentationMode: PresentationMode.Strategic,
  accessibilityMode: AccessibilityMode.Default,
  zoomLevel: ZoomLevel.Year,
  viewport: {
    offsetX: 0,
    offsetY: 0,
    pixelsPerDay: ZOOM_PRESETS[ZoomLevel.Year],
  },
  selectedPhaseId: null,
  selectedScenarioId: null,
  compareScenarioId: null,
  sidebarOpen: false,

  setPresentationMode: (mode) => set({ presentationMode: mode }),
  setAccessibilityMode: (mode) => set({ accessibilityMode: mode }),
  setZoomLevel: (level) =>
    set((state) => ({
      zoomLevel: level,
      viewport: { ...state.viewport, pixelsPerDay: ZOOM_PRESETS[level] },
    })),
  setViewport: (partial) =>
    set((state) => ({ viewport: { ...state.viewport, ...partial } })),
  setPixelsPerDay: (ppd) =>
    set((state) => ({ viewport: { ...state.viewport, pixelsPerDay: ppd } })),
  selectPhase: (id) => set({ selectedPhaseId: id }),
  selectScenario: (id) => set({ selectedScenarioId: id }),
  setCompareScenario: (id) => set({ compareScenarioId: id }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))

export { ZOOM_PRESETS }
