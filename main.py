from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from psycopg2.pool import SimpleConnectionPool
import psycopg2
import os
from datetime import datetime, timezone, date

app = FastAPI()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set")

# -------------------------------
# CONNECTION POOL (FIX)
# -------------------------------
pool = SimpleConnectionPool(
    1, 10, DATABASE_URL
)

def get_conn():
    return pool.getconn()

def release_conn(conn):
    pool.putconn(conn)

# -------------------------------
# APP CONFIG
# -------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

guesses = []
secret_character = None

static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/favicon.ico")
def favicon():
    return FileResponse(os.path.join(static_dir, "favicon.ico"))

@app.get("/")
def home():
    return FileResponse(os.path.join(static_dir, "index.html"))

# -------------------------------
# MODELS
# -------------------------------
class Guess(BaseModel):
    name: str

# -------------------------------
# START GAME
# -------------------------------
@app.get("/start")
def start_game(n: int = 0):

    global guesses
    global secret_character

    guesses = []

    conn = get_conn()
    cur = conn.cursor()

    try:
        launch_date = date(2026,3,10)
        today = datetime.now(timezone.utc).date()

        puzzle_number = max(0, (today - launch_date).days - n)

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

        cur.execute("""
            SELECT 
                photo_url,
                c.charname,
                gender,
                chartype,
                origin,
                yearappeard,
                quotes,
                description,
                firstappears,

                (SELECT STRING_AGG(s.species, ', ')
                FROM dccomicsdle_schema.species s
                WHERE s.charname = c.charname) AS species,

                (SELECT STRING_AGG(p.powers, ', ')
                FROM dccomicsdle_schema.powers p
                WHERE p.charname = c.charname) AS powers,

                (SELECT STRING_AGG(a.affiliations, ', ')
                FROM dccomicsdle_schema.affiliations a
                WHERE a.charname = c.charname) AS affiliations,

                (SELECT STRING_AGG(ap.apperances, ', ')
                FROM dccomicsdle_schema.appearance_types ap
                WHERE ap.charname = c.charname) AS appearances

            FROM dccomicsdle_schema.character_info c
            WHERE c.charname = %s
        """, (secret_character,))

        row = cur.fetchone()

        if not row:
            return {"error":"Secret character not found"}

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

        return {
            "message": "game started",
            "secret": secret,
            "puzzle_number": puzzle_number,
            "todays_puzzle": (today - launch_date).days
        }

    finally:
        cur.close()
        release_conn(conn)

# -------------------------------
# SEARCH
# -------------------------------
@app.get("/search")
def search_characters(q: str):

    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT c.charname, a.aliases
            FROM dccomicsdle_schema.character_info c
            LEFT JOIN dccomicsdle_schema.aliases a
            ON c.charname = a.charname
            WHERE LOWER(c.charname) LIKE %s
            OR LOWER(a.aliases) LIKE %s
            LIMIT 20
        """,(f"%{q.lower()}%",f"%{q.lower()}%"))

        rows = cur.fetchall()

        options = []
        seen = set()

        for charname, alias in rows:

            if charname not in seen:
                options.append({
                    "charname": charname,
                    "display_name": charname
                })
                seen.add(charname)

            if alias and alias.lower().startswith(q.lower()) and alias not in seen:
                options.append({
                    "charname": charname,
                    "display_name": alias
                })
                seen.add(alias)

        return options

    finally:
        cur.close()
        release_conn(conn)

# -------------------------------
# GUESS
# -------------------------------
@app.post("/guess")
def guess_character(guess: Guess):

    global secret_character
    global guesses

    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute("""
        SELECT 
        c.photo_url,
        c.charname,
        c.gender,
        c.chartype,
        c.origin,
        c.yearappeard,

        (SELECT STRING_AGG(s.species, ', ')
        FROM dccomicsdle_schema.species s
        WHERE s.charname = c.charname) AS species,

        (SELECT STRING_AGG(p.powers, ', ')
        FROM dccomicsdle_schema.powers p
        WHERE p.charname = c.charname) AS powers,

        (SELECT STRING_AGG(a.affiliations, ', ')
        FROM dccomicsdle_schema.affiliations a
        WHERE a.charname = c.charname) AS affiliations,

        (SELECT STRING_AGG(ap.apperances, ', ')
        FROM dccomicsdle_schema.appearance_types ap
        WHERE ap.charname = c.charname) AS appearances

        FROM dccomicsdle_schema.character_info c
        WHERE c.charname = %s
        """,(guess.name,))

        row = cur.fetchone()

        if not row:
            return {"error":"Character not found"}

        result = {
            "charname": row[1],
            "photo_url": row[0],
            "gender": row[2],
            "chartype": row[3],
            "species": row[6],
            "powers": row[7],
            "origin": row[4],
            "affiliations": row[8],
            "year": row[5],
            "appearances": row[9],
            "correct": row[1].lower() == secret_character.lower()
        }

        if any(g['charname'].lower() == result['charname'].lower() for g in guesses):
            return {"error": "Character already guessed"}

        guesses.append(result)
        return result

    finally:
        cur.close()
        release_conn(conn)
