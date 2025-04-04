import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { connectDB } from '../config/database.js';

const router = express.Router();
let pool;

// Initialize database connection
(async () => {
  try {
    pool = await connectDB();
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
})();

// Get all SACCOs with vehicle and route counts
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all SACCOs...');
    const [saccos] = await pool.query(`
      SELECT 
        s.*,
        COUNT(DISTINCT v.id) as vehicle_count,
        COUNT(DISTINCT r.id) as route_count
      FROM saccos s
      LEFT JOIN vehicles v ON v.sacco_id = s.id AND v.status = 'active'
      LEFT JOIN trips t ON t.vehicle_id = v.id
      LEFT JOIN routes r ON r.id = t.route_id
      WHERE s.status != 'inactive'
      GROUP BY s.id
      ORDER BY s.id DESC
    `);
    
    res.json(saccos.map(sacco => ({
      ...sacco,
      vehicle_count: Number(sacco.vehicle_count) || 0,
      route_count: Number(sacco.route_count) || 0
    })));
  } catch (error) {
    console.error('Error fetching SACCOs:', error);
    res.status(500).json({ 
      message: 'Failed to fetch SACCOs'
    });
  }
});

// Add new route for getting detailed SACCO information
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching SACCO details for ID:', id);
    
    // Get SACCO details with counts
    const [saccos] = await pool.query(`
      SELECT 
        s.*,
        COUNT(DISTINCT v.id) as vehicle_count,
        COUNT(DISTINCT r.id) as route_count
      FROM saccos s
      LEFT JOIN vehicles v ON v.sacco_id = s.id AND v.status = 'active'
      LEFT JOIN trips t ON t.vehicle_id = v.id
      LEFT JOIN routes r ON r.id = t.route_id
      WHERE s.id = ?
      GROUP BY s.id
    `, [id]);

    if (saccos.length === 0) {
      return res.status(404).json({ message: 'SACCO not found' });
    }

    // Get active vehicles for this SACCO
    const [vehicles] = await pool.query(
      `SELECT id, registration_number, capacity, status 
       FROM vehicles 
       WHERE sacco_id = ? AND status != 'retired'
       ORDER BY registration_number`,
      [id]
    );

    // Combine the data
    const saccoData = {
      ...saccos[0],
      vehicles,
      vehicle_count: Number(saccos[0].vehicle_count) || 0,
      route_count: Number(saccos[0].route_count) || 0
    };

    console.log('SACCO data:', saccoData);
    res.json(saccoData);
  } catch (error) {
    console.error('Error fetching SACCO details:', error);
    res.status(500).json({ message: 'Failed to fetch SACCO details' });
  }
});

// Add new SACCO with validation
router.post('/', authMiddleware(), async (req, res) => {
  try {
    const { name, registration_number, contact_email, contact_phone } = req.body;

    // Validate required fields with better naming
    const requiredFields = {
      name: name?.trim(),
      registration_number: registration_number?.trim(),
      contact_email: contact_email?.trim(),
      contact_phone: contact_phone?.trim()
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        fields: missingFields
      });
    }

    // Email format validation
    if (!contact_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check for existing SACCO
    const [existing] = await pool.query(
      `SELECT id FROM saccos WHERE 
       name = ? OR registration_number = ? OR 
       contact_email = ? OR contact_phone = ?`,
      [name, registration_number, contact_email, contact_phone]
    );

    if (existing.length > 0) {
      return res.status(409).json({ 
        message: 'SACCO with similar details already exists' 
      });
    }

    // Insert new SACCO
    const [result] = await pool.query(
      `INSERT INTO saccos (
        name, registration_number, contact_email, 
        contact_phone, status
      ) VALUES (?, ?, ?, ?, 'active')`,
      [name, registration_number, contact_email, contact_phone]
    );

    const newSacco = {
      id: result.insertId,
      name,
      registration_number,
      contact_email,
      contact_phone,
      status: 'active',
      vehicle_count: 0,
      route_count: 0
    };

    res.status(201).json(newSacco);
  } catch (error) {
    console.error('Error creating SACCO:', error);
    res.status(500).json({ 
      message: 'Failed to create SACCO',
      error: error.message
    });
  }
});

// Update SACCO with validation
router.put('/:id', authMiddleware(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, registration_number, contact_email, contact_phone } = req.body;

    // Check if SACCO exists
    const [existing] = await pool.query(
      'SELECT * FROM saccos WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'SACCO not found' });
    }

    // Check for duplicates excluding current SACCO
    const [duplicates] = await pool.query(
      `SELECT id FROM saccos WHERE 
       (name = ? OR registration_number = ? OR 
        contact_email = ? OR contact_phone = ?) AND id != ?`,
      [name, registration_number, contact_email, contact_phone, id]
    );

    if (duplicates.length > 0) {
      return res.status(409).json({ 
        message: 'Another SACCO with similar details exists' 
      });
    }

    const [result] = await pool.query(
      `UPDATE saccos 
       SET name = ?, registration_number = ?, 
           contact_email = ?, contact_phone = ?
       WHERE id = ?`,
      [name, registration_number, contact_email, contact_phone, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Update failed' });
    }

    res.json({ 
      id: Number(id), 
      name, 
      registration_number, 
      contact_email, 
      contact_phone,
      message: 'SACCO updated successfully'
    });
  } catch (error) {
    console.error('Error updating SACCO:', error);
    res.status(500).json({ 
      message: 'Error updating SACCO',
      error: error.message 
    });
  }
});

// Delete SACCO
router.delete('/:id', authMiddleware(), async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if SACCO has any active vehicles
    const [vehicles] = await pool.query(
      'SELECT COUNT(*) as count FROM vehicles WHERE sacco_id = ? AND status = "active"',
      [id]
    );

    if (vehicles[0].count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete SACCO with active vehicles. Please deactivate all vehicles first.' 
      });
    }

    const [result] = await pool.query('DELETE FROM saccos WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'SACCO not found' });
    }

    res.json({ message: 'SACCO deleted successfully' });
  } catch (error) {
    console.error('Error deleting SACCO:', error);
    res.status(500).json({ message: 'Error deleting SACCO' });
  }
});

export default router;
