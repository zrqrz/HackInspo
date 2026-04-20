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
from urllib.parse import urljoin

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

VIDEO_IFRAME_SELECTORS = [
    "#gallery iframe.video-embed",
    "#gallery iframe[src*='youtube']",
    "#gallery iframe[src*='vimeo']",
]

THUMBNAIL_META_SELECTORS = [
    "meta[property='og:image']",
    "meta[name='twitter:image']",
    "meta[itemprop='image']",
    "meta[itemprop='screenshot']",
]


def normalize_url(raw: str | None, base_url: str) -> str | None:
    """Normalize a URL value to absolute https URL when possible."""
    if not raw:
        return None
    url = raw.strip()
    if not url:
        return None
    if url.startswith("//"):
        return f"https:{url}"
    if url.startswith("http://") or url.startswith("https://"):
        return url
    if url.startswith("/"):
        return urljoin(base_url, url)
    return None


def dedupe_non_empty(items: list[str]) -> list[str]:
    """Keep first occurrence order, dropping empty values."""
    seen: set[str] = set()
    out: list[str] = []
    for item in items:
        value = item.strip()
        if not value or value in seen:
            continue
        seen.add(value)
        out.append(value)
    return out


def normalize_award_tier(label: str) -> str:
    """
    Normalize free-form award label to internal tier.
    Mirrors Prisma AwardTier enum values.
    """
    text = label.lower().strip()
    if not text:
        return "OTHER"
    if any(k in text for k in ("winner", "grand prize", "1st place", "first place", "champion")):
        return "WINNER"
    if any(k in text for k in ("runner-up", "runner up", "2nd place", "second place")):
        return "RUNNER_UP"
    if any(k in text for k in ("honorable mention", "honourable mention", "finalist", "top ")):
        return "HONORABLE_MENTION"
    return "OTHER"


def extract_thumbnail_url(soup: BeautifulSoup, screenshot_urls: list[str], base_url: str) -> str | None:
    """Extract thumbnail URL with fallback strategy."""
    for selector in THUMBNAIL_META_SELECTORS:
        node = soup.select_one(selector)
        thumb = normalize_url(node.get("content") if node else None, base_url)
        if thumb:
            return thumb
    return screenshot_urls[0] if screenshot_urls else None


def extract_video_url(soup: BeautifulSoup, base_url: str) -> str | None:
    """Extract primary demo video URL from gallery iframe."""
    for selector in VIDEO_IFRAME_SELECTORS:
        iframe = soup.select_one(selector)
        video_url = normalize_url(iframe.get("src") if iframe else None, base_url)
        if video_url:
            return video_url
    return None


def extract_screenshots(soup: BeautifulSoup, base_url: str) -> tuple[list[str], list[str]]:
    """
    Extract screenshot URLs and captions from gallery.
    Captions are index-aligned with urls.
    """
    urls: list[str] = []
    captions: list[str] = []
    for li in soup.select("#gallery li"):
        anchor = li.select_one("a[data-lightbox]")
        image = li.select_one("img.software_photo_image")

        raw_url = anchor.get("href") if anchor else None
        if not raw_url and image:
            raw_url = image.get("src")

        image_url = normalize_url(raw_url, base_url)
        if not image_url:
            continue

        # Caption sits under each gallery image block, often wrapped in <p><i>...</i></p>.
        cap_node = li.select_one("p i, p")
        caption = cap_node.get_text(strip=True) if cap_node else ""

        urls.append(image_url)
        captions.append(caption)

    # Fallback if gallery structure differs
    if not urls:
        fallback_imgs = soup.select("#gallery img.software_photo_image")
        for img in fallback_imgs:
            image_url = normalize_url(img.get("src"), base_url)
            if image_url:
                urls.append(image_url)
                captions.append("")

    # De-duplicate while keeping aligned captions
    dedup_urls: list[str] = []
    dedup_captions: list[str] = []
    seen: set[str] = set()
    for i, url in enumerate(urls):
        if not url or url in seen:
            continue
        seen.add(url)
        dedup_urls.append(url)
        dedup_captions.append(captions[i] if i < len(captions) else "")

    return dedup_urls, dedup_captions


def extract_awards(soup: BeautifulSoup) -> tuple[list[str], list[str]]:
    """
    Extract raw award labels and normalized tiers from submissions sidebar.
    """
    raw_labels = dedupe_non_empty(
        [li.get_text(" ", strip=True) for li in soup.select("#submissions .software-list-content ul li")]
    )
    normalized = [normalize_award_tier(label) for label in raw_labels]
    return raw_labels, normalized

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

    # Media (thumbnail/video/screenshots)
    screenshot_urls, screenshot_captions = extract_screenshots(soup, url)
    video_url = extract_video_url(soup, url)
    thumbnail_url = extract_thumbnail_url(soup, screenshot_urls, url)

    # Links
    link_els = soup.select("#app-links a, .app-links a, nav.app-links a")
    demo_url = None
    repo_url = None
    other_links: list[str] = []

    for a in link_els:
        href = normalize_url(a.get("href", ""), url) or ""
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

    award_labels_raw, award_tiers_normalized = extract_awards(soup)

    return {
        "title": title,
        "tagline": tagline,
        "full_desc": full_desc,
        "built_with": built_with,
        "thumbnail_url": thumbnail_url,
        "video_url": video_url,
        "screenshot_urls": screenshot_urls,
        "screenshot_captions": screenshot_captions,
        "demo_url": demo_url,
        "repo_url": repo_url,
        "other_links": other_links,
        "team_members": team_members,
        "award_labels_raw": award_labels_raw,
        "award_tiers_normalized": award_tiers_normalized,
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
