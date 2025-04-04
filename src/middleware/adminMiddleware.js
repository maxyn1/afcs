export const adminMiddleware = () => (req, res, next) => {
  if (req.user && (req.user.role === 'system_admin' || req.user.role === 'sacco_admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};
