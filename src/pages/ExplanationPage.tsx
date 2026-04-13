import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Shield, ArrowLeft, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AssessmentData, AssessmentResult } from '@/lib/types';
import { ALL_RULES, runWhatIf } from '@/lib/rules-engine';

const WHAT_IF_OPTIONS = [
  { value: 'remove_tobacco', label: 'Remove tobacco use' },
  { value: 'remove_lesion', label: 'Remove lesion findings' },
  { value: 'remove_leukoplakia', label: 'Remove leukoplakia' },
  { value: 'remove_alcohol', label: 'Remove alcohol consumption' },
  { value: 'remove_lymph', label: 'Remove lymphadenopathy' },
  { value: 'lesion_under_2weeks', label: 'Lesion was < 2 weeks' },
];

const riskColors = { low: 'text-success', moderate: 'text-warning', high: 'text-destructive', critical: 'text-destructive' };

export default function ExplanationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<{ data: AssessmentData; result: AssessmentResult } | null>(
    location.state || (() => {
      const saved = localStorage.getItem('assessmentState');
      return saved ? JSON.parse(saved) : null;
    })()
  );
  const [whatIf, setWhatIf] = useState('');
  const [whatIfResult, setWhatIfResult] = useState<AssessmentResult | null>(null);

  // Update state from location if available
  useEffect(() => {
    if (location.state) {
      setState(location.state);
    }
  }, [location.state]);

  // Redirect if no state is available
  useEffect(() => {
    if (!state) {
      navigate('/');
    }
  }, [state, navigate]);

  if (!state) { return null; }
  const { result, data } = state;

  const localFallback = result.metadata?.inferenceSource === 'local_fallback';
  const datasetRefs = result.metadata?.datasetReferences ?? [];
  const firedIds = new Set(result.firedRules.map(r => r.id));

  const handleWhatIf = (val: string) => {
    setWhatIf(val);
    setWhatIfResult(runWhatIf(data, val));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg text-primary">OralGuard</span>
          </button>
          <Button variant="outline" size="sm" onClick={() => navigate('/results', { state })}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Results
          </Button>
        </div>
      </header>

      <div className="container max-w-4xl py-8">
        <h1 className="text-2xl font-bold text-primary mb-6">Detailed Reasoning</h1>

        <Tabs defaultValue="rules" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="rules">{localFallback ? 'Backup rule trace (R1–R22)' : 'Datasets & clinical factors'}</TabsTrigger>
            <TabsTrigger value="chaining">Forward vs Backward</TabsTrigger>
            <TabsTrigger value="whatif">What-If Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="rules">
            {localFallback ? (
              <div className="card-elevated overflow-hidden">
                <p className="text-sm text-muted-foreground p-4 border-b border-border bg-muted/30">
                  {result.metadata?.explanationNote ||
                    'Offline mode: full R1–R22 matrix is shown because the server was unreachable.'}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-3 font-semibold">Rule ID</th>
                        <th className="text-left p-3 font-semibold">Description</th>
                        <th className="text-left p-3 font-semibold">Category</th>
                        <th className="text-center p-3 font-semibold">Fired?</th>
                        <th className="text-right p-3 font-semibold">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ALL_RULES.map(rule => {
                        const fired = firedIds.has(rule.id);
                        const firedRule = result.firedRules.find(r => r.id === rule.id);
                        return (
                          <tr key={rule.id} className={`border-b border-border/50 ${fired ? 'bg-success/5' : ''}`}>
                            <td className="p-3 font-mono font-medium">{rule.id}</td>
                            <td className="p-3">
                              {rule.description}
                              {firedRule && <p className="text-xs text-muted-foreground mt-1">→ {firedRule.trigger}</p>}
                            </td>
                            <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-muted">{rule.category}</span></td>
                            <td className="p-3 text-center">
                              {fired ? <CheckCircle2 className="h-5 w-5 text-success mx-auto" /> : <XCircle className="h-5 w-5 text-muted-foreground/30 mx-auto" />}
                            </td>
                            <td className="p-3 text-right font-mono">{fired ? `+${rule.points}` : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/50 font-semibold">
                        <td className="p-3" colSpan={4}>Total Score</td>
                        <td className="p-3 text-right font-mono">{result.score} / {result.maxScore}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="card-elevated p-6">
                  <h3 className="font-semibold text-primary mb-2">Registered reference datasets</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    These entries come from your backend dataset registry (System Info). They document which tabular or clinical-json sources ground this deployment—not individual IF/THEN rule IDs.
                  </p>
                  {datasetRefs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No non-restricted tabular/clinical-json datasets registered yet.</p>
                  ) : (
                    <ul className="space-y-4">
                      {datasetRefs.map((d) => (
                        <li key={d.id} className="rounded-xl border border-border p-4 bg-muted/20">
                          <div className="font-medium text-foreground">{d.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">{d.source}</div>
                          <div className="text-xs text-muted-foreground mt-1">{d.modality} · {d.status}{d.license ? ` · ${d.license}` : ''}</div>
                          {d.notes ? <p className="text-xs text-muted-foreground mt-2">{d.notes}</p> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="card-elevated p-6">
                  <h3 className="font-semibold text-primary mb-4">Contributing clinical factors (this assessment)</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Factors detected for this patient, described in clinical language. Rule IDs (R1–R22) are omitted here; they remain available only in offline backup mode.
                  </p>
                  <ul className="space-y-3">
                    {result.firedRules.map((rule) => (
                      <li key={rule.id} className="flex gap-3 border-b border-border/50 pb-3 last:border-0">
                        <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">{rule.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">{rule.trigger}</div>
                          <div className="text-xs font-mono text-accent mt-1">Weight +{rule.points}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {result.firedRules.length === 0 && (
                    <p className="text-sm text-muted-foreground">No additional weighted factors fired beyond baseline scoring.</p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Forward/Backward */}
          <TabsContent value="chaining">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card-elevated p-6">
                <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                  <ArrowRight className="h-5 w-5" /> Forward Chaining
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {localFallback
                    ? 'When patient data was entered, these backup rules fired in engine order:'
                    : 'Clinical factors applied in evaluation order (identifiers hidden on server runs):'}
                </p>
                <div className="space-y-3">
                  {result.firedRules.map((rule, i) => (
                    <div key={rule.id} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {localFallback ? `${rule.id}: ` : ''}{rule.description}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">→ +{rule.points} points — {rule.trigger}</div>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-start gap-3 pt-2 border-t border-border">
                    <div className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      ∑
                    </div>
                    <div>
                      <div className="text-sm font-medium">Final Score: {result.score} → {result.riskLevel.toUpperCase()} RISK</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-elevated p-6">
                <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                  <ArrowLeft className="h-5 w-5" /> Backward Chaining
                </h3>
                <p className="text-sm text-muted-foreground mb-4">To determine {result.riskLevel.toUpperCase()} RISK, the system verified:</p>
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                    <div className="text-sm font-semibold text-accent">Goal: Classify as {result.riskLevel.toUpperCase()} RISK</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Requires score {result.riskLevel === 'critical' ? '≥ 18' : result.riskLevel === 'high' ? '12-17' : result.riskLevel === 'moderate' ? '6-11' : '< 6'}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">Verified conditions:</div>
                  {result.firedRules.map(rule => (
                    <div key={rule.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                      <span>{localFallback ? `${rule.id}: ` : ''}{rule.trigger}</span>
                    </div>
                  ))}
                  <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                    <div className="text-sm font-semibold text-success">
                      ✓ All conditions verified → Score {result.score} = {result.riskLevel.toUpperCase()} RISK
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="whatif">
            <div className="card-elevated p-6">
              <h3 className="font-bold text-primary mb-2">What-If Analysis</h3>
              <p className="text-sm text-muted-foreground mb-4">Explore how changing factors affects the risk classification.</p>

              <Select value={whatIf} onValueChange={handleWhatIf}>
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="Select a modification..." />
                </SelectTrigger>
                <SelectContent>
                  {WHAT_IF_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {whatIfResult && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Original</h4>
                    <div className={`text-2xl font-bold ${riskColors[result.riskLevel]}`}>
                      {result.riskLevel.toUpperCase()} ({result.score} pts)
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{result.firedRules.length} rules fired</div>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Modified</h4>
                    <div className={`text-2xl font-bold ${riskColors[whatIfResult.riskLevel]}`}>
                      {whatIfResult.riskLevel.toUpperCase()} ({whatIfResult.score} pts)
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{whatIfResult.firedRules.length} rules fired</div>
                  </div>
                  <div className="md:col-span-2 p-4 rounded-xl bg-accent/5 border border-accent/10">
                    <div className="text-sm font-medium">
                      Score change: {result.score} → {whatIfResult.score} ({whatIfResult.score - result.score > 0 ? '+' : ''}{whatIfResult.score - result.score} points)
                    </div>
                    {result.riskLevel !== whatIfResult.riskLevel && (
                      <div className="text-sm text-accent font-semibold mt-1">
                        Risk level changed: {result.riskLevel.toUpperCase()} → {whatIfResult.riskLevel.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
