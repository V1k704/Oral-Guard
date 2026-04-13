# OralGuard Python Backend

This backend provides:

- a FastAPI inference endpoint at `/api/assess`
- user registration and login with JWT tokens
- assessment persistence in SQLite
- a training script for an ML model

## Setup

Run these commands from the **project root** (not from inside the `backend/` folder).

1. Activate the Backend Virtual Environment

   ```powershell
   .\backend\.venv\Scripts\Activate.ps1
   ```

2. Install Dependencies

   ```powershell
   python -m pip install -r backend/requirements.txt
   ```

3. Copy Environment Variables (Optional)

   ```powershell
   copy backend\.env.example backend\.env
   ```

4. Run the Backend Server

   ```powershell
   python -m uvicorn backend.app:app --reload --host 127.0.0.1 --port 8010
   ```
   
   Server runs at: `http://127.0.0.1:8010`

## Training

Place a dataset at `backend/data/oral_cancer_dataset.csv` with a `riskLevel` target column and run (from project root):

```powershell
.\backend\.venv\Scripts\python.exe -m backend.train
```

If no dataset exists, `train.py` will generate a synthetic dataset and save a model to `backend/model_store/oralguard_model.joblib`.

### Import dataset from KaggleHub

You do not need to manually handle `.zip` files when using `kagglehub`; it downloads files to a local path.

```powershell
.\backend\.venv\Scripts\python.exe -c "import kagglehub; print(kagglehub.dataset_download('ankushpanday2/oral-cancer-prediction-dataset'))"
```

Then map and prepare your CSV:

```powershell
.\backend\.venv\Scripts\python.exe backend/scripts/prepare_dataset.py --source-csv <downloaded_file.csv> --mapping-json backend/scripts/column_mapping.example.json --output-csv backend/data/oral_cancer_dataset.csv
.\backend\.venv\Scripts\python.exe -m backend.train
```

Training now also writes metadata and metrics to `backend/model_store/oralguard_model_metadata.json`.

### Portable one-command pipeline

For portability across machines, use a config-driven runner instead of manual commands:

1. Copy config template:

```powershell
copy backend\scripts\pipeline_config.example.json backend\scripts\pipeline_config.json
```

2. Edit `backend/scripts/pipeline_config.json` and set your real `source_csv` path.

3. Run full pipeline (from project root):

```powershell
.\backend\.venv\Scripts\python.exe backend\scripts\run_pipeline.py --config backend\scripts\pipeline_config.json
```

This performs:
- dataset preparation (`prepare_dataset.py`)
- model training (`python -m backend.train`)

To prepare data only:

```powershell
.\backend\.venv\Scripts\python.exe backend\scripts\run_pipeline.py --config backend\scripts\pipeline_config.json --skip-train
```

### Quick convert for `archive.zip` dataset

If you extracted `archive.zip` and have `oral_cancer_prediction_dataset.csv`, convert it directly:

```powershell
.\backend\.venv\Scripts\python.exe backend\scripts\prepare_archive_dataset.py --source-csv "C:\path\to\oral_cancer_prediction_dataset.csv" --output-csv backend\data\oral_cancer_dataset.csv
.\backend\.venv\Scripts\python.exe -m backend.train
```

Note: this converter infers some missing OralGuard fields from available columns (proxy mapping), so keep the generated model metadata with your experiment notes.

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/assess`
- `POST /api/assess-image`
- `GET /api/history`

### Image Assessment Endpoint

`POST /api/assess-image` accepts a multipart form upload with key `image`.

Example:

```bash
curl -X POST "http://127.0.0.1:8010/api/assess-image" -F "image=@sample.jpg"
```

To enable image inference, place a compatible model at:
`backend/model_store/oralguard_image_model.joblib`

The response includes:
- predicted `label` (e.g., `normal`, `pre_cancer`, `oral_cancer`)
- mapped `riskLevel`
- `confidence`
- class probability map (`predictions`)

## Notes

The frontend is expected to call the backend at `http://localhost:8000` by default.
