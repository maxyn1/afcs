class DriverMessagesController {
  constructor(pool) {
    this.pool = pool;
  }

  async getConversations(req, res) {
    try {
      const userId = req.user.userId;
      
      // Check if user is a driver
      const [driverRows] = await this.pool.query(
        'SELECT id FROM drivers WHERE user_id = ?',
        [userId]
      );
      
      if (driverRows.length === 0) {
        return res.status(403).json({ message: 'User is not a registered driver' });
      }
      
      // Since there's no messages or conversations table in the schema,
      // we'll create a mock response with conversations between drivers and passengers
      // This would need to be replaced with proper implementation when the schema is updated
      
      // Get user bookings where this driver was involved
      const [bookings] = await this.pool.query(`
        SELECT 
          b.id,
          b.user_id,
          t.id AS trip_id,
          u.name,
          b.booking_time,
          b.status
        FROM bookings b
        JOIN trips t ON b.trip_id = t.id
        JOIN users u ON b.user_id = u.id
        JOIN drivers d ON t.driver_id = d.id
        WHERE d.user_id = ?
        ORDER BY b.booking_time DESC
        LIMIT 10
      `, [userId]);
      
      // Transform bookings into conversation-like structure
      const conversations = bookings.map(booking => {
        let lastMessage = "Hello, I'm your passenger for this trip.";
        if (booking.status === 'completed') {
          lastMessage = "Thanks for the ride!";
        } else if (booking.status === 'cancelled') {
          lastMessage = "Sorry, I had to cancel my booking.";
        }
        
        return {
          id: `booking-${booking.id}`,
          name: booking.name,
          is_group: false,
          last_message: lastMessage,
          last_message_date: booking.booking_time,
          member_count: 2,
          unread_count: 0
        };
      });

      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: 'Error fetching conversations' });
    }
  }

  async getMessages(req, res) {
    try {
      const userId = req.user.userId;
      const { conversationId } = req.params;
      
      // Check if user is a driver
      const [driverRows] = await this.pool.query(
        'SELECT id FROM drivers WHERE user_id = ?',
        [userId]
      );
      
      if (driverRows.length === 0) {
        return res.status(403).json({ message: 'User is not a registered driver' });
      }
      
      // Extract booking ID from conversation ID
      const bookingId = conversationId.replace('booking-', '');
      
      // Get booking details
      const [bookingRows] = await this.pool.query(`
        SELECT 
          b.id,
          b.user_id,
          b.booking_time,
          b.status,
          u.name AS passenger_name,
          t.id AS trip_id,
          r.start_location,
          r.end_location
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN trips t ON b.trip_id = t.id
        JOIN routes r ON t.route_id = r.id
        JOIN drivers d ON t.driver_id = d.id
        WHERE b.id = ? AND d.user_id = ?
      `, [bookingId, userId]);
      
      if (bookingRows.length === 0) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      const booking = bookingRows[0];
      
      // Generate mock messages based on booking status
      const messages = [];
      const now = new Date();
      
      // First message from passenger
      messages.push({
        id: `msg-${booking.id}-1`,
        content: `Hello, I've booked a seat from ${booking.start_location} to ${booking.end_location}.`,
        timestamp: new Date(booking.booking_time).toISOString(),
        is_mine: false,
        sender_name: booking.passenger_name
      });
      
      // Response from driver
      messages.push({
        id: `msg-${booking.id}-2`,
        content: `Hi there! I'll be your driver for this trip. Looking forward to seeing you.`,
        timestamp: new Date(new Date(booking.booking_time).getTime() + 5 * 60000).toISOString(),
        is_mine: true,
        sender_name: 'You'
      });
      
      if (booking.status === 'completed') {
        messages.push({
          id: `msg-${booking.id}-3`,
          content: `Thanks for the ride!`,
          timestamp: new Date(now.getTime() - 24 * 60 * 60000).toISOString(),
          is_mine: false,
          sender_name: booking.passenger_name
        });
        
        messages.push({
          id: `msg-${booking.id}-4`,
          content: `You're welcome! Hope to see you again.`,
          timestamp: new Date(now.getTime() - 23 * 60 * 60000).toISOString(),
          is_mine: true,
          sender_name: 'You'
        });
      } else if (booking.status === 'cancelled') {
        messages.push({
          id: `msg-${booking.id}-3`,
          content: `Sorry, I had to cancel my booking.`,
          timestamp: new Date(now.getTime() - 24 * 60 * 60000).toISOString(),
          is_mine: false,
          sender_name: booking.passenger_name
        });
        
        messages.push({
          id: `msg-${booking.id}-4`,
          content: `No problem, maybe next time!`,
          timestamp: new Date(now.getTime() - 23 * 60 * 60000).toISOString(),
          is_mine: true,
          sender_name: 'You'
        });
      }

      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Error fetching messages' });
    }
  }

  async sendMessage(req, res) {
    try {
      const userId = req.user.userId;
      const { conversationId } = req.params;
      const { content } = req.body;
      
      // Check if user is a driver
      const [driverRows] = await this.pool.query(
        'SELECT id FROM drivers WHERE user_id = ?',
        [userId]
      );
      
      if (driverRows.length === 0) {
        return res.status(403).json({ message: 'User is not a registered driver' });
      }
      
      // Since we don't have a messages table,
      // we'll just acknowledge the message and return a mock response
      
      // Get user name
      const [userRows] = await this.pool.query(
        'SELECT name FROM users WHERE id = ?',
        [userId]
      );
      
      if (userRows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const message = {
        id: `msg-temp-${Date.now()}`,
        content: content,
        timestamp: new Date().toISOString(),
        is_mine: true,
        sender_name: userRows[0].name
      };

      res.json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Error sending message' });
    }
  }
}

export default DriverMessagesController;