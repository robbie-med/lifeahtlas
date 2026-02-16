import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useLiveIncomeStreams } from '@/hooks/useLiveData'
import { financialActions } from '@/stores/financialStore'
import { CertaintyLevel } from '@/types'

interface IncomeStreamEditorProps {
  scenarioId: string
}

export function IncomeStreamEditor({ scenarioId }: IncomeStreamEditorProps) {
  const streams = useLiveIncomeStreams(scenarioId)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    name: '',
    monthlyAmount: 0,
    startDate: '',
    endDate: '',
    annualGrowthRate: 3,
    certainty: CertaintyLevel.Likely as CertaintyLevel,
  })

  const handleAdd = async () => {
    if (!form.name || !form.startDate || !form.endDate) return
    await financialActions.createIncome({ ...form, scenarioId })
    setForm({ name: '', monthlyAmount: 0, startDate: '', endDate: '', annualGrowthRate: 3, certainty: CertaintyLevel.Likely })
    setAdding(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Income Streams</h3>
        <Button size="sm" onClick={() => setAdding(!adding)}>
          {adding ? 'Cancel' : '+ Add'}
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Monthly $</Label>
                <Input type="number" value={form.monthlyAmount} onChange={(e) => setForm((f) => ({ ...f, monthlyAmount: Number(e.target.value) }))} />
              </div>
              <div>
                <Label className="text-xs">Growth %/yr</Label>
                <Input type="number" step="0.1" value={form.annualGrowthRate} onChange={(e) => setForm((f) => ({ ...f, annualGrowthRate: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
            </div>
            <Select value={form.certainty} onChange={(e) => setForm((f) => ({ ...f, certainty: e.target.value as CertaintyLevel }))}>
              {Object.entries(CertaintyLevel).map(([k, v]) => <option key={v} value={v}>{k}</option>)}
            </Select>
            <Button size="sm" onClick={handleAdd} className="w-full">Add Income Stream</Button>
          </CardContent>
        </Card>
      )}

      {streams?.map((s) => (
        <Card key={s.id}>
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                ${s.monthlyAmount.toLocaleString()}/mo &middot; {s.annualGrowthRate}% growth
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => financialActions.removeIncome(s.id)}>
              Remove
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
