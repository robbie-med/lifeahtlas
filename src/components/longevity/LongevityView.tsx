import { useState, useMemo } from 'react'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAccessibility } from '@/hooks/useAccessibility'
import {
  computeSurvivalCurve,
  lifeExpectancyAtAge,
  computePercentiles,
  healthyLifeExpectancy,
  computeCareNeedsCurve,
  expectedCareCosts,
  getCareCostEstimates,
} from '@/engine/longevity-engine'
import type { Sex } from '@/types'

interface LongevityViewProps {
  birthDate: string // ISO date
  spouseBirthDate?: string
  spouseSex?: Sex
  spouseName?: string
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${Math.round(value)}`
}

export function LongevityView({ birthDate, spouseBirthDate, spouseSex, spouseName }: LongevityViewProps) {
  const [sex, setSex] = useState<Sex>('female')
  const { showCharts, showText, showNumbers } = useAccessibility()

  const currentAge = useMemo(() => {
    const birth = new Date(birthDate)
    const now = new Date()
    return Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  }, [birthDate])

  const survivalCurve = useMemo(
    () => computeSurvivalCurve(currentAge, sex),
    [currentAge, sex],
  )

  const le = useMemo(() => lifeExpectancyAtAge(currentAge, sex), [currentAge, sex])
  const healthyLE = useMemo(() => healthyLifeExpectancy(currentAge, sex), [currentAge, sex])
  const percentiles = useMemo(() => computePercentiles(currentAge, sex), [currentAge, sex])
  const careNeeds = useMemo(() => computeCareNeedsCurve(currentAge, sex), [currentAge, sex])
  const careCosts = useMemo(() => expectedCareCosts(currentAge, sex), [currentAge, sex])
  const careCostEstimates = getCareCostEstimates()

  // Spouse data (when available)
  const spouseAge = useMemo(() => {
    if (!spouseBirthDate) return null
    const birth = new Date(spouseBirthDate)
    const now = new Date()
    return Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  }, [spouseBirthDate])

  const spouseSurvivalCurve = useMemo(() => {
    if (spouseAge === null || !spouseSex) return null
    return computeSurvivalCurve(spouseAge, spouseSex)
  }, [spouseAge, spouseSex])

  const spouseLE = useMemo(() => {
    if (spouseAge === null || !spouseSex) return null
    return lifeExpectancyAtAge(spouseAge, spouseSex)
  }, [spouseAge, spouseSex])

  const spousePercentiles = useMemo(() => {
    if (spouseAge === null || !spouseSex) return null
    return computePercentiles(spouseAge, spouseSex)
  }, [spouseAge, spouseSex])

  // Chart data: survival curve as percentage
  const survivalChartData = useMemo(
    () => survivalCurve.map((s) => ({ age: s.age, survival: Math.round(s.probability * 1000) / 10 })),
    [survivalCurve],
  )

  // Combined survival chart data with spouse overlay
  const combinedSurvivalData = useMemo(() => {
    if (!spouseSurvivalCurve || spouseAge === null) return survivalChartData

    // Build a map of all ages to combine data
    const dataByAge = new Map<number, { age: number; survival: number; spouseSurvival?: number }>()

    for (const s of survivalCurve) {
      dataByAge.set(s.age, { age: s.age, survival: Math.round(s.probability * 1000) / 10 })
    }

    for (const s of spouseSurvivalCurve) {
      const entry = dataByAge.get(s.age)
      if (entry) {
        entry.spouseSurvival = Math.round(s.probability * 1000) / 10
      } else {
        dataByAge.set(s.age, {
          age: s.age,
          survival: 0,
          spouseSurvival: Math.round(s.probability * 1000) / 10,
        })
      }
    }

    return Array.from(dataByAge.values()).sort((a, b) => a.age - b.age)
  }, [survivalCurve, spouseSurvivalCurve, spouseAge, survivalChartData])

  // Chart data: care needs stacked
  const careChartData = useMemo(
    () => careNeeds.map((c) => ({
      age: c.age,
      independent: c.independentLiving,
      light: c.lightAssistance,
      moderate: c.moderateAssistance,
      full: c.fullCare,
    })),
    [careNeeds],
  )

  const hasSpouse = spouseAge !== null && spouseSex && spouseLE !== null

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3">
        {showText && <h2 className="text-lg font-semibold">Longevity & Care Planning</h2>}
        <div className="flex items-center gap-2 ml-auto">
          {showText && <span className="text-xs text-muted-foreground">Sex (for actuarial data):</span>}
          <Select
            value={sex}
            onChange={(e) => setSex(e.target.value as Sex)}
            className="w-28 h-8 text-xs"
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
          </Select>
        </div>
      </div>

      {/* Key metrics */}
      <div className={`grid gap-3 ${hasSpouse ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-4'}`}>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{currentAge}</div>
            {showText && <div className="text-xs text-muted-foreground">Current Age</div>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{le}</div>
            {showText && <div className="text-xs text-muted-foreground">Years Remaining (expected)</div>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{healthyLE}</div>
            {showText && <div className="text-xs text-muted-foreground">Healthy Years Remaining</div>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{Math.round(currentAge + le)}</div>
            {showText && <div className="text-xs text-muted-foreground">Expected Age at Death</div>}
          </CardContent>
        </Card>
      </div>

      {/* Spouse metrics row */}
      {hasSpouse && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-pink-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-pink-700">{spouseAge}</div>
              {showText && <div className="text-xs text-muted-foreground">{spouseName ?? 'Spouse'} Age</div>}
            </CardContent>
          </Card>
          <Card className="border-pink-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-pink-700">{spouseLE}</div>
              {showText && <div className="text-xs text-muted-foreground">{spouseName ?? 'Spouse'} Years Remaining</div>}
            </CardContent>
          </Card>
          <Card className="border-pink-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-pink-700">{Math.round(spouseAge! + spouseLE!)}</div>
              {showText && <div className="text-xs text-muted-foreground">{spouseName ?? 'Spouse'} Expected Age</div>}
            </CardContent>
          </Card>
          <Card className="border-pink-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-pink-700">
                {Math.abs(Math.round((currentAge + le) - (spouseAge! + spouseLE!)))}y
              </div>
              {showText && <div className="text-xs text-muted-foreground">Expected Gap</div>}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Percentiles */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">Longevity Percentiles</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          {showText && (
            <p className="text-xs text-muted-foreground mb-3">
              Based on current actuarial tables. These are population averages — individual outcomes vary based on health, lifestyle, and genetics.
            </p>
          )}
          <div className="flex gap-3 flex-wrap">
            <Badge variant="outline" className="text-xs">
              25th percentile: age {percentiles.p25}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Median: age {percentiles.p50}
            </Badge>
            <Badge variant="outline" className="text-xs">
              75th percentile: age {percentiles.p75}
            </Badge>
            <Badge variant="outline" className="text-xs">
              90th percentile: age {percentiles.p90}
            </Badge>
          </div>
          {spousePercentiles && (
            <div className="flex gap-3 flex-wrap mt-2">
              <span className="text-xs text-pink-700 font-medium">{spouseName ?? 'Spouse'}:</span>
              <Badge variant="outline" className="text-xs border-pink-200 text-pink-700">
                25th: {spousePercentiles.p25}
              </Badge>
              <Badge variant="outline" className="text-xs border-pink-200 text-pink-700">
                Median: {spousePercentiles.p50}
              </Badge>
              <Badge variant="outline" className="text-xs border-pink-200 text-pink-700">
                75th: {spousePercentiles.p75}
              </Badge>
              <Badge variant="outline" className="text-xs border-pink-200 text-pink-700">
                90th: {spousePercentiles.p90}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Survival Curve Chart (with spouse overlay when available) */}
      {showCharts && (
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">
              Survival Curve{hasSpouse ? ' (Comparison)' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {hasSpouse ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={combinedSurvivalData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="age"
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Age', position: 'insideBottom', offset: -5, fontSize: 10 }}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    domain={[0, 100]}
                    label={{ value: 'Survival %', angle: -90, position: 'insideLeft', fontSize: 10 }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value}%`,
                      name === 'survival' ? 'You' : (spouseName ?? 'Spouse'),
                    ]}
                    labelFormatter={(age) => `Age ${age}`}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 10 }}
                    formatter={(value) => (value === 'survival' ? 'You' : (spouseName ?? 'Spouse'))}
                  />
                  <Line
                    type="monotone"
                    dataKey="survival"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="spouseSurvival"
                    stroke="#db2777"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={survivalChartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="age"
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Age', position: 'insideBottom', offset: -5, fontSize: 10 }}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    domain={[0, 100]}
                    label={{ value: 'Survival %', angle: -90, position: 'insideLeft', fontSize: 10 }}
                  />
                  <Tooltip
                    formatter={(value) => [`${Number(value)}%`, 'Survival probability']}
                    labelFormatter={(age) => `Age ${age}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="survival"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.15}
                  />
                  <ReferenceLine x={Math.round(currentAge + le)} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: 'Expected', fontSize: 10 }} />
                  <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Text-only survival table fallback */}
      {!showCharts && showNumbers && (
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">Survival Probability by Age</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-1 font-medium">Age</th>
                  <th className="text-right py-1 font-medium">Survival %</th>
                </tr>
              </thead>
              <tbody>
                {survivalChartData.filter((_, i) => i % 5 === 0).map((d) => (
                  <tr key={d.age} className="border-b last:border-0">
                    <td className="py-1">{d.age}</td>
                    <td className="py-1 text-right font-mono">{d.survival}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Care Needs Chart */}
      {showCharts && (
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">Care Needs Probability by Age</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={careChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="age"
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Age', position: 'insideBottom', offset: -5, fontSize: 10 }}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  domain={[0, 100]}
                  label={{ value: '%', angle: -90, position: 'insideLeft', fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value) => [`${Number(value)}%`]}
                  labelFormatter={(age) => `Age ${age}`}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="independent" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} name="Independent" />
                <Area type="monotone" dataKey="light" stackId="1" stroke="#eab308" fill="#eab308" fillOpacity={0.6} name="Light Assistance" />
                <Area type="monotone" dataKey="moderate" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.6} name="Moderate Assistance" />
                <Area type="monotone" dataKey="full" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Full Care" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Care Cost Estimates */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">Care Cost Planning</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3">
          {showText && (
            <p className="text-xs text-muted-foreground">
              Estimated care costs in today's dollars. Actual costs vary significantly by location and care type.
            </p>
          )}

          {showNumbers && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Light Assistance</span>
                <span className="font-mono">{formatCurrency(careCostEstimates.lightAssistance)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Moderate Assistance</span>
                <span className="font-mono">{formatCurrency(careCostEstimates.moderateAssistance)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Full Care (nursing)</span>
                <span className="font-mono">{formatCurrency(careCostEstimates.fullCare)}/mo</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Expected Lifetime Care Cost</span>
                <span className="font-mono">{formatCurrency(careCosts.totalExpected)}</span>
              </div>
            </div>
          )}

          {showText && (
            <p className="text-xs text-muted-foreground mt-2">
              Expected lifetime care cost integrates care probabilities, survival probability, and monthly costs at each age. This is a statistical average — individual experiences will differ.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
