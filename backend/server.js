const express = require('express');
const cors = require('cors'); 
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 8081;

app.use(cors());
app.use(express.json());

const db = new Database('database.db');

// Create customer table
db.prepare(`
  CREATE TABLE IF NOT EXISTS customer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_number TEXT NOT NULL UNIQUE,
    location TEXT,
    gender TEXT
  )
`).run();

// Create calllog table (fixed syntax error)
db.prepare(`
  CREATE TABLE IF NOT EXISTS calllog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    called_at DATETIME,
    customer_number TEXT NOT NULL,
    outcome TEXT,
    remark TEXT,
    FOREIGN KEY(customer_number) REFERENCES customer(customer_number)
  )
`).run();

// Create users table
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL
  )
`).run();

// Simple route
app.get('/', (req, res) => {
  res.send('VAPI Call App');
});


// CUSTOMER ENDPOINTS (ADDED MISSING ENDPOINTS)
app.get('/customers', (req, res) => {
  try {
    const customers = db.prepare('SELECT * FROM customer').all();
    res.json(customers);
  } catch (err) {
    console.error('DB Query Error:', err);
    res.status(500).json({ error: 'Failed to retrieve customers' });
  }
});

app.post('/customers', (req, res) => {
  const { customer_number, location, gender } = req.body;
  
  if (!customer_number) {
    return res.status(400).json({ error: 'Customer number is required' });
  }
  
  try {
    const stmt = db.prepare(`
      INSERT INTO customer (customer_number, location, gender)
      VALUES (?, ?, ?)
    `);
    
    const info = stmt.run(
      customer_number,
      location || null,
      gender || 'Male'
    );
    
    const newCustomer = db.prepare('SELECT * FROM customer WHERE id = ?')
      .get(info.lastInsertRowid);
    
    res.status(201).json(newCustomer);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Customer number already exists' });
    }
    console.error('DB Insert Error:', err);
    res.status(500).json({ error: 'Database operation failed' });
  }
});

// USERS endpoints
app.get('/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users);
});

app.post('/users', (req, res) => {
  const { name, email} = req.body;
  try {
    const stmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
    const info = stmt.run(name, email);
    res.status(201).json({ id: info.lastInsertRowid, name, email });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// CALLLOG ENDPOINTS (REMOVED DUPLICATE)
// GET /calllogs (with filtering)
app.get('/calllogs', (req, res) => {
  try {
    let query = `
      SELECT calllog.*, customer.location AS customer_location
      FROM calllog
      LEFT JOIN customer ON calllog.customer_number = customer.customer_number
      WHERE 1=1
    `;
    
    const params = [];
    
    if (req.query.customer_number) {
      query += ' AND calllog.customer_number LIKE ?';
      params.push(`%${req.query.customer_number}%`);
    }
    
    if (req.query.outcome) {
      query += ' AND outcome = ?';
      params.push(req.query.outcome);
    }
    
    if (req.query.start_date) {
      query += ' AND called_at >= ?';
      params.push(req.query.start_date);
    }
    
    if (req.query.end_date) {
      query += ' AND called_at <= ?';
      params.push(req.query.end_date);
    }
    
    query += ' ORDER BY called_at DESC';
    
    const stmt = db.prepare(query);
    const logs = stmt.all(...params);
    
    res.json(logs);
  } catch (err) {
    console.error('DB Query Error:', err);
    res.status(500).json({ error: 'Failed to retrieve call logs' });
  }
});

// POST /calllogs
app.post('/calllogs', (req, res) => {
  const { called_at, customer_number, outcome, remark } = req.body;

  if (!called_at || !customer_number || !outcome) {
    return res.status(400).json({ 
      error: 'called_at, customer_number, and outcome are required.' 
    });
  }

  try {
    // Check customer exists
    const customer = db.prepare(`
      SELECT * FROM customer WHERE customer_number = ?
    `).get(customer_number);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const stmt = db.prepare(`
      INSERT INTO calllog (called_at, customer_number, outcome, remark)
      VALUES (?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      called_at,
      customer_number,
      outcome,
      remark || null
    );
    
    // Fetch the newly created record with customer location
    const newLog = db.prepare(`
      SELECT calllog.*, customer.location AS customer_location
      FROM calllog
      LEFT JOIN customer ON calllog.customer_number = customer.customer_number
      WHERE calllog.id = ?
    `).get(info.lastInsertRowid);
    
    res.status(201).json(newLog);
  } catch (err) {
    console.error('DB Insert Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /calllogs/:id
app.put('/calllogs/:id', (req, res) => {
  const { called_at, outcome, remark } = req.body;
  const logId = req.params.id;

  if (!called_at || !outcome) {
    return res.status(400).json({ 
      error: 'called_at and outcome are required.' 
    });
  }

  try {
    const stmt = db.prepare(`
      UPDATE calllog 
      SET called_at = ?, outcome = ?, remark = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(
      called_at,
      outcome,
      remark || null,
      logId
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Call log not found' });
    }
    
    // Return updated log with customer location
    const updatedLog = db.prepare(`
      SELECT calllog.*, customer.location AS customer_location
      FROM calllog
      LEFT JOIN customer ON calllog.customer_number = customer.customer_number
      WHERE calllog.id = ?
    `).get(logId);
    
    res.json(updatedLog);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Database operation failed' });
  }
});

// DELETE /calllogs/:id
app.delete('/calllogs/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM calllog WHERE id = ?');
    const result = stmt.run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Call log not found' });
    }
    
    res.status(204).end();
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Database operation failed' });
  }
});

// PUT /customers/:id
app.put('/customers/:id', (req, res) => {
  const { location, gender } = req.body;
  const customerId = req.params.id;

  try {
    const stmt = db.prepare(`
      UPDATE customer 
      SET location = ?, gender = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(
      location || null,
      gender || 'Male',
      customerId
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Return updated customer
    const updatedCustomer = db.prepare('SELECT * FROM customer WHERE id = ?')
      .get(customerId);
    
    res.json(updatedCustomer);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Database operation failed' });
  }
});

// DELETE /customers/:id
app.delete('/customers/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM customer WHERE id = ?');
    const result = stmt.run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.status(204).end();
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Database operation failed' });
  }
});

// Add this to your existing backend code
app.get('/dashboard-stats', (req, res) => {
  try {
    // Get total customers
    const customerCount = db.prepare('SELECT COUNT(id) AS count FROM customer').get().count;
    
    // Get today's calls
    const today = new Date().toISOString().split('T')[0];
    const callsToday = db.prepare(`
      SELECT COUNT(id) AS count FROM calllog 
      WHERE DATE(called_at) = ?
    `).get(today).count;
    
    // Get success rate (percentage of 'Connected' calls)
    const totalCalls = db.prepare('SELECT COUNT(id) AS count FROM calllog').get().count;
    const successfulCalls = db.prepare(`
      SELECT COUNT(id) AS count FROM calllog 
      WHERE outcome = 'Connected'
    `).get().count;
    
    const successRate = totalCalls > 0 
      ? Math.round((successfulCalls / totalCalls) * 100) 
      : 0;

    res.json({
      customers: customerCount,
      callsToday: callsToday,
      successRate: successRate
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.post('/api/vapi-call', async (req, res) => {
  try {
    const response = await axios.post('https://api.vapi.ai/call/web', req.body, {
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});