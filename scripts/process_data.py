#!/usr/bin/env python3
"""
Script for processing raw xlsx data files into CSV format.

Usage:
    python process_data.py [stage]

Stages:
    xlsx-to-csv   Convert raw xlsx files to CSV
    normalize     Extract subjects and refactor measurement files
    publish       Copy normalized data to static/ for web access
    all           Run all stages (default)
"""

import csv
import sys
from pathlib import Path
from python_calamine import CalamineWorkbook

# Define paths
PROJECT_ROOT = Path(__file__).parent.parent
RAW_DATA_DIR = PROJECT_ROOT / "data" / "raw"
PROCESSED_DATA_DIR = PROJECT_ROOT / "data" / "processed"
NORMALIZED_DATA_DIR = PROJECT_ROOT / "data" / "normalized"
STATIC_DATA_DIR = PROJECT_ROOT / "static" / "data"


def convert_xlsx_to_csv():
    """Convert all xlsx files in raw directory to CSV format."""
    xlsx_files = sorted(RAW_DATA_DIR.glob("*.xlsx"))

    if not xlsx_files:
        print("No xlsx files found in", RAW_DATA_DIR)
        return

    print(f"Found {len(xlsx_files)} xlsx files to convert")

    for xlsx_path in xlsx_files:
        csv_filename = xlsx_path.stem + ".csv"
        csv_path = PROCESSED_DATA_DIR / csv_filename

        print(f"Converting: {xlsx_path.name} -> {csv_filename}")

        workbook = CalamineWorkbook.from_path(xlsx_path)
        sheet = workbook.get_sheet_by_index(0)
        rows = sheet.to_python()

        with open(csv_path, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(rows)

    print(f"\nConverted {len(xlsx_files)} files to CSV in {PROCESSED_DATA_DIR}")


# Columns that belong to subject metadata
SUBJECT_COLUMNS = ['subject', 'birthdate', 'deathdate', 'age_at_death', 'species', 'sex', 'social_environment', 'housing', 'diet']


def extract_subjects():
    """Extract subject metadata into subjects.csv and refactor measurement files."""
    csv_files = sorted(PROCESSED_DATA_DIR.glob("primate*.csv"))

    if not csv_files:
        print("No measurement CSV files found")
        return

    NORMALIZED_DATA_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Processing {len(csv_files)} measurement files")

    # Collect all unique subjects and measurement metadata
    subjects = {}
    measurements = {}

    for csv_path in csv_files:
        with open(csv_path, newline='') as f:
            reader = csv.DictReader(f)
            for row in reader:
                subject_id = row['subject']
                if subject_id not in subjects:
                    subjects[subject_id] = {col: row[col] for col in SUBJECT_COLUMNS}
                if csv_path.name not in measurements:
                    measurements[csv_path.name] = {
                        'filename': csv_path.name,
                        'measurement': row['measurement'],
                        'unit': row['unit'],
                    }

    print(f"Found {len(subjects)} unique subjects")

    # Write subjects.csv
    subjects_path = NORMALIZED_DATA_DIR / "subjects.csv"
    with open(subjects_path, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=SUBJECT_COLUMNS)
        writer.writeheader()
        for subject_id in sorted(subjects.keys()):
            writer.writerow(subjects[subject_id])

    print(f"Wrote {subjects_path.name}")

    # Write measurements.csv
    measurements_path = NORMALIZED_DATA_DIR / "measurements.csv"
    with open(measurements_path, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['filename', 'measurement', 'unit'])
        writer.writeheader()
        for filename in sorted(measurements.keys()):
            writer.writerow(measurements[filename])

    print(f"Wrote {measurements_path.name}")

    # Write refactored measurement files to normalized directory
    for csv_path in csv_files:
        with open(csv_path, newline='') as f:
            reader = csv.DictReader(f)
            headers = reader.fieldnames
            # Keep only subject, measurements count, and y* columns
            keep_columns = ['subject', 'measurements'] + [h for h in headers if h.startswith('y')]
            rows = [{col: row[col] for col in keep_columns} for row in reader]

        output_path = NORMALIZED_DATA_DIR / csv_path.name
        with open(output_path, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=keep_columns)
            writer.writeheader()
            writer.writerows(rows)

        print(f"Wrote: {output_path.name}")

    print(f"\nWrote subjects.csv, measurements.csv, and {len(csv_files)} measurement files to {NORMALIZED_DATA_DIR}")


def publish():
    """Copy normalized data to static directory for web access."""
    import shutil

    if not NORMALIZED_DATA_DIR.exists():
        print(f"Normalized data directory not found: {NORMALIZED_DATA_DIR}")
        print("Run 'normalize' stage first")
        return

    # Clear existing static data
    if STATIC_DATA_DIR.exists():
        shutil.rmtree(STATIC_DATA_DIR)

    STATIC_DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Copy all files from normalized to static
    files = list(NORMALIZED_DATA_DIR.glob("*.csv"))
    for src in files:
        dst = STATIC_DATA_DIR / src.name
        shutil.copy2(src, dst)
        print(f"Copied: {src.name}")

    print(f"\nPublished {len(files)} files to {STATIC_DATA_DIR}")


STAGES = {
    'xlsx-to-csv': convert_xlsx_to_csv,
    'normalize': extract_subjects,
    'publish': publish,
}


def main():
    """Main processing pipeline."""
    stage = sys.argv[1] if len(sys.argv) > 1 else 'all'

    # Ensure output directories exist
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    STATIC_DATA_DIR.mkdir(parents=True, exist_ok=True)

    if stage == 'all':
        for name, func in STAGES.items():
            print(f"=== Stage: {name} ===")
            func()
            print()
    elif stage in STAGES:
        print(f"=== Stage: {stage} ===")
        STAGES[stage]()
    else:
        print(f"Unknown stage: {stage}")
        print(f"Available stages: {', '.join(STAGES.keys())}, all")
        sys.exit(1)

    print("Done!")


if __name__ == "__main__":
    main()
