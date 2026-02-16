import { useUIStore } from '@/stores/uiStore'
import { AccessibilityMode } from '@/types'
import { Select } from '@/components/ui/select'

export function AccessibilityToggle() {
  const mode = useUIStore((s) => s.accessibilityMode)
  const setMode = useUIStore((s) => s.setAccessibilityMode)

  return (
    <Select
      value={mode}
      onChange={(e) => setMode(e.target.value as AccessibilityMode)}
      className="w-[140px] h-8 text-xs"
    >
      {Object.entries(AccessibilityMode).map(([key, val]) => (
        <option key={val} value={val}>
          {key.replace(/([A-Z])/g, ' $1').trim()}
        </option>
      ))}
    </Select>
  )
}
