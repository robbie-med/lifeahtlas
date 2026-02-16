import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useLiveExpenseRules } from '@/hooks/useLiveData'
import { financialActions } from '@/stores/financialStore'

interface ExpenseRuleEditorProps {
  scenarioId: string
}

export function ExpenseRuleEditor({ scenarioId }: ExpenseRuleEditorProps) {
  const rules = useLiveExpenseRules(scenarioId)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    name: '',
    monthlyAmount: 0,
    startDate: '',
    endDate: '',
    annualInflationRate: 3,
    category: 'living',
    isRequired: true,
  })

  const handleAdd = async () => {
    if (!form.name || !form.startDate || !form.endDate) return
    await financialActions.createExpense({ ...form, scenarioId })
    setForm({ name: '', monthlyAmount: 0, startDate: '', endDate: '', annualInflationRate: 3, category: 'living', isRequired: true })
    setAdding(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Expense Rules</h3>
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
                <Label className="text-xs">Inflation %/yr</Label>
                <Input type="number" step="0.1" value={form.annualInflationRate} onChange={(e) => setForm((f) => ({ ...f, annualInflationRate: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isRequired} onChange={(e) => setForm((f) => ({ ...f, isRequired: e.target.checked }))} />
                Required
              </label>
            </div>
            <Button size="sm" onClick={handleAdd} className="w-full">Add Expense Rule</Button>
          </CardContent>
        </Card>
      )}

      {rules?.map((r) => (
        <Card key={r.id}>
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{r.name}</p>
              <p className="text-xs text-muted-foreground">
                ${r.monthlyAmount.toLocaleString()}/mo &middot; {r.category} &middot; {r.isRequired ? 'Required' : 'Optional'}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => financialActions.removeExpense(r.id)}>
              Remove
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
