import mysql from 'mysql2/promise';
import config from './config.js';

export class DatabaseSetup {
  constructor() {
    this.pool = null;
  }

  async initializeDatabase() {
    try {
      // Create connection to MySQL server with minimal logging
      const connection = await mysql.createConnection({
        host: config.db.host,
        user: config.db.user,
        password: config.db.password,
      });

      await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.db.database}`);
      await connection.end();

      // Create connection pool to the specific database
      this.pool = await mysql.createPool({
        host: config.db.host,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // Add minimal query logging
      const oldQuery = this.pool.query.bind(this.pool);
      this.pool.query = async (...args) => {
        try {
          const result = await oldQuery(...args);
          return result;
        } catch (error) {
          console.error('Database Error:', error.message);
          throw error;
        }
      };

      // Create tables with minimal logging
      await this.createUsersTable();
      await this.createSaccosTable();
      await this.createVehiclesTable();
      await this.createDriversTable();
      await this.createRoutesTable();
      await this.createTripsTable();
      await this.createBookingsTable();
      await this.createWalletTransactionsTable();
      await this.createMaintenanceLogsTable();
      await this.createFeedbackTable();
      
      // Setup indexes
      await this.setupIndexes();
      
      // Add test data
      await this.addTestData();

      console.log('Database initialized successfully');
      return this.pool;
    } catch (error) {
      console.error('Database initialization failed:', error.message);
      throw error;
    }
  }

  async createTable(tableName, createTableQuery) {
    try {
      const [tables] = await this.pool.query(`SHOW TABLES LIKE '${tableName}'`);
      if (tables.length === 0) {
        await this.pool.query(createTableQuery);
        console.log(`Created table: ${tableName}`);
      }
    } catch (error) {
      console.error(`Error creating ${tableName}:`, error.message);
      throw error;
    }
  }

  // Users Table
  async createUsersTable() {
    const createQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('passenger', 'driver', 'sacco_admin', 'system_admin') DEFAULT 'passenger',
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        balance DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `;
    await this.createTable('users', createQuery);
  }

  // SACCOs Table
  async createSaccosTable() {
    const createQuery = `
      CREATE TABLE IF NOT EXISTS saccos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        registration_number VARCHAR(50) UNIQUE,
        contact_email VARCHAR(100),
        contact_phone VARCHAR(20),
        address TEXT,
        founded_date DATE,
        status ENUM('active', 'suspended', 'inactive') DEFAULT 'active',
        total_vehicles INT DEFAULT 0
      )
    `;
    await this.createTable('saccos', createQuery);
  }

  // Vehicles Table
  async createVehiclesTable() {
    const createQuery = `
      CREATE TABLE IF NOT EXISTS vehicles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sacco_id INT,
        registration_number VARCHAR(20) UNIQUE NOT NULL,
        make VARCHAR(50),
        model VARCHAR(50),
        year INT,
        capacity INT NOT NULL,
        status ENUM('active', 'maintenance', 'retired') DEFAULT 'active',
        last_maintenance_date DATE,
        FOREIGN KEY (sacco_id) REFERENCES saccos(id)
      )
    `;
    await this.createTable('vehicles', createQuery);
  }

