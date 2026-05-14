#!/usr/bin/env python3
import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

REPO_ROOT = Path("/workspace/FloralWhisperTime")
PAYLOAD_PATH = REPO_ROOT / "tmp/catalog/catalog-payload.json"
API_BASE = os.getenv("CATALOG_API_BASE", "http://127.0.0.1:3001")
USERNAME = os.getenv("ADMIN_USERNAME", "admin")
PASSWORD = os.getenv("ADMIN_PASSWORD", "Floral@2026")
WRITE_DELAY_SECONDS = float(os.getenv("CATALOG_WRITE_DELAY_SECONDS", "2.2"))


def request(path: str, method: str = "GET", payload=None, token: str | None = None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    headers = {}
    if payload is not None:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{API_BASE}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read()
            if not raw:
                return None
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        try:
            error = json.loads(body)
            message = error.get("message", body)
        except Exception:
            message = body or str(exc)
        raise RuntimeError(message) from exc


def main() -> None:
    payload = json.loads(PAYLOAD_PATH.read_text())
    auth = request("/api/admin/login", "POST", {"username": USERNAME, "password": PASSWORD})
    token = auth["token"]
    existing = request("/api/flowers?limit=200")
    existing_ids = {item["id"] for item in existing["list"]}

    created = 0
    updated = 0
    failed = 0

    for item in payload:
        try:
            if item["id"] in existing_ids:
                request(f'/api/flowers/{item["id"]}', "PUT", item, token)
                updated += 1
            else:
                request("/api/flowers", "POST", item, token)
                created += 1
            print(f"synced {item['id']}")
        except Exception as exc:
            failed += 1
            print(f"failed {item['id']}: {exc}")
        time.sleep(WRITE_DELAY_SECONDS)

    print(json.dumps({"total": len(payload), "created": created, "updated": updated, "failed": failed}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
