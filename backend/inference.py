from .schemas import AssessmentPayload, AssessmentResultSchema, FiredRule, EvidenceItem, Recommendation

RULES = [
    {
        "id": "R1",
        "description": "Heavy Tobacco Risk (>20 pack-years)",
        "category": "risk_factor",
        "check": lambda d: d["riskFactors"]["packYears"] > 20,
        "points": 5,
        "trigger": lambda d: f"Patient has {d['riskFactors']['packYears']} pack-years of tobacco use",
    },
    {
        "id": "R2",
        "description": "Moderate Tobacco Risk (10-20 pack-years)",
        "category": "risk_factor",
        "check": lambda d: 10 <= d["riskFactors"]["packYears"] <= 20,
        "points": 3,
        "trigger": lambda d: f"Patient has {d['riskFactors']['packYears']} pack-years of tobacco use",
    },
    {
        "id": "R3",
        "description": "Betel Nut/Gutka Use",
        "category": "risk_factor",
        "check": lambda d: d["riskFactors"]["betelNut"] and d["riskFactors"]["betelNutDurationYears"] > 5,
        "points": 4,
        "trigger": lambda d: f"Betel nut use for {d['riskFactors']['betelNutDurationYears']} years",
    },
    {
        "id": "R4",
        "description": "Heavy Alcohol Consumption",
        "category": "risk_factor",
        "check": lambda d: d["riskFactors"]["alcoholConsumption"] == "heavy",
        "points": 3,
        "trigger": lambda d: f"Heavy alcohol consumption: {d['riskFactors']['drinksPerDay']} drinks/day",
    },
    {
        "id": "R5",
        "description": "Combined Tobacco + Alcohol Synergy",
        "category": "combination",
        "check": lambda d: d["riskFactors"]["packYears"] > 10 and d["riskFactors"]["alcoholConsumption"] in ["regular", "heavy"],
        "points": 3,
        "trigger": lambda d: "Synergistic risk: combined tobacco and alcohol exposure",
    },
    {
        "id": "R6",
        "description": "Family History of Oral Cancer",
        "category": "risk_factor",
        "check": lambda d: d["riskFactors"]["familyHistory"],
        "points": 2,
        "trigger": lambda d: "Positive family history of oral cancer",
    },
    {
        "id": "R7",
        "description": "HPV Positive Status",
        "category": "risk_factor",
        "check": lambda d: d["riskFactors"]["hpvStatus"] == "positive",
        "points": 3,
        "trigger": lambda d: "HPV positive status confirmed",
    },
    {
        "id": "R8",
        "description": "Suspicious Lesion (>2 weeks, indurated)",
        "category": "examination",
        "check": lambda d: d["symptoms"]["oralUlcer"] and d["symptoms"]["ulcerDurationWeeks"] > 2 and d["examination"]["induration"],
        "points": 6,
        "trigger": lambda d: f"Lesion present >2 weeks ({d['symptoms']['ulcerDurationWeeks']}w) with induration",
    },
    {
        "id": "R9",
        "description": "Premalignant Lesion - Leukoplakia",
        "category": "symptom",
        "check": lambda d: d["symptoms"]["leukoplakia"],
        "points": 3,
        "trigger": lambda d: "Leukoplakia identified on examination",
    },
    {
        "id": "R10",
        "description": "Premalignant Lesion - Erythroplakia",
        "category": "symptom",
        "check": lambda d: d["symptoms"]["erythroplakia"],
        "points": 5,
        "trigger": lambda d: "Erythroplakia identified — higher malignant potential",
    },
    {
        "id": "R11",
        "description": "Red Flag: Unexplained Bleeding",
        "category": "symptom",
        "check": lambda d: d["symptoms"]["unexplainedBleeding"],
        "points": 2,
        "trigger": lambda d: "Unexplained oral bleeding reported",
    },
    {
        "id": "R12",
        "description": "Red Flag: Numbness/Paresthesia",
        "category": "symptom",
        "check": lambda d: d["symptoms"]["numbness"] or d["symptoms"]["limitedTongueMovement"],
        "points": 3,
        "trigger": lambda d: "Neurological symptoms: numbness or limited tongue movement",
    },
    {
        "id": "R13",
        "description": "Lymphadenopathy (Suspicious)",
        "category": "examination",
        "check": lambda d: d["examination"]["palpableLymphNodes"] and d["examination"]["lymphNodeFirmFixed"],
        "points": 5,
        "trigger": lambda d: f"Firm/fixed lymph nodes palpable, size: {d['examination']['lymphNodeSize']}",
    },
    {
        "id": "R14",
        "description": "Lesion Fixation to Deep Tissue",
        "category": "examination",
        "check": lambda d: d["examination"]["fixation"],
        "points": 4,
        "trigger": lambda d: "Lesion fixed to underlying tissue — suggests invasion",
    },
    {
        "id": "R15",
        "description": "High-Risk Location",
        "category": "examination",
        "check": lambda d: d["examination"]["lesionPresent"] and d["examination"]["lesionLocation"] in ["tongue", "floor_of_mouth"],
        "points": 2,
        "trigger": lambda d: f"Lesion in high-risk location: {d['examination']['lesionLocation'].replace('_', ' ')}",
    },
    {
        "id": "R16",
        "description": "Age >50 with Risk Factors",
        "category": "combination",
        "check": lambda d: d["demographics"]["age"] > 50 and (d["riskFactors"]["smokingStatus"] != "never" or d["riskFactors"]["betelNut"]),
        "points": 2,
        "trigger": lambda d: f"Age {d['demographics']['age']} with tobacco/betel nut exposure",
    },
    {
        "id": "R17",
        "description": "Persistent Non-Healing Ulcer",
        "category": "symptom",
        "check": lambda d: d["symptoms"]["oralUlcer"] and d["symptoms"]["ulcerHealing"] == "non-healing",
        "points": 4,
        "trigger": lambda d: "Non-healing oral ulcer pattern documented",
    },
    {
        "id": "R18",
        "description": "Large Lesion Burden",
        "category": "examination",
        "check": lambda d: d["symptoms"]["ulcerSize"] in ["2-4cm", ">4cm"],
        "points": 3,
        "trigger": lambda d: f"Lesion size category: {d['symptoms']['ulcerSize']}",
    },
    {
        "id": "R19",
        "description": "Converging Red Flags Cluster",
        "category": "combination",
        "check": lambda d: sum(
            [
                bool(d["symptoms"]["persistentPain"]),
                bool(d["symptoms"]["dysphagia"]),
                bool(d["symptoms"]["difficultyChewing"]),
                bool(d["symptoms"]["unexplainedBleeding"]),
            ]
        ) >= 3,
        "points": 4,
        "trigger": lambda d: "Multiple high-risk symptoms present concurrently",
    },
    {
        "id": "R20",
        "description": "Heavy Alcohol and Poor Oral Hygiene Synergy",
        "category": "combination",
        "check": lambda d: d["riskFactors"]["alcoholConsumption"] == "heavy" and d["riskFactors"]["poorOralHygiene"],
        "points": 2,
        "trigger": lambda d: "Combined inflammatory risk factors (heavy alcohol + poor oral hygiene)",
    },
    {
        "id": "R21",
        "description": "Lymph Node Persistence >4 Weeks",
        "category": "examination",
        "check": lambda d: d["examination"]["palpableLymphNodes"] and d["examination"]["lymphNodeDurationWeeks"] >= 4,
        "points": 3,
        "trigger": lambda d: f"Persistent lymphadenopathy for {d['examination']['lymphNodeDurationWeeks']} weeks",
    },
    {
        "id": "R22",
        "description": "Potential Field Cancerization Pattern",
        "category": "combination",
        "check": lambda d: (d["symptoms"]["leukoplakia"] or d["symptoms"]["erythroplakia"]) and d["riskFactors"]["smokingStatus"] == "current",
        "points": 3,
        "trigger": lambda d: "Mucosal premalignant change in active smoker",
    },
]


