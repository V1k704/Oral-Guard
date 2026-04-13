from io import BytesIO
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from PIL import Image

from .settings import settings

_image_model = None
_default_labels = ["normal", "pre_cancer", "oral_cancer"]


def get_image_model_path() -> Path:
    return Path(settings.image_model_path)


def load_image_model() -> Any | None:
    global _image_model
    path = get_image_model_path()
    if path.exists():
        _image_model = joblib.load(path)
    return _image_model


def is_image_model_available() -> bool:
    return get_image_model_path().exists()


def _prepare_image_features(image_bytes: bytes) -> np.ndarray:
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    size = int(settings.image_model_input_size)
    image = image.resize((size, size))
    arr = np.asarray(image, dtype=np.float32) / 255.0
    flat = arr.reshape(1, -1)
    return flat


def _model_labels(model: Any) -> list[str]:
    classes = getattr(model, "classes_", None)
    if classes is None:
        return _default_labels
    labels = [str(c) for c in classes]
    return labels if labels else _default_labels


def predict_image_assessment(image_bytes: bytes) -> dict:
    model = _image_model or load_image_model()
    if not model:
        raise RuntimeError("Image model not available")

    x = _prepare_image_features(image_bytes)
    labels = _model_labels(model)

    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(x)[0]
        probs = np.asarray(probs, dtype=np.float32)
        probs = probs / (probs.sum() if probs.sum() > 0 else 1.0)
        top_index = int(np.argmax(probs))
        confidence = int(float(probs[top_index]) * 100)
        predictions = {labels[i]: float(probs[i]) for i in range(min(len(labels), len(probs)))}
        label = labels[top_index] if top_index < len(labels) else "unknown"
    else:
        pred = model.predict(x)[0]
        label = str(pred)
        confidence = 50
        predictions = {label: 1.0}

    risk_map = {
        "normal": "low",
        "pre_cancer": "moderate",
        "precancer": "moderate",
        "oral_cancer": "high",
        "cancer": "high",
    }

    return {
        "label": label,
        "confidence": max(0, min(confidence, 100)),
        "riskLevel": risk_map.get(label.lower(), "moderate"),
        "predictions": predictions,
        "metadata": {"engine": "image_ml_model", "model_path": str(get_image_model_path())},
    }
