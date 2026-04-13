from pathlib import Path
from typing import Any
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, f1_score, accuracy_score
from sklearn.preprocessing import StandardScaler
import joblib
from .settings import settings
import json

FEATURE_COLUMNS = [
    "demographics.age",
    "riskFactors.smokingStatus",
    "riskFactors.packYears",
    "riskFactors.betelNut",
    "riskFactors.betelNutDurationYears",
    "riskFactors.alcoholConsumption",
    "riskFactors.drinksPerDay",
    "riskFactors.familyHistory",
    "riskFactors.hpvStatus",
    "riskFactors.poorOralHygiene",
    "symptoms.oralUlcer",
    "symptoms.ulcerDurationWeeks",
    "symptoms.ulcerSize",
    "symptoms.ulcerHealing",
    "symptoms.leukoplakia",
    "symptoms.erythroplakia",
    "symptoms.mixedPatches",
    "symptoms.persistentPain",
    "symptoms.dysphagia",
    "symptoms.difficultyChewing",
    "symptoms.unexplainedBleeding",
    "symptoms.numbness",
    "symptoms.looseTeeth",
    "symptoms.limitedTongueMovement",
    "examination.lesionPresent",
    "examination.lesionLocation",
    "examination.induration",
    "examination.irregularBorders",
    "examination.ulceration",
    "examination.fixation",
    "examination.palpableLymphNodes",
    "examination.lymphNodeSize",
    "examination.lymphNodeFirmFixed",
    "examination.lymphNodeDurationWeeks",
]

CATEGORY_MAPS = {
    "riskFactors.alcoholConsumption": {"never": 0, "occasional": 1, "regular": 2, "heavy": 3},
    "riskFactors.smokingStatus": {"never": 0, "former": 1, "current": 2},
    "riskFactors.hpvStatus": {"unknown": 0, "negative": 1, "positive": 2},
    "symptoms.ulcerSize": {"<1cm": 0, "1-2cm": 1, "2-4cm": 2, ">4cm": 3},
    "symptoms.ulcerHealing": {"slow-healing": 0, "non-healing": 1},
    "examination.lesionLocation": {"tongue": 0, "floor_of_mouth": 1, "buccal_mucosa": 2, "gingiva": 3, "hard_palate": 4, "lip": 5},
    "examination.lymphNodeSize": {"<1.5cm": 0, "1.5-3cm": 1, "3-6cm": 2, ">6cm": 3},
}


def encode_features(frame: pd.DataFrame) -> pd.DataFrame:
    encoded = frame.copy()
    for col, mapping in CATEGORY_MAPS.items():
        if col in encoded.columns:
            encoded[col] = (
                encoded[col]
                .astype(str)
                .str.strip()
                .str.lower()
                .map(mapping)
                .fillna(0)
                .astype(int)
            )
    for col in encoded.columns:
        if col not in CATEGORY_MAPS:
            encoded[col] = pd.to_numeric(encoded[col], errors="coerce").fillna(0)
    return encoded


def load_dataset(path: Path):
    df = pd.read_csv(path)
    if "riskLevel" not in df.columns:
        raise ValueError("Dataset must include a riskLevel target column")
    missing = [col for col in FEATURE_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")
    return df


def train_model() -> dict[str, Any]:
    path = Path(settings.data_path)
    source = "synthetic"
    if path.exists():
        df = load_dataset(path)
        print(f"Loaded dataset from {path}")
        source = str(path)
        X = encode_features(df[FEATURE_COLUMNS])
        y = df["riskLevel"].astype(int)
    else:
        print("Dataset not found. Generating synthetic training data.")
        from sklearn.datasets import make_classification
        X, y = make_classification(n_samples=800, n_features=34, n_informative=18, n_redundant=6, n_classes=4, random_state=42)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    model = LogisticRegression(max_iter=500, solver="lbfgs")
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    report_text = classification_report(y_test, y_pred, zero_division=0)
    macro_f1 = float(f1_score(y_test, y_pred, average="macro"))
    acc = float(accuracy_score(y_test, y_pred))
    cm = confusion_matrix(y_test, y_pred).tolist()
    print("Training complete. Model performance:\n")
    print(report_text)
    print(f"Macro F1: {macro_f1:.4f}")
    print(f"Accuracy: {acc:.4f}")
    print(f"Confusion Matrix: {cm}")

    storage = Path(settings.model_path)
    storage.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, storage)
    print(f"Saved trained model to {storage}")

    metadata = {
        "dataset_source": source,
        "feature_columns": FEATURE_COLUMNS,
        "metrics": {
            "macro_f1": macro_f1,
            "accuracy": acc,
            "classification_report": report_text,
            "confusion_matrix": cm,
        },
    }
    metadata_path = storage.parent / "oralguard_model_metadata.json"
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"Saved metadata to {metadata_path}")
    return metadata


if __name__ == "__main__":
    train_model()