def classify_risk(score: int) -> str:
    if score >= 18:
        return "critical"
    if score >= 12:
        return "high"
    if score >= 6:
        return "moderate"
    return "low"


def calculate_confidence(fired, data) -> int:
    base = 60
    if len(fired) >= 3:
        base += 10
    if len(fired) >= 5:
        base += 5
    if data["examination"]["lesionPresent"]:
        base += 10
    if any(getattr(r, "category", None) == "examination" for r in fired):
        base += 8
    if any(getattr(r, "category", None) == "combination" for r in fired):
        base += 5
    return min(base, 95)


def build_evidence(data, fired) -> list[EvidenceItem]:
    items = []
    if data["riskFactors"]["smokingStatus"] != "never":
        level = "high" if data["riskFactors"]["packYears"] > 20 else "medium" if data["riskFactors"]["packYears"] >= 10 else "low"
        items.append(EvidenceItem(label="Tobacco Exposure", value=f"{data['riskFactors']['packYears']} pack-years", level=level))

    if data["symptoms"]["oralUlcer"]:
        level = "high" if data["symptoms"]["ulcerDurationWeeks"] > 2 and data["examination"]["induration"] else "medium" if data["symptoms"]["ulcerDurationWeeks"] > 2 else "low"
        items.append(EvidenceItem(label="Lesion Characteristics", value=f"{data['symptoms']['ulcerDurationWeeks']}w{', indurated' if data['examination']['induration'] else ''}", level=level))

    if data["symptoms"]["leukoplakia"] or data["symptoms"]["erythroplakia"] or data["symptoms"]["mixedPatches"]:
        types = [label for label, active in [("leukoplakia", data["symptoms"]["leukoplakia"]), ("erythroplakia", data["symptoms"]["erythroplakia"]), ("mixed", data["symptoms"]["mixedPatches"])] if active]
        items.append(EvidenceItem(label="Premalignant Changes", value=", ".join(types), level="high" if data["symptoms"]["erythroplakia"] else "medium"))

    if data["examination"]["palpableLymphNodes"]:
        items.append(EvidenceItem(label="Lymphadenopathy", value=f"{data['examination']['lymphNodeSize']}{', firm/fixed' if data['examination']['lymphNodeFirmFixed'] else ''}", level="high" if data["examination"]["lymphNodeFirmFixed"] else "medium"))

    if data["riskFactors"]["alcoholConsumption"] != "never":
        level = "high" if data["riskFactors"]["alcoholConsumption"] == "heavy" else "medium" if data["riskFactors"]["alcoholConsumption"] == "regular" else "low"
        items.append(EvidenceItem(label="Alcohol Consumption", value=data["riskFactors"]["alcoholConsumption"], level=level))

    if not items:
        items.append(EvidenceItem(label="Overall Risk Profile", value="No significant risk factors identified", level="low"))

    return items


