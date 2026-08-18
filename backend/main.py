from pathlib import Path
import sqlite3

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# =========================================================
# Configuration
# =========================================================

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "likes.db"


app = FastAPI(
    title="The Space Between Moments — Reactions API"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)


# =========================================================
# Request Models
# =========================================================

class Reaction(BaseModel):
    client_id: str = Field(
        min_length=8,
        max_length=128
    )


# =========================================================
# Database
# =========================================================

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:

        # Likes
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS likes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT NOT NULL,
                client_id TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

                UNIQUE(slug, client_id)
            )
            """
        )

        # Shares
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS shares (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT NOT NULL,
                client_id TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        conn.commit()


# Create tables when the application starts
init_db()


# =========================================================
# Health Check
# =========================================================

@app.get("/api/health")
def health():
    return {
        "status": "ok"
    }


# =========================================================
# GET — Writing Stats
# =========================================================

@app.get("/api/writings/{slug}/stats")
def get_stats(
    slug: str,
    client_id: str | None = Query(
        default=None,
        min_length=8,
        max_length=128
    ),
):
    with get_db() as conn:

        # Total likes
        likes = conn.execute(
            """
            SELECT COUNT(*)
            FROM likes
            WHERE slug = ?
            """,
            (slug,),
        ).fetchone()[0]

        # Total shares
        shares = conn.execute(
            """
            SELECT COUNT(*)
            FROM shares
            WHERE slug = ?
            """,
            (slug,),
        ).fetchone()[0]

        # Has this client liked the writing?
        liked = False

        if client_id:
            liked = (
                conn.execute(
                    """
                    SELECT 1
                    FROM likes
                    WHERE slug = ?
                      AND client_id = ?
                    LIMIT 1
                    """,
                    (slug, client_id),
                ).fetchone()
                is not None
            )

    return {
        "slug": slug,
        "likes": likes,
        "shares": shares,
        "liked": liked,
    }


# =========================================================
# GET — Likes Only
# =========================================================

@app.get("/api/writings/{slug}/likes")
def get_likes(
    slug: str,
    client_id: str | None = Query(
        default=None,
        min_length=8,
        max_length=128
    ),
):
    with get_db() as conn:

        count = conn.execute(
            """
            SELECT COUNT(*)
            FROM likes
            WHERE slug = ?
            """,
            (slug,),
        ).fetchone()[0]

        liked = False

        if client_id:
            liked = (
                conn.execute(
                    """
                    SELECT 1
                    FROM likes
                    WHERE slug = ?
                      AND client_id = ?
                    LIMIT 1
                    """,
                    (slug, client_id),
                ).fetchone()
                is not None
            )

    return {
        "slug": slug,
        "count": count,
        "liked": liked,
    }


# =========================================================
# POST — Like Writing
# =========================================================

@app.post("/api/writings/{slug}/like")
def like(
    slug: str,
    reaction: Reaction
):
    with get_db() as conn:

        # INSERT OR IGNORE means:
        # the same client can only like the same
        # writing once.
        conn.execute(
            """
            INSERT OR IGNORE INTO likes (
                slug,
                client_id
            )
            VALUES (?, ?)
            """,
            (
                slug,
                reaction.client_id
            ),
        )

        conn.commit()

        count = conn.execute(
            """
            SELECT COUNT(*)
            FROM likes
            WHERE slug = ?
            """,
            (slug,),
        ).fetchone()[0]

    return {
        "slug": slug,
        "count": count,
        "liked": True,
    }


# =========================================================
# DELETE — Unlike Writing
# =========================================================

@app.delete("/api/writings/{slug}/like")
def unlike(
    slug: str,
    reaction: Reaction
):
    with get_db() as conn:

        conn.execute(
            """
            DELETE FROM likes
            WHERE slug = ?
              AND client_id = ?
            """,
            (
                slug,
                reaction.client_id
            ),
        )

        conn.commit()

        count = conn.execute(
            """
            SELECT COUNT(*)
            FROM likes
            WHERE slug = ?
            """,
            (slug,),
        ).fetchone()[0]

    return {
        "slug": slug,
        "count": count,
        "liked": False,
    }


# =========================================================
# POST — Share Writing
# =========================================================

@app.post("/api/writings/{slug}/share")
def share(
    slug: str,
    reaction: Reaction
):
    with get_db() as conn:

        # Shares are NOT unique.
        # A person can share the same writing
        # more than once.
        conn.execute(
            """
            INSERT INTO shares (
                slug,
                client_id
            )
            VALUES (?, ?)
            """,
            (
                slug,
                reaction.client_id
            ),
        )

        conn.commit()

        count = conn.execute(
            """
            SELECT COUNT(*)
            FROM shares
            WHERE slug = ?
            """,
            (slug,),
        ).fetchone()[0]

    return {
        "slug": slug,
        "count": count,
    }