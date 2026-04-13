import type { AssessmentData, FiredRule, AssessmentResult, RiskLevel, Recommendation } from './types';

interface Rule {
  id: string;
  description: string;
  category: FiredRule['category'];
  check: (d: AssessmentData) => boolean;
  points: number;
  trigger: (d: AssessmentData) => string;
}

const RULES: Rule[] = [
  {
    id: 'R1', description: 'Heavy Tobacco Risk (>20 pack-years)', category: 'risk_factor',
    check: d => d.riskFactors.packYears > 20, points: 5,
    trigger: d => `Patient has ${d.riskFactors.packYears} pack-years of tobacco use`,
  },
  {
    id: 'R2', description: 'Moderate Tobacco Risk (10-20 pack-years)', category: 'risk_factor',
    check: d => d.riskFactors.packYears >= 10 && d.riskFactors.packYears <= 20, points: 3,
    trigger: d => `Patient has ${d.riskFactors.packYears} pack-years of tobacco use`,
  },
  {
    id: 'R3', description: 'Betel Nut/Gutka Use', category: 'risk_factor',
    check: d => d.riskFactors.betelNut && d.riskFactors.betelNutDurationYears > 5, points: 4,
    trigger: d => `Betel nut use for ${d.riskFactors.betelNutDurationYears} years`,
  },
  {
    id: 'R4', description: 'Heavy Alcohol Consumption', category: 'risk_factor',
    check: d => d.riskFactors.alcoholConsumption === 'heavy', points: 3,
    trigger: d => `Heavy alcohol consumption: ${d.riskFactors.drinksPerDay} drinks/day`,
  },
  {
    id: 'R5', description: 'Combined Tobacco + Alcohol Synergy', category: 'combination',
    check: d => d.riskFactors.packYears > 10 && ['regular', 'heavy'].includes(d.riskFactors.alcoholConsumption), points: 3,
    trigger: () => 'Synergistic risk: combined tobacco and alcohol exposure',
  },
  {
    id: 'R6', description: 'Family History of Oral Cancer', category: 'risk_factor',
    check: d => d.riskFactors.familyHistory, points: 2,
    trigger: () => 'Positive family history of oral cancer',
  },
  {
    id: 'R7', description: 'HPV Positive Status', category: 'risk_factor',
    check: d => d.riskFactors.hpvStatus === 'positive', points: 3,
    trigger: () => 'HPV positive status confirmed',
  },
  {
    id: 'R8', description: 'Suspicious Lesion (>2 weeks, indurated)', category: 'examination',
    check: d => d.symptoms.oralUlcer && d.symptoms.ulcerDurationWeeks > 2 && d.examination.induration, points: 6,
    trigger: d => `Lesion present >2 weeks (${d.symptoms.ulcerDurationWeeks}w) with induration`,
  },
  {
    id: 'R9', description: 'Premalignant Lesion - Leukoplakia', category: 'symptom',
    check: d => d.symptoms.leukoplakia, points: 3,
    trigger: () => 'Leukoplakia identified on examination',
  },
  {
    id: 'R10', description: 'Premalignant Lesion - Erythroplakia', category: 'symptom',
    check: d => d.symptoms.erythroplakia, points: 5,
    trigger: () => 'Erythroplakia identified — higher malignant potential',
  },
  {
    id: 'R11', description: 'Red Flag: Unexplained Bleeding', category: 'symptom',
    check: d => d.symptoms.unexplainedBleeding, points: 2,
    trigger: () => 'Unexplained oral bleeding reported',
  },
  {
    id: 'R12', description: 'Red Flag: Numbness/Paresthesia', category: 'symptom',
    check: d => d.symptoms.numbness || d.symptoms.limitedTongueMovement, points: 3,
    trigger: () => 'Neurological symptoms: numbness or limited tongue movement',
  },
  {
    id: 'R13', description: 'Lymphadenopathy (Suspicious)', category: 'examination',
    check: d => d.examination.palpableLymphNodes && d.examination.lymphNodeFirmFixed, points: 5,
    trigger: d => `Firm/fixed lymph nodes palpable, size: ${d.examination.lymphNodeSize}`,
  },
  {
    id: 'R14', description: 'Lesion Fixation to Deep Tissue', category: 'examination',
    check: d => d.examination.fixation, points: 4,
    trigger: () => 'Lesion fixed to underlying tissue — suggests invasion',
  },
  {
    id: 'R15', description: 'High-Risk Location', category: 'examination',
    check: d => d.examination.lesionPresent && ['tongue', 'floor_of_mouth'].includes(d.examination.lesionLocation), points: 2,
    trigger: d => `Lesion in high-risk location: ${d.examination.lesionLocation.replace('_', ' ')}`,
  },
  {
    id: 'R16', description: 'Age >50 with Risk Factors', category: 'combination',
    check: d => d.demographics.age > 50 && (d.riskFactors.smokingStatus !== 'never' || d.riskFactors.betelNut), points: 2,
    trigger: d => `Age ${d.demographics.age} with tobacco/betel nut exposure`,
  },
  {
    id: 'R17', description: 'Persistent Non-Healing Ulcer', category: 'symptom',
    check: d => d.symptoms.oralUlcer && d.symptoms.ulcerHealing === 'non-healing', points: 4,
    trigger: () => 'Non-healing oral ulcer pattern documented',
  },
  {
    id: 'R18', description: 'Large Lesion Burden', category: 'examination',
    check: d => ['2-4cm', '>4cm'].includes(d.symptoms.ulcerSize), points: 3,
    trigger: d => `Lesion size category: ${d.symptoms.ulcerSize}`,
  },
  {
    id: 'R19', description: 'Converging Red Flags Cluster', category: 'combination',
    check: d => {
      const redFlags = [
        d.symptoms.persistentPain,
        d.symptoms.dysphagia,
        d.symptoms.difficultyChewing,
        d.symptoms.unexplainedBleeding,
      ].filter(Boolean).length;
      return redFlags >= 3;
    },
    points: 4,
    trigger: () => 'Multiple high-risk symptoms present concurrently',
  },
  {
    id: 'R20', description: 'Heavy Alcohol and Poor Oral Hygiene Synergy', category: 'combination',
    check: d => d.riskFactors.alcoholConsumption === 'heavy' && d.riskFactors.poorOralHygiene, points: 2,
    trigger: () => 'Combined inflammatory risk factors (heavy alcohol + poor oral hygiene)',
  },
  {
    id: 'R21', description: 'Lymph Node Persistence >4 Weeks', category: 'examination',
    check: d => {
      // Note: checking for lymphNodeDurationWeeks property if available
      const hasLymphNodeDuration = 'lymphNodeDurationWeeks' in d.examination;
      return d.examination.palpableLymphNodes && (hasLymphNodeDuration ? (d.examination as any).lymphNodeDurationWeeks >= 4 : false);
    },
    points: 3,
    trigger: d => {
      const hasLymphNodeDuration = 'lymphNodeDurationWeeks' in d.examination;
      const weeks = hasLymphNodeDuration ? (d.examination as any).lymphNodeDurationWeeks : 0;
      return `Persistent lymphadenopathy for ${weeks} weeks`;
    },
  },
  {
    id: 'R22', description: 'Potential Field Cancerization Pattern', category: 'combination',
    check: d => (d.symptoms.leukoplakia || d.symptoms.erythroplakia) && d.riskFactors.smokingStatus === 'current', points: 3,
    trigger: () => 'Mucosal premalignant change in active smoker',
  },
];