def build_recommendations(risk: str, fired, data) -> list[Recommendation]:
    recs = []
    if risk in ["critical", "high"]:
        recs.append(Recommendation(priority="urgent", title="Biopsy Required", detail="Incisional biopsy of suspicious lesion for histopathological examination", timing="Within 2 weeks"))
        recs.append(Recommendation(priority="urgent", title="Specialist Referral", detail="Refer to ENT surgeon or oral oncologist for evaluation", timing="Urgent"))
        if risk == "critical":
            recs.append(Recommendation(priority="urgent", title="Imaging Studies", detail="CT/MRI of head and neck region; chest X-ray for staging", timing="Within 1 week"))

    if risk == "moderate":
        recs.append(Recommendation(priority="standard", title="Close Clinical Follow-up", detail="Re-examine in 2-4 weeks to monitor lesion progression", timing="2-4 weeks"))
        if data["symptoms"]["leukoplakia"] or data["symptoms"]["erythroplakia"]:
            recs.append(Recommendation(priority="urgent", title="Consider Biopsy", detail="Biopsy recommended for persistent premalignant lesions", timing="Within 4 weeks"))

    if data["riskFactors"]["smokingStatus"] != "never":
        recs.append(Recommendation(priority="standard", title="Tobacco Cessation Counseling", detail="Provide smoking cessation resources and pharmacotherapy options"))

    if data["riskFactors"]["alcoholConsumption"] in ["regular", "heavy"]:
        recs.append(Recommendation(priority="standard", title="Alcohol Reduction Counseling", detail="Discuss reducing alcohol intake as a modifiable risk factor"))

    follow_up = "1 week" if risk == "critical" else "2 weeks" if risk == "high" else "1 month" if risk == "moderate" else "6 months"
    recs.append(Recommendation(priority="standard", title="Follow-up Schedule", detail=f"Next appointment in {follow_up}; regular oral cancer screening", timing=follow_up))

    if risk == "low":
        recs.append(Recommendation(priority="standard", title="Routine Monitoring", detail="Continue regular dental check-ups with oral cancer screening"))

    return recs


def build_differential_considerations(data, risk: str) -> list[str]:
    differentials = []
    if data["symptoms"]["erythroplakia"] or data["symptoms"]["leukoplakia"]:
        differentials.append("Oral potentially malignant disorder (OPMD) including leukoplakia/erythroplakia spectrum")
    if data["symptoms"]["oralUlcer"] and data["symptoms"]["ulcerHealing"] == "non-healing":
        differentials.append("Non-healing ulcer suspicious for oral squamous cell carcinoma (OSCC)")
    if data["examination"]["palpableLymphNodes"] and data["examination"]["lymphNodeFirmFixed"]:
        differentials.append("Possible nodal metastatic involvement requiring urgent staging workup")
    if risk in ["critical", "high"]:
        differentials.append("Advanced oral cavity malignancy cannot be excluded without biopsy and imaging")
    if not differentials:
        differentials.append("Low immediate malignant suspicion; monitor for lesion persistence or progression")
    return differentials


def run_inference(payload: AssessmentPayload) -> AssessmentResultSchema:
    fired = []
    data = payload.dict()
    score = 0

    for rule in RULES:
        if rule["check"](data):
            points = rule["points"]
            score += points
            fired.append(FiredRule(id=rule["id"], description=rule["description"], points=points, trigger=rule["trigger"](data), category=rule["category"]))

    risk_level = classify_risk(score)
    confidence = calculate_confidence(fired, data)
    evidence = build_evidence(data, fired)
    recommendations = build_recommendations(risk_level, fired, data)

    return AssessmentResultSchema(
        score=score,
        maxScore=74,
        riskLevel=risk_level,
        confidence=confidence,
        firedRules=fired,
        evidenceSummary=evidence,
        recommendations=recommendations,
        metadata={"engine": "rule_based", "differentialConsiderations": build_differential_considerations(data, risk_level)},
    )
