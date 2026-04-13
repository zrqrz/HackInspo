"""
HackInspo Pipeline Orchestrator

Runs the full data pipeline in order:
  Stage 1 — Hackathon Discovery   (Devpost API)
  Stage 2 — Winner Discovery      (Gallery scraping)
  Stage 3 — Detail Extraction     (Project page scraping)
  Stage 4 — Database Ingestion    (Upsert into PostgreSQL)

Usage:
    # Full run (all stages)
    python pipeline/run_pipeline.py

    # Start from a specific stage (re-uses earlier checkpoints)
    python pipeline/run_pipeline.py --from-stage 2
    python pipeline/run_pipeline.py --from-stage 4   # ingest only

    # Custom lookback window (default: 365 days)
    python pipeline/run_pipeline.py --lookback-days 90

    # Skip DB write (scrape + save JSONs only)
    python pipeline/run_pipeline.py --skip-db

Adding a new data source:
    1. Create pipeline/sources/<source_name>/stage1_*.py, stage2_*.py, stage3_*.py
       following the same run() / save() interface as the devpost modules.
    2. Register the source below in SOURCES.
    3. Stage 4 (ingest.py) is source-agnostic — it reads from data/*.json.
"""

import argparse
import sys
import time
from pathlib import Path

# Ensure project root (HackInspo/) is on sys.path so that
# `from pipeline.sources.devpost import ...` works whether this file is run as:
#   python pipeline/run_pipeline.py        (direct)
#   python -m pipeline.run_pipeline        (module)
_project_root = Path(__file__).parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

# ── Source registry ───────────────────────────────────────────────────────────
# To add a new source, import its stage modules and add an entry here.
# Each entry is a dict with keys: stage1, stage2, stage3 pointing to modules
# that expose run() and save() functions.

from pipeline.sources.devpost import (
    stage1_hackathon_discovery as devpost_s1,
    stage2_winner_discovery as devpost_s2,
    stage3_detail_extraction as devpost_s3,
)
from pipeline.db import ingest as stage4

SOURCES = [
    {
        "name": "devpost",
        "stage1": devpost_s1,
        "stage2": devpost_s2,
        "stage3": devpost_s3,
    },
    # Future:
    # {
    #     "name": "hackearth",
    #     "stage1": hackearth_s1,
    #     "stage2": hackearth_s2,
    #     "stage3": hackearth_s3,
    # },
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def banner(text: str) -> None:
    print(f"\n{'━' * 60}")
    print(f"  {text}")
    print(f"{'━' * 60}")


def elapsed(start: float) -> str:
    secs = int(time.time() - start)
    return f"{secs // 60}m {secs % 60}s"


# ── Pipeline ──────────────────────────────────────────────────────────────────

def run_pipeline(from_stage: int = 1, lookback_days: int = 365, skip_db: bool = False) -> None:
    total_start = time.time()

    for source in SOURCES:
        name = source["name"]
        s1, s2, s3 = source["stage1"], source["stage2"], source["stage3"]

        # ── Stage 1 ───────────────────────────────────────────────────────────
        if from_stage <= 1:
            banner(f"Stage 1 — {name}: Hackathon Discovery")
            t = time.time()
            hackathons = s1.run(lookback_days=lookback_days)
            s1.save(hackathons)
            print(f"  ⏱  {elapsed(t)}")
        else:
            banner(f"Stage 1 — {name}: SKIPPED (using existing checkpoint)")
            hackathons = None  # stage 2 will load from file

        # ── Stage 2 ───────────────────────────────────────────────────────────
        if from_stage <= 2:
            banner(f"Stage 2 — {name}: Winner Discovery")
            t = time.time()
            winners = s2.run(hackathons=hackathons)
            s2.save(winners)
            print(f"  ⏱  {elapsed(t)}")
        else:
            winners = None  # stage 3 will load from file

        # ── Stage 3 ───────────────────────────────────────────────────────────
        if from_stage <= 3:
            banner(f"Stage 3 — {name}: Detail Extraction")
            t = time.time()
            projects = s3.run(winners=winners)
            s3.save(projects)
            print(f"  ⏱  {elapsed(t)}")

    # ── Stage 4: DB Ingestion (source-agnostic) ───────────────────────────────
    if not skip_db and from_stage <= 4:
        banner("Stage 4 — Database Ingestion")
        t = time.time()
        stage4.run()
        print(f"  ⏱  {elapsed(t)}")
    elif skip_db:
        banner("Stage 4 — SKIPPED (--skip-db flag)")

    banner(f"Pipeline complete  ⏱  total {elapsed(total_start)}")


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="HackInspo data pipeline")
    parser.add_argument(
        "--from-stage", type=int, default=1, choices=[1, 2, 3, 4],
        help="Start from this stage (re-uses earlier checkpoints). Default: 1",
    )
    parser.add_argument(
        "--lookback-days", type=int, default=365,
        help="How many days back to look for ended hackathons. Default: 365",
    )
    parser.add_argument(
        "--skip-db", action="store_true",
        help="Run scraping stages only, skip DB ingestion",
    )
    args = parser.parse_args()

    run_pipeline(
        from_stage=args.from_stage,
        lookback_days=args.lookback_days,
        skip_db=args.skip_db,
    )


if __name__ == "__main__":
    main()
