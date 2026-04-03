from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import psycopg2
import os
from datetime import datetime, timezone, date

app = FastAPI()

DATABASE_URL = os.environ["DATABASE_URL"]

def get_connection():
    return psycopg2.connect(DATABASE_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    
    conn = get_connection()
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
    cur.close()
    conn.close()
    return {"message": "game started", "secret": secret, "puzzle_number": puzzle_number, "todays_puzzle":(today - launch_date).days}

@app.get("/search")
def search_characters(q: str):

    if not q:
        return []

    conn = get_connection()
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
        conn.close()
        


@app.post("/guess")
def guess_character(guess: Guess, session_id: str):

    global secret_character
    global user_guesses

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
        SELECT 
        c.photo_url,
        c.charname,
        c.gender,
        c.origin,
        c.chartype,
        c.yearappeard,
        
        (SELECT STRING_AGG(s.species, ', ' ORDER BY s.species)
         FROM dccomicsdle_schema.species s
         WHERE s.charname = c.charname) AS species,
        
        (SELECT STRING_AGG(p.powers, ', ' ORDER BY p.powers)
         FROM dccomicsdle_schema.powers p
         WHERE p.charname = c.charname) AS powers,
        
        (SELECT STRING_AGG(a.affiliations, ', ' ORDER BY a.affiliations)
         FROM dccomicsdle_schema.affiliations a
         WHERE a.charname = c.charname) AS affiliations,
        
        (SELECT STRING_AGG(ap.apperances, ', ' ORDER BY ap.apperances)
         FROM dccomicsdle_schema.appearance_types ap
         WHERE ap.charname = c.charname) AS appearences
                    
        FROM dccomicsdle_schema.character_info c
        WHERE charname = %s;
        """, (guess.name,))

        row = cur.fetchone()

        if not row:
            return {"error": "Character not found"}

        if session_id not in user_guesses:
            user_guesses[session_id] = []

        user_list = user_guesses[session_id]

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

        if any(g['charname'].lower() == result['charname'].lower() for g in user_list):
            return {"error": "Character already guessed"}

        user_list.append(result)

        return result

    finally:
        cur.close()
        conn.close()
