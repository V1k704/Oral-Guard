import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronLeft, ChevronRight, Check, Save, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { PatientDemographics, RiskFactors, ClinicalSymptoms, ExaminationFindings, AssessmentData, PatientRegistration } from '@/lib/types';
import { DEFAULT_DEMOGRAPHICS, DEFAULT_RISK_FACTORS, DEFAULT_SYMPTOMS, DEFAULT_EXAMINATION, DEFAULT_PATIENT_REGISTRATION } from '@/lib/types';
import { registerPatient } from '@/lib/api';
import { ageFromDateOfBirth } from '@/lib/age';

const STEPS = ['Registration', 'Risk Factors', 'Symptoms', 'Examination'];

export default function AssessmentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [patient, setPatient] = useState<PatientRegistration>({ ...DEFAULT_PATIENT_REGISTRATION });
  const [demographics, setDemographics] = useState<PatientDemographics>({ ...DEFAULT_DEMOGRAPHICS });
  const [riskFactors, setRiskFactors] = useState<RiskFactors>({ ...DEFAULT_RISK_FACTORS });
  const [symptoms, setSymptoms] = useState<ClinicalSymptoms>({ ...DEFAULT_SYMPTOMS });
  const [examination, setExamination] = useState<ExaminationFindings>({ ...DEFAULT_EXAMINATION });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const imagePreview = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile]);

  const canNext = () => {
    if (step === 0) {
      const computedAge = ageFromDateOfBirth(patient.dateOfBirth);
      return (
        patient.fullName.trim().length > 2 &&
        patient.guardianName.trim().length > 2 &&
        !!patient.dateOfBirth &&
        computedAge >= 0 &&
        computedAge <= 120
      );
    }
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setFormError(null);
    try {
      const computedAge = ageFromDateOfBirth(patient.dateOfBirth);
      const registered = await registerPatient({
        ...patient,
        age: computedAge,
        gender: demographics.gender || patient.gender,
        occupation: demographics.occupation || patient.occupation,
      });
      const demo = { ...demographics, age: computedAge };
      const data: AssessmentData = {
        patientUid: String(registered.patientUid),
        demographics: demo,
        riskFactors,
        symptoms,
        examination,
      };
      navigate('/processing', { state: { data, patient: registered, imageFile } });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Patient registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const packYearsLevel = riskFactors.packYears <= 10 ? 'low' : riskFactors.packYears <= 20 ? 'medium' : 'high';

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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Save className="h-4 w-4" />
              <span>Data auto-saved</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-2xl py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  i < step ? 'bg-primary text-primary-foreground' :
                  i === step ? 'bg-accent text-accent-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`hidden sm:block text-sm ${i === step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{s}</span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="card-elevated p-8"
          >
            {step === 0 && (
              <StepRegistration patient={patient} onPatientChange={setPatient} demographics={demographics} onDemographicsChange={setDemographics} />
            )}
            {step === 1 && (
              <StepRiskFactors data={riskFactors} onChange={setRiskFactors} packYearsLevel={packYearsLevel} />
            )}
            {step === 2 && (
              <StepSymptoms data={symptoms} onChange={setSymptoms} />
            )}
            {step === 3 && (
              <StepExamination data={examination} onChange={setExamination} imageFile={imageFile} onImageFileChange={setImageFile} imagePreview={imagePreview} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate('/')} className="btn-primary-press">
            <ChevronLeft className="mr-1 h-4 w-4" />
            {step > 0 ? 'Back' : 'Home'}
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="btn-primary-press">
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="btn-primary-press bg-accent hover:bg-accent/90">
              {submitting ? 'Registering patient...' : 'Run Assessment'} <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
        {formError && <div className="mt-4 text-sm text-destructive">{formError}</div>}
      </div>
    </div>
  );
}

function StepRegistration({
  patient,
  onPatientChange,
  demographics,
  onDemographicsChange,
}: {
  patient: PatientRegistration;
  onPatientChange: (d: PatientRegistration) => void;
  demographics: PatientDemographics;
  onDemographicsChange: (d: PatientDemographics) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-primary">Compulsory Patient Registration</h2>
      <p className="text-sm text-muted-foreground">Register patient identity before assessment to enable longitudinal risk progression tracking.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Patient Full Name *</Label>
          <Input value={patient.fullName} onChange={e => onPatientChange({ ...patient, fullName: e.target.value })} placeholder="e.g., Muhammad Ali" />
        </div>
        <div className="space-y-2">
          <Label>Father/Guardian Name *</Label>
          <Input value={patient.guardianName} onChange={e => onPatientChange({ ...patient, guardianName: e.target.value })} placeholder="e.g., Ahmed Ali" />
        </div>
        <div className="space-y-2">
          <Label>Date of Birth *</Label>
          <Input
            type="date"
            value={patient.dateOfBirth}
            onChange={(e) => {
              const dateOfBirth = e.target.value;
              const age = ageFromDateOfBirth(dateOfBirth);
              onPatientChange({ ...patient, dateOfBirth, age });
              onDemographicsChange({ ...demographics, age });
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Age (from DOB)</Label>
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
            {patient.dateOfBirth ? `${ageFromDateOfBirth(patient.dateOfBirth)} years` : '—'}
          </div>
          <p className="text-xs text-muted-foreground">Computed automatically from date of birth.</p>
        </div>
        <div className="space-y-2">
          <Label>Phone (optional)</Label>
          <Input value={patient.phone || ''} onChange={e => onPatientChange({ ...patient, phone: e.target.value })} placeholder="+92..." />
        </div>
        <div className="space-y-2">
          <Label>Date of Visit</Label>
          <Input type="date" value={demographics.visitDate} onChange={e => onDemographicsChange({ ...demographics, visitDate: e.target.value })} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Address (optional)</Label>
          <Input value={patient.address || ''} onChange={e => onPatientChange({ ...patient, address: e.target.value })} placeholder="City, district, country" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Gender</Label>
        <div className="flex gap-4">
          {(['male', 'female', 'other'] as const).map(g => (
            <label key={g} className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-colors ${demographics.gender === g ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              <input type="radio" name="gender" value={g} checked={demographics.gender === g} onChange={() => { onDemographicsChange({ ...demographics, gender: g }); onPatientChange({ ...patient, gender: g }); }} className="sr-only" />
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Occupation / Exposure Context (optional)</Label>
        <Input value={demographics.occupation} onChange={e => { onDemographicsChange({ ...demographics, occupation: e.target.value }); onPatientChange({ ...patient, occupation: e.target.value }); }} placeholder="e.g., welder, chemical factory worker" />
      </div>
    </div>
  );
}

function StepRiskFactors({ data, onChange, packYearsLevel }: { data: RiskFactors; onChange: (d: RiskFactors) => void; packYearsLevel: string }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-primary">Risk Factors Assessment</h2>

      {/* Tobacco */}
      <div className="space-y-3 p-4 rounded-xl bg-muted/50">
        <Label className="text-base font-semibold">Tobacco Use</Label>
        <div className="flex gap-3 flex-wrap">
          {(['current', 'former', 'never'] as const).map(s => (
            <label key={s} className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-colors ${data.smokingStatus === s ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-card/80'}`}>
              <input type="radio" name="smoking" value={s} checked={data.smokingStatus === s} onChange={() => onChange({ ...data, smokingStatus: s })} className="sr-only" />
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </label>
          ))}
        </div>
        {data.smokingStatus !== 'never' && (
          <div className="space-y-2 mt-2">
            <Label>Pack-years (packs/day × years)</Label>
            <Input type="number" min={0} value={data.packYears || ''} onChange={e => onChange({ ...data, packYears: +e.target.value })} />
            <div className={`text-xs font-medium px-2 py-1 rounded-md inline-block ${
              packYearsLevel === 'low' ? 'bg-success/20 text-success' :
              packYearsLevel === 'medium' ? 'bg-warning/20 text-warning' :
              'bg-destructive/20 text-destructive'
            }`}>
              {packYearsLevel === 'low' ? 'Low Risk (<10)' : packYearsLevel === 'medium' ? 'Medium Risk (10-20)' : 'High Risk (>20)'}
            </div>
          </div>
        )}
      </div>

      {/* Betel Nut */}
      <div className="space-y-3 p-4 rounded-xl bg-muted/50">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Betel Nut / Gutka / Areca</Label>
          <Switch checked={data.betelNut} onCheckedChange={v => onChange({ ...data, betelNut: v })} />
        </div>
        {data.betelNut && (
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-1">
              <Label className="text-sm">Duration (years)</Label>
              <Input type="number" min={0} value={data.betelNutDurationYears || ''} onChange={e => onChange({ ...data, betelNutDurationYears: +e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Frequency (times/day)</Label>
              <Input type="number" min={0} value={data.betelNutFrequencyPerDay || ''} onChange={e => onChange({ ...data, betelNutFrequencyPerDay: +e.target.value })} />
            </div>
          </div>
        )}
      </div>

      {/* Alcohol */}
      <div className="space-y-3 p-4 rounded-xl bg-muted/50">
        <Label className="text-base font-semibold">Alcohol Consumption</Label>
        <Select value={data.alcoholConsumption} onValueChange={v => onChange({ ...data, alcoholConsumption: v as RiskFactors['alcoholConsumption'] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="never">Never</SelectItem>
            <SelectItem value="occasional">Occasional</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
            <SelectItem value="heavy">Heavy</SelectItem>
          </SelectContent>
        </Select>
        {(data.alcoholConsumption === 'regular' || data.alcoholConsumption === 'heavy') && (
          <div className="space-y-1">
            <Label className="text-sm">Drinks per day</Label>
            <Input type="number" min={0} value={data.drinksPerDay || ''} onChange={e => onChange({ ...data, drinksPerDay: +e.target.value })} />
          </div>
        )}
      </div>

      {/* Other */}
      <div className="space-y-3 p-4 rounded-xl bg-muted/50">
        <Label className="text-base font-semibold">Other Factors</Label>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <Checkbox checked={data.familyHistory} onCheckedChange={v => onChange({ ...data, familyHistory: !!v })} />
            <span className="text-sm">Family history of oral cancer</span>
          </label>
          <label className="flex items-center gap-3">
            <Checkbox checked={data.poorOralHygiene} onCheckedChange={v => onChange({ ...data, poorOralHygiene: !!v })} />
            <span className="text-sm">Poor oral hygiene</span>
          </label>
          <div className="space-y-1">
            <Label className="text-sm">HPV Status</Label>
            <Select value={data.hpvStatus} onValueChange={v => onChange({ ...data, hpvStatus: v as RiskFactors['hpvStatus'] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unknown">Unknown</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepSymptoms({ data, onChange }: { data: ClinicalSymptoms; onChange: (d: ClinicalSymptoms) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-primary">Clinical Symptoms</h2>

      {/* Oral Ulcer */}
      <div className="space-y-3 p-4 rounded-xl bg-muted/50">
        <label className="flex items-center gap-3">
          <Checkbox checked={data.oralUlcer} onCheckedChange={v => onChange({ ...data, oralUlcer: !!v })} />
          <span className="font-medium">Oral ulcer / sore</span>
        </label>
        {data.oralUlcer && (
          <div className="grid grid-cols-2 gap-4 ml-7">
            <div className="space-y-1">
              <Label className="text-sm">Duration (weeks)</Label>
              <Input type="number" min={0} value={data.ulcerDurationWeeks || ''} onChange={e => onChange({ ...data, ulcerDurationWeeks: +e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Size</Label>
              <Select value={data.ulcerSize} onValueChange={v => onChange({ ...data, ulcerSize: v as ClinicalSymptoms['ulcerSize'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="<1cm">&lt;1cm</SelectItem>
                  <SelectItem value="1-2cm">1-2cm</SelectItem>
                  <SelectItem value="2-4cm">2-4cm</SelectItem>
                  <SelectItem value=">4cm">&gt;4cm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-sm">Healing Status</Label>
              <div className="flex gap-3">
                {(['non-healing', 'slow-healing'] as const).map(h => (
                  <label key={h} className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${data.ulcerHealing === h ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}>
                    <input type="radio" name="healing" value={h} checked={data.ulcerHealing === h} onChange={() => onChange({ ...data, ulcerHealing: h })} className="sr-only" />
                    {h.charAt(0).toUpperCase() + h.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lesions */}
      <div className="space-y-3 p-4 rounded-xl bg-muted/50">
        <Label className="text-base font-semibold">Oral Lesions</Label>
        <div className="space-y-3">
          {([
            ['leukoplakia', 'White patches (Leukoplakia)'],
            ['erythroplakia', 'Red patches (Erythroplakia)'],
            ['mixedPatches', 'Mixed red/white patches'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3">
              <Checkbox checked={data[key]} onCheckedChange={v => onChange({ ...data, [key]: !!v })} />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Pain */}
      <div className="space-y-3 p-4 rounded-xl bg-muted/50">
        <Label className="text-base font-semibold">Pain Symptoms</Label>
        <div className="space-y-3">
          {([
            ['persistentPain', 'Persistent oral pain'],
            ['dysphagia', 'Difficulty swallowing (Dysphagia)'],
            ['difficultyChewing', 'Difficulty chewing'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3">
              <Checkbox checked={data[key]} onCheckedChange={v => onChange({ ...data, [key]: !!v })} />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Red flags */}
      <div className="space-y-3 p-4 rounded-xl bg-destructive/5 border border-destructive/10">
        <Label className="text-base font-semibold text-destructive">Red Flag Symptoms</Label>
        <div className="space-y-3">
          {([
            ['unexplainedBleeding', 'Unexplained bleeding'],
            ['numbness', 'Numbness in mouth/tongue'],
            ['looseTeeth', 'Loose teeth without periodontal disease'],
            ['limitedTongueMovement', 'Limited tongue movement'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3">
              <Checkbox checked={data[key]} onCheckedChange={v => onChange({ ...data, [key]: !!v })} />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepExamination({
  data,
  onChange,
  imageFile,
  onImageFileChange,
  imagePreview,
}: {
  data: ExaminationFindings;
  onChange: (d: ExaminationFindings) => void;
  imageFile: File | null;
  onImageFileChange: (f: File | null) => void;
  imagePreview: string | null;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-primary">Physical Examination Findings</h2>

      <div className="space-y-3 p-4 rounded-xl bg-muted/50">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Lesion Present</Label>
          <Switch checked={data.lesionPresent} onCheckedChange={v => onChange({ ...data, lesionPresent: v })} />
        </div>
        {data.lesionPresent && (
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label className="text-sm">Location</Label>
              <Select value={data.lesionLocation} onValueChange={v => onChange({ ...data, lesionLocation: v as ExaminationFindings['lesionLocation'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tongue">Tongue</SelectItem>
                  <SelectItem value="floor_of_mouth">Floor of Mouth</SelectItem>
                  <SelectItem value="buccal_mucosa">Buccal Mucosa</SelectItem>
                  <SelectItem value="gingiva">Gingiva</SelectItem>
                  <SelectItem value="hard_palate">Hard Palate</SelectItem>
                  <SelectItem value="lip">Lip</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([
                ['induration', 'Induration (firm/hardened)'],
                ['irregularBorders', 'Irregular borders'],
                ['ulceration', 'Ulceration'],
                ['fixation', 'Fixation to underlying tissue'],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-card">
                  <span className="text-sm">{label}</span>
                  <Switch checked={data[key]} onCheckedChange={v => onChange({ ...data, [key]: v })} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 p-4 rounded-xl bg-muted/50">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Palpable Neck Lymph Nodes</Label>
          <Switch checked={data.palpableLymphNodes} onCheckedChange={v => onChange({ ...data, palpableLymphNodes: v })} />
        </div>
        {data.palpableLymphNodes && (
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label className="text-sm">Size</Label>
              <Select value={data.lymphNodeSize} onValueChange={v => onChange({ ...data, lymphNodeSize: v as ExaminationFindings['lymphNodeSize'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="<1.5cm">&lt;1.5cm</SelectItem>
                  <SelectItem value="1.5-3cm">1.5-3cm</SelectItem>
                  <SelectItem value="3-6cm">3-6cm</SelectItem>
                  <SelectItem value=">6cm">&gt;6cm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-3">
              <Checkbox checked={data.lymphNodeFirmFixed} onCheckedChange={v => onChange({ ...data, lymphNodeFirmFixed: !!v })} />
              <span className="text-sm">Firm / Fixed characteristics</span>
            </label>
            <div className="space-y-1">
              <Label className="text-sm">Duration (weeks)</Label>
              <Input type="number" min={0} value={data.lymphNodeDurationWeeks || ''} onChange={e => onChange({ ...data, lymphNodeDurationWeeks: +e.target.value })} />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 p-4 rounded-xl bg-muted/50">
        <Label className="text-base font-semibold">Optional Lesion Image Support</Label>
        <p className="text-xs text-muted-foreground">Optional image upload to support lesion comparison; manual clinical findings remain primary.</p>
        <label className="block border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:bg-muted/30 transition-colors">
          <input type="file" accept="image/*" className="hidden" onChange={e => onImageFileChange(e.target.files?.[0] ?? null)} />
          <ImagePlus className="h-6 w-6 mx-auto mb-2 text-accent" />
          <span className="text-sm">{imageFile ? imageFile.name : 'Upload lesion photo (optional)'}</span>
        </label>
        {imagePreview && <img src={imagePreview} alt="Lesion preview" className="max-h-52 rounded-xl border border-border object-contain bg-card" />}
      </div>
    </div>
  );
}
