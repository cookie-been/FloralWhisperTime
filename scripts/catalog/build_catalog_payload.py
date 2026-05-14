#!/usr/bin/env python3
import json
from pathlib import Path

REPO_ROOT = Path("/workspace/FloralWhisperTime")
DATASET_PATH = REPO_ROOT / "tmp/catalog/catalog-dataset.json"
MANIFEST_PATH = REPO_ROOT / "tmp/catalog/catalog-images-manifest.json"
OUTPUT_PATH = REPO_ROOT / "tmp/catalog/catalog-payload.json"

dataset = json.loads(DATASET_PATH.read_text())
manifest = json.loads(MANIFEST_PATH.read_text())

payload = []
for item in dataset:
    record = dict(item)
    record["images"] = manifest.get(item["id"], [])
    payload.append(record)

OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Wrote {len(payload)} payload records to {OUTPUT_PATH}")
