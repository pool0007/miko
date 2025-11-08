import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Initialize database
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clicks (
        country TEXT PRIMARY KEY,
        total_clicks BIGINT DEFAULT 0
      );
    `);
    console.log('✅ Database initialized');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
  }
}

// Routes
app.post('/api/click', async (req, res) => {
  console.log('📥 Received click request:', req.body);
  
  const { country } = req.body;

  if (!country) {
    return res.status(400).json({ success: false, error: "Country is required" });
  }

  try {
    // Add 1 click for the country
    const updateResult = await pool.query(
      `INSERT INTO clicks (country, total_clicks)
       VALUES ($1, 1)
       ON CONFLICT (country) 
       DO UPDATE SET total_clicks = clicks.total_clicks + 1
       RETURNING total_clicks`,
      [country]
    );

    console.log('✅ Click added for country:', country);

    // Get updated leaderboard
    const result = await pool.query(
      "SELECT country, total_clicks FROM clicks ORDER BY total_clicks DESC LIMIT 20"
    );

    res.status(200).json({
      success: true,
      leaderboard: result.rows,
      country: country,
      newCount: updateResult.rows[0]?.total_clicks
    });
    
  } catch (err) {
    console.error("❌ Error adding click:", err.message);
    res.status(500).json({ 
      success: false, 
      error: err.message
    });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT country, total_clicks FROM clicks ORDER BY total_clicks DESC LIMIT 20"
    );
    
    res.status(200).json({
      success: true,
      leaderboard: result.rows,
    });
  } catch (err) {
    console.error("❌ Error getting leaderboard:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/ipinfo', async (req, res) => {
  try {
    // Usar ipapi.co que es más confiable
    const response = await fetch(`https://ipapi.co/json/`);
    const data = await response.json();
    
    res.json({
      country: data.country_name,
      country_code: data.country_code,
      ip: data.ip,
      city: data.city,
      region: data.region
    });
  } catch (error) {
    // Fallback a otra API
    try {
      const response = await fetch('https://api.country.is/');
      const data = await response.json();
      res.json({
        country: data.country,
        country_code: data.country,
        ip: 'Unknown'
      });
    } catch (fallbackError) {
      res.json({
        country: 'Unknown',
        country_code: 'US',
        ip: 'Unknown'
      });
    }
  }
});

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    const tableCheck = await pool.query("SELECT COUNT(*) as count FROM clicks");
    
    res.status(200).json({
      success: true,
      message: "Database connection successful",
      timestamp: result.rows[0].now,
      total_countries: tableCheck.rows[0].count
    });
  } catch (err) {
    console.error("❌ Error connecting to database:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const dbCheck = await pool.query('SELECT 1');
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (err) {
    res.status(500).json({
      status: 'ERROR',
      database: 'disconnected',
      error: err.message
    });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});
