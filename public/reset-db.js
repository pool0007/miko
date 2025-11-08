import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');
    
    // Eliminar la tabla existente
    await pool.query('DROP TABLE IF EXISTS clicks');
    console.log('✅ Table dropped');
    
    // Crear la tabla con el schema correcto
    await pool.query(`
      CREATE TABLE clicks (
        country TEXT PRIMARY KEY,
        total_clicks BIGINT DEFAULT 0
      );
    `);
    console.log('✅ Table created with correct schema');
    
    // Insertar algunos datos de prueba
    await pool.query(`
      INSERT INTO clicks (country, total_clicks) VALUES 
      ('Argentina', 10),
      ('Chile', 8),
      ('España', 15),
      ('Mexico', 12),
      ('Estados Unidos', 20)
      ON CONFLICT (country) DO NOTHING;
    `);
    console.log('✅ Sample data inserted');
    
    console.log('🎉 Database reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await pool.end();
  }
}

resetDatabase();
