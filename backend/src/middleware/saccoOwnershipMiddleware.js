export const saccoOwnershipMiddleware = () => async (req, res, next) => {
  // Skip check for system admins
  if (req.user.role === 'system_admin') {
    return next();
  }

  // For SACCO admins, check if they're managing the requested SACCO
  if (req.user.role === 'sacco_admin') {
    const saccoId = req.params.id || req.body.saccoId;
    
    if (!saccoId) {
      return res.status(400).json({ message: 'SACCO ID is required' });
    }

    if (Number(saccoId) !== Number(req.user.saccoId)) {
      return res.status(403).json({ message: 'You can only access your own SACCO' });
    }
  }

  next();
};