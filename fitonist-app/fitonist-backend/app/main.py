from fastapi import FastAPI, HTTPException, Depends, status, Query, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from pydantic import BaseModel
from typing import Optional, List
import bcrypt
import jwt
import sqlite3
import os
import random
import hashlib
from datetime import datetime, timedelta
from contextlib import contextmanager
import math

# --- App Setup ---
app = FastAPI(title="Fitonist API", version="2.0.0")


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
    "Access-Control-Expose-Headers": "*",
    "Access-Control-Max-Age": "0",
}


class CORSMiddlewareCustom(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return Response(status_code=200, headers=CORS_HEADERS)
        try:
            response = await call_next(request)
        except Exception:
            import traceback
            traceback.print_exc()
            response = JSONResponse(status_code=500, content={"detail": "Internal server error"})
        for k, v in CORS_HEADERS.items():
            response.headers[k] = v
        return response


app.add_middleware(CORSMiddlewareCustom)

# --- Auth Setup ---
SECRET_KEY = os.getenv("JWT_SECRET", "change-me-in-production")
ALGORITHM = "HS256"
security = HTTPBearer()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


DB_PATH = os.getenv("DB_PATH", "/data/app.db") if os.path.isdir("/data") else "app.db"


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        conn.executescript("""
            -- Migration: add missing columns to profiles if they don't exist
        """)
        # Safe column additions for existing databases
        for col, coltype, default in [
            ("onboarding_done", "INTEGER", "0"),
            ("workout_style", "TEXT", "'gym'"),
            ("weekly_goal", "INTEGER", "4"),
        ]:
            try:
                conn.execute(f"ALTER TABLE profiles ADD COLUMN {col} {coltype} DEFAULT {default}")
            except sqlite3.OperationalError:
                pass  # column already exists
        conn.commit()
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS profiles (
                user_id INTEGER PRIMARY KEY REFERENCES users(id),
                age INTEGER, gender TEXT, height REAL, weight REAL,
                goal TEXT, fitness_level TEXT, equipment TEXT,
                workout_style TEXT DEFAULT 'gym', gym_time TEXT,
                weekly_goal INTEGER DEFAULT 4,
                target_calories INTEGER, target_protein INTEGER,
                onboarding_done INTEGER DEFAULT 0,
                updated_at TEXT DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS workout_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id),
                date TEXT NOT NULL, day_title TEXT,
                duration_min INTEGER DEFAULT 0,
                calories_burned INTEGER DEFAULT 0,
                exercises_done INTEGER DEFAULT 0,
                total_volume REAL DEFAULT 0,
                completed INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS exercise_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER REFERENCES workout_sessions(id),
                user_id INTEGER REFERENCES users(id),
                exercise_name TEXT NOT NULL, muscle_group TEXT,
                set_number INTEGER, reps INTEGER,
                weight_kg REAL DEFAULT 0, completed INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS personal_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id),
                exercise_name TEXT NOT NULL,
                best_weight REAL DEFAULT 0, best_reps INTEGER DEFAULT 0,
                best_volume REAL DEFAULT 0, date_achieved TEXT,
                updated_at TEXT DEFAULT (datetime('now')),
                UNIQUE(user_id, exercise_name)
            );
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id),
                exercise_name TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now')),
                UNIQUE(user_id, exercise_name)
            );
            CREATE TABLE IF NOT EXISTS body_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id),
                date TEXT NOT NULL, weight REAL, body_fat REAL,
                chest REAL, waist REAL, hips REAL, arms REAL, thighs REAL,
                notes TEXT, created_at TEXT DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS daily_checkins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id),
                date TEXT NOT NULL,
                water_litres REAL DEFAULT 0, sleep_hours REAL DEFAULT 0,
                workout_completed INTEGER DEFAULT 0, diet_followed INTEGER DEFAULT 0,
                mood TEXT, created_at TEXT DEFAULT (datetime('now')),
                UNIQUE(user_id, date)
            );
            CREATE TABLE IF NOT EXISTS achievements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id),
                badge_key TEXT NOT NULL,
                badge_name TEXT NOT NULL,
                badge_desc TEXT,
                badge_icon TEXT DEFAULT 'trophy',
                unlocked_at TEXT DEFAULT (datetime('now')),
                UNIQUE(user_id, badge_key)
            );
            CREATE TABLE IF NOT EXISTS custom_splits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id),
                name TEXT NOT NULL,
                split_type TEXT DEFAULT 'custom',
                days_json TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id),
                title TEXT NOT NULL,
                body TEXT,
                notif_type TEXT DEFAULT 'reminder',
                read INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            );
        """)


init_db()


# --- Pydantic Models ---
class UserRegister(BaseModel):
    email: str
    password: str
    name: str


class UserLogin(BaseModel):
    email: str
    password: str


class ProfileUpdate(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    goal: Optional[str] = None
    fitness_level: Optional[str] = None
    equipment: Optional[str] = None
    workout_style: Optional[str] = None
    gym_time: Optional[str] = None
    weekly_goal: Optional[int] = None
    target_calories: Optional[int] = None
    target_protein: Optional[int] = None
    onboarding_done: Optional[int] = None


class StartSessionReq(BaseModel):
    day_title: str


class LogSetReq(BaseModel):
    session_id: int
    exercise_name: str
    muscle_group: str
    set_number: int
    reps: int
    weight_kg: float = 0


class FinishSessionReq(BaseModel):
    session_id: int
    duration_min: int = 0
    calories_burned: int = 0


class ToggleFavoriteReq(BaseModel):
    exercise_name: str


class BodyLogCreate(BaseModel):
    date: str
    weight: Optional[float] = None
    body_fat: Optional[float] = None
    chest: Optional[float] = None
    waist: Optional[float] = None
    hips: Optional[float] = None
    arms: Optional[float] = None
    thighs: Optional[float] = None
    notes: Optional[str] = None


class DailyCheckinCreate(BaseModel):
    date: str
    water_litres: Optional[float] = 0
    sleep_hours: Optional[float] = 0
    workout_completed: Optional[int] = 0
    diet_followed: Optional[int] = 0
    mood: Optional[str] = None


class CustomSplitCreate(BaseModel):
    name: str
    split_type: str = "custom"
    days: list


class AdminExerciseCreate(BaseModel):
    group: str
    name: str
    sets: int = 3
    reps: str = "10-12"
    rest: int = 60
    muscles: List[str] = []
    primary: str = ""
    type: str = "compound"
    equip: str = "full"
    video: str = ""
    instructions: str = ""
    difficulty: str = "intermediate"


# --- Auth Helpers ---
def create_token(user_id: int, email: str) -> str:
    payload = {"sub": str(user_id), "email": email, "exp": datetime.utcnow() + timedelta(days=30)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return {"id": int(payload["sub"]), "email": payload["email"]}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# --- Auth Routes ---
@app.post("/api/register")
def register(data: UserRegister):
    with get_db() as conn:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (data.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        hashed = hash_password(data.password)
        cursor = conn.execute("INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)", (data.email, hashed, data.name))
        user_id = cursor.lastrowid
        conn.execute("INSERT INTO profiles (user_id) VALUES (?)", (user_id,))
        token = create_token(user_id, data.email)
        return {"token": token, "user": {"id": user_id, "email": data.email, "name": data.name}}


@app.post("/api/login")
def login(data: UserLogin):
    with get_db() as conn:
        user = conn.execute("SELECT * FROM users WHERE email = ?", (data.email,)).fetchone()
        if not user or not verify_password(data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        token = create_token(user["id"], user["email"])
        return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"]}}


# --- Profile Routes ---
@app.get("/api/profile")
def get_profile(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        profile = conn.execute("SELECT * FROM profiles WHERE user_id = ?", (user["id"],)).fetchone()
        u = conn.execute("SELECT name, email FROM users WHERE id = ?", (user["id"],)).fetchone()
        if not profile:
            return {"user_id": user["id"], "name": u["name"], "email": u["email"]}
        return {**dict(profile), "name": u["name"], "email": u["email"]}


@app.put("/api/profile")
def update_profile(data: ProfileUpdate, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        fields = []
        values = []
        for field, value in data.model_dump(exclude_none=True).items():
            fields.append(f"{field} = ?")
            values.append(value)
        if fields:
            fields.append("updated_at = datetime('now')")
            values.append(user["id"])
            conn.execute(f"UPDATE profiles SET {', '.join(fields)} WHERE user_id = ?", values)
        profile = conn.execute("SELECT * FROM profiles WHERE user_id = ?", (user["id"],)).fetchone()
        return dict(profile)


# =====================================================================
# EXERCISE DATABASE - 200+ exercises across 6 muscle groups
# =====================================================================
EXERCISE_DB = {
    "chest": [
        {"name": "Push-Ups", "sets": 3, "reps": "15-20", "rest": 45, "muscles": ["Chest", "Triceps", "Shoulders"], "primary": "Chest", "type": "compound", "equip": "home", "video": "dZgVxmf6jkA", "instructions": "Keep body straight, lower chest to floor, push back up.", "difficulty": "beginner"},
        {"name": "Diamond Push-Ups", "sets": 3, "reps": "10-15", "rest": 45, "muscles": ["Inner Chest", "Triceps"], "primary": "Chest", "type": "compound", "equip": "home", "video": "J0DnG1_S3li8", "instructions": "Hands close together forming diamond shape.", "difficulty": "intermediate"},
        {"name": "Wide Push-Ups", "sets": 3, "reps": "12-15", "rest": 45, "muscles": ["Outer Chest", "Shoulders"], "primary": "Chest", "type": "compound", "equip": "home", "video": "pfPvbSFfUkQ", "instructions": "Hands wider than shoulders.", "difficulty": "beginner"},
        {"name": "Decline Push-Ups", "sets": 3, "reps": "10-15", "rest": 45, "muscles": ["Upper Chest", "Shoulders"], "primary": "Chest", "type": "compound", "equip": "home", "video": "SKPab2YC8BE", "instructions": "Feet elevated on bench or chair.", "difficulty": "intermediate"},
        {"name": "Archer Push-Ups", "sets": 3, "reps": "8-10 each", "rest": 60, "muscles": ["Chest", "Triceps"], "primary": "Chest", "type": "compound", "equip": "home", "video": "LbKSqEfFMmI", "instructions": "Shift weight to one arm.", "difficulty": "advanced"},
        {"name": "Dumbbell Bench Press", "sets": 4, "reps": "10-12", "rest": 75, "muscles": ["Chest", "Triceps", "Shoulders"], "primary": "Chest", "type": "compound", "equip": "basic", "video": "VmB1G1K7v94", "instructions": "Full range of motion, squeeze chest at top.", "difficulty": "beginner"},
        {"name": "Incline Dumbbell Press", "sets": 3, "reps": "10-12", "rest": 75, "muscles": ["Upper Chest", "Shoulders"], "primary": "Chest", "type": "compound", "equip": "basic", "video": "8iPEnn-ltC8", "instructions": "30-degree incline, squeeze at top.", "difficulty": "beginner"},
        {"name": "Dumbbell Fly", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Chest"], "primary": "Chest", "type": "isolation", "equip": "basic", "video": "eozdVDA78K0", "instructions": "Slight bend in elbows, deep stretch at bottom.", "difficulty": "beginner"},
        {"name": "Decline Dumbbell Press", "sets": 3, "reps": "10-12", "rest": 75, "muscles": ["Lower Chest", "Triceps"], "primary": "Chest", "type": "compound", "equip": "basic", "video": "LfyQBUKR8SE", "instructions": "Decline bench, press dumbbells up.", "difficulty": "intermediate"},
        {"name": "Dumbbell Pullover", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Chest", "Lats"], "primary": "Chest", "type": "compound", "equip": "basic", "video": "FK4rHfWKEac", "instructions": "Lie on bench, lower DB behind head.", "difficulty": "intermediate"},
        {"name": "Flat Barbell Bench Press", "sets": 4, "reps": "8-10", "rest": 90, "muscles": ["Chest", "Triceps", "Shoulders"], "primary": "Chest", "type": "compound", "equip": "full", "video": "rT7DgCr-3pg", "instructions": "Shoulder blades pinched, slight arch.", "difficulty": "beginner"},
        {"name": "Incline Barbell Press", "sets": 3, "reps": "8-10", "rest": 90, "muscles": ["Upper Chest", "Shoulders"], "primary": "Chest", "type": "compound", "equip": "full", "video": "SrqOu55lrYU", "instructions": "30-45 degree incline, controlled descent.", "difficulty": "intermediate"},
        {"name": "Cable Fly (Mid)", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Chest"], "primary": "Chest", "type": "isolation", "equip": "full", "video": "Iwe6AmxVf7o", "instructions": "Cables at mid height, squeeze at peak.", "difficulty": "beginner"},
        {"name": "Cable Fly (Low to High)", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Upper Chest"], "primary": "Chest", "type": "isolation", "equip": "full", "video": "Iwe6AmxVf7o", "instructions": "Cables from low, fly upward.", "difficulty": "intermediate"},
        {"name": "Pec Deck Machine", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Chest"], "primary": "Chest", "type": "isolation", "equip": "full", "video": "Iwe6AmxVf7o", "instructions": "Squeeze chest at peak, slow negative.", "difficulty": "beginner"},
        {"name": "Smith Machine Bench Press", "sets": 3, "reps": "10-12", "rest": 75, "muscles": ["Chest", "Triceps"], "primary": "Chest", "type": "compound", "equip": "full", "video": "rT7DgCr-3pg", "instructions": "Guided bar path, focus on contraction.", "difficulty": "beginner"},
        {"name": "Incline Dumbbell Fly", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Upper Chest"], "primary": "Chest", "type": "isolation", "equip": "basic", "video": "eozdVDA78K0", "instructions": "Incline bench, fly with squeeze at top.", "difficulty": "intermediate"},
        {"name": "Close-Grip Bench Press", "sets": 3, "reps": "10-12", "rest": 75, "muscles": ["Inner Chest", "Triceps"], "primary": "Chest", "type": "compound", "equip": "full", "video": "rT7DgCr-3pg", "instructions": "Narrow grip, elbows tucked.", "difficulty": "intermediate"},
        {"name": "Floor Press", "sets": 3, "reps": "10-12", "rest": 75, "muscles": ["Chest", "Triceps"], "primary": "Chest", "type": "compound", "equip": "basic", "video": "rT7DgCr-3pg", "instructions": "Lie on floor, press dumbbells up.", "difficulty": "beginner"},
        {"name": "Chest Dips", "sets": 3, "reps": "8-12", "rest": 75, "muscles": ["Lower Chest", "Triceps"], "primary": "Chest", "type": "compound", "equip": "basic", "video": "dX_nSOOJIsE", "instructions": "Lean forward, deep stretch at bottom.", "difficulty": "intermediate"},
        {"name": "Svend Press", "sets": 3, "reps": "12-15", "rest": 45, "muscles": ["Inner Chest"], "primary": "Chest", "type": "isolation", "equip": "basic", "video": "eozdVDA78K0", "instructions": "Squeeze plates together, press forward.", "difficulty": "beginner"},
        {"name": "Machine Chest Press", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Chest", "Triceps"], "primary": "Chest", "type": "compound", "equip": "full", "video": "rT7DgCr-3pg", "instructions": "Controlled press, squeeze at peak.", "difficulty": "beginner"},
        {"name": "Landmine Press", "sets": 3, "reps": "10-12 each", "rest": 60, "muscles": ["Upper Chest", "Shoulders"], "primary": "Chest", "type": "compound", "equip": "full", "video": "rT7DgCr-3pg", "instructions": "Press barbell at angle.", "difficulty": "intermediate"},
        {"name": "Hex Press", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Inner Chest", "Triceps"], "primary": "Chest", "type": "compound", "equip": "basic", "video": "VmB1G1K7v94", "instructions": "Press DBs together throughout movement.", "difficulty": "beginner"},
        {"name": "Incline Cable Fly", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Upper Chest"], "primary": "Chest", "type": "isolation", "equip": "full", "video": "Iwe6AmxVf7o", "instructions": "Incline bench between cables.", "difficulty": "intermediate"},
        {"name": "Dip Machine", "sets": 3, "reps": "10-12", "rest": 60, "muscles": ["Lower Chest", "Triceps"], "primary": "Chest", "type": "compound", "equip": "full", "video": "dX_nSOOJIsE", "instructions": "Assisted dips on machine.", "difficulty": "beginner"},
    ],
    "back": [
        {"name": "Superman Hold", "sets": 3, "reps": "30 sec", "rest": 30, "muscles": ["Lower Back", "Glutes"], "primary": "Back", "type": "isolation", "equip": "home", "video": "z6PJMT2y8GQ", "instructions": "Lift chest and legs off ground.", "difficulty": "beginner"},
        {"name": "Bodyweight Rows", "sets": 3, "reps": "10-15", "rest": 45, "muscles": ["Mid Back", "Biceps"], "primary": "Back", "type": "compound", "equip": "home", "video": "OYUxXMGVuuU", "instructions": "Use sturdy table, pull chest to edge.", "difficulty": "beginner"},
        {"name": "Reverse Snow Angels", "sets": 3, "reps": "12-15", "rest": 30, "muscles": ["Upper Back", "Rear Delts"], "primary": "Back", "type": "isolation", "equip": "home", "video": "M9_CRWqAgjE", "instructions": "Face down, sweep arms overhead.", "difficulty": "beginner"},
        {"name": "Prone Y Raises", "sets": 3, "reps": "12-15", "rest": 30, "muscles": ["Upper Back", "Traps"], "primary": "Back", "type": "isolation", "equip": "home", "video": "M9_CRWqAgjE", "instructions": "Face down, raise arms in Y shape.", "difficulty": "beginner"},
        {"name": "Single-Arm Dumbbell Row", "sets": 3, "reps": "10-12 each", "rest": 60, "muscles": ["Lats", "Rhomboids", "Biceps"], "primary": "Back", "type": "compound", "equip": "basic", "video": "pYcpY20QaE8", "instructions": "Full stretch at bottom, squeeze at top.", "difficulty": "beginner"},
        {"name": "Dumbbell Bent-Over Row", "sets": 3, "reps": "10-12", "rest": 60, "muscles": ["Mid Back", "Lats"], "primary": "Back", "type": "compound", "equip": "basic", "video": "pYcpY20QaE8", "instructions": "Hinge at hips, pull to belly button.", "difficulty": "beginner"},
        {"name": "Pull-Ups", "sets": 3, "reps": "6-10", "rest": 90, "muscles": ["Lats", "Biceps", "Rear Delts"], "primary": "Back", "type": "compound", "equip": "basic", "video": "eGo4IYlbE5g", "instructions": "Full hang to chin over bar.", "difficulty": "intermediate"},
        {"name": "Chin-Ups", "sets": 3, "reps": "6-10", "rest": 90, "muscles": ["Lats", "Biceps"], "primary": "Back", "type": "compound", "equip": "basic", "video": "brhRXlOhsAM", "instructions": "Underhand grip, chin over bar.", "difficulty": "intermediate"},
        {"name": "Dumbbell Pullover (Back)", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Lats", "Chest"], "primary": "Back", "type": "compound", "equip": "basic", "video": "FK4rHfWKEac", "instructions": "Focus on lat stretch.", "difficulty": "intermediate"},
        {"name": "Deadlift", "sets": 4, "reps": "6-8", "rest": 120, "muscles": ["Back", "Hamstrings", "Glutes", "Traps"], "primary": "Back", "type": "compound", "equip": "full", "video": "op9kVnSso6Q", "instructions": "Keep back straight, drive through heels.", "difficulty": "intermediate"},
        {"name": "Lat Pulldown (Wide)", "sets": 3, "reps": "10-12", "rest": 75, "muscles": ["Lats", "Biceps"], "primary": "Back", "type": "compound", "equip": "full", "video": "CAwf7n6Luuc", "instructions": "Pull to upper chest, squeeze lats.", "difficulty": "beginner"},
        {"name": "Lat Pulldown (Close)", "sets": 3, "reps": "10-12", "rest": 75, "muscles": ["Lats", "Biceps"], "primary": "Back", "type": "compound", "equip": "full", "video": "CAwf7n6Luuc", "instructions": "V-bar attachment, pull to chest.", "difficulty": "beginner"},
        {"name": "Seated Cable Row", "sets": 3, "reps": "10-12", "rest": 75, "muscles": ["Mid Back", "Rhomboids"], "primary": "Back", "type": "compound", "equip": "full", "video": "GZbfZ033f74", "instructions": "Squeeze shoulder blades together.", "difficulty": "beginner"},
        {"name": "Barbell Row", "sets": 4, "reps": "8-10", "rest": 90, "muscles": ["Mid Back", "Lats", "Biceps"], "primary": "Back", "type": "compound", "equip": "full", "video": "FWJR5Ve8bnQ", "instructions": "Hinge at hips, pull to lower chest.", "difficulty": "intermediate"},
        {"name": "T-Bar Row", "sets": 3, "reps": "10-12", "rest": 75, "muscles": ["Mid Back", "Lats"], "primary": "Back", "type": "compound", "equip": "full", "video": "FWJR5Ve8bnQ", "instructions": "Keep back straight, pull to chest.", "difficulty": "intermediate"},
        {"name": "Face Pulls", "sets": 3, "reps": "15-20", "rest": 60, "muscles": ["Rear Delts", "Traps", "Rotator Cuff"], "primary": "Back", "type": "isolation", "equip": "full", "video": "rep-qVOkqgk", "instructions": "Pull rope to face, external rotate.", "difficulty": "beginner"},
        {"name": "Meadows Row", "sets": 3, "reps": "10-12 each", "rest": 60, "muscles": ["Lats", "Upper Back"], "primary": "Back", "type": "compound", "equip": "full", "video": "FWJR5Ve8bnQ", "instructions": "Staggered stance, pull landmine to hip.", "difficulty": "intermediate"},
        {"name": "Inverted Row", "sets": 3, "reps": "10-15", "rest": 60, "muscles": ["Mid Back", "Biceps"], "primary": "Back", "type": "compound", "equip": "basic", "video": "OYUxXMGVuuU", "instructions": "Under bar, pull chest to bar.", "difficulty": "beginner"},
        {"name": "Straight-Arm Pulldown", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Lats"], "primary": "Back", "type": "isolation", "equip": "full", "video": "CAwf7n6Luuc", "instructions": "Arms straight, pull bar to thighs.", "difficulty": "beginner"},
        {"name": "Rack Pull", "sets": 3, "reps": "6-8", "rest": 120, "muscles": ["Upper Back", "Traps", "Glutes"], "primary": "Back", "type": "compound", "equip": "full", "video": "op9kVnSso6Q", "instructions": "Barbell at knee height, lockout.", "difficulty": "intermediate"},
        {"name": "Pendlay Row", "sets": 3, "reps": "8-10", "rest": 90, "muscles": ["Mid Back", "Lats"], "primary": "Back", "type": "compound", "equip": "full", "video": "FWJR5Ve8bnQ", "instructions": "Dead stop each rep, explosive pull.", "difficulty": "advanced"},
        {"name": "Chest-Supported Row", "sets": 3, "reps": "10-12", "rest": 60, "muscles": ["Mid Back", "Rear Delts"], "primary": "Back", "type": "compound", "equip": "basic", "video": "pYcpY20QaE8", "instructions": "Chest on incline bench, row DBs.", "difficulty": "beginner"},
        {"name": "Seal Row", "sets": 3, "reps": "10-12", "rest": 60, "muscles": ["Mid Back", "Lats"], "primary": "Back", "type": "compound", "equip": "full", "video": "FWJR5Ve8bnQ", "instructions": "Lie face down on elevated bench, row.", "difficulty": "intermediate"},
        {"name": "Kroc Row", "sets": 3, "reps": "15-20 each", "rest": 60, "muscles": ["Lats", "Grip"], "primary": "Back", "type": "compound", "equip": "basic", "video": "pYcpY20QaE8", "instructions": "Heavy single-arm row, controlled cheat.", "difficulty": "advanced"},
        {"name": "Cable Row (Wide)", "sets": 3, "reps": "10-12", "rest": 60, "muscles": ["Upper Back", "Rear Delts"], "primary": "Back", "type": "compound", "equip": "full", "video": "GZbfZ033f74", "instructions": "Wide grip, pull to chest.", "difficulty": "beginner"},
        {"name": "Hyperextension", "sets": 3, "reps": "12-15", "rest": 45, "muscles": ["Lower Back", "Glutes"], "primary": "Back", "type": "isolation", "equip": "full", "video": "z6PJMT2y8GQ", "instructions": "Controlled extension, squeeze at top.", "difficulty": "beginner"},
    ],
    "legs": [
        {"name": "Bodyweight Squats", "sets": 3, "reps": "20-25", "rest": 45, "muscles": ["Quads", "Glutes"], "primary": "Legs", "type": "compound", "equip": "home", "video": "aclHkVaku9U", "instructions": "Below parallel, drive through heels.", "difficulty": "beginner"},
        {"name": "Walking Lunges", "sets": 3, "reps": "12 each", "rest": 45, "muscles": ["Quads", "Glutes", "Hamstrings"], "primary": "Legs", "type": "compound", "equip": "home", "video": "D7KaRcUTQeE", "instructions": "Keep torso upright.", "difficulty": "beginner"},
        {"name": "Glute Bridge", "sets": 3, "reps": "15-20", "rest": 30, "muscles": ["Glutes", "Hamstrings"], "primary": "Legs", "type": "isolation", "equip": "home", "video": "OUgsJ8-Vi0E", "instructions": "Squeeze glutes at top.", "difficulty": "beginner"},
        {"name": "Calf Raises", "sets": 3, "reps": "20-25", "rest": 30, "muscles": ["Calves"], "primary": "Legs", "type": "isolation", "equip": "home", "video": "gwLzBJYoWlI", "instructions": "Full range, pause at top.", "difficulty": "beginner"},
        {"name": "Bulgarian Split Squat", "sets": 3, "reps": "10 each", "rest": 60, "muscles": ["Quads", "Glutes"], "primary": "Legs", "type": "compound", "equip": "home", "video": "2C-uNgKwPLE", "instructions": "Rear foot on bench.", "difficulty": "intermediate"},
        {"name": "Jump Squats", "sets": 3, "reps": "15-20", "rest": 45, "muscles": ["Quads", "Glutes", "Calves"], "primary": "Legs", "type": "compound", "equip": "home", "video": "CVaEhXotL7M", "instructions": "Explosive jump, land softly.", "difficulty": "intermediate"},
        {"name": "Wall Sit", "sets": 3, "reps": "45-60 sec", "rest": 45, "muscles": ["Quads"], "primary": "Legs", "type": "isolation", "equip": "home", "video": "aclHkVaku9U", "instructions": "Back against wall, thighs parallel.", "difficulty": "beginner"},
        {"name": "Dumbbell Squat", "sets": 4, "reps": "12-15", "rest": 75, "muscles": ["Quads", "Glutes"], "primary": "Legs", "type": "compound", "equip": "basic", "video": "LcGo1I-2E6k", "instructions": "Hold DBs at sides, full depth.", "difficulty": "beginner"},
        {"name": "Dumbbell RDL", "sets": 3, "reps": "10-12", "rest": 75, "muscles": ["Hamstrings", "Glutes", "Lower Back"], "primary": "Legs", "type": "compound", "equip": "basic", "video": "7j-2w4-P14I", "instructions": "Hinge at hips, feel hamstring stretch.", "difficulty": "intermediate"},
        {"name": "Dumbbell Lunges", "sets": 3, "reps": "10 each", "rest": 60, "muscles": ["Quads", "Glutes"], "primary": "Legs", "type": "compound", "equip": "basic", "video": "D7KaRcUTQeE", "instructions": "Step forward, knee over ankle.", "difficulty": "beginner"},
        {"name": "Dumbbell Step-Ups", "sets": 3, "reps": "10 each", "rest": 60, "muscles": ["Quads", "Glutes"], "primary": "Legs", "type": "compound", "equip": "basic", "video": "D7KaRcUTQeE", "instructions": "Step onto bench, drive through heel.", "difficulty": "beginner"},
        {"name": "Barbell Back Squat", "sets": 4, "reps": "8-10", "rest": 120, "muscles": ["Quads", "Glutes", "Hamstrings"], "primary": "Legs", "type": "compound", "equip": "full", "video": "ultWZbUMPL8", "instructions": "Below parallel, drive through heels.", "difficulty": "intermediate"},
        {"name": "Front Squat", "sets": 3, "reps": "8-10", "rest": 90, "muscles": ["Quads", "Core"], "primary": "Legs", "type": "compound", "equip": "full", "video": "ultWZbUMPL8", "instructions": "Bar on front delts, elbows high.", "difficulty": "advanced"},
        {"name": "Leg Press", "sets": 3, "reps": "12-15", "rest": 90, "muscles": ["Quads", "Glutes"], "primary": "Legs", "type": "compound", "equip": "full", "video": "IZxyjW7MPJQ", "instructions": "Don't lock knees at top.", "difficulty": "beginner"},
        {"name": "Leg Curl Machine", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Hamstrings"], "primary": "Legs", "type": "isolation", "equip": "full", "video": "1Tq3QdYUuHs", "instructions": "Slow eccentric, squeeze at peak.", "difficulty": "beginner"},
        {"name": "Leg Extension", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Quads"], "primary": "Legs", "type": "isolation", "equip": "full", "video": "YyvSfVjQeL0", "instructions": "Squeeze quads at top.", "difficulty": "beginner"},
        {"name": "Hack Squat", "sets": 3, "reps": "10-12", "rest": 90, "muscles": ["Quads", "Glutes"], "primary": "Legs", "type": "compound", "equip": "full", "video": "ultWZbUMPL8", "instructions": "Deep range of motion.", "difficulty": "intermediate"},
        {"name": "Calf Raises (Machine)", "sets": 4, "reps": "15-20", "rest": 45, "muscles": ["Calves"], "primary": "Legs", "type": "isolation", "equip": "full", "video": "gwLzBJYoWlI", "instructions": "Full range, pause at top.", "difficulty": "beginner"},
        {"name": "Barbell RDL", "sets": 3, "reps": "10-12", "rest": 90, "muscles": ["Hamstrings", "Glutes", "Lower Back"], "primary": "Legs", "type": "compound", "equip": "full", "video": "7j-2w4-P14I", "instructions": "Hinge at hips, bar close to legs.", "difficulty": "intermediate"},
        {"name": "Sumo Squat", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Inner Thighs", "Glutes", "Quads"], "primary": "Legs", "type": "compound", "equip": "basic", "video": "aclHkVaku9U", "instructions": "Wide stance, toes out, squat deep.", "difficulty": "beginner"},
        {"name": "Pistol Squat", "sets": 3, "reps": "5-8 each", "rest": 90, "muscles": ["Quads", "Glutes", "Balance"], "primary": "Legs", "type": "compound", "equip": "home", "video": "aclHkVaku9U", "instructions": "Single leg squat, other leg extended.", "difficulty": "advanced"},
        {"name": "Hip Thrust", "sets": 4, "reps": "12-15", "rest": 75, "muscles": ["Glutes", "Hamstrings"], "primary": "Legs", "type": "compound", "equip": "basic", "video": "OUgsJ8-Vi0E", "instructions": "Back on bench, thrust hips up.", "difficulty": "beginner"},
        {"name": "Nordic Curl", "sets": 3, "reps": "5-8", "rest": 90, "muscles": ["Hamstrings"], "primary": "Legs", "type": "isolation", "equip": "home", "video": "1Tq3QdYUuHs", "instructions": "Kneel, lower body forward slowly.", "difficulty": "advanced"},
        {"name": "Sissy Squat", "sets": 3, "reps": "10-15", "rest": 60, "muscles": ["Quads"], "primary": "Legs", "type": "isolation", "equip": "home", "video": "aclHkVaku9U", "instructions": "Lean back, bend knees forward.", "difficulty": "intermediate"},
        {"name": "Goblet Squat", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Quads", "Glutes", "Core"], "primary": "Legs", "type": "compound", "equip": "basic", "video": "LcGo1I-2E6k", "instructions": "Hold DB at chest, squat deep.", "difficulty": "beginner"},
        {"name": "Single-Leg RDL", "sets": 3, "reps": "10 each", "rest": 60, "muscles": ["Hamstrings", "Glutes", "Balance"], "primary": "Legs", "type": "compound", "equip": "basic", "video": "7j-2w4-P14I", "instructions": "One leg, hinge at hip.", "difficulty": "intermediate"},
        {"name": "Reverse Lunge", "sets": 3, "reps": "10 each", "rest": 60, "muscles": ["Quads", "Glutes"], "primary": "Legs", "type": "compound", "equip": "home", "video": "D7KaRcUTQeE", "instructions": "Step back into lunge position.", "difficulty": "beginner"},
        {"name": "Box Squat", "sets": 3, "reps": "8-10", "rest": 90, "muscles": ["Quads", "Glutes", "Hamstrings"], "primary": "Legs", "type": "compound", "equip": "full", "video": "ultWZbUMPL8", "instructions": "Squat to box, pause, stand up.", "difficulty": "intermediate"},
        {"name": "Leg Press (Narrow)", "sets": 3, "reps": "12-15", "rest": 75, "muscles": ["Quads"], "primary": "Legs", "type": "compound", "equip": "full", "video": "IZxyjW7MPJQ", "instructions": "Narrow stance, focus quads.", "difficulty": "beginner"},
        {"name": "Seated Calf Raise", "sets": 3, "reps": "15-20", "rest": 30, "muscles": ["Calves"], "primary": "Legs", "type": "isolation", "equip": "full", "video": "gwLzBJYoWlI", "instructions": "Seated, raise heels up.", "difficulty": "beginner"},
        {"name": "Good Mornings", "sets": 3, "reps": "10-12", "rest": 60, "muscles": ["Hamstrings", "Lower Back", "Glutes"], "primary": "Legs", "type": "compound", "equip": "full", "video": "7j-2w4-P14I", "instructions": "Bar on back, hinge at hips.", "difficulty": "intermediate"},
        {"name": "Zercher Squat", "sets": 3, "reps": "8-10", "rest": 90, "muscles": ["Quads", "Core", "Glutes"], "primary": "Legs", "type": "compound", "equip": "full", "video": "ultWZbUMPL8", "instructions": "Bar in elbow crease, squat.", "difficulty": "advanced"},
    ],
    "shoulders": [
        {"name": "Pike Push-Ups", "sets": 3, "reps": "10-15", "rest": 45, "muscles": ["Shoulders", "Triceps"], "primary": "Shoulders", "type": "compound", "equip": "home", "video": "sposDXWEB0A", "instructions": "Hips high, head towards ground.", "difficulty": "intermediate"},
        {"name": "Lateral Raises (Bottles)", "sets": 3, "reps": "15-20", "rest": 30, "muscles": ["Side Delts"], "primary": "Shoulders", "type": "isolation", "equip": "home", "video": "3VcKaXpzqRo", "instructions": "Use water bottles, raise to shoulder.", "difficulty": "beginner"},
        {"name": "Front Raises (Bottles)", "sets": 3, "reps": "12-15", "rest": 30, "muscles": ["Front Delts"], "primary": "Shoulders", "type": "isolation", "equip": "home", "video": "-t7fuZ0KhDA", "instructions": "Controlled, don't swing.", "difficulty": "beginner"},
        {"name": "Handstand Push-Ups (Wall)", "sets": 3, "reps": "5-8", "rest": 90, "muscles": ["Shoulders", "Triceps"], "primary": "Shoulders", "type": "compound", "equip": "home", "video": "sposDXWEB0A", "instructions": "Kick up against wall.", "difficulty": "advanced"},
        {"name": "Dumbbell Shoulder Press", "sets": 4, "reps": "10-12", "rest": 75, "muscles": ["Shoulders", "Triceps"], "primary": "Shoulders", "type": "compound", "equip": "basic", "video": "qEwKCR5JCog", "instructions": "Press straight up, don't arch.", "difficulty": "beginner"},
        {"name": "Dumbbell Lateral Raise", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Side Delts"], "primary": "Shoulders", "type": "isolation", "equip": "basic", "video": "3VcKaXpzqRo", "instructions": "Slight bend in elbows.", "difficulty": "beginner"},
        {"name": "Dumbbell Front Raise", "sets": 3, "reps": "12", "rest": 60, "muscles": ["Front Delts"], "primary": "Shoulders", "type": "isolation", "equip": "basic", "video": "-t7fuZ0KhDA", "instructions": "Alternate arms, controlled.", "difficulty": "beginner"},
        {"name": "Dumbbell Rear Delt Fly", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Rear Delts"], "primary": "Shoulders", "type": "isolation", "equip": "basic", "video": "EA7u4Q_8HQ0", "instructions": "Bend forward, squeeze at top.", "difficulty": "beginner"},
        {"name": "Arnold Press", "sets": 3, "reps": "10-12", "rest": 75, "muscles": ["Shoulders", "Front Delts"], "primary": "Shoulders", "type": "compound", "equip": "basic", "video": "qEwKCR5JCog", "instructions": "Rotate palms during press.", "difficulty": "intermediate"},
        {"name": "Upright Row", "sets": 3, "reps": "10-12", "rest": 60, "muscles": ["Shoulders", "Traps"], "primary": "Shoulders", "type": "compound", "equip": "basic", "video": "qEwKCR5JCog", "instructions": "Pull weight to chin, elbows high.", "difficulty": "intermediate"},
        {"name": "Z-Press", "sets": 3, "reps": "8-10", "rest": 75, "muscles": ["Shoulders", "Core"], "primary": "Shoulders", "type": "compound", "equip": "basic", "video": "qEwKCR5JCog", "instructions": "Seated on floor, press overhead.", "difficulty": "advanced"},
        {"name": "Reverse Pec Deck", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Rear Delts", "Upper Back"], "primary": "Shoulders", "type": "isolation", "equip": "full", "video": "rep-qVOkqgk", "instructions": "Face machine, squeeze rear delts.", "difficulty": "beginner"},
        {"name": "Plate Front Raise", "sets": 3, "reps": "12-15", "rest": 45, "muscles": ["Front Delts"], "primary": "Shoulders", "type": "isolation", "equip": "basic", "video": "-t7fuZ0KhDA", "instructions": "Hold plate, raise to eye level.", "difficulty": "beginner"},
        {"name": "Band Pull-Apart", "sets": 3, "reps": "15-20", "rest": 30, "muscles": ["Rear Delts", "Rotator Cuff"], "primary": "Shoulders", "type": "isolation", "equip": "home", "video": "rep-qVOkqgk", "instructions": "Pull band apart at chest height.", "difficulty": "beginner"},
        {"name": "Seated DB Shoulder Press", "sets": 3, "reps": "10-12", "rest": 75, "muscles": ["Shoulders", "Triceps"], "primary": "Shoulders", "type": "compound", "equip": "basic", "video": "qEwKCR5JCog", "instructions": "Seated, press DBs overhead.", "difficulty": "beginner"},
        {"name": "Arnold Press", "sets": 3, "reps": "10-12", "rest": 75, "muscles": ["Shoulders", "Triceps"], "primary": "Shoulders", "type": "compound", "equip": "basic", "video": "qEwKCR5JCog", "instructions": "Rotate palms as you press up.", "difficulty": "intermediate"},
        {"name": "Overhead Barbell Press", "sets": 4, "reps": "8-10", "rest": 90, "muscles": ["Shoulders", "Triceps"], "primary": "Shoulders", "type": "compound", "equip": "full", "video": "_RlRDWO2jfg", "instructions": "Brace core, press straight up.", "difficulty": "intermediate"},
        {"name": "Cable Lateral Raise", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Side Delts"], "primary": "Shoulders", "type": "isolation", "equip": "full", "video": "PPrzBWZDS_g", "instructions": "Constant cable tension.", "difficulty": "beginner"},
        {"name": "Machine Shoulder Press", "sets": 3, "reps": "10-12", "rest": 75, "muscles": ["Shoulders", "Triceps"], "primary": "Shoulders", "type": "compound", "equip": "full", "video": "qEwKCR5JCog", "instructions": "Guided path, press overhead.", "difficulty": "beginner"},
        {"name": "Reverse Pec Deck", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Rear Delts"], "primary": "Shoulders", "type": "isolation", "equip": "full", "video": "EA7u4Q_8HQ0", "instructions": "Squeeze rear delts at peak.", "difficulty": "beginner"},
        {"name": "Cable Face Pulls", "sets": 3, "reps": "15-20", "rest": 60, "muscles": ["Rear Delts", "Traps"], "primary": "Shoulders", "type": "isolation", "equip": "full", "video": "rep-qVOkqgk", "instructions": "Pull to face, external rotate.", "difficulty": "beginner"},
    ],
    "arms": [
        {"name": "Chin-Ups (Biceps)", "sets": 3, "reps": "6-10", "rest": 60, "muscles": ["Biceps", "Lats"], "primary": "Arms", "type": "compound", "equip": "home", "video": "brhRXlOhsAM", "instructions": "Underhand grip, chin over bar.", "difficulty": "intermediate"},
        {"name": "Towel Curls", "sets": 3, "reps": "10-12", "rest": 45, "muscles": ["Biceps"], "primary": "Arms", "type": "isolation", "equip": "home", "video": "PEikGKDVsCc", "instructions": "Step on towel, curl against resistance.", "difficulty": "beginner"},
        {"name": "Bench Dips", "sets": 3, "reps": "12-15", "rest": 45, "muscles": ["Triceps"], "primary": "Arms", "type": "compound", "equip": "home", "video": "6kALZikXxLc", "instructions": "Use chair/bench, go to 90 degrees.", "difficulty": "beginner"},
        {"name": "Bodyweight Skull Crushers", "sets": 3, "reps": "10-12", "rest": 45, "muscles": ["Triceps"], "primary": "Arms", "type": "isolation", "equip": "home", "video": "1jLbaIxmwnk", "instructions": "Use table edge, lower forehead.", "difficulty": "intermediate"},
        {"name": "Dumbbell Bicep Curl", "sets": 3, "reps": "10-12", "rest": 60, "muscles": ["Biceps"], "primary": "Arms", "type": "isolation", "equip": "basic", "video": "ykJmrZ5v0Oo", "instructions": "No swinging, strict form.", "difficulty": "beginner"},
        {"name": "Hammer Curl", "sets": 3, "reps": "12", "rest": 60, "muscles": ["Brachialis", "Biceps"], "primary": "Arms", "type": "isolation", "equip": "basic", "video": "zC3nLlEvin4", "instructions": "Neutral grip, controlled.", "difficulty": "beginner"},
        {"name": "Incline Dumbbell Curl", "sets": 3, "reps": "10-12", "rest": 60, "muscles": ["Biceps"], "primary": "Arms", "type": "isolation", "equip": "basic", "video": "soxrZlIl35U", "instructions": "Full stretch at bottom.", "difficulty": "intermediate"},
        {"name": "Concentration Curl", "sets": 3, "reps": "10-12 each", "rest": 60, "muscles": ["Biceps"], "primary": "Arms", "type": "isolation", "equip": "basic", "video": "ykJmrZ5v0Oo", "instructions": "Elbow on inner thigh, strict curl.", "difficulty": "beginner"},
        {"name": "Overhead DB Extension", "sets": 3, "reps": "10-12", "rest": 60, "muscles": ["Triceps"], "primary": "Arms", "type": "isolation", "equip": "basic", "video": "_gsUck-7M74", "instructions": "Keep elbows close to head.", "difficulty": "beginner"},
        {"name": "Dumbbell Kickbacks", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Triceps"], "primary": "Arms", "type": "isolation", "equip": "basic", "video": "6SS6K3lAwZ8", "instructions": "Squeeze at full extension.", "difficulty": "beginner"},
        {"name": "Close-Grip DB Press", "sets": 3, "reps": "10-12", "rest": 60, "muscles": ["Triceps", "Chest"], "primary": "Arms", "type": "compound", "equip": "basic", "video": "nEF0bv2FW94", "instructions": "Dumbbells touching, press up.", "difficulty": "beginner"},
        {"name": "EZ Bar Curl", "sets": 3, "reps": "10-12", "rest": 60, "muscles": ["Biceps"], "primary": "Arms", "type": "isolation", "equip": "full", "video": "kwG2ipFRgFo", "instructions": "No swinging, strict form.", "difficulty": "beginner"},
        {"name": "Preacher Curl Machine", "sets": 3, "reps": "10-12", "rest": 60, "muscles": ["Biceps"], "primary": "Arms", "type": "isolation", "equip": "full", "video": "fIWP-FRFNU0", "instructions": "Full stretch, squeeze at top.", "difficulty": "beginner"},
        {"name": "Cable Curl", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Biceps"], "primary": "Arms", "type": "isolation", "equip": "full", "video": "NFzTWp2qpiE", "instructions": "Constant cable tension.", "difficulty": "beginner"},
        {"name": "Tricep Rope Pushdown", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Triceps"], "primary": "Arms", "type": "isolation", "equip": "full", "video": "2-LAMcpzODU", "instructions": "Spread rope at bottom, squeeze.", "difficulty": "beginner"},
        {"name": "Close-Grip Bench Press", "sets": 3, "reps": "8-10", "rest": 75, "muscles": ["Triceps", "Chest"], "primary": "Arms", "type": "compound", "equip": "full", "video": "nEF0bv2FW94", "instructions": "Hands shoulder-width apart.", "difficulty": "intermediate"},
        {"name": "Skull Crushers (EZ Bar)", "sets": 3, "reps": "10-12", "rest": 60, "muscles": ["Triceps"], "primary": "Arms", "type": "isolation", "equip": "full", "video": "d_KZxkY_0cM", "instructions": "Lower to forehead, elbows fixed.", "difficulty": "intermediate"},
        {"name": "Overhead Cable Extension", "sets": 3, "reps": "12-15", "rest": 60, "muscles": ["Triceps"], "primary": "Arms", "type": "isolation", "equip": "full", "video": "2-LAMcpzODU", "instructions": "Face away from cable, extend.", "difficulty": "beginner"},
        {"name": "Skull Crushers", "sets": 3, "reps": "10-12", "rest": 60, "muscles": ["Triceps"], "primary": "Arms", "type": "isolation", "equip": "full", "video": "d_KZxkY_0cM", "instructions": "Lower bar to forehead, extend.", "difficulty": "intermediate"},
        {"name": "Tricep Dips (Bench)", "sets": 3, "reps": "12-15", "rest": 45, "muscles": ["Triceps", "Chest"], "primary": "Arms", "type": "compound", "equip": "home", "video": "dX_nSOOJIsE", "instructions": "Hands on bench behind, dip down.", "difficulty": "beginner"},
        {"name": "Reverse Curls", "sets": 3, "reps": "12-15", "rest": 45, "muscles": ["Forearms", "Biceps"], "primary": "Arms", "type": "isolation", "equip": "basic", "video": "zC3nLlEvin4", "instructions": "Overhand grip curl.", "difficulty": "beginner"},
        {"name": "Wrist Curls", "sets": 3, "reps": "15-20", "rest": 30, "muscles": ["Forearms"], "primary": "Arms", "type": "isolation", "equip": "basic", "video": "zC3nLlEvin4", "instructions": "Seated, curl wrists up.", "difficulty": "beginner"},
        {"name": "Spider Curls", "sets": 3, "reps": "10-12", "rest": 45, "muscles": ["Biceps"], "primary": "Arms", "type": "isolation", "equip": "basic", "video": "zC3nLlEvin4", "instructions": "Chest on incline bench, curl.", "difficulty": "intermediate"},
        {"name": "Close-Grip Push-Ups", "sets": 3, "reps": "12-15", "rest": 45, "muscles": ["Triceps", "Chest"], "primary": "Arms", "type": "compound", "equip": "home", "video": "J0DnG1_S3li8", "instructions": "Hands close together, push up.", "difficulty": "beginner"},
        {"name": "21s Bicep Curls", "sets": 3, "reps": "21", "rest": 60, "muscles": ["Biceps"], "primary": "Arms", "type": "isolation", "equip": "basic", "video": "zC3nLlEvin4", "instructions": "7 bottom half, 7 top half, 7 full.", "difficulty": "intermediate"},
        {"name": "Cable Tricep Kickback", "sets": 3, "reps": "12-15", "rest": 45, "muscles": ["Triceps"], "primary": "Arms", "type": "isolation", "equip": "full", "video": "d_KZxkY_0cM", "instructions": "Hinge forward, extend arm back.", "difficulty": "beginner"},
        {"name": "Barbell Curl", "sets": 3, "reps": "10-12", "rest": 60, "muscles": ["Biceps"], "primary": "Arms", "type": "isolation", "equip": "full", "video": "zC3nLlEvin4", "instructions": "Straight bar, controlled curl.", "difficulty": "beginner"},
        {"name": "Diamond Push-Up (Triceps)", "sets": 3, "reps": "10-15", "rest": 45, "muscles": ["Triceps", "Chest"], "primary": "Arms", "type": "compound", "equip": "home", "video": "J0DnG1_S3li8", "instructions": "Diamond hand position, focus triceps.", "difficulty": "intermediate"},
    ],
    "core": [
        {"name": "Plank Hold", "sets": 3, "reps": "45-60 sec", "rest": 30, "muscles": ["Core", "Shoulders"], "primary": "Core", "type": "isolation", "equip": "home", "video": "ASdvN_XEl_c", "instructions": "Keep body straight, engage abs.", "difficulty": "beginner"},
        {"name": "Bicycle Crunches", "sets": 3, "reps": "20 each", "rest": 30, "muscles": ["Obliques", "Abs"], "primary": "Core", "type": "isolation", "equip": "home", "video": "9FGilxCbdz8", "instructions": "Touch elbow to opposite knee.", "difficulty": "beginner"},
        {"name": "Hanging Leg Raise", "sets": 3, "reps": "10-15", "rest": 60, "muscles": ["Lower Abs", "Hip Flexors"], "primary": "Core", "type": "isolation", "equip": "basic", "video": "hdng3Nm1x_E", "instructions": "Hang from bar, raise legs to 90.", "difficulty": "intermediate"},
        {"name": "Ab Wheel Rollout", "sets": 3, "reps": "8-12", "rest": 60, "muscles": ["Abs", "Core"], "primary": "Core", "type": "compound", "equip": "basic", "video": "hdng3Nm1x_E", "instructions": "Roll out slowly, pull back.", "difficulty": "intermediate"},
        {"name": "Cable Woodchop", "sets": 3, "reps": "12 each", "rest": 45, "muscles": ["Obliques", "Core"], "primary": "Core", "type": "compound", "equip": "full", "video": "hdng3Nm1x_E", "instructions": "Rotate torso, pull cable across.", "difficulty": "intermediate"},
        {"name": "Side Plank", "sets": 3, "reps": "30-45 sec each", "rest": 30, "muscles": ["Obliques", "Core"], "primary": "Core", "type": "isolation", "equip": "home", "video": "hdng3Nm1x_E", "instructions": "Stack feet, hold body straight.", "difficulty": "beginner"},
        {"name": "Dead Bug", "sets": 3, "reps": "10 each", "rest": 30, "muscles": ["Core", "Deep Stabilizers"], "primary": "Core", "type": "isolation", "equip": "home", "video": "hdng3Nm1x_E", "instructions": "Back flat, extend opposite arm/leg.", "difficulty": "beginner"},
        {"name": "V-Ups", "sets": 3, "reps": "12-15", "rest": 45, "muscles": ["Abs", "Hip Flexors"], "primary": "Core", "type": "isolation", "equip": "home", "video": "hdng3Nm1x_E", "instructions": "Touch toes at top of V.", "difficulty": "intermediate"},
        {"name": "Toe Touches", "sets": 3, "reps": "15-20", "rest": 30, "muscles": ["Upper Abs"], "primary": "Core", "type": "isolation", "equip": "home", "video": "hdng3Nm1x_E", "instructions": "Legs up, reach for toes.", "difficulty": "beginner"},
        {"name": "Dragon Flag", "sets": 3, "reps": "5-8", "rest": 90, "muscles": ["Abs", "Core", "Lats"], "primary": "Core", "type": "compound", "equip": "basic", "video": "hdng3Nm1x_E", "instructions": "Grip bench, lower body slowly.", "difficulty": "advanced"},
        {"name": "Decline Sit-Ups", "sets": 3, "reps": "15-20", "rest": 45, "muscles": ["Abs"], "primary": "Core", "type": "isolation", "equip": "full", "video": "hdng3Nm1x_E", "instructions": "On decline bench, sit up.", "difficulty": "beginner"},
        {"name": "Weighted Plank", "sets": 3, "reps": "30-60 sec", "rest": 45, "muscles": ["Core", "Shoulders"], "primary": "Core", "type": "isolation", "equip": "basic", "video": "hdng3Nm1x_E", "instructions": "Plank with plate on back.", "difficulty": "intermediate"},
        {"name": "Pallof Press", "sets": 3, "reps": "10-12 each", "rest": 45, "muscles": ["Core", "Obliques"], "primary": "Core", "type": "isolation", "equip": "full", "video": "hdng3Nm1x_E", "instructions": "Resist rotation, press cable out.", "difficulty": "beginner"},
        {"name": "Hollow Body Hold", "sets": 3, "reps": "30-45 sec", "rest": 45, "muscles": ["Abs", "Core"], "primary": "Core", "type": "isolation", "equip": "home", "video": "hdng3Nm1x_E", "instructions": "Arms overhead, legs extended, hold.", "difficulty": "intermediate"},
        {"name": "Leg Raises", "sets": 3, "reps": "15", "rest": 30, "muscles": ["Lower Abs"], "primary": "Core", "type": "isolation", "equip": "home", "video": "JB2oyawG9KI", "instructions": "Keep lower back pressed down.", "difficulty": "beginner"},
        {"name": "Mountain Climbers", "sets": 3, "reps": "30 sec", "rest": 30, "muscles": ["Core", "Cardio"], "primary": "Core", "type": "compound", "equip": "home", "video": "nmwgirgXLYM", "instructions": "Fast pace, keep hips level.", "difficulty": "beginner"},
        {"name": "Russian Twists", "sets": 3, "reps": "20 each", "rest": 30, "muscles": ["Obliques"], "primary": "Core", "type": "isolation", "equip": "home", "video": "wkD8rjkodUI", "instructions": "Use weight for resistance.", "difficulty": "beginner"},
        {"name": "Dead Bug", "sets": 3, "reps": "10 each", "rest": 30, "muscles": ["Core", "Lower Abs"], "primary": "Core", "type": "isolation", "equip": "home", "video": "ASdvN_XEl_c", "instructions": "Opposite arm/leg extend, back flat.", "difficulty": "beginner"},
        {"name": "V-Ups", "sets": 3, "reps": "12-15", "rest": 30, "muscles": ["Abs"], "primary": "Core", "type": "isolation", "equip": "home", "video": "JB2oyawG9KI", "instructions": "Touch toes at top.", "difficulty": "intermediate"},
        {"name": "Flutter Kicks", "sets": 3, "reps": "30 sec", "rest": 30, "muscles": ["Lower Abs"], "primary": "Core", "type": "isolation", "equip": "home", "video": "JB2oyawG9KI", "instructions": "Small kicks, lower back down.", "difficulty": "beginner"},
        {"name": "Ab Roller", "sets": 3, "reps": "10-12", "rest": 45, "muscles": ["Core", "Lats"], "primary": "Core", "type": "compound", "equip": "basic", "video": "ASdvN_XEl_c", "instructions": "Roll out slowly, pull back with abs.", "difficulty": "intermediate"},
        {"name": "Cable Woodchops", "sets": 3, "reps": "12 each", "rest": 45, "muscles": ["Obliques", "Core"], "primary": "Core", "type": "compound", "equip": "full", "video": "AV5PmSFfUkQ", "instructions": "Rotate torso, pivot on feet.", "difficulty": "intermediate"},
        {"name": "Cable Crunches", "sets": 3, "reps": "15-20", "rest": 45, "muscles": ["Upper Abs"], "primary": "Core", "type": "isolation", "equip": "full", "video": "AV5PmSFfUkQ", "instructions": "Kneel, crunch against cable.", "difficulty": "beginner"},
        {"name": "Hanging Leg Raises", "sets": 3, "reps": "10-15", "rest": 45, "muscles": ["Lower Abs"], "primary": "Core", "type": "isolation", "equip": "full", "video": "hdng3Nm1x_E", "instructions": "Hang from bar, raise legs.", "difficulty": "intermediate"},
    ],
    "stretching": [
        {"name": "Standing Hamstring Stretch", "sets": 2, "reps": "30 sec each", "rest": 15, "muscles": ["Hamstrings"], "primary": "Stretching", "type": "isolation", "equip": "home", "video": "dZgVxmf6jkA", "instructions": "Straight leg on elevated surface, lean forward.", "difficulty": "beginner"},
        {"name": "Hip Flexor Stretch", "sets": 2, "reps": "30 sec each", "rest": 15, "muscles": ["Hip Flexors", "Quads"], "primary": "Stretching", "type": "isolation", "equip": "home", "video": "dZgVxmf6jkA", "instructions": "Lunge position, push hips forward.", "difficulty": "beginner"},
        {"name": "Pigeon Pose", "sets": 2, "reps": "30 sec each", "rest": 15, "muscles": ["Glutes", "Hip Flexors"], "primary": "Stretching", "type": "isolation", "equip": "home", "video": "dZgVxmf6jkA", "instructions": "Front knee bent, back leg extended.", "difficulty": "beginner"},
        {"name": "Cat-Cow Stretch", "sets": 2, "reps": "10 reps", "rest": 15, "muscles": ["Spine", "Core"], "primary": "Stretching", "type": "isolation", "equip": "home", "video": "dZgVxmf6jkA", "instructions": "Alternate arching and rounding back.", "difficulty": "beginner"},
        {"name": "Child's Pose", "sets": 2, "reps": "30 sec", "rest": 15, "muscles": ["Lower Back", "Shoulders"], "primary": "Stretching", "type": "isolation", "equip": "home", "video": "dZgVxmf6jkA", "instructions": "Kneel, sit back, arms extended.", "difficulty": "beginner"},
        {"name": "Chest Doorway Stretch", "sets": 2, "reps": "30 sec each", "rest": 15, "muscles": ["Chest", "Shoulders"], "primary": "Stretching", "type": "isolation", "equip": "home", "video": "dZgVxmf6jkA", "instructions": "Arm on doorframe, lean through.", "difficulty": "beginner"},
        {"name": "Shoulder Cross-Body Stretch", "sets": 2, "reps": "30 sec each", "rest": 15, "muscles": ["Rear Delts", "Shoulders"], "primary": "Stretching", "type": "isolation", "equip": "home", "video": "dZgVxmf6jkA", "instructions": "Pull arm across body.", "difficulty": "beginner"},
        {"name": "Tricep Overhead Stretch", "sets": 2, "reps": "30 sec each", "rest": 15, "muscles": ["Triceps"], "primary": "Stretching", "type": "isolation", "equip": "home", "video": "dZgVxmf6jkA", "instructions": "Arm behind head, pull elbow.", "difficulty": "beginner"},
        {"name": "Quad Stretch (Standing)", "sets": 2, "reps": "30 sec each", "rest": 15, "muscles": ["Quads"], "primary": "Stretching", "type": "isolation", "equip": "home", "video": "dZgVxmf6jkA", "instructions": "Grab ankle, pull heel to glute.", "difficulty": "beginner"},
        {"name": "Seated Forward Fold", "sets": 2, "reps": "30 sec", "rest": 15, "muscles": ["Hamstrings", "Lower Back"], "primary": "Stretching", "type": "isolation", "equip": "home", "video": "dZgVxmf6jkA", "instructions": "Legs straight, reach for toes.", "difficulty": "beginner"},
        {"name": "Lat Side Stretch", "sets": 2, "reps": "30 sec each", "rest": 15, "muscles": ["Lats", "Obliques"], "primary": "Stretching", "type": "isolation", "equip": "home", "video": "dZgVxmf6jkA", "instructions": "Arm overhead, lean to side.", "difficulty": "beginner"},
        {"name": "World's Greatest Stretch", "sets": 2, "reps": "5 each", "rest": 15, "muscles": ["Full Body"], "primary": "Stretching", "type": "compound", "equip": "home", "video": "dZgVxmf6jkA", "instructions": "Lunge, rotate, reach up.", "difficulty": "beginner"},
    ],
    "cardio": [
        {"name": "Burpees", "sets": 3, "reps": "10-15", "rest": 45, "muscles": ["Full Body"], "primary": "Cardio", "type": "compound", "equip": "home", "video": "dZgVxmf6jkA", "instructions": "Squat, jump back, push-up, jump up.", "difficulty": "intermediate"},
        {"name": "Mountain Climbers", "sets": 3, "reps": "30 sec", "rest": 30, "muscles": ["Core", "Shoulders"], "primary": "Cardio", "type": "compound", "equip": "home", "video": "dZgVxmf6jkA", "instructions": "Plank position, alternate knees to chest.", "difficulty": "beginner"},
        {"name": "Jumping Jacks", "sets": 3, "reps": "30-45 sec", "rest": 30, "muscles": ["Full Body"], "primary": "Cardio", "type": "compound", "equip": "home", "video": "dZgVxmf6jkA", "instructions": "Jump feet out, arms up, repeat.", "difficulty": "beginner"},
        {"name": "Box Jumps", "sets": 3, "reps": "10-12", "rest": 60, "muscles": ["Quads", "Glutes", "Calves"], "primary": "Cardio", "type": "compound", "equip": "basic", "video": "CVaEhXotL7M", "instructions": "Jump onto box, stand fully, step down.", "difficulty": "intermediate"},
        {"name": "Battle Ropes", "sets": 3, "reps": "30 sec", "rest": 45, "muscles": ["Shoulders", "Core", "Arms"], "primary": "Cardio", "type": "compound", "equip": "full", "video": "dZgVxmf6jkA", "instructions": "Alternate waves with heavy ropes.", "difficulty": "intermediate"},
        {"name": "Jump Rope", "sets": 3, "reps": "60 sec", "rest": 30, "muscles": ["Calves", "Shoulders"], "primary": "Cardio", "type": "compound", "equip": "home", "video": "dZgVxmf6jkA", "instructions": "Light bounces, wrists rotate rope.", "difficulty": "beginner"},
        {"name": "Kettlebell Swings", "sets": 3, "reps": "15-20", "rest": 60, "muscles": ["Glutes", "Hamstrings", "Core"], "primary": "Cardio", "type": "compound", "equip": "basic", "video": "dZgVxmf6jkA", "instructions": "Hip hinge, explosive swing to chest.", "difficulty": "intermediate"},
        {"name": "Sprint Intervals", "sets": 5, "reps": "30 sec", "rest": 60, "muscles": ["Quads", "Hamstrings", "Calves"], "primary": "Cardio", "type": "compound", "equip": "home", "video": "dZgVxmf6jkA", "instructions": "Sprint 30s, rest 60s, repeat.", "difficulty": "intermediate"},
        {"name": "High Knees", "sets": 3, "reps": "30 sec", "rest": 30, "muscles": ["Core", "Hip Flexors"], "primary": "Cardio", "type": "compound", "equip": "home", "video": "dZgVxmf6jkA", "instructions": "Run in place, knees to waist.", "difficulty": "beginner"},
        {"name": "Bear Crawl", "sets": 3, "reps": "30 sec", "rest": 45, "muscles": ["Core", "Shoulders", "Quads"], "primary": "Cardio", "type": "compound", "equip": "home", "video": "dZgVxmf6jkA", "instructions": "Crawl forward on hands and toes.", "difficulty": "intermediate"},
        {"name": "Skater Jumps", "sets": 3, "reps": "12 each", "rest": 30, "muscles": ["Glutes", "Quads", "Balance"], "primary": "Cardio", "type": "compound", "equip": "home", "video": "dZgVxmf6jkA", "instructions": "Lateral jumps side to side.", "difficulty": "intermediate"},
        {"name": "Rowing Machine", "sets": 3, "reps": "500m", "rest": 90, "muscles": ["Back", "Legs", "Arms"], "primary": "Cardio", "type": "compound", "equip": "full", "video": "dZgVxmf6jkA", "instructions": "Drive legs first, then pull.", "difficulty": "beginner"},
    ],
}

EQUIP_LEVELS = {"home": 0, "basic": 1, "full": 2}
EQUIP_MAP = {"home": 0, "basic_gym": 1, "full_gym": 2}


def filter_by_equipment(exercises, user_equip):
    max_level = EQUIP_MAP.get(user_equip, 2)
    return [ex for ex in exercises if EQUIP_LEVELS.get(ex.get("equip", "full"), 2) <= max_level]


def adjust_for_level(exercise, fitness_level, goal):
    ex = dict(exercise)
    base_sets = ex["sets"]
    if fitness_level == "beginner":
        ex["sets"] = max(2, base_sets - 1)
        ex["rest"] = min(ex["rest"] + 15, 120)
    elif fitness_level == "advanced":
        ex["sets"] = base_sets + 1
        ex["rest"] = max(ex["rest"] - 15, 15)
    if goal == "fat_loss":
        ex["rest"] = max(ex["rest"] - 10, 15)
    elif goal == "muscle_gain":
        ex["rest"] = ex["rest"] + 10
    return ex


def compute_bmr_tdee(weight_kg, height_cm, age, gender, goal):
    if gender == "female":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    tdee = bmr * 1.55
    if goal == "fat_loss":
        target_cal = int(tdee - 500)
    elif goal == "muscle_gain":
        target_cal = int(tdee + 300)
    else:
        target_cal = int(tdee)
    target_cal = max(target_cal, 1400)
    if goal == "fat_loss":
        protein = int(weight_kg * 2.2)
        fat = int(target_cal * 0.25 / 9)
    elif goal == "muscle_gain":
        protein = int(weight_kg * 2.0)
        fat = int(target_cal * 0.25 / 9)
    else:
        protein = int(weight_kg * 1.6)
        fat = int(target_cal * 0.28 / 9)
    carbs = int((target_cal - protein * 4 - fat * 9) / 4)
    carbs = max(carbs, 80)
    return {"bmr": int(bmr), "tdee": int(tdee), "calories": target_cal, "protein": protein, "carbs": carbs, "fat": fat}


# =====================================================================
# WORKOUT SPLIT DEFINITIONS
# =====================================================================
SPLITS = {
    "ppl": {
        "name": "Push / Pull / Legs",
        "days": [
            {"day": "Monday", "title": "Push (Chest, Shoulders, Triceps)", "groups": ["chest", "shoulders", "arms"], "filter_arms": "triceps"},
            {"day": "Tuesday", "title": "Pull (Back, Biceps)", "groups": ["back", "arms"], "filter_arms": "biceps"},
            {"day": "Wednesday", "title": "Legs & Core", "groups": ["legs", "core"]},
            {"day": "Thursday", "title": "Push (Chest, Shoulders, Triceps)", "groups": ["chest", "shoulders", "arms"], "filter_arms": "triceps"},
            {"day": "Friday", "title": "Pull (Back, Biceps)", "groups": ["back", "arms"], "filter_arms": "biceps"},
            {"day": "Saturday", "title": "Legs & Core", "groups": ["legs", "core"]},
            {"day": "Sunday", "title": "Rest Day", "groups": [], "is_rest": True},
        ]
    },
    "upper_lower": {
        "name": "Upper / Lower",
        "days": [
            {"day": "Monday", "title": "Upper Body", "groups": ["chest", "back", "shoulders", "arms"]},
            {"day": "Tuesday", "title": "Lower Body & Core", "groups": ["legs", "core"]},
            {"day": "Wednesday", "title": "Rest Day", "groups": [], "is_rest": True},
            {"day": "Thursday", "title": "Upper Body", "groups": ["chest", "back", "shoulders", "arms"]},
            {"day": "Friday", "title": "Lower Body & Core", "groups": ["legs", "core"]},
            {"day": "Saturday", "title": "Full Body HIIT", "groups": ["chest", "legs", "core"]},
            {"day": "Sunday", "title": "Rest Day", "groups": [], "is_rest": True},
        ]
    },
    "bro_split": {
        "name": "Bro Split (5-Day)",
        "days": [
            {"day": "Monday", "title": "Chest", "groups": ["chest"]},
            {"day": "Tuesday", "title": "Back", "groups": ["back"]},
            {"day": "Wednesday", "title": "Shoulders & Arms", "groups": ["shoulders", "arms"]},
            {"day": "Thursday", "title": "Legs", "groups": ["legs"]},
            {"day": "Friday", "title": "Arms & Core", "groups": ["arms", "core"]},
            {"day": "Saturday", "title": "Rest / Active Recovery", "groups": [], "is_rest": True},
            {"day": "Sunday", "title": "Rest Day", "groups": [], "is_rest": True},
        ]
    },
    "full_body": {
        "name": "Full Body (3-Day)",
        "days": [
            {"day": "Monday", "title": "Full Body A", "groups": ["chest", "back", "legs", "core"]},
            {"day": "Tuesday", "title": "Rest / Cardio", "groups": [], "is_rest": True},
            {"day": "Wednesday", "title": "Full Body B", "groups": ["shoulders", "arms", "legs", "core"]},
            {"day": "Thursday", "title": "Rest / Cardio", "groups": [], "is_rest": True},
            {"day": "Friday", "title": "Full Body C", "groups": ["chest", "back", "shoulders", "arms", "core"]},
            {"day": "Saturday", "title": "Active Recovery", "groups": [], "is_rest": True},
            {"day": "Sunday", "title": "Rest Day", "groups": [], "is_rest": True},
        ]
    }
}


def pick_split(goal, fitness_level):
    if fitness_level == "beginner":
        return "full_body" if goal == "general_fitness" else "upper_lower"
    elif fitness_level == "advanced":
        return "ppl"
    else:
        return "ppl" if goal == "muscle_gain" else "upper_lower"


def generate_workout_day(groups, equipment, fitness_level, goal, user_id, day_seed, filter_arms=None):
    seed_str = f"{user_id}-{day_seed}-{datetime.utcnow().strftime('%Y-%W')}"
    seed = int(hashlib.md5(seed_str.encode()).hexdigest(), 16) % (10**9)
    rng = random.Random(seed)
    exercises = []
    for group in groups:
        pool = EXERCISE_DB.get(group, [])
        pool = filter_by_equipment(pool, equipment)
        if filter_arms and group == "arms":
            if filter_arms == "triceps":
                pool = [e for e in pool if any(m.lower() in ["triceps"] for m in e["muscles"])]
            elif filter_arms == "biceps":
                pool = [e for e in pool if any(m.lower() in ["biceps", "brachialis"] for m in e["muscles"])]
        rng.shuffle(pool)
        major = ["chest", "back", "legs"]
        count = (4 if fitness_level == "advanced" else 3) if group in major else (3 if fitness_level == "advanced" else 2)
        for ex in pool[:count]:
            exercises.append(adjust_for_level(ex, fitness_level, goal))
    return exercises


def generate_diet_plan(weight_kg, height_cm, age, gender, goal):
    macros = compute_bmr_tdee(weight_kg, height_cm, age, gender, goal)
    cal = macros["calories"]
    scale = cal / 2200
    meals = [
        {"time": "7:00 AM", "name": "Pre-Workout", "items": ["Banana (1)", f"Almonds ({int(5*scale)} pcs)", "Black Coffee / Green Tea"], "calories": int(200*scale), "protein": int(5*scale), "carbs": int(30*scale), "fat": int(8*scale)},
        {"time": "10:30 AM", "name": "Post-Workout", "items": ["Whey Protein (1 scoop)", f"Oats ({int(50*scale)}g) with Pintola PB", f"Eggs ({max(3,int(5*scale))} boiled)", "Apple (1)"], "calories": int(650*scale), "protein": int(50*scale), "carbs": int(60*scale), "fat": int(20*scale)},
        {"time": "1:00 PM", "name": "Lunch", "items": [f"Chicken ({int(150*scale)}g) / Paneer ({int(200*scale)}g)", f"Brown Rice ({int(150*scale)}g) / Roti ({max(1,int(2*scale))})", "Dal (1 bowl)", "Sabzi + Salad", "Orange"], "calories": int(550*scale), "protein": int(45*scale), "carbs": int(55*scale), "fat": int(15*scale)},
        {"time": "4:30 PM", "name": "Evening Snack", "items": ["Greek Yogurt (200g)", f"Mixed Nuts ({int(15*scale)} pcs)", "Seasonal Fruit"], "calories": int(250*scale), "protein": int(15*scale), "carbs": int(20*scale), "fat": int(12*scale)},
        {"time": "7:30 PM", "name": "Dinner", "items": [f"Fish/Chicken ({int(150*scale)}g)", "Sabzi (2 types)", "Salad", "Raita", "Papaya (1 bowl)"], "calories": int(400*scale), "protein": int(40*scale), "carbs": int(15*scale), "fat": int(18*scale)},
        {"time": "9:30 PM", "name": "Before Bed", "items": ["Warm Milk (1 glass)", f"Almonds ({int(5*scale)} pcs)", "Magnesium supplement"], "calories": int(150*scale), "protein": int(10*scale), "carbs": int(12*scale), "fat": int(8*scale)},
    ]
    supplements = [
        {"name": "Whey Protein", "timing": "Post-workout (within 30 min)", "icon": "protein"},
        {"name": "Creatine Monohydrate", "timing": "5g daily with post-workout shake", "icon": "supplement"},
        {"name": "Fish Oil (Omega-3)", "timing": "With lunch", "icon": "pill"},
        {"name": "Multivitamin", "timing": "With breakfast", "icon": "pill"},
        {"name": "Magnesium", "timing": "Before bed", "icon": "pill"},
        {"name": "Electrolyte", "timing": "During workout", "icon": "water"},
        {"name": "Vitamin D3", "timing": "With breakfast", "icon": "sun"},
    ]
    return {
        "goal": goal,
        "personalized_for": {"weight": weight_kg, "height": height_cm, "age": age, "gender": gender, "bmr": macros["bmr"], "tdee": macros["tdee"]},
        "daily_targets": {"calories": macros["calories"], "protein": macros["protein"], "carbs": macros["carbs"], "fat": macros["fat"]},
        "meals": meals,
        "supplements": supplements,
    }


# =====================================================================
# API ROUTES
# =====================================================================

@app.get("/api/workout-plan")
def get_workout_plan(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        profile = conn.execute("SELECT * FROM profiles WHERE user_id = ?", (user["id"],)).fetchone()
        if not profile or not profile["goal"]:
            raise HTTPException(status_code=400, detail="Complete your profile first")
        p = dict(profile)
    goal = p.get("goal", "general_fitness")
    level = p.get("fitness_level", "intermediate")
    equip = p.get("equipment", "full_gym")
    weight = p.get("weight", 70)
    height_ = p.get("height", 170)
    age = p.get("age", 25)
    gender = p.get("gender", "male")
    split_key = pick_split(goal, level)
    split = SPLITS[split_key]
    macros = compute_bmr_tdee(weight, height_, age, gender, goal)
    days = []
    for day_def in split["days"]:
        if day_def.get("is_rest"):
            days.append({"day": day_def["day"], "title": day_def["title"], "is_rest": True, "exercises": []})
        else:
            exercises = generate_workout_day(
                day_def["groups"], equip, level, goal, user["id"],
                day_def["day"], filter_arms=day_def.get("filter_arms")
            )
            est_cal = int(len(exercises) * 35 * (1.2 if goal == "fat_loss" else 1.0))
            days.append({
                "day": day_def["day"], "title": day_def["title"], "is_rest": False,
                "exercises": exercises, "est_calories": est_cal,
                "est_duration": int(len(exercises) * 7 + 10),
            })
    return {
        "split_name": split["name"], "split_key": split_key,
        "goal": goal, "fitness_level": level, "equipment": equip,
        "personalized_for": {"weight": weight, "height": height_, "age": age, "gender": gender},
        "macros": macros, "days": days,
    }


@app.get("/api/diet-plan")
def get_diet_plan(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        profile = conn.execute("SELECT * FROM profiles WHERE user_id = ?", (user["id"],)).fetchone()
        if not profile or not profile["goal"]:
            raise HTTPException(status_code=400, detail="Complete your profile first")
        p = dict(profile)
    return generate_diet_plan(
        p.get("weight", 70), p.get("height", 170),
        p.get("age", 25), p.get("gender", "male"),
        p.get("goal", "general_fitness"),
    )


@app.get("/api/exercises")
def get_exercises(
    muscle: Optional[str] = None, equipment: Optional[str] = None,
    search: Optional[str] = None, user: dict = Depends(get_current_user),
):
    all_ex = []
    for group, exs in EXERCISE_DB.items():
        for ex in exs:
            e = dict(ex)
            e["group"] = group
            all_ex.append(e)
    if muscle:
        ml = muscle.lower()
        all_ex = [e for e in all_ex if ml in e["primary"].lower() or ml in e["group"].lower() or any(ml in m.lower() for m in e.get("muscles", []))]
    if equipment:
        max_lv = EQUIP_MAP.get(equipment, 2)
        all_ex = [e for e in all_ex if EQUIP_LEVELS.get(e.get("equip", "full"), 2) <= max_lv]
    if search:
        sl = search.lower()
        all_ex = [e for e in all_ex if sl in e["name"].lower()]
    with get_db() as conn:
        favs = conn.execute("SELECT exercise_name FROM favorites WHERE user_id = ?", (user["id"],)).fetchall()
        fav_names = {f["exercise_name"] for f in favs}
        for e in all_ex:
            e["is_favorite"] = e["name"] in fav_names
    return {"total": len(all_ex), "exercises": all_ex}


@app.get("/api/exercises/similar")
def get_similar_exercises(exercise_name: str = Query(...), user: dict = Depends(get_current_user)):
    target = None
    target_group = None
    for group, exs in EXERCISE_DB.items():
        for ex in exs:
            if ex["name"] == exercise_name:
                target = ex
                target_group = group
                break
        if target:
            break
    if not target:
        return {"similar": []}
    pool = EXERCISE_DB.get(target_group, [])
    similar = [dict(ex) for ex in pool if ex["name"] != exercise_name]
    for s in similar:
        s["group"] = target_group
    return {"similar": similar[:8]}


# --- Workout Session Management ---
@app.post("/api/sessions/start")
def start_session(data: StartSessionReq, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        today = datetime.utcnow().strftime("%Y-%m-%d")
        cursor = conn.execute(
            "INSERT INTO workout_sessions (user_id, date, day_title) VALUES (?, ?, ?)",
            (user["id"], today, data.day_title),
        )
        return {"session_id": cursor.lastrowid, "date": today}


@app.post("/api/sessions/log-set")
def log_set(data: LogSetReq, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        conn.execute(
            "INSERT INTO exercise_logs (session_id, user_id, exercise_name, muscle_group, set_number, reps, weight_kg, completed) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
            (data.session_id, user["id"], data.exercise_name, data.muscle_group, data.set_number, data.reps, data.weight_kg),
        )
        volume = data.reps * data.weight_kg
        existing = conn.execute(
            "SELECT * FROM personal_records WHERE user_id = ? AND exercise_name = ?",
            (user["id"], data.exercise_name),
        ).fetchone()
        new_pr = False
        if existing:
            uf, uv = [], []
            if data.weight_kg > existing["best_weight"]:
                uf.append("best_weight = ?"); uv.append(data.weight_kg); new_pr = True
            if data.reps > existing["best_reps"]:
                uf.append("best_reps = ?"); uv.append(data.reps); new_pr = True
            if volume > existing["best_volume"]:
                uf.append("best_volume = ?"); uv.append(volume); new_pr = True
            if uf:
                uf.append("date_achieved = ?"); uv.append(datetime.utcnow().strftime("%Y-%m-%d"))
                uf.append("updated_at = datetime('now')")
                uv.extend([user["id"], data.exercise_name])
                conn.execute(f"UPDATE personal_records SET {', '.join(uf)} WHERE user_id = ? AND exercise_name = ?", uv)
        else:
            conn.execute(
                "INSERT INTO personal_records (user_id, exercise_name, best_weight, best_reps, best_volume, date_achieved) VALUES (?, ?, ?, ?, ?, ?)",
                (user["id"], data.exercise_name, data.weight_kg, data.reps, volume, datetime.utcnow().strftime("%Y-%m-%d")),
            )
            new_pr = True
        return {"status": "logged", "volume": volume, "new_pr": new_pr}


@app.post("/api/sessions/finish")
def finish_session(data: FinishSessionReq, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        sets_done = conn.execute("SELECT COUNT(*) as cnt FROM exercise_logs WHERE session_id = ? AND user_id = ?", (data.session_id, user["id"])).fetchone()["cnt"]
        exercises_done = conn.execute("SELECT COUNT(DISTINCT exercise_name) as cnt FROM exercise_logs WHERE session_id = ? AND user_id = ?", (data.session_id, user["id"])).fetchone()["cnt"]
        total_vol = conn.execute("SELECT COALESCE(SUM(reps * weight_kg), 0) as vol FROM exercise_logs WHERE session_id = ? AND user_id = ?", (data.session_id, user["id"])).fetchone()["vol"]
        conn.execute(
            "UPDATE workout_sessions SET completed = 1, duration_min = ?, calories_burned = ?, exercises_done = ?, total_volume = ? WHERE id = ? AND user_id = ?",
            (data.duration_min, data.calories_burned, exercises_done, total_vol, data.session_id, user["id"]),
        )
        return {"status": "completed", "sets_done": sets_done, "exercises_done": exercises_done, "total_volume": total_vol}


@app.get("/api/sessions/history")
def get_session_history(limit: int = 20, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        sessions = conn.execute(
            "SELECT * FROM workout_sessions WHERE user_id = ? AND completed = 1 ORDER BY date DESC LIMIT ?",
            (user["id"], limit),
        ).fetchall()
        result = []
        for s in sessions:
            sd = dict(s)
            logs = conn.execute(
                "SELECT * FROM exercise_logs WHERE session_id = ? ORDER BY exercise_name, set_number",
                (s["id"],),
            ).fetchall()
            sd["exercise_logs"] = [dict(l) for l in logs]
            result.append(sd)
        return result


# --- Favorites ---
@app.post("/api/favorites/toggle")
def toggle_favorite(data: ToggleFavoriteReq, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        existing = conn.execute("SELECT id FROM favorites WHERE user_id = ? AND exercise_name = ?", (user["id"], data.exercise_name)).fetchone()
        if existing:
            conn.execute("DELETE FROM favorites WHERE id = ?", (existing["id"],))
            return {"status": "removed", "is_favorite": False}
        else:
            conn.execute("INSERT INTO favorites (user_id, exercise_name) VALUES (?, ?)", (user["id"], data.exercise_name))
            return {"status": "added", "is_favorite": True}


@app.get("/api/favorites")
def get_favorites(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        favs = conn.execute("SELECT exercise_name FROM favorites WHERE user_id = ?", (user["id"],)).fetchall()
        return [f["exercise_name"] for f in favs]


# --- Personal Records ---
@app.get("/api/personal-records")
def get_personal_records(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        prs = conn.execute("SELECT * FROM personal_records WHERE user_id = ? ORDER BY updated_at DESC", (user["id"],)).fetchall()
        return [dict(pr) for pr in prs]


# --- Body Logs ---
@app.post("/api/body-logs")
def create_body_log(data: BodyLogCreate, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        conn.execute(
            "INSERT INTO body_logs (user_id, date, weight, body_fat, chest, waist, hips, arms, thighs, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (user["id"], data.date, data.weight, data.body_fat, data.chest, data.waist, data.hips, data.arms, data.thighs, data.notes),
        )
        return {"status": "logged"}


@app.get("/api/body-logs")
def get_body_logs(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        logs = conn.execute("SELECT * FROM body_logs WHERE user_id = ? ORDER BY date DESC LIMIT 30", (user["id"],)).fetchall()
        return [dict(l) for l in logs]


# --- Daily Check-ins ---
@app.post("/api/checkins")
def create_checkin(data: DailyCheckinCreate, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        existing = conn.execute("SELECT id FROM daily_checkins WHERE user_id = ? AND date = ?", (user["id"], data.date)).fetchone()
        if existing:
            conn.execute(
                "UPDATE daily_checkins SET water_litres=?, sleep_hours=?, workout_completed=?, diet_followed=?, mood=? WHERE id=?",
                (data.water_litres, data.sleep_hours, data.workout_completed, data.diet_followed, data.mood, existing["id"]),
            )
        else:
            conn.execute(
                "INSERT INTO daily_checkins (user_id, date, water_litres, sleep_hours, workout_completed, diet_followed, mood) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (user["id"], data.date, data.water_litres, data.sleep_hours, data.workout_completed, data.diet_followed, data.mood),
            )
        return {"status": "ok"}


@app.get("/api/checkins")
def get_checkins(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM daily_checkins WHERE user_id = ? ORDER BY date DESC LIMIT 30", (user["id"],)).fetchall()
        return [dict(r) for r in rows]


# --- Analytics / Stats ---
@app.get("/api/stats")
def get_stats(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        total_sessions = conn.execute("SELECT COUNT(*) as cnt FROM workout_sessions WHERE user_id = ? AND completed = 1", (user["id"],)).fetchone()["cnt"]
        total_vol = conn.execute("SELECT COALESCE(SUM(total_volume), 0) as vol FROM workout_sessions WHERE user_id = ? AND completed = 1", (user["id"],)).fetchone()["vol"]
        total_cal = conn.execute("SELECT COALESCE(SUM(calories_burned), 0) as cal FROM workout_sessions WHERE user_id = ? AND completed = 1", (user["id"],)).fetchone()["cal"]
        week_start = (datetime.utcnow() - timedelta(days=datetime.utcnow().weekday())).strftime("%Y-%m-%d")
        week_sessions = conn.execute("SELECT COUNT(*) as cnt FROM workout_sessions WHERE user_id = ? AND completed = 1 AND date >= ?", (user["id"], week_start)).fetchone()["cnt"]
        profile = conn.execute("SELECT weekly_goal FROM profiles WHERE user_id = ?", (user["id"],)).fetchone()
        weekly_goal = profile["weekly_goal"] if profile and profile["weekly_goal"] else 4
        streak = 0
        sessions = conn.execute("SELECT DISTINCT date FROM workout_sessions WHERE user_id = ? AND completed = 1 ORDER BY date DESC", (user["id"],)).fetchall()
        if sessions:
            check_date = datetime.utcnow().date()
            session_dates = {s["date"] for s in sessions}
            for i in range(365):
                d = (check_date - timedelta(days=i)).strftime("%Y-%m-%d")
                if d in session_dates:
                    streak += 1
                elif i > 0:
                    break
        weekly_data = []
        for w in range(8):
            start = (datetime.utcnow() - timedelta(weeks=w+1)).strftime("%Y-%m-%d")
            end = (datetime.utcnow() - timedelta(weeks=w)).strftime("%Y-%m-%d")
            count = conn.execute("SELECT COUNT(*) as cnt FROM workout_sessions WHERE user_id = ? AND completed = 1 AND date >= ? AND date < ?", (user["id"], start, end)).fetchone()["cnt"]
            cal = conn.execute("SELECT COALESCE(SUM(calories_burned), 0) as cal FROM workout_sessions WHERE user_id = ? AND completed = 1 AND date >= ? AND date < ?", (user["id"], start, end)).fetchone()["cal"]
            weekly_data.append({"week": f"W-{w}", "workouts": count, "calories": cal})
        weekly_data.reverse()
        muscle_dist = conn.execute("SELECT muscle_group, COUNT(*) as cnt FROM exercise_logs WHERE user_id = ? GROUP BY muscle_group ORDER BY cnt DESC", (user["id"],)).fetchall()
        recent_prs = conn.execute("SELECT * FROM personal_records WHERE user_id = ? ORDER BY updated_at DESC LIMIT 5", (user["id"],)).fetchall()
        weight_hist = conn.execute("SELECT date, weight FROM body_logs WHERE user_id = ? AND weight IS NOT NULL ORDER BY date ASC LIMIT 30", (user["id"],)).fetchall()
        return {
            "total_sessions": total_sessions, "total_volume": total_vol, "total_calories": total_cal,
            "week_sessions": week_sessions, "weekly_goal": weekly_goal, "streak": streak,
            "weekly_data": weekly_data, "muscle_distribution": [dict(m) for m in muscle_dist],
            "recent_prs": [dict(pr) for pr in recent_prs], "weight_history": [dict(w) for w in weight_hist],
        }


@app.get("/api/exercise-history")
def get_exercise_history(exercise_name: str = Query(...), user: dict = Depends(get_current_user)):
    with get_db() as conn:
        logs = conn.execute(
            "SELECT el.*, ws.date FROM exercise_logs el JOIN workout_sessions ws ON el.session_id = ws.id WHERE el.user_id = ? AND el.exercise_name = ? ORDER BY ws.date DESC, el.set_number ASC LIMIT 100",
            (user["id"], exercise_name),
        ).fetchall()
        return [dict(l) for l in logs]



# --- Achievement Definitions ---
ACHIEVEMENT_DEFS = [
    {"key": "first_workout", "name": "First Step", "desc": "Complete your first workout", "icon": "footprints", "check": lambda stats: stats.get("total_sessions", 0) >= 1},
    {"key": "five_workouts", "name": "Getting Started", "desc": "Complete 5 workouts", "icon": "flame", "check": lambda stats: stats.get("total_sessions", 0) >= 5},
    {"key": "ten_workouts", "name": "Consistent", "desc": "Complete 10 workouts", "icon": "zap", "check": lambda stats: stats.get("total_sessions", 0) >= 10},
    {"key": "twenty_five_workouts", "name": "Dedicated", "desc": "Complete 25 workouts", "icon": "star", "check": lambda stats: stats.get("total_sessions", 0) >= 25},
    {"key": "fifty_workouts", "name": "Iron Will", "desc": "Complete 50 workouts", "icon": "trophy", "check": lambda stats: stats.get("total_sessions", 0) >= 50},
    {"key": "hundred_workouts", "name": "Century Club", "desc": "Complete 100 workouts", "icon": "crown", "check": lambda stats: stats.get("total_sessions", 0) >= 100},
    {"key": "streak_3", "name": "3-Day Streak", "desc": "Work out 3 days in a row", "icon": "flame", "check": lambda stats: stats.get("streak", 0) >= 3},
    {"key": "streak_7", "name": "Week Warrior", "desc": "Work out 7 days in a row", "icon": "flame", "check": lambda stats: stats.get("streak", 0) >= 7},
    {"key": "streak_14", "name": "Two Week Terror", "desc": "14-day workout streak", "icon": "flame", "check": lambda stats: stats.get("streak", 0) >= 14},
    {"key": "streak_30", "name": "Monthly Monster", "desc": "30-day workout streak", "icon": "flame", "check": lambda stats: stats.get("streak", 0) >= 30},
    {"key": "cal_1000", "name": "Calorie Crusher", "desc": "Burn 1,000 total calories", "icon": "flame", "check": lambda stats: stats.get("total_calories", 0) >= 1000},
    {"key": "cal_5000", "name": "Furnace", "desc": "Burn 5,000 total calories", "icon": "flame", "check": lambda stats: stats.get("total_calories", 0) >= 5000},
    {"key": "cal_10000", "name": "Inferno", "desc": "Burn 10,000 total calories", "icon": "flame", "check": lambda stats: stats.get("total_calories", 0) >= 10000},
    {"key": "vol_10000", "name": "Heavy Lifter", "desc": "Lift 10,000 kg total volume", "icon": "dumbbell", "check": lambda stats: stats.get("total_volume", 0) >= 10000},
    {"key": "vol_50000", "name": "Iron Giant", "desc": "Lift 50,000 kg total volume", "icon": "dumbbell", "check": lambda stats: stats.get("total_volume", 0) >= 50000},
    {"key": "vol_100000", "name": "Titan", "desc": "Lift 100,000 kg total volume", "icon": "dumbbell", "check": lambda stats: stats.get("total_volume", 0) >= 100000},
    {"key": "pr_5", "name": "PR Hunter", "desc": "Set 5 personal records", "icon": "medal", "check": lambda stats: stats.get("total_prs", 0) >= 5},
    {"key": "pr_20", "name": "Record Breaker", "desc": "Set 20 personal records", "icon": "medal", "check": lambda stats: stats.get("total_prs", 0) >= 20},
    {"key": "pr_50", "name": "Legendary", "desc": "Set 50 personal records", "icon": "medal", "check": lambda stats: stats.get("total_prs", 0) >= 50},
    {"key": "profile_done", "name": "All Set", "desc": "Complete your profile setup", "icon": "user-check", "check": lambda stats: stats.get("profile_done", False)},
]

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "change-me-in-production")


# --- Achievements ---
def check_achievements(user_id: int):
    with get_db() as conn:
        total_sessions = conn.execute("SELECT COUNT(*) as cnt FROM workout_sessions WHERE user_id = ? AND completed = 1", (user_id,)).fetchone()["cnt"]
        total_vol = conn.execute("SELECT COALESCE(SUM(total_volume), 0) as vol FROM workout_sessions WHERE user_id = ? AND completed = 1", (user_id,)).fetchone()["vol"]
        total_cal = conn.execute("SELECT COALESCE(SUM(calories_burned), 0) as cal FROM workout_sessions WHERE user_id = ? AND completed = 1", (user_id,)).fetchone()["cal"]
        total_prs = conn.execute("SELECT COUNT(*) as cnt FROM personal_records WHERE user_id = ?", (user_id,)).fetchone()["cnt"]
        profile = conn.execute("SELECT onboarding_done FROM profiles WHERE user_id = ?", (user_id,)).fetchone()
        profile_done = bool(profile and profile["onboarding_done"])
        streak = 0
        sessions = conn.execute("SELECT DISTINCT date FROM workout_sessions WHERE user_id = ? AND completed = 1 ORDER BY date DESC", (user_id,)).fetchall()
        if sessions:
            from datetime import date as dt_date
            check_date = datetime.utcnow().date()
            session_dates = {s["date"] for s in sessions}
            for i in range(365):
                d = (check_date - timedelta(days=i)).strftime("%Y-%m-%d")
                if d in session_dates:
                    streak += 1
                elif i > 0:
                    break
        stats = {"total_sessions": total_sessions, "total_volume": total_vol, "total_calories": total_cal, "total_prs": total_prs, "streak": streak, "profile_done": profile_done}
        newly_unlocked = []
        for ach in ACHIEVEMENT_DEFS:
            existing = conn.execute("SELECT id FROM achievements WHERE user_id = ? AND badge_key = ?", (user_id, ach["key"])).fetchone()
            if not existing and ach["check"](stats):
                conn.execute("INSERT INTO achievements (user_id, badge_key, badge_name, badge_desc, badge_icon) VALUES (?, ?, ?, ?, ?)",
                    (user_id, ach["key"], ach["name"], ach["desc"], ach["icon"]))
                newly_unlocked.append({"key": ach["key"], "name": ach["name"], "desc": ach["desc"], "icon": ach["icon"]})
        return newly_unlocked


@app.get("/api/achievements")
def get_achievements(user: dict = Depends(get_current_user)):
    newly = check_achievements(user["id"])
    with get_db() as conn:
        all_badges = conn.execute("SELECT * FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC", (user["id"],)).fetchall()
    unlocked = [dict(b) for b in all_badges]
    all_possible = [{"key": a["key"], "name": a["name"], "desc": a["desc"], "icon": a["icon"]} for a in ACHIEVEMENT_DEFS]
    unlocked_keys = {b["badge_key"] for b in unlocked}
    locked = [a for a in all_possible if a["key"] not in unlocked_keys]
    return {"unlocked": unlocked, "locked": locked, "newly_unlocked": newly, "total": len(ACHIEVEMENT_DEFS), "earned": len(unlocked)}


# --- Custom Splits ---
@app.post("/api/custom-splits")
def create_custom_split(data: CustomSplitCreate, user: dict = Depends(get_current_user)):
    import json
    with get_db() as conn:
        cursor = conn.execute("INSERT INTO custom_splits (user_id, name, split_type, days_json) VALUES (?, ?, ?, ?)",
            (user["id"], data.name, data.split_type, json.dumps(data.days)))
        return {"id": cursor.lastrowid, "name": data.name, "split_type": data.split_type}


@app.get("/api/custom-splits")
def get_custom_splits(user: dict = Depends(get_current_user)):
    import json
    with get_db() as conn:
        splits = conn.execute("SELECT * FROM custom_splits WHERE user_id = ? ORDER BY updated_at DESC", (user["id"],)).fetchall()
        result = []
        for s in splits:
            d = dict(s)
            d["days"] = json.loads(d["days_json"])
            del d["days_json"]
            result.append(d)
        return result


@app.delete("/api/custom-splits/{split_id}")
def delete_custom_split(split_id: int, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        conn.execute("DELETE FROM custom_splits WHERE id = ? AND user_id = ?", (split_id, user["id"]))
        return {"status": "deleted"}


# --- Notifications ---
@app.get("/api/notifications")
def get_notifications(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        notifs = conn.execute("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50", (user["id"],)).fetchall()
        unread = conn.execute("SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND read = 0", (user["id"],)).fetchone()["cnt"]
        return {"notifications": [dict(n) for n in notifs], "unread_count": unread}


@app.post("/api/notifications/read-all")
def mark_notifications_read(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        conn.execute("UPDATE notifications SET read = 1 WHERE user_id = ?", (user["id"],))
        return {"status": "ok"}


# --- Admin Panel ---
def verify_admin(password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Invalid admin password")


@app.get("/api/admin/stats")
def admin_stats(admin_key: str = Query(...)):
    verify_admin(admin_key)
    with get_db() as conn:
        total_users = conn.execute("SELECT COUNT(*) as cnt FROM users").fetchone()["cnt"]
        total_sessions = conn.execute("SELECT COUNT(*) as cnt FROM workout_sessions WHERE completed = 1").fetchone()["cnt"]
        total_exercises = sum(len(v) for v in EXERCISE_DB.values())
        active_today = conn.execute("SELECT COUNT(DISTINCT user_id) as cnt FROM workout_sessions WHERE date = date('now')").fetchone()["cnt"]
        return {"total_users": total_users, "total_sessions": total_sessions, "total_exercises": total_exercises, "active_today": active_today}


@app.get("/api/admin/users")
def admin_users(admin_key: str = Query(...)):
    verify_admin(admin_key)
    with get_db() as conn:
        users = conn.execute("SELECT u.id, u.email, u.name, u.created_at, p.goal, p.fitness_level, p.equipment, p.onboarding_done FROM users u LEFT JOIN profiles p ON u.id = p.user_id ORDER BY u.created_at DESC").fetchall()
        result = []
        for u in users:
            ud = dict(u)
            sessions = conn.execute("SELECT COUNT(*) as cnt FROM workout_sessions WHERE user_id = ? AND completed = 1", (u["id"],)).fetchone()["cnt"]
            ud["total_sessions"] = sessions
            result.append(ud)
        return result


@app.post("/api/admin/exercises")
def admin_add_exercise(data: AdminExerciseCreate, admin_key: str = Query(...)):
    verify_admin(admin_key)
    group = data.group.lower()
    if group not in EXERCISE_DB:
        EXERCISE_DB[group] = []
    ex = {"name": data.name, "sets": data.sets, "reps": data.reps, "rest": data.rest,
        "muscles": data.muscles, "primary": data.primary or data.group.title(),
        "type": data.type, "equip": data.equip, "video": data.video,
        "instructions": data.instructions, "difficulty": data.difficulty}
    EXERCISE_DB[group].append(ex)
    return {"status": "added", "exercise": ex, "total": sum(len(v) for v in EXERCISE_DB.values())}


@app.delete("/api/admin/exercises/{exercise_name}")
def admin_delete_exercise(exercise_name: str, admin_key: str = Query(...)):
    verify_admin(admin_key)
    for group in EXERCISE_DB:
        EXERCISE_DB[group] = [e for e in EXERCISE_DB[group] if e["name"] != exercise_name]
    return {"status": "deleted", "total": sum(len(v) for v in EXERCISE_DB.values())}


@app.get("/api/muscle-groups")
def get_muscle_groups(user: dict = Depends(get_current_user)):
    groups = {}
    for group, exs in EXERCISE_DB.items():
        groups[group] = {"count": len(exs), "exercises": [e["name"] for e in exs]}
    with get_db() as conn:
        recent = conn.execute("SELECT muscle_group, COUNT(*) as cnt FROM exercise_logs WHERE user_id = ? AND created_at >= datetime('now', '-7 days') GROUP BY muscle_group", (user["id"],)).fetchall()
        trained_this_week = {r["muscle_group"]: r["cnt"] for r in recent}
    return {"groups": groups, "trained_this_week": trained_this_week, "total_exercises": sum(len(v) for v in EXERCISE_DB.values())}


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "3.0.0", "exercises": sum(len(v) for v in EXERCISE_DB.values())}
