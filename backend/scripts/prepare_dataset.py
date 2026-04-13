import argparse
import json
from pathlib import Path
from typing import Dict

import pandas as pd

TARGET_COLUMNS = [
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
    "riskLevel",
]


def parse_args():
    parser = argparse.ArgumentParser(description="Prepare OralGuard training dataset.")
    parser.add_argument("--source-csv", required=True, help="Path to source CSV.")
    parser.add_argument("--mapping-json", required=True, help="JSON file mapping source columns to target columns.")
    parser.add_argument("--output-csv", default="backend/data/oral_cancer_dataset.csv", help="Output CSV path.")
    return parser.parse_args()


def normalize_yes_no(value):
    if pd.isna(value):
        return 0
    text = str(value).strip().lower()
    if text in {"1", "true", "yes", "y", "positive", "present"}:
        return 1
    return 0


def normalize_dataset(df: pd.DataFrame) -> pd.DataFrame:
    bool_cols = [c for c in TARGET_COLUMNS if c.endswith(("betelNut", "familyHistory", "poorOralHygiene", "oralUlcer", "leukoplakia", "erythroplakia", "mixedPatches", "persistentPain", "dysphagia", "difficultyChewing", "unexplainedBleeding", "numbness", "looseTeeth", "limitedTongueMovement", "lesionPresent", "induration", "irregularBorders", "ulceration", "fixation", "palpableLymphNodes", "lymphNodeFirmFixed"))]
    for col in bool_cols:
        if col in df.columns:
            df[col] = df[col].apply(normalize_yes_no)

    numeric_cols = [
        "demographics.age",
        "riskFactors.packYears",
        "riskFactors.betelNutDurationYears",
        "riskFactors.drinksPerDay",
        "symptoms.ulcerDurationWeeks",
        "examination.lymphNodeDurationWeeks",
        "riskLevel",
    ]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

    enums = {
        "riskFactors.smokingStatus": "never",
        "riskFactors.alcoholConsumption": "never",
        "riskFactors.hpvStatus": "unknown",
        "symptoms.ulcerSize": "<1cm",
        "symptoms.ulcerHealing": "slow-healing",
        "examination.lesionLocation": "tongue",
        "examination.lymphNodeSize": "<1.5cm",
    }
    for col, default in enums.items():
        if col in df.columns:
            df[col] = df[col].fillna(default).astype(str).str.strip().str.lower().str.replace(" ", "_")

    return df


def main():
    args = parse_args()
    source_path = Path(args.source_csv)
    mapping_path = Path(args.mapping_json)
    output_path = Path(args.output_csv)

    if not source_path.exists():
        raise FileNotFoundError(f"Source CSV not found: {source_path}")
    if not mapping_path.exists():
        raise FileNotFoundError(f"Mapping file not found: {mapping_path}")

    mapping: Dict[str, str] = json.loads(mapping_path.read_text(encoding="utf-8"))
    source = pd.read_csv(source_path)

    renamed = source.rename(columns=mapping)
    missing = [col for col in TARGET_COLUMNS if col not in renamed.columns]
    if missing:
        raise ValueError(f"Missing required target columns after mapping: {missing}")

    prepared = normalize_dataset(renamed[TARGET_COLUMNS]).dropna()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    prepared.to_csv(output_path, index=False)
    print(f"Prepared dataset saved to: {output_path}")
    print(f"Rows: {len(prepared)}")


if __name__ == "__main__":
    main()
