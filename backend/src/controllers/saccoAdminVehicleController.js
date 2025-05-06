class SaccoAdminVehicleController {
  constructor(pool) {
    this.pool = pool;
    console.log('[SaccoAdminVehicleController] Initialized with pool:', !!pool);
  }

  // Helper method to get saccoId from userId
  async getSaccoIdFromUserId(userId) {
    try {
      // Query the saccos table to find the sacco managed by this user
      const [rows] = await this.pool.query(
        'SELECT id FROM saccos WHERE managed_by = ?',
        [userId]
      );

      if (!rows || rows.length === 0) {
        return null; // User does not manage any SACCO
      }

      return rows[0].id;
    } catch (error) {
      console.error('[SaccoAdminVehicleController] Error getting saccoId from userId:', error);
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
          GROUP_CONCAT(
            DISTINCT CONCAT(r.start_location, ' - ', r.end_location)
            SEPARATOR ', '
          ) as route
        FROM vehicles v
        LEFT JOIN saccos s ON v.sacco_id = s.id
        LEFT JOIN trips t ON v.id = t.vehicle_id
        LEFT JOIN routes r ON t.route_id = r.id
        WHERE v.sacco_id = ?
        GROUP BY v.id, s.id, s.name
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
        lastMaintenanceDate: vehicle.last_maintenance_date ? 
          new Date(vehicle.last_maintenance_date).toISOString() : null,
        saccoName: vehicle.sacco_name || 'Unknown',
        routes: vehicle.route || ''
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
}

export default SaccoAdminVehicleController;