import os
from pathlib import Path
from typing import Any
import joblib
from .settings import settings
from .schemas import AssessmentPayload
from .inference import run_inference

_model = None


def get_model_path() -> Path:
    return Path(settings.model_path)


def load_model() -> Any | None:
    global _model
    path = get_model_path()
    if path.exists():
        _model = joblib.load(path)
    return _model


def feature_vector(payload: AssessmentPayload) -> list[float]:
    p = payload.dict()
    mapping = {
        "alcoholConsumption": {"never": 0, "occasional": 1, "regular": 2, "heavy": 3},
        "smokingStatus": {"never": 0, "former": 1, "current": 2},
        "hpvStatus": {"unknown": 0, "negative": 1, "positive": 2},
        "ulcerSize": {"<1cm": 0, "1-2cm": 1, "2-4cm": 2, ">4cm": 3},
        "ulcerHealing": {"slow-healing": 0, "non-healing": 1},
        "lesionLocation": {"tongue": 0, "floor_of_mouth": 1, "buccal_mucosa": 2, "gingiva": 3, "hard_palate": 4, "lip": 5},
        "lymphNodeSize": {"<1.5cm": 0, "1.5-3cm": 1, "3-6cm": 2, ">6cm": 3},
    }

    features = [
        p["demographics"]["age"],
        mapping["smokingStatus"][p["riskFactors"]["smokingStatus"]],
        p["riskFactors"]["packYears"],
        int(p["riskFactors"]["betelNut"]),
        p["riskFactors"]["betelNutDurationYears"],
        mapping["alcoholConsumption"][p["riskFactors"]["alcoholConsumption"]],
        p["riskFactors"]["drinksPerDay"],
        int(p["riskFactors"]["familyHistory"]),
        mapping["hpvStatus"][p["riskFactors"]["hpvStatus"]],
        int(p["riskFactors"]["poorOralHygiene"]),
        int(p["symptoms"]["oralUlcer"]),
        p["symptoms"]["ulcerDurationWeeks"],
        mapping["ulcerSize"][p["symptoms"]["ulcerSize"]],
        mapping["ulcerHealing"][p["symptoms"]["ulcerHealing"]],
        int(p["symptoms"]["leukoplakia"]),
        int(p["symptoms"]["erythroplakia"]),
        int(p["symptoms"]["mixedPatches"]),
        int(p["symptoms"]["persistentPain"]),
        int(p["symptoms"]["dysphagia"]),
        int(p["symptoms"]["difficultyChewing"]),
        int(p["symptoms"]["unexplainedBleeding"]),
        int(p["symptoms"]["numbness"]),
        int(p["symptoms"]["looseTeeth"]),
        int(p["symptoms"]["limitedTongueMovement"]),
        int(p["examination"]["lesionPresent"]),
        mapping["lesionLocation"][p["examination"]["lesionLocation"]],
        int(p["examination"]["induration"]),
        int(p["examination"]["irregularBorders"]),
        int(p["examination"]["ulceration"]),
        int(p["examination"]["fixation"]),
        int(p["examination"]["palpableLymphNodes"]),
        mapping["lymphNodeSize"][p["examination"]["lymphNodeSize"]],
        int(p["examination"]["lymphNodeFirmFixed"]),
        p["examination"]["lymphNodeDurationWeeks"],
    ]
    return features


def map_label(index: int) -> str:
    return ["low", "moderate", "high", "critical"][index]


def predict_assessment(payload: AssessmentPayload) -> dict:
    model = _model or load_model()
    if not model:
        return {"model": "none", "score": 0, "risk_level": "low", "confidence": 0}

    features = feature_vector(payload)
    score = model.predict([features])[0]
    proba = max(model.predict_proba([features])[0]) if hasattr(model, "predict_proba") else 0.5
    return {
        "model": "ml",
        "score": int(score),
        "risk_level": map_label(int(score)) if isinstance(score, (int, float)) else "low",
        "confidence": int(proba * 100),
    }


def is_model_available() -> bool:
    return get_model_path().exists()
