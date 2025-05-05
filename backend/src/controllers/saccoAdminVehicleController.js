class SaccoAdminVehicleController {
  constructor(pool) {
    this.pool = pool;
    console.log('[SaccoAdminVehicleController] Initialized with pool:', !!pool);
  }

  async getAllVehicles(req, res) {
    try {
      const saccoId = req.user.saccoId;

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

      res.json(vehicles);
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
      const saccoId = req.user.saccoId;
      const { registration_number, capacity, make, model, year } = req.body;

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

      res.status(201).json({ 
        id: result.insertId, 
        registration_number, 
        sacco_id: saccoId, 
        capacity,
        make,
        model,
        year,
        status: 'active'
      });
    } catch (error) {
      console.error('[SaccoAdminVehicleController] Error creating vehicle:', error);
      res.status(500).json({ message: 'Error creating vehicle' });
    }
  }

  async updateVehicle(req, res) {
    try {
      const saccoId = req.user.saccoId;
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
          registration_number,
          capacity,
          status,
          make,
          model,
          year,
          sacco_id: saccoId
        }
      });
    } catch (error) {
      console.error('[SaccoAdminVehicleController] Error updating vehicle:', error);
      res.status(500).json({ message: 'Error updating vehicle' });
    }
  }

  async deleteVehicle(req, res) {
    try {
      const saccoId = req.user.saccoId;
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

      const [result] = await this.pool.query(
        'DELETE FROM vehicles WHERE id = ? AND sacco_id = ?',
        [id, saccoId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Delete failed' });
      }

      res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
      console.error('[SaccoAdminVehicleController] Error deleting vehicle:', error);
      res.status(500).json({ message: 'Error deleting vehicle' });
    }
  }
}

export default SaccoAdminVehicleController;