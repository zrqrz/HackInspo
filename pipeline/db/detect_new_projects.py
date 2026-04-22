"""
Detect whether Stage 2 produced new projects not yet in DB.

Reads pipeline/data/winners.json and checks each project_url against Project.devpostUrl.
Writes GitHub Actions step outputs:
  - has_new_projects: "true" / "false"
  - new_projects_count: "<int>"
  - winners_count: "<int>"
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from pipeline.db.client import get_connection

DATA_DIR = Path(__file__).parent.parent / "data"
WINNERS_FILE = DATA_DIR / "winners.json"


def _chunked(items: list[str], size: int) -> list[list[str]]:
    return [items[i : i + size] for i in range(0, len(items), size)]


def _write_github_output(name: str, value: str) -> None:
    output_path = os.environ.get("GITHUB_OUTPUT")
    if not output_path:
        return
    with open(output_path, "a", encoding="utf-8") as f:
        f.write(f"{name}={value}\n")


def main() -> None:
    if not WINNERS_FILE.exists():
        sys.exit(f"[ERROR] Missing {WINNERS_FILE}. Run Stage 2 first.")

    with open(WINNERS_FILE, encoding="utf-8") as f:
        payload = json.load(f)

    winners = payload.get("winners", [])
    urls = []
    seen = set()
    for row in winners:
        url = str(row.get("project_url", "")).strip()
        if not url or url in seen:
            continue
        seen.add(url)
        urls.append(url)

    winners_count = len(urls)
    if winners_count == 0:
        print("No winner project URLs found.")
        _write_github_output("has_new_projects", "false")
        _write_github_output("new_projects_count", "0")
        _write_github_output("winners_count", "0")
        return

    existing_urls: set[str] = set()

    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                for chunk in _chunked(urls, 1000):
                    cur.execute(
                        """
                        SELECT "devpostUrl"
                        FROM "Project"
                        WHERE "devpostUrl" IN %s
                        """,
                        (tuple(chunk),),
                    )
                    for row in cur.fetchall():
                        existing_urls.add(str(row["devpostUrl"]))
    finally:
        conn.close()

    new_count = winners_count - len(existing_urls)
    has_new = new_count > 0

    print(f"Winners checked: {winners_count}")
    print(f"Existing projects: {len(existing_urls)}")
    print(f"New projects: {new_count}")

    _write_github_output("has_new_projects", "true" if has_new else "false")
    _write_github_output("new_projects_count", str(new_count))
    _write_github_output("winners_count", str(winners_count))


if __name__ == "__main__":
    main()