  // Drivers Table
  async createDriversTable() {
    const createQuery = `
      CREATE TABLE IF NOT EXISTS drivers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36),
        sacco_id INT,
        license_number VARCHAR(50) UNIQUE NOT NULL,
        license_expiry DATE,
        driver_rating DECIMAL(3, 2) DEFAULT 0.00,
        total_trips INT DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (sacco_id) REFERENCES saccos(id)
      )
    `;
    await this.createTable('drivers', createQuery);

    // Check and modify drivers status column if needed
    const [statusColumnInfo] = await this.pool.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'drivers' 
      AND COLUMN_NAME = 'status'
      AND TABLE_SCHEMA = DATABASE()
    `);

    if (statusColumnInfo.length > 0) {
      const currentType = statusColumnInfo[0].COLUMN_TYPE;
      if (currentType !== "enum('active','inactive','suspended')") {
        await this.pool.query(`
          ALTER TABLE drivers 
          MODIFY COLUMN status ENUM('active', 'inactive', 'suspended') 
          DEFAULT 'inactive'
        `);
        console.log('Modified drivers status column definition');
      }
    } else {
      // In case somehow the column doesn't exist
      await this.pool.query(`
        ALTER TABLE drivers 
        ADD COLUMN status ENUM('active', 'inactive', 'suspended') 
        DEFAULT 'inactive' 
        AFTER sacco_id
      `);
      console.log('Added status column to drivers table');
    }
  }

  // Routes Table
  async createRoutesTable() {
    const createQuery = `
      CREATE TABLE IF NOT EXISTS routes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        start_location VARCHAR(100) NOT NULL,
        end_location VARCHAR(100) NOT NULL,
        distance_km DECIMAL(10, 2),
        estimated_duration_minutes INT,
        base_fare DECIMAL(10, 2) NOT NULL,
        UNIQUE(start_location, end_location)
      )
    `;
    await this.createTable('routes', createQuery);
  }

  // Trips Table
  async createTripsTable() {
    const createQuery = `
      CREATE TABLE IF NOT EXISTS trips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        route_id INT,
        vehicle_id INT,
        driver_id INT,
        departure_time TIMESTAMP,
        arrival_time TIMESTAMP,
        status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
        total_passengers INT DEFAULT 0,
        FOREIGN KEY (route_id) REFERENCES routes(id),
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
        FOREIGN KEY (driver_id) REFERENCES drivers(id)
      )
    `;
    await this.createTable('trips', createQuery);
  }

  // Bookings Table
  async createBookingsTable() {
    const createQuery = `
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36),
        trip_id INT,
        seat_number VARCHAR(10),
        booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('confirmed', 'cancelled', 'completed') DEFAULT 'confirmed',
        total_fare DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (trip_id) REFERENCES trips(id)
      )
    `;
    await this.createTable('bookings', createQuery);
  }

  // Wallet Transactions Table
  async createWalletTransactionsTable() {
    const createQuery = `
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36),
        amount DECIMAL(10, 2) NOT NULL,
        transaction_type ENUM('top_up', 'payment', 'refund', 'withdrawal') NOT NULL,
        description TEXT,
        transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_method VARCHAR(50),
        status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;
    await this.createTable('wallet_transactions', createQuery);
  }

  // Maintenance Logs Table
  async createMaintenanceLogsTable() {
    const createQuery = `
      CREATE TABLE IF NOT EXISTS maintenance_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vehicle_id INT,
        maintenance_date DATE NOT NULL,
        description TEXT,
        cost DECIMAL(10, 2),
        performed_by VARCHAR(100),
        next_maintenance_date DATE,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
      )
    `;
    await this.createTable('maintenance_logs', createQuery);
  }

  // Feedback Table
  async createFeedbackTable() {
    const createQuery = `
      CREATE TABLE IF NOT EXISTS feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trip_id INT,
        user_id VARCHAR(36),
        rating INT CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        feedback_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trip_id) REFERENCES trips(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;
    await this.createTable('feedback', createQuery);
  }

  async setupIndexes() {
    try {
      const connection = await this.pool.getConnection();
      try {
        const indexes = [
          { table: 'saccos', name: 'idx_saccos_status_v1', columns: 'status' },
          { table: 'vehicles', name: 'idx_vehicles_status_v1', columns: 'status' },
          { table: 'trips', name: 'idx_trips_status_v1', columns: 'status' },
          { table: 'wallet_transactions', name: 'idx_wallet_trans_status_v1', columns: 'status' }
        ];

        for (const idx of indexes) {
          const [exists] = await connection.query(
            'SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?',
            [config.db.database, idx.table, idx.name]
          );
          
          if (!exists[0].count) {
            await connection.query(`CREATE INDEX ${idx.name} ON ${idx.table}(${idx.columns})`);
          }
        }
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Index setup error:', error.message);
    }
  }

  async addTestData() {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Add test data with minimal logging
      const [existingSaccos] = await connection.query('SELECT COUNT(*) as count FROM saccos');
      if (existingSaccos[0].count === 0) {
        await connection.query(`
          INSERT INTO saccos (name, registration_number, contact_email, contact_phone, status) VALUES
          ('Metro Trans', 'MT123', 'info@metrotrans.co.ke', '+254711111111', 'active'),
          ('City Hoppa', 'CH456', 'info@cityhoppa.co.ke', '+254722222222', 'active'),
          ('Forward Travelers', 'FT789', 'info@forward.co.ke', '+254733333333', 'active')
        `);
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error('Test data setup error:', error.message);
    } finally {
      connection.release();
    }
  }
}

// Function to connect to database
export const connectDB = async () => {
  const dbSetup = new DatabaseSetup();
  return await dbSetup.initializeDatabase();
};
