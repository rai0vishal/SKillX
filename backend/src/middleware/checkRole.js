import UserProfile from '../models/UserProfile.js';

/**
 * Middleware to check user roles and status.
 * Note: Assumes `req.user.email` is already set by a previous authentication middleware
 * (or expects the email to be passed in headers/body for this basic implementation).
 * 
 * @param {Array<String>} allowedRoles - Array of roles allowed to access the route (e.g., ['admin'])
 */
export const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // In a real app, you'd extract email from req.user (set by JWT middleware)
      // For SkillX MVP, many routes receive email in req.headers or req.body
      const userEmail = req.headers['user-email'] || req.body.userEmail || req.query.email;

      if (!userEmail) {
        return res.status(401).json({ message: 'Authentication required. Missing user email.' });
      }

      const user = await UserProfile.findOne({ email: userEmail });

      if (!user) {
        return res.status(404).json({ message: 'User profile not found.' });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({ message: 'Your account has been suspended.' });
      }

      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }

      // Attach user profile to request for downstream use
      req.userProfile = user;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ message: 'Server error during authorization.' });
    }
  };
};
