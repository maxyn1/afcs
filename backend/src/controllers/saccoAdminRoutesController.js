class SaccoAdminRoutesController {
  constructor(pool) {
    this.pool = pool;
    console.log('[SaccoAdminRoutesController] Initialized with pool:', !!pool);
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
      console.error('[SaccoAdminRoutesController] Error getting saccoId from userId:', error);
      throw error;
    }
  }

  async getRoutes(req, res) {
    try {
      const userId = req.user.id;
      console.log('[SaccoAdminRoutesController] Getting routes for user:', userId);

      const saccoId = await this.getSaccoIdFromUserId(userId);
      if (!saccoId) {
        return res.status(403).json({ message: 'You do not manage any SACCO' });
      }

      const [routes] = await this.pool.query(
        `SELECT 
          r.id,
          CONCAT(r.start_location, ' - ', r.end_location) as name,
          r.start_location as start_point,
          r.end_location as end_point,
          r.distance_km as distance,
          r.base_fare as fare,
          r.status,
          COUNT(DISTINCT v.id) as assigned_vehicles
        FROM routes r
        LEFT JOIN trips t ON r.id = t.route_id
        LEFT JOIN vehicles v ON t.vehicle_id = v.id AND v.status = 'active'
        WHERE v.sacco_id = ? OR v.sacco_id IS NULL
        GROUP BY r.id
        ORDER BY r.start_location ASC, r.end_location ASC`,
        [saccoId]
      );

      console.log('[SaccoAdminRoutesController] Fetched routes:', routes.length);
      res.json(routes.map(route => ({
        ...route,
        status: route.status || 'active',
        assigned_vehicles: Number(route.assigned_vehicles) || 0
      })));
    } catch (error) {
      console.error('[SaccoAdminRoutesController] Error fetching routes:', error);
      res.status(500).json({ 
        message: 'Error fetching routes',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async createRoute(req, res) {
    try {
      const userId = req.user.id;
      console.log('[SaccoAdminRoutesController] Creating route for user:', userId);

      const saccoId = await this.getSaccoIdFromUserId(userId);
      if (!saccoId) {
        return res.status(403).json({ message: 'You do not manage any SACCO' });
      }

      const { start_location, end_location, distance_km, estimated_duration_minutes, base_fare, status = 'active' } = req.body;

      if (!start_location || !end_location || distance_km == null || base_fare == null) {
        console.log('[SaccoAdminRoutesController] Missing required route fields:', req.body);
        return res.status(400).json({ message: 'Missing required route fields' });
      }

      if (isNaN(distance_km) || distance_km <= 0) {
        console.log('[SaccoAdminRoutesController] Invalid distance:', distance_km);
        return res.status(400).json({ message: 'Distance must be a positive number' });
      }

      if (isNaN(base_fare) || base_fare <= 0) {
        console.log('[SaccoAdminRoutesController] Invalid fare:', base_fare);
        return res.status(400).json({ message: 'Fare must be a positive number' });
      }

      const [result] = await this.pool.query(
        `INSERT INTO routes (
          start_location, 
          end_location, 
          distance_km, 
          estimated_duration_minutes, 
          base_fare,
          status,
          sacco_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          start_location.trim(), 
          end_location.trim(), 
          distance_km, 
          estimated_duration_minutes || null, 
          base_fare,
          status,
          saccoId
        ]
      );

      const [newRoute] = await this.pool.query(
        'SELECT * FROM routes WHERE id = ?',
        [result.insertId]
      );

      console.log('[SaccoAdminRoutesController] Route created successfully:', newRoute[0]);
      res.status(201).json({
        id: newRoute[0].id,
        name: `${newRoute[0].start_location} - ${newRoute[0].end_location}`,
        start_point: newRoute[0].start_location,
        end_point: newRoute[0].end_location,
        distance: newRoute[0].distance_km,
        fare: newRoute[0].base_fare,
        status: newRoute[0].status || 'active',
        assigned_vehicles: 0
      });
    } catch (error) {
      console.error('[SaccoAdminRoutesController] Error creating route:', error);
      res.status(500).json({ 
        message: 'Error creating route',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async updateRoute(req, res) {
    try {
      const userId = req.user.id;
      console.log('[SaccoAdminRoutesController] Updating route for user:', userId);

      const saccoId = await this.getSaccoIdFromUserId(userId);
      if (!saccoId) {
        return res.status(403).json({ message: 'You do not manage any SACCO' });
      }

      const { id } = req.params;
      const { start_location, end_location, distance_km, estimated_duration_minutes, base_fare, status } = req.body;

      // Validate route exists and belongs to SACCO
      const [existingRoute] = await this.pool.query(
        'SELECT id FROM routes WHERE id = ? AND sacco_id = ?',
        [id, saccoId]
      );

      if (existingRoute.length === 0) {
        return res.status(404).json({ message: 'Route not found or access denied' });
      }

      // Validate required fields
      if (!start_location || !end_location || distance_km == null || base_fare == null) {
        return res.status(400).json({ message: 'Missing required route fields' });
      }

      // Validate numeric fields
      if (isNaN(distance_km) || distance_km <= 0) {
        return res.status(400).json({ message: 'Distance must be a positive number' });
      }

      if (isNaN(base_fare) || base_fare <= 0) {
        return res.status(400).json({ message: 'Fare must be a positive number' });
      }

      await this.pool.query(
        `UPDATE routes 
         SET start_location = ?,
             end_location = ?,
             distance_km = ?,
             estimated_duration_minutes = ?,
             base_fare = ?,
             status = ?
         WHERE id = ? AND sacco_id = ?`,
        [
          start_location.trim(),
          end_location.trim(),
          distance_km,
          estimated_duration_minutes || null,
          base_fare,
          status || 'active',
          id,
          saccoId
        ]
      );

      const [updatedRoute] = await this.pool.query(
        `SELECT 
          r.*,
          COUNT(DISTINCT v.id) as assigned_vehicles
        FROM routes r
        LEFT JOIN trips t ON r.id = t.route_id
        LEFT JOIN vehicles v ON t.vehicle_id = v.id AND v.status = 'active'
        WHERE r.id = ? AND r.sacco_id = ?
        GROUP BY r.id`,
        [id, saccoId]
      );

      res.json({
        id: updatedRoute[0].id,
        name: `${updatedRoute[0].start_location} - ${updatedRoute[0].end_location}`,
        start_point: updatedRoute[0].start_location,
        end_point: updatedRoute[0].end_location,
        distance: updatedRoute[0].distance_km,
        fare: updatedRoute[0].base_fare,
        status: updatedRoute[0].status || 'active',
        assigned_vehicles: Number(updatedRoute[0].assigned_vehicles) || 0
      });
    } catch (error) {
      console.error('[SaccoAdminRoutesController] Error updating route:', error);
      res.status(500).json({ 
        message: 'Error updating route',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async deleteRoute(req, res) {
    try {
      const userId = req.user.id;
      console.log('[SaccoAdminRoutesController] Deleting route for user:', userId);

      const saccoId = await this.getSaccoIdFromUserId(userId);
      if (!saccoId) {
        return res.status(403).json({ message: 'You do not manage any SACCO' });
      }

      const { id } = req.params;

      // Check if route exists and belongs to SACCO
      const [existingRoute] = await this.pool.query(
        'SELECT id FROM routes WHERE id = ? AND sacco_id = ?',
        [id, saccoId]
      );

      if (existingRoute.length === 0) {
        return res.status(404).json({ message: 'Route not found or access denied' });
      }

      // Check if route is in use
      const [activeTrips] = await this.pool.query(
        'SELECT COUNT(*) as count FROM trips WHERE route_id = ? AND status = "in_progress"',
        [id]
      );

      if (activeTrips[0].count > 0) {
        return res.status(400).json({ message: 'Cannot delete route with active trips' });
      }

      await this.pool.query('DELETE FROM routes WHERE id = ? AND sacco_id = ?', [id, saccoId]);
      res.json({ message: 'Route deleted successfully' });
    } catch (error) {
      console.error('[SaccoAdminRoutesController] Error deleting route:', error);
      res.status(500).json({ 
        message: 'Error deleting route',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default SaccoAdminRoutesController;
