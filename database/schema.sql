-- SQL script to create the entries table for the Personal Finance Tracker

CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK(type IN ('expense', 'income')) NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    amount REAL NOT NULL CHECK(amount > 0),
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP
);
