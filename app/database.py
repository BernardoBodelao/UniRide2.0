import os
import sqlite3

DB_PATH = os.environ.get(
    "DATABASE_URL",
    os.path.join(os.path.dirname(__file__), "..", "uniride.db"),
)


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            email    TEXT    NOT NULL UNIQUE,
            password TEXT    NOT NULL,
            name     TEXT,
            course   TEXT,
            phone    TEXT,
            bio      TEXT
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS rides (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL,
            from_loc   TEXT    NOT NULL,
            to_loc     TEXT    NOT NULL,
            ride_time  TEXT    NOT NULL,
            seats      INTEGER NOT NULL,
            created_at TEXT    DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS ride_participants (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            ride_id    INTEGER NOT NULL,
            user_id    INTEGER NOT NULL,
            joined_at  TEXT DEFAULT (datetime('now','localtime')),
            UNIQUE (ride_id, user_id),
            FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """
    )

    conn.commit()
    conn.close()
