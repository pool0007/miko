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
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database connection - usa DATABASE_URL de Vercel
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
  } catch (err) {
    console.error('❌ Database initialization error:', err);
  }
}

// Routes
app.post('/api/click', async (req, res) => {
  const { country } = req.body;

  if (!country) {
    return res.status(400).json({ success: false, error: "Falta el país" });
  }

  try {
    // Sumar 1 click para ese país
    await pool.query(
      `INSERT INTO clicks (country, total_clicks)
       VALUES ($1, 1)
       ON CONFLICT (country) 
       DO UPDATE SET total_clicks = clicks.total_clicks + 1, last_updated = CURRENT_TIMESTAMP`,
      [country]
    );

    const result = await pool.query(
      "SELECT country, total_clicks FROM clicks ORDER BY total_clicks DESC LIMIT 20"
    );

    res.status(200).json({
      success: true,
      leaderboard: result.rows,
    });
  } catch (err) {
    console.error("❌ Error al sumar click:", err.message);
    res.status(500).json({ success: false, error: err.message });
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
    console.error("❌ Error al obtener leaderboard:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Conectado a la base de datos:", result.rows[0]);
    res.status(200).json({
      success: true,
      message: "Conexión a la base de datos exitosa",
      result: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error al conectar con la base de datos:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});
