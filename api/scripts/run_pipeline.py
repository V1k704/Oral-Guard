import argparse
import json
import subprocess
import sys
from pathlib import Path


def parse_args():
    parser = argparse.ArgumentParser(
        description="Portable data pipeline: prepare dataset and train OralGuard model."
    )
    parser.add_argument(
        "--config",
        default="backend/scripts/pipeline_config.example.json",
        help="Path to JSON config file.",
    )
    parser.add_argument(
        "--skip-train",
        action="store_true",
        help="Only prepare dataset, skip model training.",
    )
    return parser.parse_args()


def run_command(command: list[str]) -> None:
    printable = " ".join(command)
    print(f"Running: {printable}")
    result = subprocess.run(command, check=False)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed ({result.returncode}): {printable}")


def main():
    args = parse_args()
    config_path = Path(args.config)
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")

    cfg = json.loads(config_path.read_text(encoding="utf-8"))
    source_csv = cfg.get("source_csv")
    mapping_json = cfg.get("mapping_json")
    output_csv = cfg.get("output_csv", "backend/data/oral_cancer_dataset.csv")

    if not source_csv or not mapping_json:
        raise ValueError("Config must include 'source_csv' and 'mapping_json'.")

    run_command(
        [
            sys.executable,
            "backend/scripts/prepare_dataset.py",
            "--source-csv",
            str(source_csv),
            "--mapping-json",
            str(mapping_json),
            "--output-csv",
            str(output_csv),
        ]
    )

    if not args.skip_train:
        run_command([sys.executable, "-m", "backend.train"])

    print("Pipeline complete.")


if __name__ == "__main__":
    main()
