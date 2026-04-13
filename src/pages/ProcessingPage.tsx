import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Check, Loader2 } from 'lucide-react';
import type { AssessmentData, AssessmentResult } from '@/lib/types';
import { submitAssessment, submitImageAssessment } from '@/lib/api';

const STEPS = [
  'Analyzing risk factors...',
  'Evaluating symptoms...',
  'Processing examination findings...',
  'Running inference engine...',
  'Generating explanation...',
];

export default function ProcessingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const statePayload = (location.state as { data: AssessmentData; imageFile?: File | null } | null);
  const data = statePayload?.data;
  const imageFile = statePayload?.imageFile ?? null;
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) { navigate('/'); return; }

    const interval = setInterval(() => {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }, 500);

    const run = async () => {
      try {
        const result: AssessmentResult = await submitAssessment(data);
        if (imageFile) {
          try {
            const imageResult = await submitImageAssessment(imageFile);
            result.metadata = { ...(result.metadata || {}), imageSupport: imageResult };
          } catch (imageErr) {
            result.metadata = { ...(result.metadata || {}), imageSupportError: imageErr instanceof Error ? imageErr.message : 'Image support unavailable' };
          }
        }
        setTimeout(() => navigate('/results', { state: { data, result } }), 400);
      } catch (err) {
        let msg = err instanceof Error ? err.message : 'Unable to reach backend service.';
        try {
          const parsed = JSON.parse(msg) as { detail?: unknown };
          if (typeof parsed.detail === 'string') msg = parsed.detail;
          else if (Array.isArray(parsed.detail)) msg = parsed.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join('; ') || msg;
        } catch {
          /* plain text error */
        }
        setError(msg);
      } finally {
        clearInterval(interval);
      }
    };

    run();
    return () => clearInterval(interval);
  }, [data, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="card-elevated p-12 max-w-md w-full text-center relative overflow-hidden">
        <div className="scanning-overlay absolute inset-0" />
        <div className="relative z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-8"
          >
            <Shield className="w-16 h-16 text-primary" />
          </motion.div>
          <h2 className="text-xl font-bold text-primary mb-2">Processing Assessment</h2>
          <p className="text-sm text-muted-foreground mb-8">Sending patient data to the secure clinical backend for risk evaluation...</p>
          <div className="space-y-3 text-left">
            {STEPS.map((s, i) => (
              <motion.div
                key={s}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: i <= currentStep ? 1 : 0.3, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className="flex items-center gap-3"
              >
                {i < currentStep ? (
                  <Check className="h-5 w-5 text-success flex-shrink-0" />
                ) : i === currentStep ? (
                  <Loader2 className="h-5 w-5 text-accent animate-spin flex-shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border border-border flex-shrink-0" />
                )}
                <span className={`text-sm ${i <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</span>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-border/20 bg-muted/10 p-4 text-sm text-muted-foreground">
            Waiting for clinical inference. This may take a few seconds while the system evaluates the assessment.
          </div>
          {error ? (
            <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              <p>Unable to process assessment: {error}</p>
              <button
                className="mt-4 inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground bg-card hover:bg-card/90"
                onClick={() => navigate('/assessment')}
              >
                Return to assessment
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