export function runInference(data: AssessmentData): AssessmentResult {
  const firedRules: FiredRule[] = [];
  let score = 0;

  for (const rule of RULES) {
    if (rule.check(data)) {
      const points = rule.points;
      score += points;
      firedRules.push({
        id: rule.id,
        description: rule.description,
        points,
        trigger: rule.trigger(data),
        category: rule.category,
      });
    }
  }

  const maxScore = 74;
  const riskLevel = classifyRisk(score);
  const confidence = calculateConfidence(firedRules, data);
  const evidenceSummary = buildEvidence(data, firedRules);
  const recommendations = buildRecommendations(riskLevel, firedRules, data);

  return {
    score,
    maxScore,
    riskLevel,
    confidence,
    firedRules,
    recommendations,
    evidenceSummary,
    metadata: {
      inferenceSource: 'local_fallback' as const,
      datasetReferences: [],
      engine: 'embedded_rules_backup',
      explanationNote:
        'The API was unreachable, so this result uses the embedded offline rule engine (R1–R22). It is not linked to your server dataset registry. Re-run when the backend is online for registry-backed reporting.',
    },
  };
}

function classifyRisk(score: number): RiskLevel {
  if (score >= 18) return 'critical';
  if (score >= 12) return 'high';
  if (score >= 6) return 'moderate';
  return 'low';
}

function calculateConfidence(fired: FiredRule[], data: AssessmentData): number {
  let base = 60;
  if (fired.length >= 3) base += 10;
  if (fired.length >= 5) base += 5;
  if (data.examination.lesionPresent) base += 10;
  if (fired.some(r => r.category === 'examination')) base += 8;
  if (fired.some(r => r.category === 'combination')) base += 5;
  return Math.min(base, 95);
}

