import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useLiveAssumptions } from '@/hooks/useLiveData'
import { financialActions } from '@/stores/financialStore'

interface AssumptionsTableProps {
  scenarioId: string
}

export function AssumptionsTable({ scenarioId }: AssumptionsTableProps) {
  const assumptions = useLiveAssumptions(scenarioId)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ key: '', value: 0, unit: '', description: '' })

  const handleAdd = async () => {
    if (!form.key) return
    await financialActions.createAssumption({ ...form, scenarioId })
    setForm({ key: '', value: 0, unit: '', description: '' })
    setAdding(false)
  }

  const handleUpdate = async (id: string) => {
    await financialActions.updateAssumption(id, form)
    setEditingId(null)
  }

  const startEdit = (a: typeof assumptions extends (infer T)[] | undefined ? NonNullable<T> : never) => {
    setEditingId(a.id)
    setForm({ key: a.key, value: a.value, unit: a.unit, description: a.description })
  }

  return (
    <Card>
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Assumptions & Variables</CardTitle>
        <Button size="sm" variant="outline" onClick={() => { setAdding(!adding); setEditingId(null) }}>
          {adding ? 'Cancel' : '+ Add'}
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {adding && (
          <div className="grid grid-cols-[1fr_80px_80px_1fr_auto] gap-2 items-end mb-3 text-xs">
            <Input placeholder="Variable name" value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} className="h-8 text-xs" />
            <Input type="number" placeholder="Value" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))} className="h-8 text-xs" />
            <Input placeholder="Unit" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} className="h-8 text-xs" />
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="h-8 text-xs" />
            <Button size="sm" onClick={handleAdd} className="h-8 text-xs">Add</Button>
          </div>
        )}

        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="text-left py-1.5 font-medium">Variable</th>
              <th className="text-right py-1.5 font-medium">Value</th>
              <th className="text-left py-1.5 pl-2 font-medium">Unit</th>
              <th className="text-left py-1.5 font-medium">Description</th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {assumptions?.map((a) => (
              <tr key={a.id} className="border-b last:border-0 hover:bg-accent/30">
                {editingId === a.id ? (
                  <>
                    <td className="py-1"><Input value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} className="h-7 text-xs" /></td>
                    <td className="py-1"><Input type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))} className="h-7 text-xs w-20" /></td>
                    <td className="py-1 pl-2"><Input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} className="h-7 text-xs w-20" /></td>
                    <td className="py-1"><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="h-7 text-xs" /></td>
                    <td className="py-1 text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleUpdate(a.id)} className="h-6 text-[10px] px-2">Save</Button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-1.5 font-medium">{a.key}</td>
                    <td className="py-1.5 text-right font-mono">{a.value}</td>
                    <td className="py-1.5 pl-2 text-muted-foreground">{a.unit}</td>
                    <td className="py-1.5 text-muted-foreground">{a.description}</td>
                    <td className="py-1.5 text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(a)} className="h-6 text-[10px] px-2">Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => financialActions.removeAssumption(a.id)} className="h-6 text-[10px] px-2 text-destructive">Del</Button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {(!assumptions || assumptions.length === 0) && !adding && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-muted-foreground">
                  No assumptions yet. Add variables that underpin your projections.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
