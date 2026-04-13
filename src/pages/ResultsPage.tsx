import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Lightbulb, ClipboardList, CheckCircle2, XCircle, ChevronRight, Printer, Mail, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AssessmentData, AssessmentResult, RiskLevel } from '@/lib/types';
import { useState, useEffect } from 'react';

const riskConfig: Record<RiskLevel, { label: string; className: string; icon: typeof Shield; tagline: string }> = {
  low: { label: 'LOW RISK', className: 'badge-risk-low', icon: Shield, tagline: 'Routine monitoring recommended' },
  moderate: { label: 'MODERATE RISK', className: 'badge-risk-moderate', icon: AlertTriangle, tagline: 'Close follow-up needed' },
  high: { label: 'HIGH RISK', className: 'badge-risk-high', icon: AlertTriangle, tagline: 'Urgent evaluation required' },
  critical: { label: 'CRITICAL', className: 'badge-risk-critical', icon: XCircle, tagline: 'Immediate specialist referral' },
};

const evidenceLevelColors = { low: 'text-success', medium: 'text-warning', high: 'text-destructive' };

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<{ data: AssessmentData; result: AssessmentResult } | null>(
    location.state || (() => {
      const saved = localStorage.getItem('assessmentState');
      return saved ? JSON.parse(saved) : null;
    })()
  );
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  // Update state from location if available
  useEffect(() => {
    if (location.state) {
      setState(location.state);
    }
  }, [location.state]);

  // Save to localStorage when state updates
  useEffect(() => {
    if (state) {
      localStorage.setItem('assessmentState', JSON.stringify(state));
    }
  }, [state]);

  // Redirect if no state is available
  useEffect(() => {
    if (!state) {
      navigate('/');
    }
  }, [state, navigate]);

  if (!state) { return null; }
  const { result, data } = state;
  const risk = riskConfig[result.riskLevel];
  const RiskIcon = risk.icon;
  const progress = result.metadata?.progress;
  const differential = (result.metadata?.differentialConsiderations ?? []) as string[];
  const imageSupport = result.metadata?.imageSupport;
  const datasetRefs = result.metadata?.datasetReferences ?? [];
  const localFallback = result.metadata?.inferenceSource === 'local_fallback';
  const explanationNote = result.metadata?.explanationNote;

  const scorePercent = (result.score / result.maxScore) * 100;
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (circumference * Math.min(scorePercent, 100)) / 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg text-primary">OralGuard</span>
          </button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/patient-records')}>
              View Records
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/explanation', { state })}>
              <BookOpen className="mr-1 h-4 w-4" /> Detailed Reasoning
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-primary mb-6"
        >
          Assessment Results
        </motion.h1>

        {localFallback && (
          <div className="mb-6 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
            <span className="font-semibold">Offline backup mode.</span>{' '}
            {explanationNote ||
              'The API could not be reached. Scoring uses the embedded R1–R22 rule engine only, not your registered server datasets.'}
          </div>
        )}

        {!localFallback && datasetRefs.length > 0 && (
          <div className="mb-6 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Registered datasets informing this run</h2>
            <ul className="space-y-2 text-sm">
              {datasetRefs.map((d) => (
                <li key={d.id} className="border-b border-border/40 pb-2 last:border-0 last:pb-0">
                  <span className="font-medium text-foreground">{d.name}</span>
                  <span className="text-muted-foreground"> — {d.source}</span>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    {d.modality} · {d.status}
                    {d.license ? ` · License: ${d.license}` : ''}
                  </span>
                  {d.notes ? <span className="text-xs text-muted-foreground block mt-1">{d.notes}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!localFallback && datasetRefs.length === 0 && (
          <div className="mb-6 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            No tabular or clinical-json datasets are registered in the backend yet (or all are restricted). Add datasets under System Info so they appear here as references.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Risk Assessment */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-elevated p-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Risk Assessment</h3>

            <div className="flex flex-col items-center">
              {/* Gauge */}
              <div className="relative w-32 h-32 mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                  <motion.circle
                    cx="50" cy="50" r="45" fill="none"
                    stroke={result.riskLevel === 'low' ? 'hsl(var(--success))' : result.riskLevel === 'moderate' ? 'hsl(var(--warning))' : 'hsl(var(--destructive))'}
                    strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: dashOffset }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">{result.score}</span>
                  <span className="text-xs text-muted-foreground">/ {result.maxScore}</span>
                </div>
              </div>

              <div className={`${risk.className} px-4 py-2 rounded-lg text-sm font-bold`}>
                <RiskIcon className="inline h-4 w-4 mr-1" />
                {risk.label}
              </div>
              <p className="text-sm text-muted-foreground mt-2 text-center">{risk.tagline}</p>

              <div className="w-full mt-6">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-medium">{result.confidence}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${result.confidence}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* CENTER: Explanation */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-elevated p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-accent" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Why This Classification?</h3>
            </div>

            {/* Contributing factors (server) vs backup rule IDs (offline) */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                {localFallback ? `Backup rules fired (${result.firedRules.length})` : `Contributing clinical factors (${result.firedRules.length})`}
              </h4>
              <div className="space-y-2">
                {result.firedRules.map(rule => (
                  <button
                    key={rule.id}
                    type="button"
                    onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
                    className="w-full text-left p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {localFallback ? `${rule.id}: ` : ''}{rule.description}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-accent">+{rule.points}</span>
                    </div>
                    {expandedRule === rule.id && (
                      <p className="text-xs text-muted-foreground mt-2 ml-6">Clinical detail: {rule.trigger}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Evidence Summary */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Evidence Summary</h4>
              <div className="space-y-2">
                {result.evidenceSummary.map((e, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{e.label}</span>
                    <span className={`font-medium ${evidenceLevelColors[e.level]}`}>{e.value.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>

            {differential.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Differential Clinical Considerations</h4>
                <ul className="space-y-1">
                  {differential.map((item, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground">- {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {progress && (
              <div className="mb-4 p-3 rounded-xl bg-muted/50">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Progress Against Previous Records</h4>
                <p className="text-sm">
                  <span className="font-medium">Trend:</span> {progress.trend} | <span className="font-medium">Delta Score:</span> {progress.delta}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{progress.note}</p>
              </div>
            )}

            {imageSupport && (
              <div className="mb-4 p-3 rounded-xl bg-muted/50">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Image Support Result (Optional)</h4>
                <p className="text-sm"><span className="font-medium">Label:</span> {imageSupport.label} | <span className="font-medium">Confidence:</span> {imageSupport.confidence}%</p>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {localFallback ? (
                <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">Embedded backup rules only</span>
              ) : (
                <>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">Server inference + registry datasets</span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">Explainable clinical factors</span>
                </>
              )}
            </div>
          </motion.div>

          {/* RIGHT: Recommendations */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-elevated p-6">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recommended Actions</h3>
            </div>

            <div className="space-y-3">
              {result.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl ${rec.priority === 'urgent' ? 'bg-destructive/5 border border-destructive/10 pulse-urgent' : 'bg-muted/50'}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs mt-0.5">{rec.priority === 'urgent' ? '🚨' : '📋'}</span>
                    <div>
                      <div className="text-sm font-semibold">{rec.title}</div>
                      <p className="text-xs text-muted-foreground mt-0.5">{rec.detail}</p>
                      {rec.timing && <p className="text-xs text-accent font-medium mt-1">Timing: {rec.timing}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-3 mt-8 justify-center"
        >
          <Button variant="outline" className="btn-primary-press" onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" /> Print Report
          </Button>
          <Button variant="outline" className="btn-primary-press">
            <Mail className="mr-1 h-4 w-4" /> Email Report
          </Button>
          <Button onClick={() => navigate('/assessment')} className="btn-primary-press">
            Start New Assessment <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
