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

// Initialize database - SCHEMA CORREGIDO
async function initializeDatabase() {
  try {
    // Verificar si la tabla existe y tiene las columnas correctas
    const tableCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clicks'
    `);
    
    const existingColumns = tableCheck.rows.map(row => row.column_name);
    
    if (existingColumns.length === 0) {
      // Crear tabla si no existe
      await pool.query(`
        CREATE TABLE clicks (
          country TEXT PRIMARY KEY,
          total_clicks BIGINT DEFAULT 0
        );
      `);
      console.log('✅ Table created successfully');
    } else if (existingColumns.includes('last_updated')) {
      // Si existe la columna problemática, crear tabla temporal
      console.log('🔄 Fixing database schema...');
      
      // Crear tabla temporal
      await pool.query(`
        CREATE TABLE IF NOT EXISTS clicks_new (
          country TEXT PRIMARY KEY,
          total_clicks BIGINT DEFAULT 0
        );
      `);
      
      // Copiar datos
      await pool.query(`
        INSERT INTO clicks_new (country, total_clicks)
        SELECT country, total_clicks FROM clicks
        ON CONFLICT (country) DO NOTHING;
      `);
      
      // Eliminar tabla vieja
      await pool.query('DROP TABLE clicks');
      
      // Renombrar tabla nueva
      await pool.query('ALTER TABLE clicks_new RENAME TO clicks');
      
      console.log('✅ Database schema fixed');
    }
    
    console.log('✅ Database initialized successfully');
    
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    
    // Intentar crear tabla básica como fallback
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS clicks (
          country TEXT PRIMARY KEY,
          total_clicks BIGINT DEFAULT 0
        );
      `);
      console.log('✅ Fallback table creation successful');
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
    }
  }
}

// Routes - VERSIÓN SIMPLIFICADA Y ROBUSTA
app.post('/api/click', async (req, res) => {
  console.log('📥 Received click request:', req.body);
  
  const { country } = req.body;

  if (!country) {
    return res.status(400).json({ success: false, error: "Falta el país" });
  }

  try {
    // Versión simplificada sin last_updated
    const updateResult = await pool.query(
      `INSERT INTO clicks (country, total_clicks)
       VALUES ($1, 1)
       ON CONFLICT (country) 
       DO UPDATE SET total_clicks = clicks.total_clicks + 1
       RETURNING total_clicks`,
      [country]
    );

    console.log('✅ Click added for country:', country);

    // Obtener leaderboard actualizado
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
    console.error("❌ Error al obtener leaderboard:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    const tableCheck = await pool.query("SELECT COUNT(*) as count FROM clicks");
    const sampleData = await pool.query("SELECT * FROM clicks ORDER BY total_clicks DESC LIMIT 5");
    
    res.status(200).json({
      success: true,
      message: "Conexión a la base de datos exitosa",
      timestamp: result.rows[0].now,
      total_countries: tableCheck.rows[0].count,
      sample_data: sampleData.rows
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
