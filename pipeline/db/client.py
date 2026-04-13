"""
Database connection management.

Reads DATABASE_URL from the project root .env / .env.local files,
same as the Next.js app and Prisma CLI do.
"""

import os
from pathlib import Path

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# Load env from project root (same order as prisma.config.ts)
_root = Path(__file__).parent.parent.parent  # HackInspo/
load_dotenv(_root / ".env")
load_dotenv(_root / ".env.local", override=True)


def get_connection() -> psycopg2.extensions.connection:
    """
    Return a new psycopg2 connection using DATABASE_URL.
    Caller is responsible for closing or using as a context manager.

    Usage:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(...)
            conn.commit()
    """
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL not set. "
            "Check your .env.local in the project root."
        )
    return psycopg2.connect(url, cursor_factory=psycopg2.extras.RealDictCursor)
