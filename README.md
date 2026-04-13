# OralGuard - Unified Project Guide

This file is the single source of truth for OralGuard setup, architecture, evolution, training workflow, and current status.

## Quick Start (Copy-Paste Ready)

> **Before running any command**: Replace `Oral Guard Application` in all paths with your actual project folder name.

**Windows PowerShell Example**:
```powershell
cd "C:\Users\YourUsername\Desktop\Oral Guard Application"
```

Then use the commands below from your project root folder.

## 1) Project Summary

OralGuard is an educational oral cancer risk assessment platform that started as a frontend-only React application and was upgraded to include a FastAPI backend with persistence, authentication, and ML hooks.

It currently supports:
- tabular assessment inference (`/api/assess`)
- optional image assessment endpoint (`/api/assess-image`)
- user registration/login with JWT
- SQLite persistence and history retrieval

## 2) Evolution (Frontend -> Backend)

### Initial State (Frontend-only)
- React + TypeScript + Vite + Tailwind + shadcn/ui
- Rule engine executed in-browser (`src/lib/rules-engine.ts`)
- No backend, no database, no authentication

### Upgrade Motivation
- Move from stateless demo to API-backed platform
- Add user-level data persistence
- Add model training/inference capability

### Backend Stack Added
- FastAPI + Uvicorn
- SQLAlchemy + SQLite
- JWT auth (`python-jose`, `passlib`)
- scikit-learn / pandas / joblib

## 3) Current Architecture Map

### Frontend Layer
- React app collects multi-step assessment data
- API client in `src/lib/api.ts`
- network fallback logic exists when backend unavailable

### Backend API Layer
- Entry: `backend/app.py`
- Auth routes: `backend/routes/auth.py`
- Assessment routes: `backend/routes/assessments.py`

### Inference Modules
- Rule-based engine: `backend/inference.py`
- Tabular ML model loading/prediction: `backend/model.py`
- Image model loading/prediction: `backend/image_model.py`

### Data/Training Modules
- Main trainer: `backend/train.py`
- Generic schema mapper: `backend/scripts/prepare_dataset.py`
- Archive dataset converter: `backend/scripts/prepare_archive_dataset.py`
- Portable pipeline runner: `backend/scripts/run_pipeline.py`

### Persistence/Auth
- DB session/config: `backend/database.py`
- ORM models: `backend/models.py`
  - **User**: email, hashed_password, created_at; 1:many with AssessmentRecord
  - **Patient**: patient_uid, full_name, guardian_name, date_of_birth, age, gender, phone, address, occupation; 1:many with AssessmentRecord
  - **AssessmentRecord**: user_id (FK), patient_id (FK), payload (JSON), result (JSON), created_at; tracks assessment history per user/patient
  - **DatasetRegistryRecord**: name, source, modality, license, status, notes, schema_ok; tracks training datasets for governance
- Auth helpers: `backend/auth.py`

## 4) API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login with JWT token

### Patient Management
- `POST /api/register-patient` - Register a new patient with demographic data
  - Parameters: fullName, guardianName, dateOfBirth, age, gender, phone, address, occupation
  - Returns: patientUid (e.g., OG-XXXXX...), deduplicates by name + DOB
  - Requires: Authentication

### Assessment
- `POST /api/assess` - Tabular assessment inference
  - Uses hybrid engine: rule-based + ML model (if available)
  - Includes progress tracking (trend analysis vs previous assessments)
  - Requires: patientUid, Authentication
- `POST /api/assess-image` - Image-based assessment
  - Accepts image file upload
  - Requires: Image model availability
  - Returns: ImageAssessmentResultSchema
- `GET /api/history` - Get all assessments for authenticated user
- `GET /api/patient-history/{patient_uid}` - Get all assessments for a specific patient

### Dataset Registry
- `POST /api/datasets/register` - Register training/reference datasets
  - Parameters: name, source, modality, license, status, notes
  - Supported modalities: tabular, image, clinical-json, literature
  - Supported statuses: active, reference, restricted
  - Includes schema compatibility validation
  - Requires: Authentication

## 5) Assessment Workflow & Key Features

### Patient Registration & Tracking
1. Users register patients with demographic data (name, DOB, age, gender, etc.)
2. System auto-generates unique `patient_uid` (format: OG-XXXXX...)
3. De-duplication: Same patient registered twice (same name + DOB) returns existing patient_uid
4. Multi-user access: Multiple clinicians can assess same patient

### Assessment & Progress Tracking
1. Frontend collects assessment form data
2. Backend hybrid inference:
   - Rule-based inference runs on all submissions
   - ML model (if available) is queried for additional risk scoring
   - Confidence scores are merged: max(rule_confidence, model_confidence)
3. **Progress Tracking**: System compares current score with previous 3 assessments
   - **Deteriorating**: Score increased by ≥3 points
   - **Improving**: Score decreased by ≥3 points
   - **Stable**: No significant change
