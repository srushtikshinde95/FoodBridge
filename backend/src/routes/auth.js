import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryGet, queryRun, queryAll } from '../db/connection.js';
import { JWT_SECRET, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register new user (Hotel, NGO, or Admin)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, orgName, address, latitude, longitude, defaultPeopleCount } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    const existing = queryGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const userResult = queryRun(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, password_hash, role.toUpperCase(), phone || null]
    );

    const userId = Number(userResult.lastInsertRowid);

    // If Hotel role, create hotel profile
    if (role.toUpperCase() === 'HOTEL') {
      queryRun(
        `INSERT INTO hotels (user_id, hotel_name, address, latitude, longitude, contact_person, phone, email) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          orgName || `${name}'s Restaurant`,
          address || 'Main City Road',
          latitude || 18.5204,
          longitude || 73.8567,
          name,
          phone || null,
          email
        ]
      );
    } else if (role.toUpperCase() === 'NGO') {
      queryRun(
        `INSERT INTO ngos (user_id, ngo_name, address, latitude, longitude, contact_person, phone, email, default_people_count) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          orgName || `${name} Foundation`,
          address || 'Community Center Road',
          latitude || 18.5304,
          longitude || 73.8667,
          name,
          phone || null,
          email,
          defaultPeopleCount ? Number(defaultPeopleCount) : 50
        ]
      );
    }

    const token = jwt.sign({ id: userId, email, role: role.toUpperCase() }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: userId, name, email, role: role.toUpperCase() }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = queryGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let extra = {};
    if (user.role === 'HOTEL') {
      const hotel = queryGet('SELECT id, hotel_name FROM hotels WHERE user_id = ?', [user.id]);
      extra.hotel_id = hotel?.id || null;
      extra.hotel_name = hotel?.hotel_name || null;
    } else if (user.role === 'NGO') {
      const ngo = queryGet('SELECT id, ngo_name FROM ngos WHERE user_id = ?', [user.id]);
      extra.ngo_id = ngo?.id || null;
      extra.ngo_name = ngo?.ngo_name || null;
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        ...extra
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

// Get Current Logged-in User Profile
router.get('/me', authenticateToken, (req, res) => {
  return res.json({ user: req.user });
});

// Get Quick Demo Profiles for 1-click login in Demo Mode
router.get('/demo-users', (req, res) => {
  const users = queryAll(`
    SELECT u.id, u.name, u.email, u.role,
           h.hotel_name, h.id as hotel_id,
           n.ngo_name, n.id as ngo_id, n.default_people_count
    FROM users u
    LEFT JOIN hotels h ON h.user_id = u.id
    LEFT JOIN ngos n ON n.user_id = u.id
    ORDER BY u.role, u.id
  `);

  return res.json({ demo_users: users });
});

export default router;
