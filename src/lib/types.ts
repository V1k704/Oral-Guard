export interface PatientDemographics {
  age: number;
  gender: 'male' | 'female' | 'other';
  occupation: string;
  visitDate: string;
}

export interface PatientRegistration {
  patientUid?: string;
  fullName: string;
  guardianName: string;
  dateOfBirth: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone?: string;
  address?: string;
  occupation?: string;
}

export interface RiskFactors {
  smokingStatus: 'current' | 'former' | 'never';
  packYears: number;
  betelNut: boolean;
  betelNutDurationYears: number;
  betelNutFrequencyPerDay: number;
  alcoholConsumption: 'never' | 'occasional' | 'regular' | 'heavy';
  drinksPerDay: number;
  familyHistory: boolean;
  hpvStatus: 'unknown' | 'positive' | 'negative';
  poorOralHygiene: boolean;
}

export interface ClinicalSymptoms {
  oralUlcer: boolean;
  ulcerDurationWeeks: number;
  ulcerSize: '<1cm' | '1-2cm' | '2-4cm' | '>4cm';
  ulcerHealing: 'non-healing' | 'slow-healing';
  leukoplakia: boolean;
  erythroplakia: boolean;
  mixedPatches: boolean;
  persistentPain: boolean;
  dysphagia: boolean;
  difficultyChewing: boolean;
  unexplainedBleeding: boolean;
  numbness: boolean;
  looseTeeth: boolean;
  limitedTongueMovement: boolean;
}

export interface ExaminationFindings {
  lesionPresent: boolean;
  lesionLocation: 'tongue' | 'floor_of_mouth' | 'buccal_mucosa' | 'gingiva' | 'hard_palate' | 'lip';
  induration: boolean;
  irregularBorders: boolean;
  ulceration: boolean;
  fixation: boolean;
  palpableLymphNodes: boolean;
  lymphNodeSize: '<1.5cm' | '1.5-3cm' | '3-6cm' | '>6cm';
  lymphNodeFirmFixed: boolean;
  lymphNodeDurationWeeks: number;
}

export interface AssessmentData {
  patientUid: string;
  demographics: PatientDemographics;
  riskFactors: RiskFactors;
  symptoms: ClinicalSymptoms;
  examination: ExaminationFindings;
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface FiredRule {
  id: string;
  description: string;
  points: number;
  trigger: string;
  category: 'risk_factor' | 'symptom' | 'examination' | 'combination';
}

export interface Recommendation {
  priority: 'urgent' | 'standard';
  title: string;
  detail: string;
  timing?: string;
}

/** Subset of dataset registry rows returned with assessment results (from backend). */
export interface AssessmentDatasetReference {
  id: number;
  name: string;
  source: string;
  modality: string;
  license: string;
  status: string;
  notes?: string | null;
}

export interface AssessmentResult {
  score: number;
  maxScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  firedRules: FiredRule[];
  recommendations: Recommendation[];
  evidenceSummary: { label: string; value: string; level: 'low' | 'medium' | 'high' }[];
  metadata?: {
    inferenceSource?: 'backend' | 'local_fallback';
    datasetReferences?: AssessmentDatasetReference[];
    createdAt?: string;
    engine?: string;
    patientUid?: string;
    progress?: { trend: string; delta: number; note: string };
    explanationNote?: string;
    imageSupport?: unknown;
    imageSupportError?: string;
    differentialConsiderations?: string[];
    clinicalFactorLabels?: string;
    [key: string]: unknown;
  };
}

export interface ImageAssessmentResult {
  label: string;
  riskLevel: RiskLevel;
  confidence: number;
  predictions: Record<string, number>;
  metadata?: Record<string, unknown>;
}

export interface DatasetRegistryItem {
  name: string;
  source: string;
  modality: 'tabular' | 'image' | 'clinical-json' | 'literature';
  license: string;
  status: 'active' | 'reference' | 'restricted';
  notes: string;
}

export interface DatasetRegistryApiItem extends DatasetRegistryItem {
  id: number;
  schema_ok: boolean;
}

export const DEFAULT_DEMOGRAPHICS: PatientDemographics = {
  age: 0,
  gender: 'male',
  occupation: '',
  visitDate: new Date().toISOString().split('T')[0],
};

export const DEFAULT_PATIENT_REGISTRATION: PatientRegistration = {
  fullName: '',
  guardianName: '',
  dateOfBirth: '',
  age: 0,
  gender: 'male',
  phone: '',
  address: '',
  occupation: '',
};

export const DEFAULT_RISK_FACTORS: RiskFactors = {
  smokingStatus: 'never',
  packYears: 0,
  betelNut: false,
  betelNutDurationYears: 0,
  betelNutFrequencyPerDay: 0,
  alcoholConsumption: 'never',
  drinksPerDay: 0,
  familyHistory: false,
  hpvStatus: 'unknown',
  poorOralHygiene: false,
};

export const DEFAULT_SYMPTOMS: ClinicalSymptoms = {
  oralUlcer: false,
  ulcerDurationWeeks: 0,
  ulcerSize: '<1cm',
  ulcerHealing: 'slow-healing',
  leukoplakia: false,
  erythroplakia: false,
  mixedPatches: false,
  persistentPain: false,
  dysphagia: false,
  difficultyChewing: false,
  unexplainedBleeding: false,
  numbness: false,
  looseTeeth: false,
  limitedTongueMovement: false,
};

export const DEFAULT_EXAMINATION: ExaminationFindings = {
  lesionPresent: false,
  lesionLocation: 'tongue',
  induration: false,
  irregularBorders: false,
  ulceration: false,
  fixation: false,
  palpableLymphNodes: false,
  lymphNodeSize: '<1.5cm',
  lymphNodeFirmFixed: false,
  lymphNodeDurationWeeks: 0,
};
