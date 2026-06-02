import UserProfile from '../models/UserProfile.js';

// checkRole.js — Validates user role and suspension status.
// Attaches the fetched UserProfile document to req.userProfile.
export const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // For MVP without JWT middleware, reads email from various request fields
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

      req.userProfile = user;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ message: 'Server error during authorization.' });
    }
  };
};
