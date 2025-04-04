class AdminDriverController {
  constructor(pool) {
    this.pool = pool;
    console.log('[AdminDriverController] Initialized with pool:', !!pool);
  }

  async getAllDrivers(req, res) {
    try {
      const query = `
        SELECT 
          d.id,
          u.name,
          u.phone,
          d.license_number as licenseNumber,
          d.license_expiry as licenseExpiry,
          COALESCE(d.driver_rating, 0) as rating,
          COALESCE(d.total_trips, 0) as totalTrips,
          s.name as saccoName,
          u.status
        FROM users u
        LEFT JOIN drivers d ON u.id = d.user_id
        LEFT JOIN saccos s ON d.sacco_id = s.id
        WHERE u.role = 'driver'
        ORDER BY u.name ASC
      `;

      const [drivers] = await this.pool.query(query);
      
      if (!drivers || !Array.isArray(drivers)) {
        throw new Error('Invalid response from database');
      }

      const transformedDrivers = drivers.map(driver => ({
        id: driver.id,
        name: driver.name || 'Unknown',
        phone: driver.phone || '',
        licenseNumber: driver.licenseNumber || '',
        licenseExpiry: driver.licenseExpiry || new Date().toISOString(),
        rating: Number(driver.rating) || 0,
        totalTrips: Number(driver.totalTrips) || 0,
        saccoName: driver.saccoName || 'Unassigned',
        status: driver.status || 'inactive'
      }));

      res.json(transformedDrivers);
    } catch (error) {
      console.error('[AdminDriverController] Error:', error);
      res.status(500).json({ 
        message: 'Error fetching drivers',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getDriverDetails(req, res) {
    try {
      const { id } = req.params;
      console.log('[AdminDriverController] Getting details for driver:', id);

      // Debug: Check table structure
      const [vehicleColumns] = await this.pool.query('DESCRIBE vehicles');
      console.log('[AdminDriverController] Vehicle table structure:', vehicleColumns);

      const query = `
        SELECT 
          d.id,
          u.name,
          u.phone,
          d.license_number,
          d.license_expiry,
          d.driver_rating,
          d.total_trips,
          s.name as sacco_name,
          u.status,
          v.registration_number,
          v.type as vehicle_type,
          v.seats as seating_capacity,
          v.status as vehicle_status,
          v.id as vehicle_id
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        LEFT JOIN saccos s ON d.sacco_id = s.id
        LEFT JOIN vehicles v ON d.vehicle_id = v.id
        WHERE d.id = ?
      `;

      console.log('[AdminDriverController] Executing query:', query);
      const [[driver]] = await this.pool.query(query, [id]);
      
      if (!driver) {
        console.log('[AdminDriverController] No driver found with id:', id);
        return res.status(404).json({ message: 'Driver not found' });
      }

      console.log('[AdminDriverController] Found driver:', driver);

      const transformedDriver = {
        ...driver,
        vehicle: driver.vehicle_id ? {
          id: driver.vehicle_id,
          plateNumber: driver.number_plate,
          model: driver.vehicle_type,
          capacity: driver.seating_capacity,
          status: driver.vehicle_status
        } : null
      };

      console.log('[AdminDriverController] Transformed response:', transformedDriver);
      res.json(transformedDriver);
    } catch (error) {
      console.error('[AdminDriverController] Error fetching driver details:', error);
      res.status(500).json({ 
        message: 'Error fetching driver details',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async createDriver(req, res) {
    try {
      console.log('Creating a new driver...');
      const { fullName, phone, licenseNumber, licenseExpiry, saccoId } = req.body;
      const userId = crypto.randomUUID();
      const defaultPassword = 'Driver@123'; // You might want to generate this randomly
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      console.log('Generated userId:', userId);
      console.log('Generated password hash:', passwordHash);

      await this.pool.beginTransaction();

      console.log('Starting transaction...');
      // Create user account first
      await this.pool.query(
        'INSERT INTO users (id, name, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, fullName, phone, passwordHash, 'driver', 'active']
      );

      console.log('User account created.');

      // Then create driver record
      const [result] = await this.pool.query(
        'INSERT INTO drivers (user_id, sacco_id, license_number, license_expiry) VALUES (?, ?, ?, ?)',
        [userId, saccoId, licenseNumber, licenseExpiry]
      );

      console.log('Driver record created with ID:', result.insertId);

      await this.pool.commit();
      console.log('Transaction committed.');

      res.status(201).json({
        message: 'Driver registered successfully',
        driverId: result.insertId,
        defaultPassword // In production, send this via SMS instead
      });
    } catch (error) {
      await this.pool.rollback();
      console.error('Error creating driver - Details:', {
        message: error.message,
        stack: error.stack,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      });
      res.status(500).json({ 
        message: 'Error creating driver',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async updateDriver(req, res) {
    try {
      console.log('Updating driver...');
      const { id } = req.params;
      const { fullName, phone, licenseNumber, licenseExpiry, saccoId, status } = req.body;

      console.log('Driver ID:', id);
      console.log('Update details:', { fullName, phone, licenseNumber, licenseExpiry, saccoId, status });

      await this.pool.beginTransaction();
      console.log('Starting transaction...');

      // Update user details
      await this.pool.query(
        'UPDATE users u JOIN drivers d ON u.id = d.user_id SET u.name = ?, u.phone = ?, u.status = ? WHERE d.id = ?',
        [fullName, phone, status, id]
      );

      console.log('User details updated.');

      // Update driver details
      await this.pool.query(
        'UPDATE drivers SET license_number = ?, license_expiry = ?, sacco_id = ? WHERE id = ?',
        [licenseNumber, licenseExpiry, saccoId, id]
      );

      console.log('Driver details updated.');

      await this.pool.commit();
      console.log('Transaction committed.');

      res.json({ message: 'Driver updated successfully' });
    } catch (error) {
      await this.pool.rollback();
      console.error('Error updating driver - Details:', {
        message: error.message,
        stack: error.stack,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      });
      res.status(500).json({ 
        message: 'Error updating driver',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async deleteDriver(req, res) {
    try {
      console.log('Deactivating driver...');
      const { id } = req.params;

      console.log('Driver ID:', id);

      // Instead of deleting, maybe just deactivate
      await this.pool.query(
        'UPDATE users u JOIN drivers d ON u.id = d.user_id SET u.status = ? WHERE d.id = ?',
        ['inactive', id]
      );

      console.log('Driver deactivated.');

      res.json({ message: 'Driver deactivated successfully' });
    } catch (error) {
      console.error('Error deactivating driver - Details:', {
        message: error.message,
        stack: error.stack,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      });
      res.status(500).json({ 
        message: 'Error deactivating driver',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default AdminDriverController;
