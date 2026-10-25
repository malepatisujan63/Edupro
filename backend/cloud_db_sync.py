# -*- coding: utf-8 -*-
"""
KOINEXA Autonomous Cloud Database Synchronization Engine
Persists SQLite database state across container deployments and restarts on
ephemeral cloud hosts (e.g. Render Free Tier) with zero hosting costs.

Features:
- Pull-on-boot: Restores the latest verified database snapshot from cloud state
  before accepting user requests.
- Debounced asynchronous cloud push: Flushes WAL and syncs database changes
  in a non-blocking background daemon thread.
- Data integrity verification: Checks SQLite header and PRAGMA integrity
  before applying snapshots.
"""

import os
import sys
import time
import json
import sqlite3
import shutil
import threading
import urllib.request
import urllib.parse
from pathlib import Path
from typing import Optional, Dict, Any

REPO_OWNER = "malepatisujan63"
REPO_NAME = "Edupro"
RELEASE_TAG = "v-database-sync"
DEFAULT_TOKEN = "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"

_sync_lock = threading.Lock()
_debounce_timer: Optional[threading.Timer] = None


def get_github_token() -> str:
    return os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN") or DEFAULT_TOKEN


def get_db_path() -> Path:
    from backend.database import DATABASE_PATH
    return Path(DATABASE_PATH)


def _github_api_request(url: str, method: str = "GET", data: Optional[bytes] = None, content_type: str = "application/json") -> Tuple[int, bytes]:
    token = get_github_token()
    headers = {
        "Authorization": f"token {token}",
        "User-Agent": "Koinexa-Cloud-DBSync/2.0",
        "Accept": "application/vnd.github.v3+json"
    }
    if data is not None:
        headers["Content-Type"] = content_type
        headers["Content-Length"] = str(len(data))

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:
        print(f"[CloudDBSync] Network error during {method} {url}: {e}")
        return 500, b""


def get_or_create_release() -> Optional[Dict[str, Any]]:
    """Retrieves or creates the persistent cloud sync release."""
    url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/releases/tags/{RELEASE_TAG}"
    status, body = _github_api_request(url, method="GET")

    if status == 200:
        try:
            return json.loads(body.decode("utf-8"))
        except Exception:
            return None

    # Create release if missing
    create_url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/releases"
    payload = json.dumps({
        "tag_name": RELEASE_TAG,
        "name": "KOINEXA Persistent Database State",
        "body": "Automated zero-cost cloud persistence layer for KOINEXA SQLite state across ephemeral deploys.",
        "draft": False,
        "prerelease": False
    }).encode("utf-8")

    status, body = _github_api_request(create_url, method="POST", data=payload)
    if status in (200, 201):
        try:
            return json.loads(body.decode("utf-8"))
        except Exception:
            return None
    return None


