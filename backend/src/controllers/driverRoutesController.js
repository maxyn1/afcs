class DriverRoutesController {
  constructor(pool) {
    this.pool = pool;
    console.log('[DriverRoutesController] Initialized with pool:', {
      hasPool: !!pool,
      connectionLimit: pool?.config?.connectionLimit
    });
  }

  async getRoutes(req, res) {
    const startTime = Date.now();
    try {
      const driverId = req.user.userId;
      console.log('[DriverRoutesController][getRoutes] Fetching routes for driver:', driverId);

      console.log('[DriverRoutesController][getRoutes] Executing query with params:', {
        driverId,
        timestamp: new Date().toISOString()
      });

      const [routes] = await this.pool.query(`
        SELECT DISTINCT
          r.id,
          r.start_location,
          r.end_location,
          r.distance_km as distance,
          r.estimated_duration_minutes as duration,
          r.base_fare
        FROM routes r
        JOIN trips t ON r.id = t.route_id
        JOIN drivers d ON t.driver_id = d.id
        WHERE d.user_id = ?
      `, [driverId]);

      console.log('[DriverRoutesController][getRoutes] Query results:', {
        duration: `${Date.now() - startTime}ms`,
        routesFound: routes.length,
        firstRoute: routes[0]?.id,
        lastRoute: routes[routes.length - 1]?.id
      });

      console.log('[DriverRoutesController][getRoutes] Found routes:', routes.length);
      res.json(routes);
    } catch (error) {
      console.error('[DriverRoutesController][getRoutes] Error:', {
        message: error.message,
        stack: error.stack,
        sql: error.sql,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        userId: req.user?.userId,
        duration: `${Date.now() - startTime}ms`
      });
      res.status(500).json({ message: 'Error fetching routes' });
    }
  }

  async getActiveRoute(req, res) {
    const startTime = Date.now();
    try {
      const driverId = req.user.userId;
      console.log('[DriverRoutesController][getActiveRoute] Checking active route for driver:', driverId);

      console.log('[DriverRoutesController][getActiveRoute] Executing query with params:', {
        driverId,
        timestamp: new Date().toISOString()
      });

      const [[activeRoute]] = await this.pool.query(`
        SELECT 
          r.id,
          r.start_location as start_point,
          r.end_location as end_point,
          r.distance_km as distance,
          r.estimated_duration_minutes as duration
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        JOIN drivers d ON t.driver_id = d.id
        WHERE d.user_id = ? 
        AND t.status = 'in_progress'
        ORDER BY t.departure_time DESC
        LIMIT 1
      `, [driverId]);

      if (!activeRoute) {
        console.log('[DriverRoutesController][getActiveRoute] No active route found:', {
          duration: `${Date.now() - startTime}ms`,
          driverId
        });
        return res.status(404).json({ message: 'No active route found' });
      }

      console.log('[DriverRoutesController][getActiveRoute] Found active route:', {
        routeId: activeRoute.id,
        duration: `${Date.now() - startTime}ms`,
        details: {
          start: activeRoute.start_point,
          end: activeRoute.end_point,
          distance: activeRoute.distance
        }
      });

      res.json(activeRoute);
    } catch (error) {
      console.error('[DriverRoutesController][getActiveRoute] Error:', {
        error: error.message,
        stack: error.stack,
        sql: error.sql,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        duration: `${Date.now() - startTime}ms`,
        userId: req.user?.userId
      });
      res.status(500).json({ message: 'Error fetching active route' });
    }
  }

  async startRoute(req, res) {
    const startTime = Date.now();
    try {
      const { routeId } = req.params;
      const driverId = req.user.userId;
      console.log('[DriverRoutesController][startRoute] Starting route:', {
        routeId,
        driverId
      });

      const [[driver]] = await this.pool.query(
        'SELECT id FROM drivers WHERE user_id = ?',
        [driverId]
      );

      if (!driver) {
        console.warn('[DriverRoutesController][startRoute] Driver not found:', driverId);
        return res.status(404).json({ message: 'Driver not found' });
      }

      console.log('[DriverRoutesController][startRoute] Found driver:', driver);

      const [activeTrips] = await this.pool.query(
        'SELECT id FROM trips WHERE driver_id = ? AND status = "in_progress"',
        [driver.id]
      );

      if (activeTrips.length > 0) {
        console.warn('[DriverRoutesController][startRoute] Driver already has active trip:', {
          driverId,
          tripId: activeTrips[0].id
        });
        return res.status(400).json({ message: 'Already have an active route' });
      }

      const [vehicles] = await this.pool.query(
        `SELECT v.id 
         FROM vehicles v
         JOIN drivers d ON v.sacco_id = d.sacco_id
         WHERE d.id = ? AND v.status = 'active'
         LIMIT 1`,
        [driver.id]
      );

      if (vehicles.length === 0) {
        console.warn('[DriverRoutesController][startRoute] No available vehicle found for driver:', driverId);
        return res.status(400).json({ message: 'No available vehicle' });
      }

      console.log('[DriverRoutesController][startRoute] Database operations:', {
        driverQuery: {
          success: !!driver,
          duration: `${Date.now() - startTime}ms`
        },
        activeTripsCheck: {
          hasActiveTrip: activeTrips.length > 0,
          tripId: activeTrips[0]?.id
        },
        vehicleAssignment: {
          success: vehicles.length > 0,
          vehicleId: vehicles[0]?.id
        }
      });

      await this.pool.query(
        `INSERT INTO trips 
         (route_id, driver_id, vehicle_id, status, departure_time) 
         VALUES (?, ?, ?, "in_progress", NOW())`,
        [routeId, driver.id, vehicles[0].id]
      );

      console.log('[DriverRoutesController][startRoute] Route started successfully');
      res.json({ message: 'Route started successfully' });
    } catch (error) {
      console.error('[DriverRoutesController][startRoute] Error:', {
        message: error.message,
        stack: error.stack,
        routeId: req.params.routeId,
        userId: req.user?.userId
      });
      res.status(500).json({ message: 'Error starting route' });
    }
  }

  async endRoute(req, res) {
    const startTime = Date.now();
    try {
      const driverId = req.user.userId;
      console.log('[DriverRoutesController][endRoute] Ending route for driver:', driverId);

      const [result] = await this.pool.query(`
        UPDATE trips t
        JOIN drivers d ON t.driver_id = d.id
        SET t.status = 'completed',
            t.arrival_time = NOW(),
            t.total_passengers = (
              SELECT COUNT(*) 
              FROM bookings b 
              WHERE b.trip_id = t.id AND b.status = 'confirmed'
            )
        WHERE d.user_id = ? AND t.status = 'in_progress'
      `, [driverId]);

      console.log('[DriverRoutesController][endRoute] Update operation:', {
        driverId,
        affectedRows: result.affectedRows,
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      });

      if (result.affectedRows === 0) {
        console.warn('[DriverRoutesController][endRoute] No active route found for driver:', driverId);
        return res.status(404).json({ message: 'No active route found' });
      }

      console.log('[DriverRoutesController][endRoute] Route ended successfully');
      res.json({ message: 'Route ended successfully' });
    } catch (error) {
      console.error('[DriverRoutesController][endRoute] Error:', {
        message: error.message,
        stack: error.stack,
        sql: error.sql,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        duration: `${Date.now() - startTime}ms`,
        userId: req.user?.userId
      });
      res.status(500).json({ message: 'Error ending route' });
    }
  }
}

export default DriverRoutesController;