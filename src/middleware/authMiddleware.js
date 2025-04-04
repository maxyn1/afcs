import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export const authMiddleware = (requireAdmin = false) => {
  return (req, res, next) => {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      // Verify token using config secret
      const decoded = jwt.verify(token, config.jwtSecret);

      // Check for admin routes if required
      if (requireAdmin && 
          decoded.role !== 'system_admin' && 
          decoded.role !== 'sacco_admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Add user from payload
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
  };
};
