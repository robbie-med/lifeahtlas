import { useState, useMemo, useCallback } from 'react'
import { parseISO } from 'date-fns'
import { useUIStore } from '@/stores/uiStore'
import { personActions } from '@/stores/personStore'
import { scenarioActions } from '@/stores/scenarioStore'
import { familyMemberActions } from '@/stores/familyMemberStore'
import { useLivePersons, useLivePhases, useLiveScenario, useLiveFamilyMembers } from '@/hooks/useLiveData'
import { useProjection } from '@/hooks/useProjection'
import { useStressScores } from '@/hooks/useStress'
import { computeProjection } from '@/engine/financial-engine'
import { computeStressScores } from '@/engine/stress-engine'
import { ModeToggle } from '@/components/shared/ModeToggle'
import { AccessibilityToggle } from '@/components/shared/AccessibilityToggle'
import { ScenarioSelector } from '@/components/scenarios/ScenarioSelector'
import { ScenarioCompare } from '@/components/scenarios/ScenarioCompare'
import { PhaseEditor } from '@/components/phases/PhaseEditor'
import { TemplateSelector } from '@/components/phases/TemplateSelector'
import { FamilyMemberEditor } from '@/components/family/FamilyMemberEditor'
import { FamilyMemberList } from '@/components/family/FamilyMemberList'
import { IncomeStreamEditor } from '@/components/financial/IncomeStreamEditor'
import { ExpenseRuleEditor } from '@/components/financial/ExpenseRuleEditor'
import { AccountList } from '@/components/financial/AccountList'
import { DebtPayoffView } from '@/components/financial/DebtPayoffView'
import { SavingsGoalView } from '@/components/financial/SavingsGoalView'
import { LongevityView } from '@/components/longevity/LongevityView'
import { StrategicView } from '@/components/strategic/StrategicView'
import { NarrativeView } from '@/components/narrative/NarrativeView'
import { SharedView } from '@/components/shared/SharedView'
import { ZoomControl } from '@/components/timeline/ZoomControl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PresentationMode } from '@/types'
import type { Sex, FamilyMember } from '@/types'
import { useLiveAccounts, useLiveIncomeStreams, useLiveExpenseRules } from '@/hooks/useLiveData'

function DarkModeToggle() {
  const darkMode = useUIStore((s) => s.darkMode)
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode)
  return (
    <Button size="sm" variant="outline" onClick={toggleDarkMode} className="h-8 w-8 p-0" title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
      {darkMode ? '\u2600' : '\u263E'}
    </Button>
  )
}

