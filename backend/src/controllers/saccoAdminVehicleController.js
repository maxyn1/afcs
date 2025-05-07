class SaccoAdminVehicleController {
  constructor(pool) {
    this.pool = pool;
    console.log('[SaccoAdminVehicleController] Initialized with pool:', !!pool);
  }

  // Helper method to get saccoId from userId
  async getSaccoIdFromUserId(userId) {
    try {
      console.log('[SaccoAdminVehicleController] Getting SACCO ID for user:', userId);
      const [rows] = await this.pool.query(
        'SELECT id FROM saccos WHERE managed_by = ?',
        [userId]
      );

      if (!rows || rows.length === 0) {
        console.warn('[SaccoAdminVehicleController] No SACCO found for user:', userId);
        return null;
      }

      console.log('[SaccoAdminVehicleController] Found SACCO ID:', rows[0].id);
      return rows[0].id;
    } catch (error) {
      console.error('[SaccoAdminVehicleController] Error getting saccoId:', error);
      throw error;
    }
  }

  async getAllVehicles(req, res) {
    try {
      // Get the userId from the authentication context
      const userId = req.user.id;
      
      // Get the saccoId for this user
      const saccoId = await this.getSaccoIdFromUserId(userId);

      if (!saccoId) {
        return res.status(403).json({ message: 'You do not manage any SACCO' });
      }

      const query = `
        SELECT 
          v.*,
          s.name as sacco_name,
          s.registration_number as sacco_registration,
          s.contact_email as sacco_email,
          s.contact_phone as sacco_phone,
          s.status as sacco_status,
          GROUP_CONCAT(
            DISTINCT CONCAT(r.start_location, ' - ', r.end_location)
            SEPARATOR ', '
          ) as route,
          d.id as driver_id,
          u.name as driver_name
        FROM vehicles v
        INNER JOIN saccos s ON v.sacco_id = s.id
        LEFT JOIN trips t ON v.id = t.vehicle_id
        LEFT JOIN routes r ON t.route_id = r.id
        LEFT JOIN drivers d ON d.vehicle_id = v.id AND d.status = 'active'
        LEFT JOIN users u ON d.user_id = u.id
        WHERE v.sacco_id = ?
        GROUP BY 
          v.id, 
          v.registration_number, 
          v.make, 
          v.model, 
          v.year, 
          v.capacity, 
          v.status, 
          v.last_maintenance_date,
          s.id, 
          s.name, 
          s.registration_number, 
          s.contact_email, 
          s.contact_phone, 
          s.status,
          d.id,
          u.name
        ORDER BY v.registration_number ASC
      `;

      const [vehicles] = await this.pool.query(query, [saccoId]);

      // Transform the data for frontend consistency
      const transformedVehicles = vehicles.map(vehicle => ({
        id: vehicle.id,
        registrationNumber: vehicle.registration_number || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || null,
        capacity: vehicle.capacity || 0,
        status: vehicle.status || 'inactive',
        sacco: {
          id: saccoId,
          name: vehicle.sacco_name || 'Unknown',
          registrationNumber: vehicle.sacco_registration || '',
          email: vehicle.sacco_email || '',
          phone: vehicle.sacco_phone || '',
          status: vehicle.sacco_status || 'inactive'
        },
        route: vehicle.route || '',
        driver: vehicle.driver_id ? {
          id: vehicle.driver_id,
          name: vehicle.driver_name
        } : null
      }));

      res.json(transformedVehicles);
    } catch (error) {
      console.error('[SaccoAdminVehicleController] Error:', error);
      res.status(500).json({ 
        message: 'Error fetching vehicles',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async createVehicle(req, res) {
    try {
      // Get the userId from the authentication context
      const userId = req.user.id;
      
      // Get the saccoId for this user
      const saccoId = await this.getSaccoIdFromUserId(userId);

      if (!saccoId) {
        return res.status(403).json({ message: 'You do not manage any SACCO' });
      }
      
      const { registration_number, capacity, make, model, year } = req.body;

      // Validate required fields
      if (!registration_number || !capacity) {
        return res.status(400).json({ message: 'Registration number and capacity are required' });
      }

      // Check for duplicate registration number
      const [existing] = await this.pool.query(
        'SELECT id FROM vehicles WHERE registration_number = ?',
        [registration_number]
      );

      if (existing.length > 0) {
        return res.status(409).json({ 
          message: 'Vehicle with this registration number already exists' 
        });
      }

      const [result] = await this.pool.query(
        'INSERT INTO vehicles (registration_number, sacco_id, capacity, make, model, year, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [registration_number, saccoId, capacity, make, model, year, 'active']
      );

      // Update the total_vehicles count in the saccos table
      await this.pool.query(
        'UPDATE saccos SET total_vehicles = total_vehicles + 1 WHERE id = ?',
        [saccoId]
      );

      res.status(201).json({ 
        id: result.insertId, 
        registrationNumber: registration_number, 
        saccoId: saccoId, 
        capacity,
        make,
        model,
        year,
        status: 'active'
      });
    } catch (error) {
      console.error('[SaccoAdminVehicleController] Error creating vehicle:', error);
      res.status(500).json({ 
        message: 'Error creating vehicle',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async updateVehicle(req, res) {
    try {
      // Get the userId from the authentication context
      const userId = req.user.id;
      
      // Get the saccoId for this user
      const saccoId = await this.getSaccoIdFromUserId(userId);

      if (!saccoId) {
        return res.status(403).json({ message: 'You do not manage any SACCO' });
      }
      
      const { id } = req.params;
      const { registration_number, capacity, status, make, model, year } = req.body;

      // Check if vehicle exists and belongs to this SACCO
      const [existingVehicle] = await this.pool.query(
        'SELECT id FROM vehicles WHERE id = ? AND sacco_id = ?',
        [id, saccoId]
      );

      if (existingVehicle.length === 0) {
        return res.status(404).json({ message: 'Vehicle not found or access denied' });
      }

      // Check for duplicate registration number
      const [duplicateReg] = await this.pool.query(
        'SELECT id FROM vehicles WHERE registration_number = ? AND id != ?',
        [registration_number, id]
      );

      if (duplicateReg.length > 0) {
        return res.status(409).json({ 
          message: 'Another vehicle with this registration number already exists' 
        });
      }

      await this.pool.query(
        `UPDATE vehicles 
         SET registration_number = ?, capacity = ?, status = ?, make = ?, model = ?, year = ?
         WHERE id = ? AND sacco_id = ?`,
        [registration_number, capacity, status, make, model, year, id, saccoId]
      );

      res.json({ 
        message: 'Vehicle updated successfully',
        vehicle: {
          id: Number(id),
          registrationNumber: registration_number,
          capacity,
          status,
          make,
          model,
          year,
          saccoId: saccoId
        }
      });
    } catch (error) {
      console.error('[SaccoAdminVehicleController] Error updating vehicle:', error);
      res.status(500).json({ 
        message: 'Error updating vehicle',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async deleteVehicle(req, res) {
    try {
      // Get the userId from the authentication context
      const userId = req.user.id;
      
      // Get the saccoId for this user
      const saccoId = await this.getSaccoIdFromUserId(userId);

      if (!saccoId) {
        return res.status(403).json({ message: 'You do not manage any SACCO' });
      }
      
      const { id } = req.params;

      // Check if vehicle exists and belongs to this SACCO
      const [vehicle] = await this.pool.query(
        'SELECT status FROM vehicles WHERE id = ? AND sacco_id = ?',
        [id, saccoId]
      );

      if (vehicle.length === 0) {
        return res.status(404).json({ message: 'Vehicle not found or access denied' });
      }

      // Don't allow deletion of active vehicles
      if (vehicle[0].status === 'active') {
        return res.status(400).json({ 
          message: 'Cannot delete active vehicle. Please deactivate the vehicle first.' 
        });
      }

      const connection = await this.pool.getConnection();
      
      try {
        await connection.beginTransaction();
        
        // Delete the vehicle
        const [result] = await connection.query(
          'DELETE FROM vehicles WHERE id = ? AND sacco_id = ?',
          [id, saccoId]
        );

        if (result.affectedRows === 0) {
          await connection.rollback();
          return res.status(404).json({ message: 'Delete failed' });
        }

        // Update the total_vehicles count in the saccos table
        await connection.query(
          'UPDATE saccos SET total_vehicles = GREATEST(total_vehicles - 1, 0) WHERE id = ?',
          [saccoId]
        );

        await connection.commit();
        res.json({ message: 'Vehicle deleted successfully' });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('[SaccoAdminVehicleController] Error deleting vehicle:', error);
      res.status(500).json({ 
        message: 'Error deleting vehicle',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Add a method to get vehicle details
  async getVehicleDetails(req, res) {
    try {
      // Get the userId from the authentication context
      const userId = req.user.id;
      
      // Get the saccoId for this user
      const saccoId = await this.getSaccoIdFromUserId(userId);

      if (!saccoId) {
        return res.status(403).json({ message: 'You do not manage any SACCO' });
      }
      
      const { id } = req.params;

      const query = `
        SELECT 
          v.*,
          s.name as sacco_name,
          GROUP_CONCAT(
            DISTINCT CONCAT(r.start_location, ' - ', r.end_location)
            SEPARATOR ', '
          ) as routes,
          COUNT(DISTINCT t.id) as total_trips,
          (
            SELECT COUNT(*) 
            FROM maintenance_logs ml 
            WHERE ml.vehicle_id = v.id
          ) as maintenance_count,
          (
            SELECT MAX(ml.maintenance_date) 
            FROM maintenance_logs ml 
            WHERE ml.vehicle_id = v.id
          ) as last_maintenance_date
        FROM vehicles v
        LEFT JOIN saccos s ON v.sacco_id = s.id
        LEFT JOIN trips t ON v.id = t.vehicle_id
        LEFT JOIN routes r ON t.route_id = r.id
        WHERE v.id = ? AND v.sacco_id = ?
        GROUP BY v.id
      `;

      const [vehicles] = await this.pool.query(query, [id, saccoId]);

      if (!vehicles || vehicles.length === 0) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      const vehicle = vehicles[0];

      res.json({
        id: vehicle.id,
        registrationNumber: vehicle.registration_number || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || null,
        capacity: vehicle.capacity || 0,
        status: vehicle.status || 'inactive',
        lastMaintenanceDate: vehicle.last_maintenance_date ? 
          new Date(vehicle.last_maintenance_date).toISOString() : null,
        saccoName: vehicle.sacco_name || 'Unknown',
        routes: vehicle.routes || '',
        totalTrips: Number(vehicle.total_trips) || 0,
        maintenanceCount: Number(vehicle.maintenance_count) || 0
      });
    } catch (error) {
      console.error('[SaccoAdminVehicleController] Error getting vehicle details:', error);
      res.status(500).json({ 
        message: 'Error fetching vehicle details',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Add a method to get vehicle maintenance logs
  async getVehicleMaintenanceLogs(req, res) {
    try {
      // Get the userId from the authentication context
      const userId = req.user.id;
      
      // Get the saccoId for this user
      const saccoId = await this.getSaccoIdFromUserId(userId);

      if (!saccoId) {
        return res.status(403).json({ message: 'You do not manage any SACCO' });
      }
      
      const { id } = req.params;

      // First verify that the vehicle belongs to this SACCO
      const [vehicleCheck] = await this.pool.query(
        'SELECT id FROM vehicles WHERE id = ? AND sacco_id = ?',
        [id, saccoId]
      );

      if (vehicleCheck.length === 0) {
        return res.status(404).json({ message: 'Vehicle not found or access denied' });
      }

      // Get maintenance logs
      const [logs] = await this.pool.query(
        `SELECT 
          id, 
          maintenance_date, 
          description, 
          cost, 
          performed_by, 
          next_maintenance_date 
        FROM maintenance_logs 
        WHERE vehicle_id = ? 
        ORDER BY maintenance_date DESC`,
        [id]
      );

      res.json(logs.map(log => ({
        id: log.id,
        maintenanceDate: log.maintenance_date ? 
          new Date(log.maintenance_date).toISOString() : null,
        description: log.description || '',
        cost: Number(log.cost) || 0,
        performedBy: log.performed_by || '',
        nextMaintenanceDate: log.next_maintenance_date ? 
          new Date(log.next_maintenance_date).toISOString() : null
      })));
    } catch (error) {
      console.error('[SaccoAdminVehicleController] Error getting maintenance logs:', error);
      res.status(500).json({ 
        message: 'Error fetching maintenance logs',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getAvailableVehicles(req, res) {
    try {
      const userId = req.user.id;
      console.log('[SaccoAdminVehicleController] Getting available vehicles for user:', userId);
      
      const saccoId = await this.getSaccoIdFromUserId(userId);
      if (!saccoId) {
        return res.status(403).json({ message: 'You do not manage any SACCO' });
      }

      // Get only active vehicles from this SACCO that don't have assigned drivers
      const [vehicles] = await this.pool.query(
        `SELECT v.id, v.registration_number, v.capacity, v.make, v.model, v.year, v.status
         FROM vehicles v
         LEFT JOIN drivers d ON v.id = d.vehicle_id
         WHERE v.sacco_id = ? 
         AND v.status = 'active'
         AND d.id IS NULL`,
        [saccoId]
      );

      console.log('[SaccoAdminVehicleController] Found vehicles:', vehicles.length);
      res.json(vehicles.map(vehicle => ({
        id: vehicle.id,
        registrationNumber: vehicle.registration_number,
        capacity: vehicle.capacity,
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year
      })));

    } catch (error) {
      console.error('[SaccoAdminVehicleController] Error getting available vehicles:', {
        error: error.message,
        userId: req.user.id
      });
      res.status(500).json({ message: 'Error fetching available vehicles' });
    }
  }

  async assignDriver(req, res) {
    try {
      const userId = req.user.id;
      const saccoId = await this.getSaccoIdFromUserId(userId);

      if (!saccoId) {
        return res.status(403).json({ message: 'You do not manage any SACCO' });
      }

      const { vehicleId } = req.params;
      const { driverId } = req.body;

      console.log('[SaccoAdminVehicleController] Attempting driver assignment:', {
        saccoId,
        vehicleId,
        driverId
      });

      // Verify vehicle belongs to SACCO and is active
      const [vehicle] = await this.pool.query(
        'SELECT id, status FROM vehicles WHERE id = ? AND sacco_id = ?',
        [vehicleId, saccoId]
      );

      if (vehicle.length === 0) {
        console.warn('[SaccoAdminVehicleController] Vehicle not found or not in SACCO:', vehicleId);
        return res.status(404).json({ message: 'Vehicle not found or access denied' });
      }

      if (vehicle[0].status !== 'active') {
        console.warn('[SaccoAdminVehicleController] Vehicle not active:', vehicle[0].status);
        return res.status(400).json({ message: 'Can only assign drivers to active vehicles' });
      }

      // Verify driver belongs to SACCO and is not already assigned
      const [driver] = await this.pool.query(
        'SELECT id, vehicle_id FROM drivers WHERE id = ? AND sacco_id = ?',
        [driverId, saccoId]
      );

      if (driver.length === 0) {
        console.warn('[SaccoAdminVehicleController] Driver not found or not in SACCO:', driverId);
        return res.status(404).json({ message: 'Driver not found or access denied' });
      }

      if (driver[0].vehicle_id) {
        console.warn('[SaccoAdminVehicleController] Driver already assigned:', driver[0].vehicle_id);
        return res.status(400).json({ message: 'Driver is already assigned to another vehicle' });
      }

      const connection = await this.pool.getConnection();
      try {
        await connection.beginTransaction();

        await connection.query(
          'UPDATE drivers SET vehicle_id = ? WHERE id = ? AND sacco_id = ?',
          [vehicleId, driverId, saccoId]
        );

        await connection.commit();
        console.log('[SaccoAdminVehicleController] Assignment successful:', {
          vehicleId,
          driverId,
          saccoId
        });
        res.json({ message: 'Driver assigned successfully' });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('[SaccoAdminVehicleController] Assignment error:', {
        error: error.message,
        stack: error.stack
      });
      res.status(500).json({ 
        message: 'Error assigning driver',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async unassignDriver(req, res) {
    try {
      const userId = req.user.id;
      const saccoId = await this.getSaccoIdFromUserId(userId);

      if (!saccoId) {
        return res.status(403).json({ message: 'You do not manage any SACCO' });
      }

      const { vehicleId } = req.params;

      // Verify vehicle belongs to SACCO
      const [vehicle] = await this.pool.query(
        'SELECT id FROM vehicles WHERE id = ? AND sacco_id = ?',
        [vehicleId, saccoId]
      );

      if (vehicle.length === 0) {
        return res.status(404).json({ message: 'Vehicle not found or access denied' });
      }

      // End current assignment
      await this.pool.query(
        `UPDATE drivers 
         SET vehicle_id = NULL 
         WHERE vehicle_id = ? AND sacco_id = ?`,
        [vehicleId, saccoId]
      );

      res.json({ message: 'Driver unassigned successfully' });
    } catch (error) {
      console.error('[SaccoAdminVehicleController] Error unassigning driver:', error);
      res.status(500).json({ 
        message: 'Error unassigning driver',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getAvailableDrivers(req, res) {
    try {
      const userId = req.user.id;
      const saccoId = await this.getSaccoIdFromUserId(userId);

      if (!saccoId) {
        return res.status(403).json({ message: 'You do not manage any SACCO' });
      }

      // Get all unassigned drivers from this SACCO
      const [drivers] = await this.pool.query(
        `SELECT 
          d.id,
          u.name,
          d.license_number,
          d.license_expiry,
          d.driver_rating,
          d.status
        FROM drivers d
        INNER JOIN users u ON d.user_id = u.id
        WHERE d.sacco_id = ? 
        AND d.vehicle_id IS NULL
        AND d.status = 'active'`,
        [saccoId]
      );

      res.json(drivers.map(driver => ({
        id: driver.id,
        name: driver.name,
        licenseNumber: driver.license_number,
        licenseExpiry: driver.license_expiry,
        rating: Number(driver.driver_rating) || 0,
        status: driver.status
      })));
    } catch (error) {
      console.error('[SaccoAdminVehicleController] Error getting available drivers:', error);
      res.status(500).json({ 
        message: 'Error fetching available drivers',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default SaccoAdminVehicleController;