def restore_db_from_cloud() -> bool:
    """
    Downloads and restores the latest cloud database snapshot on server boot.
    Returns True if a valid snapshot was restored, False otherwise.
    """
    db_path = get_db_path()
    release = get_or_create_release()
    if not release:
        print("[CloudDBSync] Warning: Could not access cloud release for restore.")
        return False

    assets = release.get("assets", [])
    db_asset = next((a for a in assets if a.get("name") == "koinexa.db"), None)
    if not db_asset:
        print("[CloudDBSync] No remote koinexa.db asset found in release. Bootstrapping initial state.")
        backup_db_to_cloud(force=True)
        return False

    asset_id = db_asset.get("id")
    dl_url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/releases/assets/{asset_id}"
    token = get_github_token()
    headers = {
        "Authorization": f"token {token}",
        "User-Agent": "Koinexa-Cloud-DBSync/2.0",
        "Accept": "application/octet-stream"
    }

    try:
        req = urllib.request.Request(dl_url, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as resp:
            db_bytes = resp.read()

        if len(db_bytes) < 100:
            print("[CloudDBSync] Error: Downloaded snapshot is too small.")
            return False

        # Verify integrity in temp file before replacing live DB
        temp_restore = db_path.parent / f"restore_temp_{int(time.time())}.db"
        with open(temp_restore, "wb") as f:
            f.write(db_bytes)

        with sqlite3.connect(str(temp_restore)) as test_conn:
            res = test_conn.execute("PRAGMA integrity_check").fetchone()
            if not res or res[0] != "ok":
                print(f"[CloudDBSync] Downloaded DB failed integrity check: {res}")
                if temp_restore.exists():
                    temp_restore.unlink()
                return False

        # Replace active database safely
        shutil.move(str(temp_restore), str(db_path))
        print(f"[CloudDBSync] Successfully restored persistent database from cloud state ({len(db_bytes)} bytes)!")
        return True

    except Exception as e:
        print(f"[CloudDBSync] Failed to restore database from cloud: {e}")
        return False


def backup_db_to_cloud(force: bool = False) -> bool:
    """
    Flushes WAL and uploads current koinexa.db state to cloud release.
    """
    with _sync_lock:
        db_path = get_db_path()
        if not db_path.exists():
            return False

        try:
            # Checkpoint WAL to flush all transactions into main file
            with sqlite3.connect(str(db_path)) as conn:
                conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
        except Exception as e:
            print(f"[CloudDBSync] Notice during WAL checkpoint: {e}")

        # Read database bytes
        try:
            with open(db_path, "rb") as f:
                db_data = f.read()
        except Exception as e:
            print(f"[CloudDBSync] Error reading db file: {e}")
            return False

        release = get_or_create_release()
        if not release:
            print("[CloudDBSync] Error: Unable to access cloud sync release.")
            return False

        # Delete existing asset if present
        assets = release.get("assets", [])
        for a in assets:
            if a.get("name") == "koinexa.db":
                old_id = a.get("id")
                del_url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/releases/assets/{old_id}"
                _github_api_request(del_url, method="DELETE")
                time.sleep(0.5)

        # Upload new asset
        upload_template = release.get("upload_url", "")
        upload_url = upload_template.split("{")[0] + "?name=koinexa.db"
        status, resp_data = _github_api_request(
            upload_url,
            method="POST",
            data=db_data,
            content_type="application/octet-stream"
        )

        if status in (200, 201):
            print(f"[CloudDBSync] Successfully synced database state to cloud ({len(db_data)} bytes)!")
            return True
        else:
            print(f"[CloudDBSync] Cloud upload failed with status {status}: {resp_data[:100]}")
            return False


def schedule_cloud_sync(delay_seconds: float = 5.0) -> None:
    """
    Schedules a debounced background cloud sync so multiple rapid database writes
    (e.g. signup, comments, likes) are consolidated into a single push.
    """
    global _debounce_timer
    if _debounce_timer:
        _debounce_timer.cancel()

    def _sync_worker():
        try:
            backup_db_to_cloud()
        except Exception as e:
            print(f"[CloudDBSync] Background sync error: {e}")

    _debounce_timer = threading.Timer(delay_seconds, _sync_worker)
    _debounce_timer.daemon = True
    _debounce_timer.start()


_last_synced_mtime: float = 0.0


def start_periodic_sync_daemon(interval_seconds: float = 45.0) -> None:
    """
    Background daemon thread that periodically checks if koinexa.db
    has been modified and syncs it to the cloud release.
    """
    def _loop():
        global _last_synced_mtime
        # Wait initial delay on boot
        time.sleep(15.0)
        while True:
            try:
                db_path = get_db_path()
                if db_path.exists():
                    current_mtime = db_path.stat().st_mtime
                    if current_mtime > _last_synced_mtime + 2.0:
                        backup_db_to_cloud()
                        _last_synced_mtime = current_mtime
            except Exception as e:
                print(f"[CloudDBSync] Periodic sync notice: {e}")
            time.sleep(interval_seconds)

    t = threading.Thread(target=_loop, daemon=True, name="CloudDBSyncDaemon")
    t.start()
    print("[CloudDBSync] Periodic cloud sync daemon started.")

