import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig: sql.config = {
  user: process.env.ERP_DB_USER || process.env.PROFIT_DB_USER || 'sa',
  password: process.env.ERP_DB_PASSWORD || process.env.PROFIT_DB_PASSWORD || 'PlaceholderPassword123!',
  server: process.env.ERP_DB_HOST || process.env.PROFIT_DB_HOST || 'localhost',
  database: process.env.ERP_DB_NAME || process.env.PROFIT_DB_NAME || 'ERP_ENTERPRISE_DB',
  port: parseInt(process.env.ERP_DB_PORT || process.env.PROFIT_DB_PORT || '1433'),
  options: {
    encrypt: false, // For local dev it's usually false
    trustServerCertificate: true, // Bypass cert validation for local Docker
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolPromise: Promise<sql.ConnectionPool>;

export const getProfitDb = async () => {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig)
      .then(pool => {
        console.log('✅ Conectado exitosamente a SQL Server (Enterprise ERP)');
        return pool;
      })
      .catch(err => {
        console.error('❌ Error conectando a SQL Server (Enterprise ERP):', err);
        poolPromise = null as any;
        throw err;
      });
  }
  return poolPromise;
};
