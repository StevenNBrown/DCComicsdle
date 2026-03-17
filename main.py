from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import psycopg2
import os
from datetime import datetime, timezone, date

app = FastAPI()

# -------------------------
# DATABASE
# -------------------------

DATABASE_URL = os.environ["DATABASE_URL"]

def get_connection():
    return psycopg2.connect(DATABASE_URL)

# -------------------------
# CORS
# -------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# STATIC FILES
# -------------------------

static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def home():
    return FileResponse(os.path.join(static_dir, "index.html"))

# -------------------------
# GLOBAL STATE
# -------------------------

guesses = []
secret_character = None

class Guess(BaseModel):
    name: str

# -------------------------
# START GAME (FIXED)
# -------------------------

@app.get("/start")
def start_game(n: int = 0):

    global guesses, secret_character
    guesses = []

    try:
        conn = get_connection()
        cur = conn.cursor()

        launch_date = date(2026, 3, 10)
        today = datetime.now(timezone.utc).date()
        puzzle_number = (today - launch_date).days - n

        # Get puzzle
        cur.execute("""
            SELECT charname
            FROM dccomicsdle_schema.puzzlenum
            WHERE num = %s
        """, (puzzle_number,))
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
            result = cur.fetchone()

            if not result:
                raise Exception("No characters found")

            secret_character = result[0]

            cur.execute("""
                INSERT INTO dccomicsdle_schema.puzzlenum (charname,num)
                VALUES (%s,%s)
                ON CONFLICT (num) DO NOTHING
            """, (secret_character, puzzle_number))

            conn.commit()

        cur.close()
        conn.close()

        return {
            "message": "game started",
            "puzzle_number": puzzle_number,
            "todays_puzzle": (today - launch_date).days
        }

    except Exception as e:
        print("START ERROR:", e)
        raise HTTPException(status_code=500, detail="Start failed")

# -------------------------
# SEARCH (SAFE)
# -------------------------

@app.get("/search")
def search_characters(q: str):

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT c.charname
            FROM dccomicsdle_schema.character_info c
            WHERE LOWER(c.charname) LIKE %s
            LIMIT 20
        """, (f"%{q.lower()}%",))

        rows = cur.fetchall()

        cur.close()
        conn.close()

        return [{"charname": r[0]} for r in rows]

    except Exception as e:
        print("SEARCH ERROR:", e)
        return []

# -------------------------
# GUESS (SAFE)
# -------------------------

@app.post("/guess")
def guess_character(guess: Guess):

    global secret_character

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT photo_url, charname
            FROM dccomicsdle_schema.character_info
            WHERE charname = %s
        """, (guess.name,))

        row = cur.fetchone()

        cur.close()
        conn.close()

        if not row:
            return {"error": "Character not found"}

        result = {
            "charname": row[1],
            "photo_url": row[0],
            "correct": row[1].lower() == secret_character.lower()
        }

        if any(g["charname"].lower() == result["charname"].lower() for g in guesses):
            return {"error": "Character already guessed"}

        guesses.append(result)
        return result

    except Exception as e:
        print("GUESS ERROR:", e)
        raise HTTPException(status_code=500, detail="Guess failed")
