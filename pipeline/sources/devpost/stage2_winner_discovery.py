"""
Stage 2: Winner Discovery
For each hackathon from Stage 1, scrape the project gallery HTML
and extract projects with the winner badge.

Gallery is server-rendered HTML. Winner projects have <img class="winner">
inside their .gallery-item container.

Input:  pipeline/data/hackathons.json
Output: pipeline/data/winners.json
"""

import json
import time
from datetime import datetime
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# ── Config ──────────────────────────────────────────────────────────────────

DATA_DIR = Path(__file__).parent.parent.parent / "data"
INPUT_FILE = DATA_DIR / "hackathons.json"
OUTPUT_FILE = DATA_DIR / "winners.json"

DELAY = 2.0

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
}


# ── Scraping ─────────────────────────────────────────────────────────────────

def scrape_gallery_page(url: str) -> tuple[list[dict], str | None]:
    """Scrape a single gallery page. Returns (winners, next_page_url)."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"    [ERROR] {e}")
        return [], None

    soup = BeautifulSoup(resp.text, "html.parser")
    winners = []

    for card in soup.select(".gallery-item:has(img.winner)"):
        try:
            link = card.select_one("a.block-wrapper-link")
            title_el = card.select_one("h5")
            tagline_el = card.select_one("p.small.tagline")
            software_id = card.get("data-software-id")

            project_url = link["href"] if link else None
            if project_url and not project_url.startswith("http"):
                project_url = "https://devpost.com" + project_url

            winners.append({
                "devpost_software_id": software_id,
                "title": title_el.get_text(strip=True) if title_el else "",
                "tagline": tagline_el.get_text(strip=True) if tagline_el else "",
                "project_url": project_url,
            })
        except Exception as e:
            print(f"    [WARN] Failed to parse card: {e}")

    # Pagination
    next_el = soup.select_one("a.next_page, li.next a, a[rel='next']")
    next_url = None
    if next_el and next_el.get("href"):
        href = next_el["href"]
        if href.startswith("http"):
            next_url = href
        elif href.startswith("?"):
            next_url = url.split("?")[0] + href
        else:
            next_url = "https://devpost.com" + href

    return winners, next_url


def scrape_hackathon_winners(hackathon: dict) -> list[dict]:
    """Scrape all winner projects from a hackathon's gallery (handles pagination)."""
    gallery_url = hackathon.get("gallery_url", "")
    if not gallery_url:
        return []

    all_winners: list[dict] = []
    current_url: str | None = gallery_url
    page = 1

    while current_url:
        if page > 1:
            print(f"    Page {page} ...", end=" ", flush=True)

        winners, next_url = scrape_gallery_page(current_url)
        all_winners.extend(winners)

        if page > 1:
            print(f"{len(winners)} winners")

        next_url = next_url if next_url != current_url else None
        current_url = next_url
        if current_url:
            page += 1
            time.sleep(DELAY)

    # Attach hackathon context
    for w in all_winners:
        w["hackathon_title"] = hackathon.get("title", "")
        w["hackathon_url"] = hackathon.get("devpost_url", "")
        w["hackathon_devpost_id"] = hackathon.get("devpost_id")

    return all_winners


# ── Main ─────────────────────────────────────────────────────────────────────

def run(hackathons: list[dict] | None = None) -> list[dict]:
    """
    For each hackathon with winners announced, scrape the gallery.
    Returns list of winner project dicts (with hackathon context attached).
    """
    if hackathons is None:
        with open(INPUT_FILE, encoding="utf-8") as f:
            hackathons = json.load(f)["hackathons"]

    # Only scrape hackathons that have announced winners
    targets = [h for h in hackathons if h.get("winners_announced")]

    print(f"\nStage 2 — Winner Discovery")
    print(f"Processing {len(targets)} hackathons (of {len(hackathons)} total)")
    print("=" * 60)

    all_winners: list[dict] = []

    for i, hackathon in enumerate(targets, 1):
        title = hackathon.get("title", "Unknown")
        gallery_url = hackathon.get("gallery_url", "")

        print(f"\n[{i}/{len(targets)}] {title}")

        if not gallery_url:
            print("  No gallery URL, skipping.")
            continue

        print(f"  Gallery: {gallery_url}")
        winners = scrape_hackathon_winners(hackathon)
        all_winners.extend(winners)
        print(f"  Found {len(winners)} winner(s)")
        for w in winners:
            print(f"    - {w['title']}")

        time.sleep(DELAY)

    print(f"\n{'=' * 60}")
    print(f"Total winners: {len(all_winners)}")
    return all_winners


def save(winners: list[dict]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    output = {
        "scraped_at": datetime.now().isoformat(),
        "total_winners": len(winners),
        "winners": winners,
    }
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"Saved → {OUTPUT_FILE}")


if __name__ == "__main__":
    winners = run()
    save(winners)
