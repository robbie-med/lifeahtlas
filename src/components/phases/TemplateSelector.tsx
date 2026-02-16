import { useState } from 'react'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useLiveTemplates } from '@/hooks/useLiveData'
import { phaseActions } from '@/stores/phaseStore'
import type { Template } from '@/types'

interface TemplateSelectorProps {
  open: boolean
  onClose: () => void
  scenarioId: string
}

export function TemplateSelector({ open, onClose, scenarioId }: TemplateSelectorProps) {
  const templates = useLiveTemplates()
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [startDate, setStartDate] = useState('')
  const [filterGroup, setFilterGroup] = useState<string>('all')

  const filtered = templates?.filter(
    (t) => filterGroup === 'all' || t.group === filterGroup,
  )

  const handleApply = async () => {
    if (!selectedTemplate || !startDate) return
    await phaseActions.applyTemplate(scenarioId, selectedTemplate, new Date(startDate))
    setSelectedTemplate(null)
    setStartDate('')
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader>
        <SheetTitle>Apply Template</SheetTitle>
      </SheetHeader>

      <div className="space-y-4">
        <div className="flex gap-2">
          {['all', 'career', 'children', 'caregiving'].map((g) => (
            <Button
              key={g}
              size="sm"
              variant={filterGroup === g ? 'default' : 'outline'}
              onClick={() => setFilterGroup(g)}
            >
              {g === 'all' ? 'All' : g.charAt(0).toUpperCase() + g.slice(1)}
            </Button>
          ))}
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {filtered?.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-colors ${
                selectedTemplate?.id === template.id
                  ? 'ring-2 ring-primary'
                  : 'hover:bg-accent/50'
              }`}
              onClick={() => setSelectedTemplate(template)}
            >
              <CardHeader className="p-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{template.name}</CardTitle>
                  <Badge variant="secondary">{template.group}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-xs text-muted-foreground">{template.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {template.phases.length} phase{template.phases.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedTemplate && (
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">
              Selected: {selectedTemplate.name}
            </p>
            <div className="space-y-1">
              {selectedTemplate.phases.map((tp, i) => (
                <div key={i} className="text-xs text-muted-foreground flex justify-between">
                  <span>{tp.name}</span>
                  <span>
                    +{tp.offsetMonths}mo, {tp.durationMonths}mo duration
                  </span>
                </div>
              ))}
            </div>
            <div>
              <Label htmlFor="templateStart">Start Date</Label>
              <Input
                id="templateStart"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <Button onClick={handleApply} disabled={!startDate} className="w-full">
              Apply Template
            </Button>
          </div>
        )}
      </div>
    </Sheet>
  )
}
