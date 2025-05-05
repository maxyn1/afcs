
class SaccoAdminRoutesController {
  constructor(pool) {
    this.pool = pool;
  }

  async getRoutes(req, res) {
    try {
      const [routes] = await this.pool.query(
        `
        SELECT 
          id,
          start_location,
          end_location,
          distance_km as distance,
          estimated_duration_minutes,
          base_fare as fare
        FROM routes
        ORDER BY start_location ASC, end_location ASC
        `
      );

      console.log('Fetched routes:', routes.length);
      res.json(routes);
    } catch (error) {
      console.error('Error fetching routes:', error);
      res.status(500).json({ message: 'Error fetching routes' });
    }
  }

  async createRoute(req, res) {
    try {
      const { start_location, end_location, distance_km, estimated_duration_minutes, base_fare } = req.body;

      if (!start_location || !end_location || distance_km == null || base_fare == null) {
        console.log('Missing required route fields:', req.body);
        return res.status(400).json({ message: 'Missing required route fields' });
      }

      if (isNaN(distance_km) || distance_km <= 0) {
        console.log('Invalid distance:', distance_km);
        return res.status(400).json({ message: 'Distance must be a positive number' });
      }

      if (isNaN(base_fare) || base_fare <= 0) {
        console.log('Invalid fare:', base_fare);
        return res.status(400).json({ message: 'Fare must be a positive number' });
      }

      const sanitizedStartLocation = start_location.trim();
      const sanitizedEndLocation = end_location.trim();

      const [result] = await this.pool.query(
        `
        INSERT INTO routes (start_location, end_location, distance_km, estimated_duration_minutes, base_fare)
        VALUES (?, ?, ?, ?, ?)
        `,
        [sanitizedStartLocation, sanitizedEndLocation, distance_km, estimated_duration_minutes !== undefined ? estimated_duration_minutes : null, base_fare]
      );

      console.log('Route created successfully with ID:', result.insertId);
      res.status(201).json({ message: 'Route created successfully', routeId: result.insertId });
    } catch (error) {
      console.error('Error creating route:', error);
      res.status(500).json({ message: 'Error creating route' });
    }
  }
}

export default SaccoAdminRoutesController;
