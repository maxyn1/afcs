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
      WHERE s.status = 'active'
      GROUP BY s.id
    `);
    console.log('Found SACCOs:', saccos);
    res.json(saccos);
  } catch (error) {
    console.error('Error fetching SACCOs:', error);
    res.status(500).json({ message: 'Error fetching SACCOs', error: error.message });
  }
});

// Add new SACCO
router.post('/', authMiddleware(), async (req, res) => {
  try {
    const { name, registrationNumber, contactEmail, contactPhone } = req.body;
    const [result] = await pool.query(
      'INSERT INTO saccos (name, registration_number, contact_email, contact_phone, status) VALUES (?, ?, ?, ?, ?)',
      [name, registrationNumber, contactEmail, contactPhone, 'active']
    );
    res.status(201).json({ id: result.insertId, message: 'SACCO created successfully' });
  } catch (error) {
    console.error('Error creating SACCO:', error);
    res.status(500).json({ message: 'Error creating SACCO' });
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

    // Get vehicles for this SACCO
    const [vehicles] = await pool.query(
      'SELECT id, registration_number, capacity, status FROM vehicles WHERE sacco_id = ?',
      [id]
    );

    // Combine the data
    const saccoData = {
      ...saccos[0],
      vehicles
    };

    console.log('SACCO data:', saccoData);
    res.json(saccoData);
  } catch (error) {
    console.error('Error fetching SACCO details:', error);
    res.status(500).json({ message: 'Error fetching SACCO details', error: error.message });
  }
});

// Update SACCO
router.put('/:id', authMiddleware(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, registration_number, contact_email, contact_phone } = req.body;
    
    const [result] = await pool.query(
      `UPDATE saccos 
       SET name = ?, registration_number = ?, contact_email = ?, contact_phone = ?
       WHERE id = ?`,
      [name, registration_number, contact_email, contact_phone, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'SACCO not found' });
    }

    res.json({ id, name, registration_number, contact_email, contact_phone });
  } catch (error) {
    console.error('Error updating SACCO:', error);
    res.status(500).json({ message: 'Error updating SACCO' });
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
