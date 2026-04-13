import { Shield, Brain, Microscope, Zap, ChevronRight, Activity, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DATASET_REGISTRY } from '@/lib/datasets';

const stats = [
  { value: '22', label: 'Diagnostic Rules', icon: Brain },
  { value: '4-Level', label: 'Risk Classification', icon: Shield },
  { value: '85%+', label: 'Accuracy Rate', icon: Activity },
];

const features = [
  { icon: Brain, title: 'Explainable AI', desc: 'Every diagnosis comes with a complete reasoning trace' },
  { icon: Microscope, title: 'Evidence-Based', desc: 'Built on WHO/IARC and NCCN clinical guidelines' },
  { icon: Shield, title: 'Prevention-Focused', desc: 'Early detection through systematic risk stratification' },
  { icon: Zap, title: 'Real-Time Results', desc: 'Instant inference with forward and backward chaining' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" as const } }),
};

export default function LandingPage() {
  const navigate = useNavigate();
  const featuredDatasets = DATASET_REGISTRY.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#dfeef8]">
      {/* Nav */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg text-primary">OralGuard</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <button onClick={() => navigate('/about')} className="hover:text-foreground transition-colors">System Info</button>
            <button onClick={() => navigate('/patient-records')} className="hover:text-foreground transition-colors">Patient Records</button>
            <button onClick={() => navigate('/explanation')} className="hover:text-foreground transition-colors">Rule Base</button>
          </nav>
          <Button onClick={() => navigate('/assessment')} className="btn-primary-press">
            Start Assessment <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-16 md:py-20">
        <motion.div
          className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 items-stretch"
          initial="hidden"
          animate="visible"
        >
          <div className="card-elevated p-8 text-left">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm text-muted-foreground mb-6">
              <Activity className="h-3.5 w-3.5 text-accent" />
              Clinical Decision Support System
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold tracking-tighter text-primary text-balance leading-[1.1]">
              OralGuard
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="mt-2 text-xl md:text-2xl font-semibold text-secondary tracking-tight">
              Oral Cancer Early Detection
            </motion.p>
            <motion.p variants={fadeUp} custom={3} className="mt-4 text-base text-muted-foreground text-balance">
              Unified clinical assessment workflow with optional image support embedded in physical examination.
            </motion.p>
            <motion.div variants={fadeUp} custom={4} className="mt-8">
              <Button size="lg" onClick={() => navigate('/assessment')} className="btn-primary-press text-base px-6">
                Begin Assessment <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </motion.div>
          </div>

          <div className="card-subtle p-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-accent" />
              Active Dataset Registry
            </h3>
            <div className="space-y-3">
              {featuredDatasets.map((d) => (
                <div key={d.name} className="rounded-xl bg-card p-3 border border-border/60">
                  <p className="font-medium text-sm">{d.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{d.source}</p>
                  <p className="text-xs text-muted-foreground">Type: {d.modality} | Status: {d.status}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-4 w-full" onClick={() => navigate('/about')}>
              View Full Sources & Licenses
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="container pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={i + 5}
              className="card-elevated p-6 text-center hover-lift"
            >
              <s.icon className="h-8 w-8 text-accent mx-auto mb-3" />
              <div className="text-2xl font-bold text-primary">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={i + 8}
              className="card-subtle p-6 flex gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-foreground">{f.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{f.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>OralGuard Expert System — Decision support tool for healthcare professionals.</p>
          <p className="mt-1">Final diagnosis must be made by qualified healthcare professionals.</p>
        </div>
      </footer>
    </div>
  );
}
