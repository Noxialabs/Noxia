import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger.utils';

let pool: Pool;

export const connectDatabase = async (): Promise<void> => {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error if connection takes more than 2 seconds
      statement_timeout: 30000, // Statement timeout
      query_timeout: 30000, // Query timeout
    });

    // Test the connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW(), version()');
    client.release();

    logger.info('✅ Database connected successfully', {
      timestamp: result.rows[0].now,
      version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]
    });

    // Set up connection event listeners
    pool.on('connect', (client) => {
      logger.debug('New database client connected');
    });

    pool.on('error', (err) => {
      logger.error('Unexpected error on idle database client:', err);
    });

    pool.on('remove', (client) => {
      logger.debug('Database client removed from pool');
    });

  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const getPool = (): Pool => {
  if (!pool) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return pool;
};

export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Database query executed', {
      query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      rows: result.rowCount
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Database query error:', {
      query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      error: error.message,
      params: params ? JSON.stringify(params).substring(0, 200) : undefined
    });
    throw error;
  }
};

export const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};

export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    logger.info('Database connection pool closed');
  }
};

// Transaction helper
export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Health check function
export const checkDatabaseHealth = async (): Promise<{
  connected: boolean;
  version?: string;
  activeConnections?: number;
  error?: string;
}> => {
  try {
    const client = await pool.connect();
    const versionResult = await client.query('SELECT version()');
    const connectionsResult = await client.query('SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()');
    client.release();

    return {
      connected: true,
      version: versionResult.rows[0].version.split(' ')[1],
      activeConnections: parseInt(connectionsResult.rows[0].count)
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
};
