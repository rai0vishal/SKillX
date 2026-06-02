// authenticate.js — Verifies Firebase ID tokens on incoming requests.
// Attaches the decoded token to req.user and the MongoDB profile to req.userProfile.
// Every protected route should use this middleware (applied globally in index.js).

import { firebaseAuth } from '../config/firebaseAdmin.js';
import UserProfile from '../models/UserProfile.js';

/**
 * Extracts and verifies the Firebase ID token from the Authorization header.
 * On success, sets:
 *   - req.user   = decoded Firebase token ({ uid, email, ... })
 *   - req.userProfile = MongoDB UserProfile document (may be null for brand-new users)
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication required. Provide a valid Firebase ID token in the Authorization header.',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (!idToken) {
      return res.status(401).json({ message: 'Authentication required. Token is empty.' });
    }

    // Cryptographically verify the token with Firebase
    console.log('Verifying token:', idToken.substring(0, 20) + '...');
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);

    // Attach verified identity to request
    req.user = decodedToken;

    // Look up the MongoDB profile (may not exist yet during first signup)
    const userProfile = await UserProfile.findOne({ email: decodedToken.email });
    req.userProfile = userProfile;

    next();
  } catch (error) {
    console.error('Authentication error:', error.code || error.message);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Token has expired. Please sign in again.' });
    }
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ message: 'Token has been revoked. Please sign in again.' });
    }
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({ message: 'Invalid token format.' });
    }

    return res.status(401).json({ message: 'Authentication failed. Invalid or expired token.' });
  }
};
