"""
Stage 1: Hackathon Discovery
Scrape Devpost API for all hackathons that ended in the past N days
and have announced winners.

API endpoint: GET https://devpost.com/hackathons?status[]=ended&page=N
Returns JSON with 9 hackathons per page.

Output: pipeline/data/hackathons.json
"""

import json
import os
import re
import time
from datetime import datetime, timedelta
from pathlib import Path

import requests

# ── Config ──────────────────────────────────────────────────────────────────

DATA_DIR = Path(__file__).parent.parent.parent / "data"
OUTPUT_FILE = DATA_DIR / "hackathons.json"

API_URL = "https://devpost.com/hackathons"
PER_PAGE = 9
DELAY = 1.5  # seconds between requests

HEADERS = {
    "User-Agent": "HackInspo Research Bot/1.0 (educational project)",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.5",
}


# ── Helpers ──────────────────────────────────────────────────────────────────

def parse_submission_dates(date_str: str) -> tuple[datetime | None, datetime | None]:
    """
    Parse Devpost date strings like:
      - "Mar 31 - Apr 07, 2026"
      - "Dec 17, 2025 - Feb 09, 2026"
    Returns (start_date, end_date).
    """
    if not date_str:
        return None, None

    date_str = date_str.strip()

    try:
        # Case 1: "Dec 17, 2025 - Feb 09, 2026" (both have year)
        if date_str.count(",") == 2:
            parts = date_str.split(" - ")
            start = datetime.strptime(parts[0].strip(), "%b %d, %Y")
            end = datetime.strptime(parts[1].strip(), "%b %d, %Y")
            return start, end

        # Case 2: "Mar 31 - Apr 07, 2026" (only end has year)
        if " - " in date_str:
            parts = date_str.split(" - ")
            end = datetime.strptime(parts[1].strip(), "%b %d, %Y")
            start = datetime.strptime(f"{parts[0].strip()}, {end.year}", "%b %d, %Y")
            if start.month > end.month:
                start = start.replace(year=end.year - 1)
            return start, end

    except (ValueError, IndexError):
        pass

    return None, None


def parse_prize_amount(prize_html: str) -> int | None:
    """Parse prize amount from HTML string like "$<span>5,000</span>"."""
    if not prize_html:
        return None
    match = re.search(r"[\d,]+", prize_html)
    return int(match.group().replace(",", "")) if match else None


def fetch_page(page: int) -> dict | None:
    """Fetch a single page of ended hackathons from Devpost API."""
    params = {"page": page, "status[]": "ended"}
    try:
        resp = requests.get(API_URL, params=params, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.RequestException as e:
        print(f"  [ERROR] Request failed: {e}")
        return None
    except json.JSONDecodeError:
        print(f"  [ERROR] Response is not JSON (status={resp.status_code})")
        print(f"  [DEBUG] First 300 chars: {resp.text[:300]!r}")
        return None


def process_hackathon(raw: dict) -> dict:
    """Transform raw API hackathon object into our clean format."""
    start_date, end_date = parse_submission_dates(raw.get("submission_period_dates", ""))
    return {
        "devpost_id": raw.get("id"),
        "title": raw.get("title", "").strip(),
        "devpost_url": raw.get("url", "").rstrip("/"),
        "gallery_url": raw.get("submission_gallery_url", ""),
        "location": raw.get("displayed_location", {}).get("location", ""),
        "submission_start": start_date.isoformat() if start_date else None,
        "submission_end": end_date.isoformat() if end_date else None,
        "registrations_count": raw.get("registrations_count"),
        "organization": raw.get("organization_name", ""),
        "themes": [t["name"] for t in raw.get("themes", [])],
        "prize_amount": parse_prize_amount(raw.get("prize_amount", "")),
        "prize_cash_count": raw.get("prizes_counts", {}).get("cash", 0),
        "prize_other_count": raw.get("prizes_counts", {}).get("other", 0),
        "winners_announced": raw.get("winners_announced", False),
        "invite_only": raw.get("invite_only", False),
    }


def is_within_cutoff(hackathon: dict, cutoff: datetime) -> bool:
    """Check if hackathon ended within our cutoff window."""
    end_str = hackathon.get("submission_end")
    if not end_str:
        return True  # keep if we can't determine date
    try:
        return datetime.fromisoformat(end_str) >= cutoff
    except ValueError:
        return True


# ── Main ─────────────────────────────────────────────────────────────────────

def run(lookback_days: int = 365) -> list[dict]:
    """
    Paginate through ended hackathons, stopping when we pass the cutoff.
    Returns list of normalized hackathon dicts.
    """
    cutoff = datetime.now() - timedelta(days=lookback_days)
    all_hackathons: list[dict] = []
    page = 1
    total_pages = None
    past_cutoff = False

    print(f"Stage 1 — Hackathon Discovery")
    print(f"Cutoff: {cutoff.strftime('%Y-%m-%d')}  (lookback {lookback_days} days)")
    print("=" * 60)

    while not past_cutoff:
        label = f"  Page {page:>3}" + (f"/{total_pages}" if total_pages else "")
        print(f"{label} ...", end=" ", flush=True)

        data = fetch_page(page)
        if not data or "hackathons" not in data:
            print("no data, stopping.")
            break

        raw_list = data["hackathons"]
        meta = data.get("meta", {})
        if not total_pages and meta.get("total_count"):
            total_pages = (meta["total_count"] + PER_PAGE - 1) // PER_PAGE

        print(f"{len(raw_list)} results (total so far: {len(all_hackathons)})")

        if not raw_list:
            break

        for raw in raw_list:
            h = process_hackathon(raw)
            if not is_within_cutoff(h, cutoff):
                past_cutoff = True
                print(f"  Reached cutoff at: {h['title']} ({h['submission_end']})")
                break
            all_hackathons.append(h)

        page += 1
        time.sleep(DELAY)

    with_winners = [h for h in all_hackathons if h["winners_announced"]]
    print(f"\n{'=' * 60}")
    print(f"Total: {len(all_hackathons)}  |  Winners announced: {len(with_winners)}")

    return all_hackathons


def save(hackathons: list[dict]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    output = {
        "scraped_at": datetime.now().isoformat(),
        "total_count": len(hackathons),
        "with_winners_count": sum(1 for h in hackathons if h["winners_announced"]),
        "hackathons": hackathons,
    }
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"Saved → {OUTPUT_FILE}")


if __name__ == "__main__":
    hackathons = run()
    save(hackathons)
