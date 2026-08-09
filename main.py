from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import psycopg2
import os
from datetime import datetime, timezone, date
from collections import defaultdict


app = FastAPI()

conn = psycopg2.connect(
    "postgresql://neondb_owner:npg_qWkSa79eCNXI@ep-calm-dew-aef8rwqs-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


user_guesses = defaultdict(list)

@app.get("/favicon.ico")
def favicon():
    return FileResponse(os.path.join(static_dir, "favicon.ico"))
guesses=[]
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def home():
    return FileResponse(os.path.join(static_dir, "index.html"))

secret_character = None

class Guess(BaseModel):
    name: str
    

@app.get("/start")
def start_game(n: int = 0):
    global guesses
    guesses = []
    global secret_character

    launch_date = date(2026,3,10)
    today = datetime.now(timezone.utc).date()
    puzzle_number = (today - launch_date).days-n
    if(puzzle_number<1):
        puzzle_number=1
    
    cur = conn.cursor()
    cur.execute("""
        SELECT charname
        FROM dccomicsdle_schema.puzzlenum
        WHERE num = %s
    """,(puzzle_number,))
    row = cur.fetchone()

    if row:
        secret_character = row[0]
    else:
        cur.execute("""
            SELECT charname
            FROM dccomicsdle_schema.character_info
            ORDER BY RANDOM()
            LIMIT 1
        """)
        secret_character = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO dccomicsdle_schema.puzzlenum (charname,num)
            VALUES (%s,%s)
            ON CONFLICT (num) DO NOTHING
        """,(secret_character,puzzle_number))

        conn.commit()

    # fetch full info for the secret character
    cur.execute("""
        SELECT 
            photo_url, c.charname, gender, chartype, origin, yearappeard, quotes, description, firstappears,
            (SELECT STRING_AGG(s.species, ', ' ORDER BY s.species) FROM dccomicsdle_schema.species s WHERE s.charname = c.charname ) AS species,
            (SELECT STRING_AGG(p.powers, ', ' ORDER BY p.powers) FROM dccomicsdle_schema.powers p WHERE p.charname = c.charname ) AS powers,
            (SELECT STRING_AGG(a.affiliations, ', '  ORDER BY a.affiliations) FROM dccomicsdle_schema.affiliations a WHERE a.charname = c.charname ) AS affiliations,
            (SELECT STRING_AGG(ap.apperances, ', ' ORDER BY ap.apperances) FROM dccomicsdle_schema.appearance_types ap WHERE ap.charname = c.charname ) AS appearances
        FROM dccomicsdle_schema.character_info c
        JOIN dccomicsdle_schema.puzzlenum pz ON pz.charname=c.charname
        WHERE c.charname = %s AND pz.num=%s
    """, (secret_character, puzzle_number))
    row = cur.fetchone()

    secret = {
        "photo_url": row[0],
        "charname": row[1],
        "gender": row[2],
        "chartype": row[3],
        "origin": row[4],
        "year": row[5],
        "quote": row[6],
        "description": row[7],
        "first_appearance": row[8],
        "species": row[9],
        "powers": row[10],
        "affiliations": row[11],
        "appearances": row[12]
    }

    return {"message": "game started", "secret": secret, "puzzle_number": puzzle_number, "todays_puzzle":(today - launch_date).days}

@app.get("/search")
def search_characters(q: str):

    if not q:
        return []

    cur = conn.cursor()

    try:
        cur.execute("""
        SELECT c.charname, c.photo_url
        FROM dccomicsdle_schema.character_info c
        LEFT JOIN dccomicsdle_schema.aliases a 
            ON c.charname = a.charname
        WHERE LOWER(c.charname) LIKE %s
        OR LOWER(a.aliases) LIKE %s
        GROUP BY c.charname, c.photo_url
        ORDER BY 
            CASE 
                WHEN LOWER(c.charname) = %s THEN 0
                WHEN LOWER(c.charname) LIKE %s THEN 2
                WHEN MAX(LOWER(a.aliases)) = %s THEN 1
                WHEN MAX(LOWER(a.aliases)) LIKE %s THEN 4
                WHEN LOWER(c.charname) LIKE %s THEN 3
                WHEN MAX(LOWER(a.aliases)) LIKE %s THEN 4
                ELSE 5
            END,
            c.charname
        LIMIT 20
    """, (f"%{q.lower()}%", f"%{q.lower()}%",f"{q.lower()}",f"{q.lower()}%", f"{q.lower()}", f"{q.lower()}%",f"% {q.lower()}%", f"% {q.lower()}%"))

        rows = cur.fetchall()

        return [
            {"charname": row[0], "photo_url": row[1]}
            for row in rows
        ]

    finally:
        cur.close()

@app.post("/guess")
def guess_character(
    guess: Guess,
    session_id: str,
    puzzle_number: int,
    account_id: int | None = None
):

    cur = conn.cursor()

    try:

        # ============================================================
        # GET SECRET CHARACTER FOR THIS SPECIFIC PUZZLE
        # ============================================================

        cur.execute("""
            SELECT charname
            FROM dccomicsdle_schema.puzzlenum
            WHERE num = %s
        """, (puzzle_number,))

        secret_row = cur.fetchone()

        if not secret_row:
            return {"error": "Puzzle not found"}

        secret_character = secret_row[0]

        # ============================================================
        # GET CHARACTER INFORMATION FOR THE GUESS
        # ============================================================

        cur.execute("""
            SELECT 
                c.photo_url,
                c.charname,
                c.gender,
                c.origin,
                c.chartype,
                c.yearappeard,

                (
                    SELECT STRING_AGG(
                        s.species,
                        ', ' ORDER BY s.species
                    )
                    FROM dccomicsdle_schema.species s
                    WHERE s.charname = c.charname
                ) AS species,

                (
                    SELECT STRING_AGG(
                        p.powers,
                        ', ' ORDER BY p.powers
                    )
                    FROM dccomicsdle_schema.powers p
                    WHERE p.charname = c.charname
                ) AS powers,

                (
                    SELECT STRING_AGG(
                        a.affiliations,
                        ', ' ORDER BY a.affiliations
                    )
                    FROM dccomicsdle_schema.affiliations a
                    WHERE a.charname = c.charname
                ) AS affiliations,

                (
                    SELECT STRING_AGG(
                        ap.apperances,
                        ', ' ORDER BY ap.apperances
                    )
                    FROM dccomicsdle_schema.appearance_types ap
                    WHERE ap.charname = c.charname
                ) AS appearances

            FROM dccomicsdle_schema.character_info c
            WHERE c.charname = %s
        """, (guess.name,))

        row = cur.fetchone()

        if not row:
            return {"error": "Character not found"}

        # ============================================================
        # BUILD RESULT
        # ============================================================

        result = {
            "charname": row[1],
            "photo_url": row[0],
            "gender": row[2],
            "chartype": row[4],
            "origin": row[3],
            "year": row[5],
            "species": row[6],
            "powers": row[7],
            "affiliations": row[8],
            "appearances": row[9],
            "correct": row[1].lower() == secret_character.lower()
        }

        # ============================================================
        # CHECK FOR EXISTING GUESS
        # ============================================================

        if account_id is not None:

            cur.execute("""
                SELECT 1
                FROM dccomicsdle_schema.guesses
                WHERE account_id = %s
                  AND puzzle_number = %s
                  AND LOWER(charname) = LOWER(%s)
                LIMIT 1
            """, (
                account_id,
                puzzle_number,
                result["charname"]
            ))

        else:

            cur.execute("""
                SELECT 1
                FROM dccomicsdle_schema.guesses
                WHERE session_id = %s
                  AND puzzle_number = %s
                  AND LOWER(charname) = LOWER(%s)
                LIMIT 1
            """, (
                session_id,
                puzzle_number,
                result["charname"]
            ))

        if cur.fetchone():
            return {"error": "Character already guessed"}

        # ============================================================
        # GET NEXT GUESS ORDER
        # ============================================================

        if account_id is not None:

            cur.execute("""
                SELECT COALESCE(MAX(guess_order), 0) + 1
                FROM dccomicsdle_schema.guesses
                WHERE account_id = %s
                  AND puzzle_number = %s
            """, (
                account_id,
                puzzle_number
            ))

        else:

            cur.execute("""
                SELECT COALESCE(MAX(guess_order), 0) + 1
                FROM dccomicsdle_schema.guesses
                WHERE session_id = %s
                  AND puzzle_number = %s
            """, (
                session_id,
                puzzle_number
            ))

        guess_order = cur.fetchone()[0]

        # ============================================================
        # SAVE GUESS
        # ============================================================

        cur.execute("""
            INSERT INTO dccomicsdle_schema.guesses
            (
                session_id,
                account_id,
                puzzle_number,
                charname,
                guess_order
            )
            VALUES (%s, %s, %s, %s, %s)
        """, (
            session_id,
            account_id,
            puzzle_number,
            result["charname"],
            guess_order
        ))

        conn.commit()

        return result

    except Exception as e:

        conn.rollback()
        print("Guess error:", e)

        return {"error": "Unable to save guess"}

    finally:
        cur.close()


@app.get("/saved-guesses")
def get_saved_guesses(
    puzzle_number: int,
    session_id: str,
    account_id: int | None = None
):

    cur = conn.cursor()

    try:

        # ============================================================
        # GET SECRET CHARACTER FOR THIS PUZZLE
        # ============================================================

        cur.execute("""
            SELECT charname
            FROM dccomicsdle_schema.puzzlenum
            WHERE num = %s
        """, (puzzle_number,))

        secret_row = cur.fetchone()

        if not secret_row:
            return []

        secret_character = secret_row[0]

        # ============================================================
        # GET SAVED CHARACTER NAMES
        # ============================================================

        if account_id is not None:

            cur.execute("""
                SELECT charname
                FROM dccomicsdle_schema.guesses
                WHERE account_id = %s
                  AND puzzle_number = %s
                ORDER BY guess_order
            """, (
                account_id,
                puzzle_number
            ))

        else:

            cur.execute("""
                SELECT charname
                FROM dccomicsdle_schema.guesses
                WHERE session_id = %s
                  AND puzzle_number = %s
                  AND account_id IS NULL
                ORDER BY guess_order
            """, (
                session_id,
                puzzle_number
            ))

        saved_names = cur.fetchall()

        if not saved_names:
            return []

        # ============================================================
        # REBUILD EACH GUESS FROM CURRENT DATABASE DATA
        # ============================================================

        results = []

        for (charname,) in saved_names:

            cur.execute("""
                SELECT 
                    c.photo_url,
                    c.charname,
                    c.gender,
                    c.origin,
                    c.chartype,
                    c.yearappeard,

                    (
                        SELECT STRING_AGG(
                            s.species,
                            ', ' ORDER BY s.species
                        )
                        FROM dccomicsdle_schema.species s
                        WHERE s.charname = c.charname
                    ) AS species,

                    (
                        SELECT STRING_AGG(
                            p.powers,
                            ', ' ORDER BY p.powers
                        )
                        FROM dccomicsdle_schema.powers p
                        WHERE p.charname = c.charname
                    ) AS powers,

                    (
                        SELECT STRING_AGG(
                            a.affiliations,
                            ', ' ORDER BY a.affiliations
                        )
                        FROM dccomicsdle_schema.affiliations a
                        WHERE a.charname = c.charname
                    ) AS affiliations,

                    (
                        SELECT STRING_AGG(
                            ap.apperances,
                            ', ' ORDER BY ap.apperances
                        )
                        FROM dccomicsdle_schema.appearance_types ap
                        WHERE ap.charname = c.charname
                    ) AS appearances

                FROM dccomicsdle_schema.character_info c
                WHERE c.charname = %s
            """, (charname,))

            row = cur.fetchone()

            # Character may have been deleted from the database
            if not row:
                continue

            result = {
                "charname": row[1],
                "photo_url": row[0],
                "gender": row[2],
                "chartype": row[4],
                "origin": row[3],
                "year": row[5],
                "species": row[6],
                "powers": row[7],
                "affiliations": row[8],
                "appearances": row[9],
                "correct": row[1].lower() == secret_character.lower()
            }

            results.append(result)

        return results

    except Exception as e:

        print("Saved guesses error:", e)
        return []

    finally:
        cur.close()
@app.post("/attach-session")
def attach_session(
    session_id: str,
    account_id: int
):

    cur = conn.cursor()

    try:

        # ============================================================
        # FIND GUESSES MADE BY THIS SESSION
        # ============================================================

        cur.execute("""
            SELECT puzzle_number, charname
            FROM dccomicsdle_schema.guesses
            WHERE session_id = %s
              AND account_id IS NULL
        """, (session_id,))

        session_guesses = cur.fetchall()

        # ============================================================
        # ATTACH EACH GUESS TO THE ACCOUNT
        # ============================================================

        for puzzle_number, charname in session_guesses:

            # Check if account already has this guess
            cur.execute("""
                SELECT 1
                FROM dccomicsdle_schema.guesses
                WHERE account_id = %s
                  AND puzzle_number = %s
                  AND LOWER(charname) = LOWER(%s)
                LIMIT 1
            """, (
                account_id,
                puzzle_number,
                charname
            ))

            already_exists = cur.fetchone()

            if already_exists:

                # Account already has this guess.
                # Delete the anonymous duplicate.
                cur.execute("""
                    DELETE FROM dccomicsdle_schema.guesses
                    WHERE session_id = %s
                      AND puzzle_number = %s
                      AND LOWER(charname) = LOWER(%s)
                      AND account_id IS NULL
                """, (
                    session_id,
                    puzzle_number,
                    charname
                ))

            else:

                # Attach anonymous guess to account
                cur.execute("""
                    UPDATE dccomicsdle_schema.guesses
                    SET account_id = %s
                    WHERE session_id = %s
                      AND puzzle_number = %s
                      AND LOWER(charname) = LOWER(%s)
                      AND account_id IS NULL
                """, (
                    account_id,
                    session_id,
                    puzzle_number,
                    charname
                ))

        conn.commit()

        return {
            "success": True,
            "attached": len(session_guesses)
        }

    except Exception as e:

        conn.rollback()
        print("Attach session error:", e)

        return {
            "success": False,
            "error": "Unable to attach session guesses"
        }

    finally:
        cur.close()
