/**
 * Middleware to check if a user has a specific permission.
 * Note: Assumes `req.userProfile` has been set by a previous middleware like `checkRole`.
 * 
 * @param {String} requiredPermission - The permission required to access the route
 */
export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = req.userProfile;

      if (!user) {
        return res.status(401).json({ message: 'Authentication required. User profile not found.' });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({ message: 'Your account has been suspended.' });
      }

      const userPermissions = user.permissions || [];

      if (!userPermissions.includes(requiredPermission)) {
        return res.status(403).json({ message: `Access denied. Requires '${requiredPermission}' permission.` });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Server error during permission check.' });
    }
  };
};
