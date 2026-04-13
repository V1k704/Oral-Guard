import argparse
from pathlib import Path

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
    parser = argparse.ArgumentParser(description="Convert archive oral cancer CSV into OralGuard schema.")
    parser.add_argument("--source-csv", required=True, help="Path to oral_cancer_prediction_dataset.csv")
    parser.add_argument("--output-csv", default="backend/data/oral_cancer_dataset.csv", help="Output CSV path")
    return parser.parse_args()


def yes_no_to_bool(s: pd.Series) -> pd.Series:
    return s.fillna("No").astype(str).str.strip().str.lower().isin({"yes", "y", "true", "1"})


def map_risk_level(stage: pd.Series, diagnosis: pd.Series) -> pd.Series:
    stage_num = pd.to_numeric(stage, errors="coerce").fillna(0).astype(int)
    diagnosed = yes_no_to_bool(diagnosis)
    risk = pd.Series(0, index=stage.index, dtype=int)
    risk.loc[diagnosed] = 1
    risk.loc[stage_num >= 2] = 2
    risk.loc[stage_num >= 3] = 3
    return risk


def main():
    args = parse_args()
    source = Path(args.source_csv)
    if not source.exists():
        raise FileNotFoundError(f"Source CSV not found: {source}")

    df = pd.read_csv(source)
    out = pd.DataFrame(index=df.index)

    out["demographics.age"] = pd.to_numeric(df.get("Age"), errors="coerce").fillna(0).astype(int)
    out["riskFactors.smokingStatus"] = yes_no_to_bool(df.get("Tobacco Use", "No")).map({True: "current", False: "never"})
    out["riskFactors.packYears"] = yes_no_to_bool(df.get("Tobacco Use", "No")).astype(int) * 10
    out["riskFactors.betelNut"] = yes_no_to_bool(df.get("Betel Quid Use", "No")).astype(int)
    out["riskFactors.betelNutDurationYears"] = out["riskFactors.betelNut"] * 5

    out["riskFactors.alcoholConsumption"] = yes_no_to_bool(df.get("Alcohol Consumption", "No")).map({True: "regular", False: "never"})
    out["riskFactors.drinksPerDay"] = yes_no_to_bool(df.get("Alcohol Consumption", "No")).astype(int) * 2
    out["riskFactors.familyHistory"] = yes_no_to_bool(df.get("Family History of Cancer", "No")).astype(int)
    out["riskFactors.hpvStatus"] = yes_no_to_bool(df.get("HPV Infection", "No")).map({True: "positive", False: "negative"})
    out["riskFactors.poorOralHygiene"] = yes_no_to_bool(df.get("Poor Oral Hygiene", "No")).astype(int)

    out["symptoms.oralUlcer"] = yes_no_to_bool(df.get("Oral Lesions", "No")).astype(int)
    out["symptoms.ulcerDurationWeeks"] = out["symptoms.oralUlcer"] * 3

    tumor_size = pd.to_numeric(df.get("Tumor Size (cm)", 0), errors="coerce").fillna(0)
    out["symptoms.ulcerSize"] = pd.cut(
        tumor_size,
        bins=[-0.001, 1, 2, 4, float("inf")],
        labels=["<1cm", "1-2cm", "2-4cm", ">4cm"],
    ).astype(str).replace("nan", "<1cm")
    out["symptoms.ulcerHealing"] = "slow-healing"
    out["symptoms.leukoplakia"] = yes_no_to_bool(df.get("White or Red Patches in Mouth", "No")).astype(int)
    out["symptoms.erythroplakia"] = yes_no_to_bool(df.get("White or Red Patches in Mouth", "No")).astype(int)
    out["symptoms.mixedPatches"] = 0
    out["symptoms.persistentPain"] = out["symptoms.oralUlcer"]
    out["symptoms.dysphagia"] = yes_no_to_bool(df.get("Difficulty Swallowing", "No")).astype(int)
    out["symptoms.difficultyChewing"] = out["symptoms.oralUlcer"]
    out["symptoms.unexplainedBleeding"] = yes_no_to_bool(df.get("Unexplained Bleeding", "No")).astype(int)
    out["symptoms.numbness"] = 0
    out["symptoms.looseTeeth"] = 0
    out["symptoms.limitedTongueMovement"] = 0

    out["examination.lesionPresent"] = out["symptoms.oralUlcer"]
    out["examination.lesionLocation"] = "tongue"
    out["examination.induration"] = out["symptoms.oralUlcer"]
    out["examination.irregularBorders"] = out["symptoms.oralUlcer"]
    out["examination.ulceration"] = out["symptoms.oralUlcer"]
    out["examination.fixation"] = 0
    out["examination.palpableLymphNodes"] = 0
    out["examination.lymphNodeSize"] = "<1.5cm"
    out["examination.lymphNodeFirmFixed"] = 0
    out["examination.lymphNodeDurationWeeks"] = 0

    out["riskLevel"] = map_risk_level(df.get("Cancer Stage", 0), df.get("Oral Cancer (Diagnosis)", "No"))
    out = out[TARGET_COLUMNS]

    output = Path(args.output_csv)
    output.parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(output, index=False)
    print(f"Prepared OralGuard dataset at: {output}")
    print(f"Rows: {len(out)}")


if __name__ == "__main__":
    main()
