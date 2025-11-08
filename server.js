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

// Middleware - IMPORTANTE: CORS configurado antes de las rutas
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
        total_clicks BIGINT DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Database initialized');
    
    // Test connection
    const test = await pool.query('SELECT NOW()');
    console.log('✅ Database connection test:', test.rows[0].now);
  } catch (err) {
    console.error('❌ Database initialization error:', err);
  }
}

// Routes - CON MÁS LOGGING PARA DEBUG
app.post('/api/click', async (req, res) => {
  console.log('📥 Received click request:', req.body);
  
  const { country } = req.body;

  if (!country) {
    console.log('❌ Missing country');
    return res.status(400).json({ success: false, error: "Falta el país" });
  }

  try {
    // Sumar 1 click para ese país
    const updateResult = await pool.query(
      `INSERT INTO clicks (country, total_clicks)
       VALUES ($1, 1)
       ON CONFLICT (country) 
       DO UPDATE SET total_clicks = clicks.total_clicks + 1, last_updated = CURRENT_TIMESTAMP
       RETURNING total_clicks`,
      [country]
    );

    console.log('✅ Click added for country:', country);

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
    console.error("❌ Error al sumar click:", err.message);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: "Database error"
    });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT country, total_clicks FROM clicks ORDER BY total_clicks DESC LIMIT 20"
    );
    
    console.log('📊 Leaderboard fetched:', result.rows.length, 'countries');
    
    res.status(200).json({
      success: true,
      leaderboard: result.rows,
    });
  } catch (err) {
    console.error("❌ Error al obtener leaderboard:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    const tableCheck = await pool.query("SELECT COUNT(*) FROM clicks");
    
    console.log("✅ Database test successful");
    
    res.status(200).json({
      success: true,
      message: "Conexión a la base de datos exitosa",
      timestamp: result.rows[0].now,
      total_countries: tableCheck.rows[0].count
    });
  } catch (err) {
    console.error("❌ Error al conectar con la base de datos:", err.message);
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
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🗄️ DB test: http://localhost:${PORT}/api/test-db`);
  });
});
