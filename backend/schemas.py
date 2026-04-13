from pydantic import BaseModel, EmailStr, model_validator
from typing import List, Optional


class PatientDemographics(BaseModel):
    age: int
    gender: str
    occupation: str
    visitDate: str


class RiskFactors(BaseModel):
    smokingStatus: str
    packYears: int
    betelNut: bool
    betelNutDurationYears: int
    betelNutFrequencyPerDay: int
    alcoholConsumption: str
    drinksPerDay: int
    familyHistory: bool
    hpvStatus: str
    poorOralHygiene: bool


class ClinicalSymptoms(BaseModel):
    oralUlcer: bool
    ulcerDurationWeeks: int
    ulcerSize: str
    ulcerHealing: str
    leukoplakia: bool
    erythroplakia: bool
    mixedPatches: bool
    persistentPain: bool
    dysphagia: bool
    difficultyChewing: bool
    unexplainedBleeding: bool
    numbness: bool
    looseTeeth: bool
    limitedTongueMovement: bool


class ExaminationFindings(BaseModel):
    lesionPresent: bool
    lesionLocation: str
    induration: bool
    irregularBorders: bool
    ulceration: bool
    fixation: bool
    palpableLymphNodes: bool
    lymphNodeSize: str
    lymphNodeFirmFixed: bool
    lymphNodeDurationWeeks: int


class AssessmentPayload(BaseModel):
    patientUid: str
    demographics: PatientDemographics
    riskFactors: RiskFactors
    symptoms: ClinicalSymptoms
    examination: ExaminationFindings


class FiredRule(BaseModel):
    id: str
    description: str
    points: int
    trigger: str
    category: str


class EvidenceItem(BaseModel):
    label: str
    value: str
    level: str


class Recommendation(BaseModel):
    priority: str
    title: str
    detail: str
    timing: Optional[str] = None


class AssessmentResultSchema(BaseModel):
    score: int
    maxScore: int
    riskLevel: str
    confidence: int
    firedRules: List[FiredRule]
    recommendations: List[Recommendation]
    evidenceSummary: List[EvidenceItem]
    metadata: Optional[dict] = None


class ImageAssessmentResultSchema(BaseModel):
    label: str
    riskLevel: str
    confidence: int
    predictions: dict[str, float]
    metadata: Optional[dict] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PatientRegisterRequest(BaseModel):
    fullName: str
    guardianName: str
    dateOfBirth: str
    age: Optional[int] = None
    gender: str
    phone: Optional[str] = None
    address: Optional[str] = None
    occupation: Optional[str] = None

    @model_validator(mode="after")
    def fill_age(self):
        from .age_util import age_from_date_of_birth

        if self.age is not None:
            return self
        try:
            computed = age_from_date_of_birth(self.dateOfBirth)
        except ValueError as exc:
            raise ValueError("dateOfBirth must be a valid YYYY-MM-DD date") from exc
        return self.model_copy(update={"age": computed})


class PatientSchema(BaseModel):
    patientUid: str
    fullName: str
    guardianName: str
    dateOfBirth: str
    age: int
    gender: str
    phone: Optional[str] = None
    address: Optional[str] = None
    occupation: Optional[str] = None


class DatasetRegistryIn(BaseModel):
    name: str
    source: str
    modality: str
    license: str
    status: str
    notes: Optional[str] = None


class DatasetRegistryOut(DatasetRegistryIn):
    id: int
    schema_ok: bool
