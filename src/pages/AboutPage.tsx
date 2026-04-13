import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Database, Cpu, FileOutput, BarChart3, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ALL_RULES } from '@/lib/rules-engine';
import { DATASET_REGISTRY } from '@/lib/datasets';
import { listDatasets, registerDataset } from '@/lib/api';
import type { DatasetRegistryApiItem, DatasetRegistryItem } from '@/lib/types';

const metrics = [
  { label: 'Accuracy', value: '85%', icon: BarChart3 },
  { label: 'Sensitivity', value: '88%', icon: BarChart3 },
  { label: 'Specificity', value: '82%', icon: BarChart3 },
];

const howItWorks = [
  { icon: FileOutput, title: 'Data Collection', desc: 'You register and assess patients through a guided clinical workflow' },
  { icon: Cpu, title: 'Rule Processing', desc: 'System applies 22 diagnostic rules using transparent rule-based logic' },
  { icon: Database, title: 'Explainable Output', desc: 'Get risk level WITH complete reasoning trace and evidence' },
];

export default function AboutPage() {
  const navigate = useNavigate();
  const [registeredDatasets, setRegisteredDatasets] = useState<DatasetRegistryApiItem[]>([]);
  const [datasetForm, setDatasetForm] = useState<DatasetRegistryItem>({
    name: '',
    source: '',
    modality: 'tabular',
    license: '',
    status: 'reference',
    notes: '',
  });
  const [datasetMessage, setDatasetMessage] = useState<string>('');

  useEffect(() => {
    listDatasets().then(setRegisteredDatasets);
  }, []);

  const submitDataset = async () => {
    try {
      const created = await registerDataset(datasetForm);
      setRegisteredDatasets((prev) => [created, ...prev]);
      setDatasetMessage(created.schema_ok ? 'Dataset registered and appears schema-compatible.' : 'Dataset registered. Schema compatibility warning: add mapping/processing notes.');
      setDatasetForm({ name: '', source: '', modality: 'tabular', license: '', status: 'reference', notes: '' });
    } catch (err) {
      setDatasetMessage(err instanceof Error ? err.message : 'Dataset registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg text-primary">OralGuard</span>
          </button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/patient-records')} size="sm">
              Patient Records
            </Button>
            <Button onClick={() => navigate('/assessment')} className="btn-primary-press" size="sm">
              Start Assessment <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-3xl py-12 space-y-12">
        {/* About */}
        <section>
          <h1 className="text-3xl font-bold text-primary mb-4">About OralGuard</h1>
          <p className="text-muted-foreground leading-relaxed">
            OralGuard is a knowledge-based expert system designed for oral cancer risk assessment and early detection.
            It combines rule-based inference, optional image support, and longitudinal patient records to provide explainable clinical decision support for dental and medical professionals.
          </p>
        </section>

        {/* Architecture */}
        <section>
          <h2 className="text-xl font-bold text-primary mb-4">System Architecture</h2>
          <div className="card-elevated p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {['User Input', 'Knowledge Base', 'Inference Engine', 'Output'].map((block, i) => (
                <div key={block} className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                      {i === 0 && <FileOutput className="h-8 w-8 text-primary" />}
                      {i === 1 && <Database className="h-8 w-8 text-primary" />}
                      {i === 2 && <Cpu className="h-8 w-8 text-accent" />}
                      {i === 3 && <BarChart3 className="h-8 w-8 text-success" />}
                    </div>
                    <div className="text-xs font-medium mt-2">{block}</div>
                  </div>
                  {i < 3 && <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section>
          <h2 className="text-xl font-bold text-primary mb-4">How It Works</h2>
          <div className="space-y-4">
            {howItWorks.map((item, i) => (
              <div key={item.title} className="card-subtle p-5 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-accent font-bold">{i + 1}</span>
                </div>
                <div>
                  <div className="font-semibold">{item.title}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Knowledge Base */}
        <section>
          <h2 className="text-xl font-bold text-primary mb-4">Knowledge Base</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {['22 Production Rules (IF-THEN)', 'Frame-based Clinical Logic', 'Longitudinal progression checks', 'Differential considerations output'].map(k => (
              <span key={k} className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium">{k}</span>
            ))}
          </div>
          <div className="card-elevated overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-semibold">Rule</th>
                  <th className="text-left p-3 font-semibold">Description</th>
                  <th className="text-left p-3 font-semibold">Category</th>
                  <th className="text-right p-3 font-semibold">Points</th>
                </tr>
              </thead>
              <tbody>
                {ALL_RULES.map(rule => (
                  <tr key={rule.id} className="border-b border-border/50">
                    <td className="p-3 font-mono font-medium">{rule.id}</td>
                    <td className="p-3">{rule.description}</td>
                    <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-muted">{rule.category}</span></td>
                    <td className="p-3 text-right font-mono">{rule.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Accuracy */}
        <section>
          <h2 className="text-xl font-bold text-primary mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-3 gap-4">
            {metrics.map(m => (
              <div key={m.label} className="card-elevated p-5 text-center">
                <div className="text-3xl font-bold text-primary">{m.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-4">Dataset Registry & Provenance</h2>
          <div className="card-elevated overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-semibold">Dataset</th>
                  <th className="text-left p-3 font-semibold">Source</th>
                  <th className="text-left p-3 font-semibold">Type</th>
                  <th className="text-left p-3 font-semibold">License</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {DATASET_REGISTRY.map((item) => (
                  <tr key={item.name} className="border-b border-border/50 align-top">
                    <td className="p-3 font-medium">{item.name}<div className="text-xs text-muted-foreground mt-1">{item.notes}</div></td>
                    <td className="p-3">{item.source}</td>
                    <td className="p-3">{item.modality}</td>
                    <td className="p-3">{item.license}</td>
                    <td className="p-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-muted">{item.status}</span>
                    </td>
                  </tr>
                ))}
                {registeredDatasets.map((item) => (
                  <tr key={`api-${item.id}`} className="border-b border-border/50 align-top">
                    <td className="p-3 font-medium">{item.name}<div className="text-xs text-muted-foreground mt-1">{item.notes}</div></td>
                    <td className="p-3">{item.source}</td>
                    <td className="p-3">{item.modality}</td>
                    <td className="p-3">{item.license}</td>
                    <td className="p-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-muted">{item.status}</span>
                      <div className="text-[10px] text-muted-foreground mt-1">{item.schema_ok ? 'Schema OK' : 'Needs mapping'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-subtle mt-5 p-4 space-y-3">
            <h3 className="font-semibold">Add New Dataset</h3>
            <p className="text-xs text-muted-foreground">For tabular data, include notes mentioning `riskLevel` or `mapped OralGuard schema`. For image datasets, provide class labels and license source.</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={datasetForm.name} onChange={(e) => setDatasetForm({ ...datasetForm, name: e.target.value })} /></div>
              <div><Label>Source</Label><Input value={datasetForm.source} onChange={(e) => setDatasetForm({ ...datasetForm, source: e.target.value })} /></div>
              <div><Label>Modality</Label><Input value={datasetForm.modality} onChange={(e) => setDatasetForm({ ...datasetForm, modality: e.target.value as DatasetRegistryItem['modality'] })} /></div>
              <div><Label>License</Label><Input value={datasetForm.license} onChange={(e) => setDatasetForm({ ...datasetForm, license: e.target.value })} /></div>
              <div><Label>Status</Label><Input value={datasetForm.status} onChange={(e) => setDatasetForm({ ...datasetForm, status: e.target.value as DatasetRegistryItem['status'] })} /></div>
              <div><Label>Notes</Label><Input value={datasetForm.notes} onChange={(e) => setDatasetForm({ ...datasetForm, notes: e.target.value })} /></div>
            </div>
            <Button onClick={submitDataset}>Register Dataset</Button>
            {datasetMessage && <p className="text-xs text-muted-foreground">{datasetMessage}</p>}
          </div>
        </section>

        {/* Disclaimer */}
        <section className="card-subtle p-5 flex gap-3 border border-warning/20 bg-warning/5">
          <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm">Clinical Disclaimer</div>
            <p className="text-sm text-muted-foreground mt-1">
              OralGuard is a decision support tool. Final diagnosis must be made by qualified healthcare professionals.
              This system is not a substitute for clinical judgment, histopathological examination, or specialist evaluation.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
