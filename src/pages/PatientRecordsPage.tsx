import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Search, RefreshCw, Calendar, AlertCircle, TrendingUp, TrendingDown, Minus, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { AssessmentResult } from '@/lib/types';
import { fetchWithApiFailover, loginUser, registerUserAccount, logoutUser, getAccessToken, isNetworkError } from '@/lib/api';

const riskConfig: Record<string, { color: string; bgColor: string; badge: string; border: string }> = {
  low: { color: 'text-success', bgColor: 'bg-success/10', badge: 'badge-success', border: 'border-l-success' },
  moderate: { color: 'text-warning', bgColor: 'bg-warning/10', badge: 'badge-warning', border: 'border-l-warning' },
  high: { color: 'text-destructive', bgColor: 'bg-destructive/10', badge: 'badge-destructive', border: 'border-l-destructive' },
  critical: { color: 'text-destructive', bgColor: 'bg-destructive/20', badge: 'badge-critical', border: 'border-l-destructive' },
};

function TrendIcon({ trend }: { trend?: string }) {
  if (trend === 'deteriorating') return <TrendingUp className="h-4 w-4 text-destructive" />;
  if (trend === 'improving') return <TrendingDown className="h-4 w-4 text-success" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export default function PatientRecordsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [allHistory, setAllHistory] = useState<AssessmentResult[]>([]);
  const [patientHistory, setPatientHistory] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [sessionTick, setSessionTick] = useState(0);

  const hasToken = !!getAccessToken();

  const fetchHistory = async () => {
    setLoading(true);
    setError('');

    if (!getAccessToken()) {
      setAllHistory([]);
      setPatientHistory([]);
      setLoaded(true);
      setLoading(false);
      return;
    }

    try {
      const response = await fetchWithApiFailover('/api/history');
      if (response.status === 401) {
        setError('Your session expired or is invalid. Sign in again to load saved assessments for your account.');
        setAllHistory([]);
        setPatientHistory([]);
        logoutUser();
        setSessionTick((t) => t + 1);
        setLoaded(true);
        return;
      }
      if (!response.ok) {
        throw new Error(`Error fetching patient records: ${response.status}`);
      }
      const data = (await response.json()) as AssessmentResult[];
      setAllHistory(data);
      setPatientHistory(data);
      setLoaded(true);
    } catch (err) {
      if (isNetworkError(err)) {
        setError('Cannot reach the API (network error). Check that the backend is running and the port matches VITE_API_BASE_URL (default 8010).');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to fetch patient records.');
      }
      setAllHistory([]);
      setPatientHistory([]);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const searchPatient = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const query = searchQuery.trim();
    if (!query) {
      setPatientHistory(allHistory);
      return;
    }

    setLoading(true);

    try {
      const response = await fetchWithApiFailover(`/api/patient-history/${encodeURIComponent(query)}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Patient not found. Please check the patient name or UID.');
          setPatientHistory([]);
        } else if (response.status === 401) {
          setError('Invalid or expired session. Sign out, sign in again, then retry search.');
          setPatientHistory([]);
          logoutUser();
          setSessionTick((t) => t + 1);
        } else {
          throw new Error(`Error: ${response.status}`);
        }
      } else {
        const data = (await response.json()) as AssessmentResult[];
        setPatientHistory(data);
        if (data.length === 0) {
          setError('No assessment records found for this patient.');
        }
      }
    } catch (err) {
      if (isNetworkError(err)) {
        setError('Cannot reach the API. Is the backend running on port 8010 (or your configured URL)?');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to fetch patient records.');
      }
      setPatientHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchHistory();
  }, [sessionTick]);

  const handleAuth = async (mode: 'login' | 'register') => {
    setAuthBusy(true);
    setAuthMessage('');
    try {
      if (mode === 'login') await loginUser(authEmail.trim(), authPassword);
      else await registerUserAccount(authEmail.trim(), authPassword);
      setAuthPassword('');
      setAuthMessage(mode === 'login' ? 'Signed in. Loading your records…' : 'Account created. Loading your records…');
      setSessionTick((t) => t + 1);
    } catch (e) {
      setAuthMessage(e instanceof Error ? e.message : 'Authentication failed.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleReassess = () => {
    const patientUid = searchQuery.trim();
    navigate('/assessment', { state: { patientUid } });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg text-primary">OralGuard</span>
          </button>
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Home
          </Button>
        </div>
      </header>

      <div className="container max-w-5xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Patient Records</h1>
          <p className="text-muted-foreground">
            Search by patient name or UID. Sign in to see every assessment stored under your account; search still works for individual patients when the API allows it.
          </p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Clinician account</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Saved assessment history is tied to your login. Without a session, the list below stays empty even though assessments can still run.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                type="email"
                autoComplete="username"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@clinic.org"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                autoComplete={hasToken ? 'current-password' : 'new-password'}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button type="button" size="sm" disabled={authBusy} onClick={() => void handleAuth('login')}>
              <LogIn className="mr-1 h-4 w-4" /> Sign in
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={authBusy} onClick={() => void handleAuth('register')}>
              <UserPlus className="mr-1 h-4 w-4" /> Create account
            </Button>
            {hasToken && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  logoutUser();
                  setAllHistory([]);
                  setPatientHistory([]);
                  setSessionTick((t) => t + 1);
                  setAuthMessage('Signed out.');
                }}
              >
                Sign out
              </Button>
            )}
          </div>
          {authMessage && <p className="text-xs text-muted-foreground mt-3">{authMessage}</p>}
        </Card>

        <Card className="p-6 mb-8">
          <form onSubmit={searchPatient} className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground">Patient Name or UID</label>
                <Input
                  placeholder="e.g., John Doe or OG-ABC123..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="pt-6">
                <Button type="submit" disabled={loading} className="btn-primary-press">
                  {loading ? (
                    <>
                      <RefreshCw className="mr-1 h-4 w-4 animate-spin" /> Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-1 h-4 w-4" /> Search
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20 flex gap-2">
              <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-sm text-warning">{error}</p>
            </div>
          )}
        </Card>

        {loaded && !hasToken && !error && patientHistory.length === 0 && (
          <Card className="p-6 mb-8 border-dashed bg-muted/20">
            <p className="text-sm text-muted-foreground">
              You are not signed in. Use the form above to sign in or register, then your assessment history for this account will load automatically. You can still use Search if the server permits unauthenticated patient lookup.
            </p>
          </Card>
        )}

        {loaded && patientHistory.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-primary">Assessment History</h2>
                <p className="text-sm text-muted-foreground">{patientHistory.length} total assessment(s)</p>
              </div>
              <Button onClick={handleReassess} className="btn-primary-press">
                <RefreshCw className="mr-2 h-4 w-4" /> Perform Reassessment
              </Button>
            </div>

            <div className="space-y-4">
              {patientHistory.map((assessment, index) => {
                const risk = riskConfig[assessment.riskLevel];
                const progress = assessment.metadata?.progress as { trend?: string; note?: string; delta?: number } | undefined;
                const createdRaw = assessment.metadata?.createdAt;
                const createdAt = createdRaw ? new Date(createdRaw) : null;
                const borderClass =
                  assessment.riskLevel === 'critical' || assessment.riskLevel === 'high'
                    ? 'border-l-destructive'
                    : assessment.riskLevel === 'moderate'
                      ? 'border-l-warning'
                      : 'border-l-success';

                return (
                  <div key={index} className={`card-elevated p-6 border-l-4 ${borderClass}`}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase">Date</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {createdAt && !Number.isNaN(createdAt.getTime())
                              ? `${createdAt.toLocaleDateString()} ${createdAt.toLocaleTimeString()}`
                              : '—'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase">Risk Level</div>
                        <div className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${risk.bgColor} ${risk.color}`}>
                          {assessment.riskLevel.toUpperCase()}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase">Score</div>
                        <div className="font-mono font-bold text-lg mt-1">
                          {assessment.score} / {assessment.maxScore}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase">Confidence</div>
                        <div className="font-mono font-bold text-lg mt-1">{assessment.confidence}%</div>
                      </div>
                    </div>

                    {progress && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-start gap-3">
                        <TrendIcon trend={progress.trend} />
                        <div className="text-sm">
                          <div className="font-semibold capitalize">{progress.trend}</div>
                          <div className="text-muted-foreground text-xs mt-1">{progress.note}</div>
                          {progress.delta !== undefined && progress.delta !== 0 && (
                            <div className="text-xs font-mono mt-1">
                              {progress.delta > 0 ? '+' : ''}
                              {progress.delta} points
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {assessment.firedRules && assessment.firedRules.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                          {assessment.metadata?.inferenceSource === 'local_fallback' ? 'Backup rules (offline)' : 'Clinical factors'}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {assessment.firedRules.slice(0, 5).map((rule) => (
                            <span
                              key={rule.id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full"
                            >
                              {assessment.metadata?.inferenceSource === 'local_fallback' ? `${rule.id} ` : ''}
                              {rule.description}
                              <span className="font-mono">(+{rule.points})</span>
                            </span>
                          ))}
                          {assessment.firedRules.length > 5 && (
                            <span className="inline-flex items-center px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                              +{assessment.firedRules.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-border/50 flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => navigate('/explanation', { state: { result: assessment, data: {} } })}>
                        View Details →
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loaded && patientHistory.length === 0 && !error && hasToken && (
          <Card className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-muted-foreground">No records found</h3>
            <p className="text-sm text-muted-foreground mt-2">There are no assessment records for this account yet. Run an assessment while signed in.</p>
          </Card>
        )}

        {!loaded && (
          <Card className="p-12 text-center border-dashed">
            <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50 animate-spin" />
            <h3 className="text-lg font-semibold text-muted-foreground">Loading records...</h3>
            <p className="text-sm text-muted-foreground mt-2">Fetching assessments for your account.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
