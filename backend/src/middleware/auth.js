import jwt from 'jsonwebtoken';
import { queryGet } from '../db/connection.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'foodbridge-super-secret-key-2026';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please login.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch fresh user details including linked hotel/ngo IDs
    const user = queryGet('SELECT id, name, email, role, phone FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    if (user.role === 'HOTEL') {
      const hotel = queryGet('SELECT id, hotel_name FROM hotels WHERE user_id = ?', [user.id]);
      user.hotel_id = hotel?.id || null;
      user.hotel_name = hotel?.hotel_name || null;
    } else if (user.role === 'NGO') {
      const ngo = queryGet('SELECT id, ngo_name FROM ngos WHERE user_id = ?', [user.id]);
      user.ngo_id = ngo?.id || null;
      user.ngo_name = ngo?.ngo_name || null;
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (req.user.role === 'ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ 
      error: `Access denied. Requires one of [${allowedRoles.join(', ')}] role.` 
    });
  };
}