export function AppLayout() {
  const persons = useLivePersons()
  const mode = useUIStore((s) => s.presentationMode)
  const selectedScenarioId = useUIStore((s) => s.selectedScenarioId)
  const compareScenarioId = useUIStore((s) => s.compareScenarioId)
  const selectScenario = useUIStore((s) => s.selectScenario)
  const selectedPhaseId = useUIStore((s) => s.selectedPhaseId)
  const selectPhase = useUIStore((s) => s.selectPhase)

  const [phaseEditorOpen, setPhaseEditorOpen] = useState(false)
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false)
  const [showFinancials, setShowFinancials] = useState(false)
  const [showLongevity, setShowLongevity] = useState(false)
  const [showFamily, setShowFamily] = useState(false)
  const [familyEditorOpen, setFamilyEditorOpen] = useState(false)
  const [editingFamilyMember, setEditingFamilyMember] = useState<FamilyMember | null>(null)

  // Person setup
  const [personName, setPersonName] = useState('')
  const [personBirth, setPersonBirth] = useState('')
  const [personSex, setPersonSex] = useState<Sex>('female')

  const person = persons?.[0] // Single person for now
  const selectedScenario = useLiveScenario(selectedScenarioId)
  const phases = useLivePhases(selectedScenarioId)
  const compareScenario = useLiveScenario(compareScenarioId)
  const comparePhases = useLivePhases(compareScenarioId)
  const familyMembers = useLiveFamilyMembers(person?.id ?? null)

  const originDate = useMemo(
    () => (person ? parseISO(person.birthDate) : new Date()),
    [person],
  )
  const startDateStr = person?.birthDate ?? new Date().toISOString().slice(0, 10)

  // Projections
  const projections = useProjection(selectedScenarioId, startDateStr, 960)
  const stressScores = useStressScores(selectedScenarioId, projections, startDateStr, 960)

  // Compare projections
  const compareAccounts = useLiveAccounts(compareScenarioId)
  const compareIncome = useLiveIncomeStreams(compareScenarioId)
  const compareExpenses = useLiveExpenseRules(compareScenarioId)

  const compareProjections = useMemo(() => {
    if (!compareAccounts || !compareIncome || !compareExpenses) return []
    return computeProjection({
      accounts: compareAccounts,
      incomeStreams: compareIncome,
      expenseRules: compareExpenses,
      startDate: startDateStr,
      months: 960,
    })
  }, [compareAccounts, compareIncome, compareExpenses, startDateStr])

  const compareStress = useMemo(() => {
    if (!comparePhases || comparePhases.length === 0) return []
    return computeStressScores({
      phases: comparePhases,
      projections: compareProjections,
      startDate: startDateStr,
      months: 960,
    })
  }, [comparePhases, compareProjections, startDateStr])

  // Find selected phase for editor
  const editingPhase = useMemo(
    () => phases?.find((p) => p.id === selectedPhaseId) ?? null,
    [phases, selectedPhaseId],
  )

  // Find spouse from family members
  const spouse = useMemo(
    () => familyMembers?.find((m) => m.relationship === 'spouse') ?? null,
    [familyMembers],
  )

  const handleCreatePerson = async () => {
    if (!personName || !personBirth) return
    const p = await personActions.create(personName, personBirth, personSex)
    const s = await scenarioActions.create(p.id, 'Baseline', 'Primary life plan', true)
    selectScenario(s.id)
    setPersonName('')
    setPersonBirth('')
  }

  const handlePhaseClick = useCallback(
    (id: string) => {
      selectPhase(id)
      setPhaseEditorOpen(true)
    },
    [selectPhase],
  )

  const handleEditFamilyMember = useCallback((member: FamilyMember) => {
    setEditingFamilyMember(member)
    setFamilyEditorOpen(true)
  }, [])

  const handleDeleteFamilyMember = useCallback(async (memberId: string) => {
    await familyMemberActions.remove(memberId)
  }, [])

  const handleAddFamilyMember = useCallback(() => {
    setEditingFamilyMember(null)
    setFamilyEditorOpen(true)
  }, [])

  // Retirement month estimate (age 65)
  const retirementMonth = useMemo(() => {
    if (!person) return '2089-01'
    const birth = parseISO(person.birthDate)
    const retYear = birth.getFullYear() + 65
    return `${retYear}-01`
  }, [person])

  // No person yet: setup wizard
  if (!person) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-[400px] space-y-4 p-6 border rounded-lg">
          <h1 className="text-2xl font-bold text-center">LifeAhtlas</h1>
          <p className="text-sm text-muted-foreground text-center">
            Start planning your life journey
          </p>
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Birth Date</label>
            <Input
              type="date"
              value={personBirth}
              onChange={(e) => setPersonBirth(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Sex (for actuarial data)</label>
            <Select
              value={personSex}
              onChange={(e) => setPersonSex(e.target.value as Sex)}
              className="w-full"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
            </Select>
          </div>
          <Button onClick={handleCreatePerson} className="w-full">
            Begin
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Bar */}
      <header className="h-14 border-b flex items-center px-4 gap-4 shrink-0">
        <h1 className="text-lg font-semibold">LifeAhtlas</h1>
        <ScenarioSelector personId={person.id} />
        <div className="flex-1" />
        <ZoomControl />
        <ModeToggle />
        <AccessibilityToggle />
        <DarkModeToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        {!selectedScenarioId ? (
          <div className="text-center text-muted-foreground mt-20">
            <p>Select or create a scenario to begin.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={() => {
                  selectPhase(null)
                  setPhaseEditorOpen(true)
                }}
              >
                + Add Phase
              </Button>
              <Button size="sm" variant="outline" onClick={() => setTemplateSelectorOpen(true)}>
                Apply Template
              </Button>
              <Button size="sm" variant="outline" onClick={handleAddFamilyMember}>
                + Add Family Member
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFamily(!showFamily)}
              >
                {showFamily ? 'Hide' : 'Show'} Family ({familyMembers?.length ?? 0})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFinancials(!showFinancials)}
              >
                {showFinancials ? 'Hide' : 'Show'} Financials
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowLongevity(!showLongevity)}
              >
                {showLongevity ? 'Hide' : 'Show'} Longevity
              </Button>
            </div>

            {/* Family member list */}
            {showFamily && familyMembers && selectedScenarioId && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-2">Family Members</h3>
                <FamilyMemberList
                  members={familyMembers}
                  scenarioId={selectedScenarioId}
                  onEdit={handleEditFamilyMember}
                  onDelete={handleDeleteFamilyMember}
                />
              </div>
            )}

            {/* Presentation mode views */}
            {mode === PresentationMode.Strategic && (
              <StrategicView
                phases={phases ?? []}
                projections={projections}
                stressScores={stressScores}
                originDate={originDate}
                scenarioId={selectedScenarioId}
                onPhaseClick={handlePhaseClick}
              />
            )}
            {mode === PresentationMode.Narrative && (
              <NarrativeView
                phases={phases ?? []}
                projections={projections}
                stressScores={stressScores}
                originDate={originDate}
                onPhaseClick={handlePhaseClick}
              />
            )}
            {mode === PresentationMode.Shared && (
              <SharedView
                phases={phases ?? []}
                projections={projections}
                stressScores={stressScores}
                originDate={originDate}
                onPhaseClick={handlePhaseClick}
              />
            )}

            {/* Compare view */}
            {compareScenarioId && compareScenario && (
              <ScenarioCompare
                scenarioAName={selectedScenario?.name ?? 'Scenario A'}
                scenarioBName={compareScenario.name}
                aProjections={projections}
                bProjections={compareProjections}
                aStress={stressScores}
                bStress={compareStress}
                retirementMonth={retirementMonth}
              />
            )}

            {/* Financial editors */}
            {showFinancials && selectedScenarioId && (
              <div className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <AccountList scenarioId={selectedScenarioId} />
                  <IncomeStreamEditor scenarioId={selectedScenarioId} />
                  <ExpenseRuleEditor scenarioId={selectedScenarioId} />
                </div>
                <DebtPayoffView scenarioId={selectedScenarioId} />
                <SavingsGoalView scenarioId={selectedScenarioId} />
              </div>
            )}

            {/* Longevity module */}
            {showLongevity && person && (
              <div className="border-t pt-4">
                <LongevityView
                  birthDate={person.birthDate}
                  spouseBirthDate={spouse?.birthDate}
                  spouseSex={spouse?.sex}
                  spouseName={spouse?.name}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Editors */}
      {selectedScenarioId && (
        <>
          <PhaseEditor
            open={phaseEditorOpen}
            onClose={() => setPhaseEditorOpen(false)}
            scenarioId={selectedScenarioId}
            phase={editingPhase}
            familyMembers={familyMembers ?? []}
          />
          <TemplateSelector
            open={templateSelectorOpen}
            onClose={() => setTemplateSelectorOpen(false)}
            scenarioId={selectedScenarioId}
          />
          <FamilyMemberEditor
            open={familyEditorOpen}
            onClose={() => {
              setFamilyEditorOpen(false)
              setEditingFamilyMember(null)
            }}
            personId={person.id}
            scenarioId={selectedScenarioId}
            primaryBirthDate={person.birthDate}
            member={editingFamilyMember}
          />
        </>
      )}
    </div>
  )
}