4. Results stored with full metadata (engine used, trend, delta)

### Dataset Governance
- Register training/reference datasets in registry
- Track: name, source, license, modality (tabular/image/clinical-json/literature)
- Status tracking: active, reference, restricted
- Schema validation: Ensures dataset notes include required fields for modality

## 6) Setup & Run

### Frontend
```bash
npm install
npm run dev
```

### Backend (from project root)

**Step 1: Activate Backend Environment**
```powershell
.\backend\.venv\Scripts\Activate.ps1
```

**Step 2: Install Dependencies**
```powershell
python -m pip install -r backend/requirements.txt
```

**Step 3: Run Backend Server**
```powershell
python -m uvicorn backend.app:app --reload --host 127.0.0.1 --port 8010
// usually poprt 8080 does the work well, but in my workstation its already occupied, if you want you can change the the port back to 8080//
```

> **Note**: Port `8010` is recommended because `8000` has Windows bind restrictions. Server runs at `http://127.0.0.1:8010`

## 7) Training Workflow (Portable)

### Option A: Config-driven one-command pipeline
1. Copy config template:
```powershell
copy backend\scripts\pipeline_config.example.json backend\scripts\pipeline_config.json
```
2. Edit `backend/scripts/pipeline_config.json`
3. Run:
```powershell
.\backend\.venv\Scripts\python.exe backend\scripts\run_pipeline.py --config backend\scripts\pipeline_config.json
```

### Option B: Archive dataset quick path
If you have `oral_cancer_prediction_dataset.csv`:
```powershell
.\backend\.venv\Scripts\python.exe backend\scripts\prepare_archive_dataset.py --source-csv "C:\path\to\oral_cancer_prediction_dataset.csv" --output-csv backend/data/oral_cancer_dataset.csv
.\backend\.venv\Scripts\python.exe -m backend.train
```

### Training outputs
- Model: `backend/model_store/oralguard_model.joblib`
- Metadata: `backend/model_store/oralguard_model_metadata.json`

## 8) Retraining Guidance

Do not retrain randomly. Retrain when:
- new validated data is added
- mapping/feature engineering changes
- performance drops on a held-out validation set

Keep each run reproducible with:
- dataset source/version
- mapping file version
- metrics (macro-F1/confusion matrix)
- model artifact + metadata JSON

## 9) Project Structure (Current)
## 9) Project Structure (Current)

```text
OralGuard/
├── src/                         # Frontend
├── backend/
│   ├── app.py
│   ├── auth.py
│   ├── database.py
│   ├── inference.py
│   ├── model.py
│   ├── image_model.py
│   ├── models.py
│   ├── schemas.py
│   ├── settings.py
│   ├── train.py
│   ├── requirements.txt
│   ├── routes/
│   │   ├── auth.py
│   │   └── assessments.py
│   ├── scripts/
│   │   ├── prepare_dataset.py
│   │   ├── prepare_archive_dataset.py
│   │   ├── run_pipeline.py
│   │   ├── column_mapping.example.json
│   │   └── pipeline_config.example.json
│   ├── data/
│   └── model_store/
└── PROJECT_PROMPT.md            # Legacy context source (content merged here)
```

## 10) Upgrade Outcomes & Current State

### Completed
- Backend API structure with FastAPI
- Auth and JWT token flow with user registration/login
- Patient management with demographics & de-duplication
- Assessment persistence with full history tracking
- **Progress tracking**: Trend analysis (deteriorating/improving/stable) based on previous 3 assessments
- Rule-based + ML model hybrid inference engine
- Model confidence merging (rule score + ML model output)
- User assessment history endpoint
- Patient-specific assessment history endpoint
- Dataset registry for data governance and modality tracking
- Dataset preparation scripts (generic + archive converters)
- Portable pipeline runner for model retraining
- Image endpoint scaffolding with file upload handling

### In Progress / Needs Improvement
- End-to-end clinical validation of model predictions
- Better class balance / model calibration
- Real clinically grounded labels and dataset governance
- Stronger image-model integration (TensorFlow/Keras support)
- Frontend UI integration for patient registration and dataset registry
- Clinician review workflow UI

## 11) Limitations

- Not clinically validated
- For educational/research demonstration use
- Must not replace professional diagnosis
- Some dataset conversions use proxy feature mappings

## 12) Future Enhancements

- TensorFlow/Keras image model support in backend
- Better multimodal fusion (tabular + image)
- Clinician review workflow UI
- Model monitoring and drift checks
- PostgreSQL migration for production-scale deployments
- Frontend UI for patient registration and dataset registry
- Role-based access control (clinician vs administrator)
- Audit logging for assessment changes

## 13) Disclaimer

This software is for educational/research purposes only and is not a medical device.  
Always consult qualified healthcare professionals for diagnosis and treatment decisions.

## 14) License

MIT License.