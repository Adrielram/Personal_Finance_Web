require('dotenv').config({ path: '../.env' }); // Load environment variables from root .env
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all origins (adjust for production)
app.use(express.json()); // Parse JSON request bodies

// Database setup
const dbPath = path.resolve(__dirname, '..', process.env.DATABASE_PATH || 'database/finance.db');
console.log(`Database path: ${dbPath}`);
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Run schema script if table doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT CHECK(type IN ('expense', 'income')) NOT NULL,
            name TEXT NOT NULL,
            category TEXT,
            description TEXT,
            amount REAL NOT NULL CHECK(amount > 0),
            date_created DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error("Error creating table:", err.message);
            }
        });
    }
});

// Make db accessible to routes
app.use((req, res, next) => {
    req.db = db;
    next();
});

// Import and use routes
const entryRoutes = require('./routes/entries');
const voiceRoutes = require('./routes/voice');

app.use('/entries', entryRoutes);
app.use('/analyze-voice', voiceRoutes);

// Basic error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Closed the database connection.');
        process.exit(0);
    });
});
