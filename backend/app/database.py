import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.environ.get("DB_PATH", "/opt/aabhooshanbazaar-backend/aabhooshan.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        name_hi TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT DEFAULT '',
        description_hi TEXT DEFAULT '',
        image_url TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS designs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        title_hi TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        category_id INTEGER NOT NULL,
        description TEXT DEFAULT '',
        description_hi TEXT DEFAULT '',
        weight_grams REAL DEFAULT 0,
        purity TEXT DEFAULT '22K',
        price_range TEXT DEFAULT '',
        images TEXT DEFAULT '[]',
        tags TEXT DEFAULT '',
        is_featured INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        views INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS gold_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        gold_24k REAL NOT NULL,
        gold_22k REAL NOT NULL,
        gold_18k REAL NOT NULL,
        silver_rate REAL NOT NULL,
        city TEXT DEFAULT 'Jaipur',
        created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS blogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        title_hi TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        content TEXT NOT NULL,
        content_hi TEXT NOT NULL,
        excerpt TEXT DEFAULT '',
        excerpt_hi TEXT DEFAULT '',
        image_url TEXT DEFAULT '',
        category TEXT DEFAULT 'general',
        tags TEXT DEFAULT '',
        is_published INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_designs_category ON designs(category_id);
    CREATE INDEX IF NOT EXISTS idx_designs_featured ON designs(is_featured);
    CREATE INDEX IF NOT EXISTS idx_designs_active ON designs(is_active);
    CREATE INDEX IF NOT EXISTS idx_gold_rates_date ON gold_rates(date);
    CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(is_published);
    CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
    """)
    
    conn.commit()
    conn.close()
