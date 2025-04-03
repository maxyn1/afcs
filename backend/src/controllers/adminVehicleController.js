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
      await this.pool.query(
        'UPDATE vehicles SET registration_number = ?, sacco_id = ?, capacity = ?, status = ? WHERE id = ?',
        [registration_number, sacco_id, capacity, status, id]
      );
      res.json({ message: 'Vehicle updated successfully' });
    } catch (error) {
      console.error('Error updating vehicle:', error);
      res.status(500).json({ message: 'Error updating vehicle' });
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
