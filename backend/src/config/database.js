import mysql from 'mysql2/promise';
import config from './config.js';

export class DatabaseSetup {
  constructor() {
    this.pool = null;
  }

  async initializeDatabase() {
    try {
      // Create connection to MySQL server
      const connection = await mysql.createConnection({
        host: config.db.host,
        user: config.db.user,
        password: config.db.password,
      });

      // Create database if not exists
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

      // Create tables
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
      await this.setupIndexes();

      // Add test data
      await this.addTestData();

      console.log('Database and test data initialized successfully');
      return this.pool;
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  async createTable(tableName, createTableQuery) {
    try {
      // Check if table exists
      const [tables] = await this.pool.query(
        `SHOW TABLES LIKE '${tableName}'`
      );

      // Create table if it doesn't exist
      if (tables.length === 0) {
        await this.pool.query(createTableQuery);
        console.log(`${tableName} table created successfully`);
      }
    } catch (error) {
      console.error(`Error creating ${tableName} table:`, error);
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

  // Setup indexes
  async setupIndexes() {
    try {
      // First check which indexes already exist
      const [existingIndexes] = await this.pool.query(`
        SELECT INDEX_NAME, TABLE_NAME, COLUMN_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = ?
      `, [config.db.database]);
  
      const existingIndexMap = {};
      existingIndexes.forEach(row => {
        const key = `${row.TABLE_NAME}.${row.COLUMN_NAME}`;
        existingIndexMap[key] = row.INDEX_NAME;
      });
  
      const indexDefinitions = [
        // Removing email index since it's already covered by UNIQUE constraint
        { table: 'saccos', name: 'idx_saccos_status', columns: 'status' },
        { table: 'vehicles', name: 'idx_vehicles_status', columns: 'status' },
        { table: 'trips', name: 'idx_trips_status', columns: 'status' },
        { table: 'wallet_transactions', name: 'idx_wallet_transactions_status', columns: 'status' }
      ];
  
      for (const indexDef of indexDefinitions) {
        // Check if an index already exists on these columns
        const indexKey = `${indexDef.table}.${indexDef.columns}`;
        if (!existingIndexMap[indexKey]) {
          await this.pool.query(`
            CREATE INDEX ${indexDef.name} ON ${indexDef.table}(${indexDef.columns})
          `);
          console.log(`Created index ${indexDef.name} on ${indexDef.table}`);
        }
      }
  
      console.log('Indexes setup completed');
    } catch (error) {
      console.error('Error creating indexes:', error);
      throw error;
    }
  }

  async addTestData() {
    try {
      // Add test SACCOs with more data
      await this.pool.query(`
        INSERT IGNORE INTO saccos (name, registration_number, contact_email, contact_phone, status) VALUES
        ('Metro Trans', 'MT123', 'info@metrotrans.co.ke', '+254711111111', 'active'),
        ('City Hoppa', 'CH456', 'info@cityhoppa.co.ke', '+254722222222', 'active'),
        ('Forward Travelers', 'FT789', 'info@forward.co.ke', '+254733333333', 'active')
      `);

      // Add test routes with realistic data
      await this.pool.query(`
        INSERT IGNORE INTO routes (start_location, end_location, base_fare, distance_km, estimated_duration_minutes) VALUES
        ('Nairobi', 'Mombasa', 1000, 485, 420),
        ('Nairobi', 'Kisumu', 800, 340, 360),
        ('Nairobi', 'Nakuru', 500, 158, 120)
      `);

      // Add test vehicles
      await this.pool.query(`
        INSERT IGNORE INTO vehicles (sacco_id, registration_number, capacity, status) 
        SELECT id, 
          CONCAT('KA', FLOOR(RAND() * 1000), 'A'), 
          45, 
          'active'
        FROM saccos
      `);

      console.log('Test data added successfully');
    } catch (error) {
      console.error('Error adding test data:', error);
    }
  }
}

// Function to connect to database
export const connectDB = async () => {
  const dbSetup = new DatabaseSetup();
  return await dbSetup.initializeDatabase();
};