function buildEvidence(data: AssessmentData, fired: FiredRule[]): AssessmentResult['evidenceSummary'] {
  const items: AssessmentResult['evidenceSummary'] = [];

  if (data.riskFactors.smokingStatus !== 'never') {
    const level = data.riskFactors.packYears > 20 ? 'high' : data.riskFactors.packYears >= 10 ? 'medium' : 'low';
    items.push({ label: 'Tobacco Exposure', value: `${data.riskFactors.packYears} pack-years`, level });
  }

  if (data.symptoms.oralUlcer) {
    const level = data.symptoms.ulcerDurationWeeks > 2 && data.examination.induration ? 'high' : data.symptoms.ulcerDurationWeeks > 2 ? 'medium' : 'low';
    items.push({ label: 'Lesion Characteristics', value: `${data.symptoms.ulcerDurationWeeks}w, ${data.symptoms.ulcerSize}${data.examination.induration ? ', indurated' : ''}`, level });
  }

  if (data.symptoms.leukoplakia || data.symptoms.erythroplakia || data.symptoms.mixedPatches) {
    const types = [data.symptoms.leukoplakia && 'leukoplakia', data.symptoms.erythroplakia && 'erythroplakia', data.symptoms.mixedPatches && 'mixed'].filter(Boolean);
    items.push({ label: 'Premalignant Changes', value: types.join(', '), level: data.symptoms.erythroplakia ? 'high' : 'medium' });
  }

  if (data.examination.palpableLymphNodes) {
    items.push({ label: 'Lymphadenopathy', value: `${data.examination.lymphNodeSize}${data.examination.lymphNodeFirmFixed ? ', firm/fixed' : ''}`, level: data.examination.lymphNodeFirmFixed ? 'high' : 'medium' });
  }

  if (data.riskFactors.alcoholConsumption !== 'never') {
    const level = data.riskFactors.alcoholConsumption === 'heavy' ? 'high' : data.riskFactors.alcoholConsumption === 'regular' ? 'medium' : 'low';
    items.push({ label: 'Alcohol Consumption', value: data.riskFactors.alcoholConsumption, level });
  }

  if (items.length === 0) {
    items.push({ label: 'Overall Risk Profile', value: 'No significant risk factors identified', level: 'low' });
  }

  return items;
}

function buildRecommendations(risk: RiskLevel, fired: FiredRule[], data: AssessmentData): Recommendation[] {
  const recs: Recommendation[] = [];

  if (risk === 'critical' || risk === 'high') {
    recs.push({ priority: 'urgent', title: 'Biopsy Required', detail: 'Incisional biopsy of suspicious lesion for histopathological examination', timing: 'Within 2 weeks' });
    recs.push({ priority: 'urgent', title: 'Specialist Referral', detail: 'Refer to ENT surgeon or oral oncologist for evaluation', timing: 'Urgent' });
    if (risk === 'critical') {
      recs.push({ priority: 'urgent', title: 'Imaging Studies', detail: 'CT/MRI of head and neck region; chest X-ray for staging', timing: 'Within 1 week' });
    }
  }

  if (risk === 'moderate') {
    recs.push({ priority: 'standard', title: 'Close Clinical Follow-up', detail: 'Re-examine in 2-4 weeks to monitor lesion progression', timing: '2-4 weeks' });
    if (data.symptoms.leukoplakia || data.symptoms.erythroplakia) {
      recs.push({ priority: 'urgent', title: 'Consider Biopsy', detail: 'Biopsy recommended for persistent premalignant lesions', timing: 'Within 4 weeks' });
    }
  }

  if (data.riskFactors.smokingStatus !== 'never') {
    recs.push({ priority: 'standard', title: 'Tobacco Cessation Counseling', detail: 'Provide smoking cessation resources and pharmacotherapy options' });
  }

  if (data.riskFactors.alcoholConsumption === 'heavy' || data.riskFactors.alcoholConsumption === 'regular') {
    recs.push({ priority: 'standard', title: 'Alcohol Reduction Counseling', detail: 'Discuss reducing alcohol intake as a modifiable risk factor' });
  }

  const followUp = risk === 'critical' ? '1 week' : risk === 'high' ? '2 weeks' : risk === 'moderate' ? '1 month' : '6 months';
  recs.push({ priority: 'standard', title: 'Follow-up Schedule', detail: `Next appointment in ${followUp}; regular oral cancer screening`, timing: followUp });

  if (risk === 'low') {
    recs.push({ priority: 'standard', title: 'Routine Monitoring', detail: 'Continue regular dental check-ups with oral cancer screening' });
  }

  return recs;
}

export function runWhatIf(data: AssessmentData, modification: string): AssessmentResult {
  const modified = JSON.parse(JSON.stringify(data)) as AssessmentData;

  switch (modification) {
    case 'remove_tobacco':
      modified.riskFactors.smokingStatus = 'never';
      modified.riskFactors.packYears = 0;
      break;
    case 'remove_lesion':
      modified.symptoms.oralUlcer = false;
      modified.symptoms.ulcerDurationWeeks = 0;
      modified.examination.induration = false;
      modified.examination.irregularBorders = false;
      modified.examination.fixation = false;
      break;
    case 'remove_leukoplakia':
      modified.symptoms.leukoplakia = false;
      break;
    case 'remove_alcohol':
      modified.riskFactors.alcoholConsumption = 'never';
      modified.riskFactors.drinksPerDay = 0;
      break;
    case 'remove_lymph':
      modified.examination.palpableLymphNodes = false;
      modified.examination.lymphNodeFirmFixed = false;
      break;
    case 'lesion_under_2weeks':
      modified.symptoms.ulcerDurationWeeks = 1;
      break;
  }

  return runInference(modified);
}

export const ALL_RULES = RULES.map(r => ({ id: r.id, description: r.description, category: r.category, points: r.points }));
