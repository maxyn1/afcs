import jwt from 'jsonwebtoken';

export const authMiddleware = (requireAdmin = false) => {
  return (req, res, next) => {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Check if no token
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
      res.status(401).json({ message: 'Token is not valid' });
    }
  };
};
