const express = require('express');
const router = express.Router();

// POST /entries - Create a new expense or income entry
router.post('/', (req, res) => {
    const { type, name, category, description, amount } = req.body;
    const db = req.db; // Access db connection from middleware

    // Basic validation
    if (!type || !name || !amount) {
        return res.status(400).json({ error: 'Missing required fields: type, name, amount' });
    }
    if (type !== 'expense' && type !== 'income') {
        return res.status(400).json({ error: 'Invalid type: must be \'expense\' or \'income\'.' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount: must be a positive number.' });
    }

    const sql = `INSERT INTO entries (type, name, category, description, amount) VALUES (?, ?, ?, ?, ?)`;
    const params = [type, name, category || null, description || null, amount];

    db.run(sql, params, function(err) {
        if (err) {
            console.error("Error inserting entry:", err.message);
            return res.status(500).json({ error: 'Database error while creating entry.' });
        }
        res.status(201).json({ id: this.lastID, ...req.body });
    });
});

// GET /entries - Retrieve entries, optionally filtered by date range
router.get('/', (req, res) => {
    const { start, end } = req.query;
    const db = req.db;
    let sql = `SELECT id, type, name, category, description, amount, strftime('%Y-%m-%dT%H:%M:%SZ', date_created) as date_created FROM entries`;
    const params = [];

    if (start && end) {
        // Basic date validation (could be more robust)
        if (!/\d{4}-\d{2}-\d{2}/.test(start) || !/\d{4}-\d{2}-\d{2}/.test(end)) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        }
        sql += ' WHERE date(date_created) BETWEEN date(?) AND date(?)';
        params.push(start, end);
    } else if (start || end) {
        return res.status(400).json({ error: 'Both start and end dates are required for filtering.' });
    }

    sql += ' ORDER BY date_created DESC'; // Default sort order

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error("Error fetching entries:", err.message);
            return res.status(500).json({ error: 'Database error while fetching entries.' });
        }
        res.json(rows);
    });
});

module.exports = router;
