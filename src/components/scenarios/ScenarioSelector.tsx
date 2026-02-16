import { useState } from 'react'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUIStore } from '@/stores/uiStore'
import { useLiveScenarios } from '@/hooks/useLiveData'
import { scenarioActions } from '@/stores/scenarioStore'

interface ScenarioSelectorProps {
  personId: string
}

export function ScenarioSelector({ personId }: ScenarioSelectorProps) {
  const scenarios = useLiveScenarios(personId)
  const selectedId = useUIStore((s) => s.selectedScenarioId)
  const selectScenario = useUIStore((s) => s.selectScenario)
  const compareId = useUIStore((s) => s.compareScenarioId)
  const setCompare = useUIStore((s) => s.setCompareScenario)
  const [duplicating, setDuplicating] = useState(false)
  const [dupName, setDupName] = useState('')

  const handleDuplicate = async () => {
    if (!selectedId || !dupName) return
    const newScenario = await scenarioActions.duplicate(selectedId, dupName)
    selectScenario(newScenario.id)
    setDuplicating(false)
    setDupName('')
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedId ?? ''}
        onChange={(e) => selectScenario(e.target.value || null)}
        className="w-[180px] h-8 text-xs"
      >
        <option value="">Select scenario</option>
        {scenarios?.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} {s.isBaseline ? '(baseline)' : ''}
          </option>
        ))}
      </Select>

      {selectedId && (
        <>
          <Select
            value={compareId ?? ''}
            onChange={(e) => setCompare(e.target.value || null)}
            className="w-[160px] h-8 text-xs"
          >
            <option value="">Compare with...</option>
            {scenarios
              ?.filter((s) => s.id !== selectedId)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </Select>

          {duplicating ? (
            <div className="flex items-center gap-1">
              <Input
                value={dupName}
                onChange={(e) => setDupName(e.target.value)}
                placeholder="New name"
                className="w-[140px] h-8 text-xs"
              />
              <Button size="sm" onClick={handleDuplicate} className="h-8 text-xs">
                Go
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDuplicating(false)} className="h-8 text-xs">
                X
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setDuplicating(true)} className="h-8 text-xs">
              Duplicate
            </Button>
          )}
        </>
      )}
    </div>
  )
}
