#!/usr/bin/env python3
import json
from pathlib import Path

REPO_ROOT = Path("/workspace/FloralWhisperTime")
DATASET_PATH = REPO_ROOT / "tmp/catalog/catalog-dataset.json"
MANIFEST_PATH = REPO_ROOT / "tmp/catalog/catalog-images-manifest.json"
CATALOG_DIR = REPO_ROOT / "flower-shop-web/public/catalog"
WEB_BASE = "http://127.0.0.1:8081"


def main() -> None:
    data = json.loads(DATASET_PATH.read_text())
    manifest = {}
    for item in data:
        category_dir = CATALOG_DIR / item["categoryId"]
        manifest[item["id"]] = []
        for variant_index in range(len(item["images"])):
            filename = f'{item["id"].replace("_", "-")}-{chr(97 + variant_index)}.svg'
            file_path = category_dir / filename
            if not file_path.exists():
                raise FileNotFoundError(f"Missing local catalog asset: {file_path}")
            manifest[item["id"]].append(f"{WEB_BASE}/catalog/{item['categoryId']}/{filename}")
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum(len(paths) for paths in manifest.values())
    print(f"Generated {total} local image urls across {len(manifest)} works")


if __name__ == "__main__":
    main()
