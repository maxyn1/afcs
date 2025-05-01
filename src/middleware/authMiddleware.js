import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export const authMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Debug token receipt
    console.log('🔐 Auth Middleware:', {
      path: req.path,
      method: req.method,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}` : 'None',
      allowedRoles
    });

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);

      // Debug decoded token with full details
      console.log('🎫 Decoded Token:', {
        userId: decoded.userId || decoded.id, // Handle both formats
        email: decoded.email,
        role: decoded.role,
        status: decoded.status,
        name: decoded.name,
        phone: decoded.phone,
        exp: new Date(decoded.exp * 1000).toISOString(),
        remainingTime: `${Math.round((decoded.exp * 1000 - Date.now()) / 1000 / 60)} minutes`,
        fullDecoded: decoded // Log the full decoded token
      });

      // Verify user status is active
      if (decoded.status !== 'active') {
        return res.status(403).json({ message: 'Account is not active' });
      }

      // Check role access if roles are specified
      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Set the full user object on the request
      req.user = {
        id: decoded.userId || decoded.id, // Handle both formats
        userId: decoded.userId || decoded.id, // Include both for compatibility
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        status: decoded.status,
        phone: decoded.phone,
        lastLogin: decoded.lastLogin,
        // Include any other user properties from the token
        ...decoded
      };

      // Debug the final user object
      console.log('👤 User object set:', {
        id: req.user.id,
        userId: req.user.userId,
        role: req.user.role,
        name: req.user.name
      });

      next();
    } catch (err) {
      console.error('🚫 Token Error:', {
        error: err.message,
        name: err.name,
        token: token ? `${token.substring(0, 10)}...` : 'None'
      });
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
  };
};

// Helper middleware for common role combinations
export const adminOnly = authMiddleware(['system_admin']);
export const saccoAdminOnly = authMiddleware(['system_admin', 'sacco_admin']);
export const driverOnly = authMiddleware(['driver']);
