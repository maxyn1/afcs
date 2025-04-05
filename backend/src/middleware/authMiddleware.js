import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export const authMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);

      // Verify user status is active
      if (decoded.status !== 'active') {
        return res.status(403).json({ message: 'Account is not active' });
      }

      // Check role access if roles are specified
      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      req.user = decoded;
      next();
    } catch (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
  };
};

// Helper middleware for common role combinations
export const adminOnly = authMiddleware(['system_admin']);
export const saccoAdminOnly = authMiddleware(['system_admin', 'sacco_admin']);
export const driverOnly = authMiddleware(['driver']);
