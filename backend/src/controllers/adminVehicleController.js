class AdminVehicleController {
  constructor(pool) {
    this.pool = pool;
  }

  async getAllVehicles(req, res) {
    try {
      const [vehicles] = await this.pool.query(`
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
        WHERE v.status != 'retired'
        GROUP BY v.id, s.id, s.name
        ORDER BY v.id DESC
      `);
      res.json(vehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      res.status(500).json({ message: 'Error fetching vehicles' });
    }
  }

  async createVehicle(req, res) {
    try {
      const { registration_number, sacco_id, capacity, status } = req.body;
      const [result] = await this.pool.query(
        'INSERT INTO vehicles (registration_number, sacco_id, capacity, status) VALUES (?, ?, ?, ?)',
        [registration_number, sacco_id, capacity, status]
      );
      res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
      console.error('Error creating vehicle:', error);
      res.status(500).json({ message: 'Error creating vehicle' });
    }
  }

  async updateVehicle(req, res) {
    try {
      const { id } = req.params;
      const { registration_number, sacco_id, capacity, status } = req.body;

      // Validate required fields
      if (!registration_number || !sacco_id || !capacity) {
        return res.status(400).json({
          message: 'Missing required fields',
          details: {
            registration_number: !registration_number ? 'Registration number is required' : null,
            sacco_id: !sacco_id ? 'SACCO is required' : null,
            capacity: !capacity ? 'Capacity is required' : null
          }
        });
      }

      // Check if vehicle exists first
      const [existingVehicle] = await this.pool.query(
        'SELECT id FROM vehicles WHERE id = ?',
        [id]
      );

      if (existingVehicle.length === 0) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      // Check if registration number is already used by another vehicle
      const [duplicateReg] = await this.pool.query(
        'SELECT id FROM vehicles WHERE registration_number = ? AND id != ?',
        [registration_number, id]
      );

      if (duplicateReg.length > 0) {
        return res.status(409).json({ 
          message: 'Registration number already in use by another vehicle' 
        });
      }

      // Validate SACCO exists
      const [saccoExists] = await this.pool.query(
        'SELECT id FROM saccos WHERE id = ?',
        [sacco_id]
      );

      if (saccoExists.length === 0) {
        return res.status(400).json({ message: 'Invalid SACCO ID' });
      }

      // Perform the update
      const [result] = await this.pool.query(
        `UPDATE vehicles 
         SET registration_number = ?, 
             sacco_id = ?, 
             capacity = ?, 
             status = ?
         WHERE id = ?`,
        [registration_number, sacco_id, capacity, status, id]
      );

      if (result.affectedRows === 0) {
        return res.status(400).json({ message: 'Update failed' });
      }

      res.json({ 
        message: 'Vehicle updated successfully',
        vehicle: { id, registration_number, sacco_id, capacity, status }
      });
    } catch (error) {
      console.error('Error updating vehicle:', error);
      res.status(500).json({ 
        message: 'Error updating vehicle',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async deleteVehicle(req, res) {
    try {
      const { id } = req.params;
      await this.pool.query('DELETE FROM vehicles WHERE id = ?', [id]);
      res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      res.status(500).json({ message: 'Error deleting vehicle' });
    }
  }
}

export default AdminVehicleController;
