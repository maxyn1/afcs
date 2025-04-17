class DriverTripsController {
    constructor(pool) {
      this.pool = pool;
      console.log('[DriverTripsController] Initialized with pool:', !!pool);
    }
  
    /**
     * Get trip history for a driver with pagination and filtering
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    async getTripHistory(req, res) {
      try {
        const driverId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const status = req.query.status;
  
        console.log('[DriverTripsController][getTripHistory] Request params:', {
          driverId,
          page,
          limit,
          status
        });
  
        // Build query parameters based on status filter
        const { statusClause, countParams, queryParams } = this.buildQueryParameters(
          driverId, 
          status, 
          limit, 
          offset
        );
  
        // Get total count of trips for pagination
        const total = await this.getTotalTripsCount(driverId, statusClause, countParams);
  
        // Get paginated trip data
        const trips = await this.getPaginatedTrips(driverId, statusClause, queryParams);
  
        // Format response
        const response = this.formatResponse(trips, total, page, limit);
  
        console.log('[DriverTripsController][getTripHistory] Found trips:', {
          count: trips.length,
          ...response.pagination
        });
  
        res.json(response);
      } catch (error) {
        this.handleError(error, req, res);
      }
    }
  
    /**
     * Build query parameters based on status filter
     */
    buildQueryParameters(driverId, status, limit, offset) {
      const statusClause = status && status !== 'all' ? 'AND t.status = ?' : '';
      
      const countParams = status && status !== 'all' 
        ? [driverId, status] 
        : [driverId];
  
      const queryParams = status && status !== 'all'
        ? [driverId, status, limit, offset]
        : [driverId, limit, offset];
  
      return { statusClause, countParams, queryParams };
    }
  
    /**
     * Get total count of trips for pagination
     */
    async getTotalTripsCount(driverId, statusClause, countParams) {
      const [[{ total }]] = await this.pool.query(`
        SELECT COUNT(t.id) as total 
        FROM trips t
        JOIN drivers d ON t.driver_id = d.id
        WHERE d.user_id = ?
        ${statusClause}
      `, countParams);
  
      return total;
    }
  
    /**
     * Get paginated trip data with all related information
     */
    async getPaginatedTrips(driverId, statusClause, queryParams) {
      const [trips] = await this.pool.query(`
        SELECT 
          t.id,
          t.departure_time as date,
          t.arrival_time,
          t.status,
          CONCAT(r.start_location, ' → ', r.end_location) as route,
          r.distance_km,
          r.base_fare,
          v.registration_number as vehicle,
          v.capacity as vehicle_capacity,
          s.name as sacco_name,
          t.total_passengers as passengers,
          (
            SELECT COALESCE(SUM(b.total_fare), 0)
            FROM bookings b
            WHERE b.trip_id = t.id
            AND b.status = 'confirmed'
          ) as total_amount,
          (
            SELECT AVG(f.rating)
            FROM feedback f
            WHERE f.trip_id = t.id
          ) as average_rating,
          (
            SELECT COUNT(*)
            FROM feedback f2
            WHERE f2.trip_id = t.id
          ) as total_ratings
        FROM trips t
        JOIN drivers d ON t.driver_id = d.id
        JOIN routes r ON t.route_id = r.id
        JOIN vehicles v ON t.vehicle_id = v.id
        JOIN saccos s ON v.sacco_id = s.id
        WHERE d.user_id = ?
        ${statusClause}
        ORDER BY t.departure_time DESC
        LIMIT ? OFFSET ?
      `, queryParams);
  
      return trips;
    }
  
    /**
     * Format the response with transformed data and pagination info
     */
    formatResponse(trips, total, page, limit) {
      const formattedTrips = trips.map(trip => ({
        ...trip,
        distance_km: Number(trip.distance_km),
        base_fare: Number(trip.base_fare),
        total_amount: Number(trip.total_amount),
        passengers: Number(trip.passengers),
        average_rating: trip.average_rating ? Number(trip.average_rating) : null,
        total_ratings: Number(trip.total_ratings),
        metrics: {
          occupancy_rate: Number(((trip.passengers / trip.vehicle_capacity) * 100).toFixed(1)),
          revenue_per_km: trip.distance_km > 0 
            ? Number((trip.total_amount / trip.distance_km).toFixed(2))
            : 0
        }
      }));
  
      return {
        trips: formattedTrips,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalTrips: total,
          tripsPerPage: limit
        }
      };
    }
  
    /**
     * Handle errors consistently across the controller
     */
    handleError(error, req, res) {
      console.error('[DriverTripsController][getTripHistory] Error:', {
        message: error.message,
        stack: error.stack,
        sql: error.sql,
        sqlMessage: error.sqlMessage,
        code: error.code,
        userId: req.user?.userId
      });
      
      res.status(500).json({ 
        message: 'Error fetching trip history',
        error: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          sql: error.sql,
          code: error.code
        } : undefined
      });
    }
  }
  
  export default DriverTripsController;