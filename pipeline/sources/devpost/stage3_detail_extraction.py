"""
Stage 3: Detail Extraction
For each winner project from Stage 2, scrape the full project page:
title, description, tech stack, team members, links, etc.

Input:  pipeline/data/winners.json
Output: pipeline/data/projects.json
"""

import json
import time
from datetime import datetime
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# ── Config ──────────────────────────────────────────────────────────────────

DATA_DIR = Path(__file__).parent.parent.parent / "data"
INPUT_FILE = DATA_DIR / "winners.json"
OUTPUT_FILE = DATA_DIR / "projects.json"

DELAY = 2.0

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
}


# ── Scraping ─────────────────────────────────────────────────────────────────

def scrape_project_detail(url: str) -> dict | None:
    """Scrape a single project detail page. Returns None on failure."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"    [ERROR] {e}")
        return None

    soup = BeautifulSoup(resp.text, "html.parser")

    # Title
    title_el = soup.select_one("#app-title")
    title = title_el.get_text(strip=True) if title_el else ""

    # Tagline
    tagline_el = soup.select_one(".app-tagline, p.large")
    tagline = tagline_el.get_text(strip=True) if tagline_el else ""

    # Description — second div inside #app-details-left
    full_desc = ""
    desc_divs = soup.select("#app-details-left > div")
    if len(desc_divs) >= 2:
        full_desc = desc_divs[1].get_text(separator="\n", strip=True)

    # Built with (tech stack)
    built_with_els = soup.select(".built-with a, #built-with span.cp-tag, a.cp-tag")
    built_with = [b.get_text(strip=True) for b in built_with_els]

    # Links
    link_els = soup.select("#app-links a, .app-links a, nav.app-links a")
    demo_url = None
    repo_url = None
    other_links: list[str] = []

    for a in link_els:
        href = a.get("href", "")
        if not href or href == "#":
            continue
        if "github.com" in href or "gitlab.com" in href:
            repo_url = repo_url or href  # keep first
        elif demo_url is None and href.startswith("http"):
            demo_url = href
        else:
            other_links.append(href)

    # Team members
    member_els = soup.select("#app-team .member, .software-team-member")
    team_members = [m.get_text(strip=True) for m in member_els if m.get_text(strip=True)]

    if not team_members:
        member_links = soup.select(".members a.member-link, .software-team a")
        team_members = [m.get_text(strip=True) for m in member_links if m.get_text(strip=True)]

    return {
        "title": title,
        "tagline": tagline,
        "full_desc": full_desc,
        "built_with": built_with,
        "demo_url": demo_url,
        "repo_url": repo_url,
        "other_links": other_links,
        "team_members": team_members,
    }


# ── Main ─────────────────────────────────────────────────────────────────────

def run(winners: list[dict] | None = None) -> list[dict]:
    """
    Scrape full detail for each winner project.
    Returns list of merged dicts (winner context + detail fields).
    """
    if winners is None:
        with open(INPUT_FILE, encoding="utf-8") as f:
            winners = json.load(f)["winners"]

    print(f"\nStage 3 — Detail Extraction")
    print(f"Processing {len(winners)} winner projects")
    print("=" * 60)

    projects: list[dict] = []
    errors = 0

    for i, winner in enumerate(winners, 1):
        title = winner.get("title", "Unknown")
        url = winner.get("project_url", "")

        print(f"\n[{i}/{len(winners)}] {title}")

        if not url:
            print("  No URL, skipping.")
            errors += 1
            continue

        print(f"  URL: {url}")
        detail = scrape_project_detail(url)

        if detail is None:
            errors += 1
            continue

        project = {
            **winner,   # hackathon context from Stage 2
            **detail,   # detail fields (title from page overrides gallery title)
            "project_url": url,
        }
        projects.append(project)

        print(f"  Stack: {', '.join(detail['built_with'][:5]) or 'N/A'}")
        print(f"  Team:  {', '.join(detail['team_members'][:3]) or 'N/A'}")
        print(f"  Repo:  {detail['repo_url'] or 'N/A'}")

        time.sleep(DELAY)

    print(f"\n{'=' * 60}")
    print(f"Scraped: {len(projects)}/{len(winners)}  |  Errors: {errors}")
    return projects


def save(projects: list[dict]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    output = {
        "scraped_at": datetime.now().isoformat(),
        "total_projects": len(projects),
        "projects": projects,
    }
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"Saved → {OUTPUT_FILE}")


if __name__ == "__main__":
    projects = run()
    save(projects)
