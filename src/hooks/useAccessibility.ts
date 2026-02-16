import { useUIStore } from '@/stores/uiStore'
import { AccessibilityMode } from '@/types'

export function useAccessibility() {
  const mode = useUIStore((s) => s.accessibilityMode)

  return {
    mode,
    showIcons: mode !== AccessibilityMode.TextOnly && mode !== AccessibilityMode.NumericOnly,
    showText: mode !== AccessibilityMode.IconOnly && mode !== AccessibilityMode.NumericOnly,
    showNarrative: mode !== AccessibilityMode.NumericOnly && mode !== AccessibilityMode.IconOnly,
    showCharts: mode !== AccessibilityMode.TextOnly,
    showNumbers: mode !== AccessibilityMode.IconOnly,
  }
}
