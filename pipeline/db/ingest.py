"""
Stage 4: Database Ingestion
Joins Stage 1 (hackathons.json) and Stage 3 (projects.json) checkpoints,
then upserts everything into PostgreSQL following the Prisma schema.

All operations are idempotent — safe to re-run after partial failures.

Tables written:  Hackathon → Project → Tag → ProjectTag → Award
Tables NOT written (require AI classification, Phase 1):  Track, ProjectTrack

Run:
    python -m pipeline.db.ingest          # from project root
    python pipeline/db/ingest.py          # directly
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

import psycopg2
import psycopg2.extras

from .client import get_connection

# ── Config ───────────────────────────────────────────────────────────────────

DATA_DIR = Path(__file__).parent.parent / "data"
HACKATHONS_FILE = DATA_DIR / "hackathons.json"
PROJECTS_FILE = DATA_DIR / "projects.json"


# ── Tag normalisation ─────────────────────────────────────────────────────────

_SLUG_RE = re.compile(r"[^a-z0-9]+")


def normalize_tag_name(raw: str) -> str:
    """Lowercase and strip, preserving original casing in name but lowered."""
    return raw.strip().lower()


def slugify(name: str) -> str:
    """Convert tag name to URL-safe slug, e.g. 'React.js' → 'react-js'."""
    return _SLUG_RE.sub("-", name.lower()).strip("-")


# ── SQL helpers ───────────────────────────────────────────────────────────────

def upsert_hackathon(cur, h: dict) -> int:
    """Upsert a hackathon row. Returns the row id."""
    cur.execute(
        """
        INSERT INTO "Hackathon" (
            "devpostId", "title", "devpostUrl", "galleryUrl",
            "organization", "location",
            "submissionStart", "submissionEnd",
            "registrationsCount", "prizeAmount",
            "themes", "winnersAnnounced", "inviteOnly",
            "updatedAt"
        ) VALUES (
            %(devpost_id)s, %(title)s, %(devpost_url)s, %(gallery_url)s,
            %(organization)s, %(location)s,
            %(submission_start)s, %(submission_end)s,
            %(registrations_count)s, %(prize_amount)s,
            %(themes)s, %(winners_announced)s, %(invite_only)s,
            NOW()
        )
        ON CONFLICT ("devpostId") DO UPDATE SET
            "title"              = EXCLUDED."title",
            "galleryUrl"         = EXCLUDED."galleryUrl",
            "organization"       = EXCLUDED."organization",
            "location"           = EXCLUDED."location",
            "submissionStart"    = EXCLUDED."submissionStart",
            "submissionEnd"      = EXCLUDED."submissionEnd",
            "registrationsCount" = EXCLUDED."registrationsCount",
            "prizeAmount"        = EXCLUDED."prizeAmount",
            "themes"             = EXCLUDED."themes",
            "winnersAnnounced"   = EXCLUDED."winnersAnnounced",
            "inviteOnly"         = EXCLUDED."inviteOnly",
            "updatedAt"          = NOW()
        RETURNING "id"
        """,
        {
            "devpost_id":          str(h["devpost_id"]),
            "title":               h["title"],
            "devpost_url":         h["devpost_url"],
            "gallery_url":         h.get("gallery_url") or None,
            "organization":        h.get("organization") or None,
            "location":            h.get("location") or None,
            "submission_start":    h.get("submission_start"),
            "submission_end":      h.get("submission_end"),
            "registrations_count": h.get("registrations_count"),
            "prize_amount":        h.get("prize_amount"),
            "themes":              h.get("themes", []),
            "winners_announced":   bool(h.get("winners_announced", False)),
            "invite_only":         bool(h.get("invite_only", False)),
        },
    )
    return cur.fetchone()["id"]


def upsert_project(cur, p: dict, hackathon_id: int) -> int:
    """Upsert a project row. Returns the row id."""
    team_members = p.get("team_members", [])
    team_size = len(team_members) if team_members else None

    cur.execute(
        """
        INSERT INTO "Project" (
            "devpostSoftwareId", "devpostUrl", "title", "tagline",
            "description", "demoUrl", "repoUrl",
            "otherLinks", "teamMembers", "teamSize",
            "classificationStatus", "hackathonId",
            "updatedAt"
        ) VALUES (
            %(software_id)s, %(devpost_url)s, %(title)s, %(tagline)s,
            %(description)s, %(demo_url)s, %(repo_url)s,
            %(other_links)s, %(team_members)s, %(team_size)s,
            'PENDING', %(hackathon_id)s,
            NOW()
        )
        ON CONFLICT ("devpostUrl") DO UPDATE SET
            "title"       = EXCLUDED."title",
            "tagline"     = EXCLUDED."tagline",
            "description" = EXCLUDED."description",
            "demoUrl"     = EXCLUDED."demoUrl",
            "repoUrl"     = EXCLUDED."repoUrl",
            "otherLinks"  = EXCLUDED."otherLinks",
            "teamMembers" = EXCLUDED."teamMembers",
            "teamSize"    = EXCLUDED."teamSize",
            "updatedAt"   = NOW()
        RETURNING "id"
        """,
        {
            "software_id":   p.get("devpost_software_id") or None,
            "devpost_url":   p["project_url"],
            "title":         p.get("title", "").strip() or "Untitled",
            "tagline":       p.get("tagline") or None,
            "description":   p.get("full_desc") or None,
            "demo_url":      p.get("demo_url") or None,
            "repo_url":      p.get("repo_url") or None,
            "other_links":   p.get("other_links", []),
            "team_members":  team_members,
            "team_size":     team_size,
            "hackathon_id":  hackathon_id,
        },
    )
    return cur.fetchone()["id"]


def upsert_tags(cur, tag_names: list[str]) -> list[int]:
    """
    Upsert tags by name. Returns list of tag ids (same order as input,
    deduped, empty strings filtered).
    """
    seen: dict[str, int] = {}
    ids: list[int] = []

    for raw in tag_names:
        name = normalize_tag_name(raw)
        if not name or name in seen:
            if name in seen:
                ids.append(seen[name])
            continue

        # Use name as slug directly to avoid collisions:
        # slugify() strips special chars so "c" and "c++" both become "c".
        # Since name is already normalised + unique, it's safe as the slug.
        # A prettier URL slug (e.g. "cpp") can be backfilled later via migration.
        slug = name
        cur.execute(
            """
            INSERT INTO "Tag" ("name", "slug", "category")
            VALUES (%(name)s, %(slug)s, 'OTHER')
            ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug"
            RETURNING "id"
            """,
            {"name": name, "slug": slug},
        )
        tag_id = cur.fetchone()["id"]
        seen[name] = tag_id
        ids.append(tag_id)

    return ids


def link_project_tags(cur, project_id: int, tag_ids: list[int]) -> None:
    """Insert ProjectTag join rows, ignoring duplicates."""
    for tag_id in tag_ids:
        cur.execute(
            """
            INSERT INTO "ProjectTag" ("projectId", "tagId")
            VALUES (%(project_id)s, %(tag_id)s)
            ON CONFLICT DO NOTHING
            """,
            {"project_id": project_id, "tag_id": tag_id},
        )


def upsert_award(cur, project_id: int, hackathon_id: int) -> None:
    """
    Insert a basic 'Winner' award for the project if one doesn't exist yet.
    We only know tier=WINNER from the gallery badge; name/prizeValue are unknown.
    """
    cur.execute(
        """
        INSERT INTO "Award" ("name", "tier", "projectId", "hackathonId")
        VALUES ('Winner', 'WINNER', %(project_id)s, %(hackathon_id)s)
        ON CONFLICT DO NOTHING
        """,
        {"project_id": project_id, "hackathon_id": hackathon_id},
    )


# ── Index builder ─────────────────────────────────────────────────────────────

def build_hackathon_index(hackathons: list[dict]) -> dict[str, dict]:
    """Build a lookup map: devpost_id (as str) → hackathon dict."""
    return {str(h["devpost_id"]): h for h in hackathons if h.get("devpost_id")}


# ── Main ─────────────────────────────────────────────────────────────────────

def run(
    hackathons_path: Path = HACKATHONS_FILE,
    projects_path: Path = PROJECTS_FILE,
) -> None:
    """
    Load Stage 1 + Stage 3 checkpoints, ingest into PostgreSQL.
    Prints progress and a final summary.
    """
    # ── Load checkpoints ──────────────────────────────────────────────────────
    if not hackathons_path.exists():
        sys.exit(f"[ERROR] Missing {hackathons_path}. Run Stage 1 first.")
    if not projects_path.exists():
        sys.exit(f"[ERROR] Missing {projects_path}. Run Stages 1–3 first.")

    with open(hackathons_path, encoding="utf-8") as f:
        hackathon_index = build_hackathon_index(json.load(f)["hackathons"])

    with open(projects_path, encoding="utf-8") as f:
        projects = json.load(f)["projects"]

    print(f"\nStage 4 — Database Ingestion")
    print(f"Hackathons available: {len(hackathon_index)}")
    print(f"Projects to ingest:   {len(projects)}")
    print("=" * 60)

    inserted = 0
    updated = 0
    skipped = 0

    conn = get_connection()
    try:
        with conn:  # transaction — commits on success, rolls back on exception
            cur = conn.cursor()

            # Cache hackathon db ids to avoid redundant upserts
            hackathon_db_ids: dict[str, int] = {}

            for i, project in enumerate(projects, 1):
                hack_id_str = str(project.get("hackathon_devpost_id", ""))
                hackathon_raw = hackathon_index.get(hack_id_str)

                if not hackathon_raw:
                    print(f"  [{i}] SKIP (no hackathon data): {project.get('title')}")
                    skipped += 1
                    continue

                project_url = project.get("project_url", "")
                if not project_url:
                    print(f"  [{i}] SKIP (no project URL): {project.get('title')}")
                    skipped += 1
                    continue

                # ── Hackathon ──────────────────────────────────────────────
                if hack_id_str not in hackathon_db_ids:
                    hackathon_db_ids[hack_id_str] = upsert_hackathon(cur, hackathon_raw)

                hackathon_db_id = hackathon_db_ids[hack_id_str]

                # ── Project ────────────────────────────────────────────────
                project_db_id = upsert_project(cur, project, hackathon_db_id)

                # ── Tags ───────────────────────────────────────────────────
                raw_tags: list[str] = project.get("built_with", [])
                if raw_tags:
                    tag_ids = upsert_tags(cur, raw_tags)
                    link_project_tags(cur, project_db_id, tag_ids)

                # ── Award ──────────────────────────────────────────────────
                upsert_award(cur, project_db_id, hackathon_db_id)

                inserted += 1
                title_display = (project.get("title") or "?")[:50]
                print(f"  [{i:>4}] ✓  {title_display}")

            cur.close()

        # Transaction committed
        print(f"\n{'=' * 60}")
        print(f"Done.  Inserted/updated: {inserted}  |  Skipped: {skipped}")
        print(f"Hackathons upserted: {len(hackathon_db_ids)}")

    except Exception as e:
        print(f"\n[ERROR] Ingestion failed, transaction rolled back: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    run()
