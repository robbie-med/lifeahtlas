import { useState, useEffect } from 'react'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { familyMemberActions } from '@/stores/familyMemberStore'
import { Relationship } from '@/types'
import type { FamilyMember, Sex } from '@/types'

interface FamilyMemberEditorProps {
  open: boolean
  onClose: () => void
  personId: string
  scenarioId: string
  primaryBirthDate: string
  member?: FamilyMember | null
}

const defaultValues = {
  name: '',
  birthDate: '',
  sex: 'female' as Sex,
  relationship: Relationship.Parent as typeof Relationship[keyof typeof Relationship],
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  parent: 'Parent',
  'parent-in-law': 'Parent-in-law',
  spouse: 'Spouse',
  child: 'Child',
  sibling: 'Sibling',
}

export function FamilyMemberEditor({
  open,
  onClose,
  personId,
  scenarioId,
  primaryBirthDate,
  member,
}: FamilyMemberEditorProps) {
  const [form, setForm] = useState(defaultValues)

  useEffect(() => {
    if (member) {
      setForm({
        name: member.name,
        birthDate: member.birthDate,
        sex: member.sex,
        relationship: member.relationship,
      })
    } else {
      setForm(defaultValues)
    }
  }, [member, open])

  const set = <K extends keyof typeof defaultValues>(key: K, value: (typeof defaultValues)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSave = async () => {
    if (!form.name || !form.birthDate) return

    if (member) {
      await familyMemberActions.update(
        member.id,
        { name: form.name, birthDate: form.birthDate, sex: form.sex, relationship: form.relationship },
        scenarioId,
        primaryBirthDate,
      )
    } else {
      await familyMemberActions.create(
        personId,
        form.name,
        form.birthDate,
        form.sex,
        form.relationship,
        scenarioId,
        primaryBirthDate,
      )
    }
    onClose()
  }

  const handleDelete = async () => {
    if (member) {
      await familyMemberActions.remove(member.id)
      onClose()
    }
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader>
        <SheetTitle>{member ? 'Edit Family Member' : 'Add Family Member'}</SheetTitle>
      </SheetHeader>

      <div className="space-y-4">
        <div>
          <Label htmlFor="fm-name">Name</Label>
          <Input
            id="fm-name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g., Mom, Dad, Sarah"
          />
        </div>

        <div>
          <Label htmlFor="fm-relationship">Relationship</Label>
          <Select
            id="fm-relationship"
            value={form.relationship}
            onChange={(e) => set('relationship', e.target.value as typeof form.relationship)}
          >
            {Object.entries(Relationship).map(([key, val]) => (
              <option key={val} value={val}>
                {RELATIONSHIP_LABELS[val] ?? key}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="fm-birthDate">Birth Date</Label>
          <Input
            id="fm-birthDate"
            type="date"
            value={form.birthDate}
            onChange={(e) => set('birthDate', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="fm-sex">Sex (for actuarial data)</Label>
          <Select
            id="fm-sex"
            value={form.sex}
            onChange={(e) => set('sex', e.target.value as Sex)}
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
          </Select>
        </div>

        <div className="text-xs text-muted-foreground p-3 bg-secondary/50 rounded-md">
          {form.relationship === 'sibling'
            ? 'Siblings are added for longevity comparison. No phases are auto-generated.'
            : form.relationship === 'child'
              ? 'Child development phases (Infant through High School) will be auto-generated on the timeline.'
              : 'Caregiving phases will be auto-generated based on actuarial care-needs data.'}
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            {member ? 'Update' : 'Add'}
          </Button>
          {member && (
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
