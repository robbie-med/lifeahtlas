import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useLiveAccounts } from '@/hooks/useLiveData'
import { financialActions } from '@/stores/financialStore'
import type { Account } from '@/types'

interface AccountListProps {
  scenarioId: string
}

export function AccountList({ scenarioId }: AccountListProps) {
  const accounts = useLiveAccounts(scenarioId)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'checking' as Account['type'],
    balance: 0,
    interestRate: 0,
  })

  const handleAdd = async () => {
    if (!form.name) return
    await financialActions.createAccount({ ...form, scenarioId })
    setForm({ name: '', type: 'checking', balance: 0, interestRate: 0 })
    setAdding(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Accounts</h3>
        <Button size="sm" onClick={() => setAdding(!adding)}>
          {adding ? 'Cancel' : '+ Add'}
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <Input placeholder="Account name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Account['type'] }))}>
                  {['checking', 'savings', 'investment', 'retirement', 'debt'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label className="text-xs">Interest %/yr</Label>
                <Input type="number" step="0.1" value={form.interestRate} onChange={(e) => setForm((f) => ({ ...f, interestRate: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Balance $</Label>
              <Input type="number" value={form.balance} onChange={(e) => setForm((f) => ({ ...f, balance: Number(e.target.value) }))} />
            </div>
            <Button size="sm" onClick={handleAdd} className="w-full">Add Account</Button>
          </CardContent>
        </Card>
      )}

      {accounts?.map((a) => (
        <Card key={a.id}>
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{a.name}</p>
              <p className="text-xs text-muted-foreground">
                {a.type} &middot; ${a.balance.toLocaleString()} &middot; {a.interestRate}% APY
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => financialActions.removeAccount(a.id)}>
              Remove
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
