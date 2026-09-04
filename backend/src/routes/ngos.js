import express from 'express';
import { queryGet, queryRun, queryAll } from '../db/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List all NGOs
router.get('/', (req, res) => {
  const ngos = queryAll(`
    SELECT n.*,
      (SELECT COUNT(*) FROM ngo_requirements WHERE ngo_id = n.id AND status = 'ACTIVE') as active_requirements_count,
      (SELECT COALESCE(SUM(allocated_servings), 0) FROM matches WHERE ngo_id = n.id AND status IN ('ACCEPTED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED')) as total_servings_received
    FROM ngos n
    ORDER BY n.ngo_name
  `);
  res.json({ ngos });
});

// Get NGO Dashboard Data
router.get('/my/dashboard', authenticateToken, requireRole('NGO'), (req, res) => {
  const ngoId = req.user.ngo_id;
  if (!ngoId) {
    return res.status(400).json({ error: 'NGO profile not found for this account.' });
  }

  const ngo = queryGet('SELECT * FROM ngos WHERE id = ?', [ngoId]);

  // Current active requirements
  const activeRequirements = queryAll(`
    SELECT * FROM ngo_requirements 
    WHERE ngo_id = ? 
    ORDER BY CASE urgency 
      WHEN 'CRITICAL' THEN 1 
      WHEN 'HIGH' THEN 2 
      WHEN 'MEDIUM' THEN 3 
      ELSE 4 END, created_at DESC
  `, [ngoId]);

  // Assigned / Incoming Donations
  const incomingDonations = queryAll(`
    SELECT m.id as match_id, m.allocated_servings, m.match_score, m.status as match_status, m.created_at as matched_at,
      f.id as donation_id, f.food_name, f.category, f.is_veg, f.remaining_window_minutes,
      h.hotel_name, h.address as hotel_address, h.phone as hotel_phone,
      d.id as delivery_id, d.status as delivery_status, d.distance_km, d.estimated_duration_mins, d.route_waypoints_json, d.driver_name, d.driver_phone
    FROM matches m
    JOIN food_donations f ON m.donation_id = f.id
    JOIN hotels h ON f.hotel_id = h.id
    LEFT JOIN deliveries d ON d.match_id = m.id
    WHERE m.ngo_id = ? AND m.status IN ('PROPOSED', 'ACCEPTED', 'IN_TRANSIT')
    ORDER BY m.created_at DESC
  `, [ngoId]);

  // Total statistics
  const totalServingsReceived = queryGet(`
    SELECT COALESCE(SUM(allocated_servings), 0) as total 
    FROM matches 
    WHERE ngo_id = ? AND status IN ('ACCEPTED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED')
  `, [ngoId])?.total || 0;

  const completedDeliveries = queryGet(`
    SELECT COUNT(*) as count 
    FROM deliveries 
    WHERE ngo_id = ? AND status IN ('DELIVERED', 'COMPLETED')
  `, [ngoId])?.count || 0;

  res.json({
    ngo,
    stats: {
      active_requirements: activeRequirements.filter(r => r.status === 'ACTIVE').length,
      total_servings_received: totalServingsReceived,
      people_served: Math.round(totalServingsReceived * 1.0),
      incoming_deliveries: incomingDonations.filter(d => d.delivery_status === 'IN_TRANSIT' || d.delivery_status === 'ASSIGNED').length,
      completed_deliveries: completedDeliveries
    },
    active_requirements: activeRequirements,
    incoming_donations: incomingDonations
  });
});

// Post a new food requirement
router.post('/requirements', authenticateToken, requireRole('NGO'), (req, res) => {
  try {
    const ngoId = req.user.ngo_id;
    const { food_categories, servings_required, urgency, required_by, dietary_restrictions, notes } = req.body;

    if (!servings_required || !required_by) {
      return res.status(400).json({ error: 'Servings required and required-by time are mandatory.' });
    }

    const categoriesStr = Array.isArray(food_categories) 
      ? JSON.stringify(food_categories) 
      : (food_categories || '["All"]');

    const result = queryRun(`
      INSERT INTO ngo_requirements (
        ngo_id, food_categories, servings_required, urgency, required_by, dietary_restrictions, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `, [
      ngoId,
      categoriesStr,
      Number(servings_required),
      (urgency || 'MEDIUM').toUpperCase(),
      required_by,
      dietary_restrictions || 'Any',
      notes || null
    ]);

    const reqId = Number(result.lastInsertRowid);
    const newRequirement = queryGet('SELECT * FROM ngo_requirements WHERE id = ?', [reqId]);

    return res.status(201).json({
      message: 'Food requirement posted successfully',
      requirement: newRequirement
    });
  } catch (err) {
    console.error('Error posting requirement:', err);
    return res.status(500).json({ error: 'Failed to post food requirement.' });
  }
});

// Update requirement status (e.g. fulfill or cancel)
router.patch('/requirements/:id/status', authenticateToken, requireRole('NGO'), (req, res) => {
  const { status } = req.body;
  const ngoId = req.user.ngo_id;

  queryRun(`
    UPDATE ngo_requirements 
    SET status = ? 
    WHERE id = ? AND (ngo_id = ? OR ?)
  `, [status, req.params.id, ngoId, req.user.role === 'ADMIN']);

  const updated = queryGet('SELECT * FROM ngo_requirements WHERE id = ?', [req.params.id]);
  res.json({ message: 'Requirement updated', requirement: updated });
});

// Accept or Reject an assigned Match
router.post('/matches/:id/respond', authenticateToken, requireRole('NGO'), (req, res) => {
  const matchId = req.params.id;
  const { action, reason } = req.body; // action: 'ACCEPT' or 'REJECT'
  const ngoId = req.user.ngo_id;

  const match = queryGet('SELECT * FROM matches WHERE id = ?', [matchId]);
  if (!match) {
    return res.status(404).json({ error: 'Match record not found.' });
  }

  if (match.ngo_id !== ngoId && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'You are not authorized to respond to this allocation.' });
  }

  if (action === 'ACCEPT') {
    queryRun("UPDATE matches SET status = 'ACCEPTED' WHERE id = ?", [matchId]);
    queryRun("UPDATE deliveries SET status = 'PICKUP_READY' WHERE match_id = ?", [matchId]);
    return res.json({ message: 'Food allocation accepted! Delivery driver is notified for pickup.' });
  } else if (action === 'REJECT') {
    queryRun("UPDATE matches SET status = 'REJECTED' WHERE id = ?", [matchId]);
    queryRun("UPDATE deliveries SET status = 'FAILED', notes = ? WHERE match_id = ?", [reason || 'Rejected by NGO', matchId]);
    // Reset donation status so it can be rematched
    queryRun("UPDATE food_donations SET status = 'SAFETY_PASSED' WHERE id = ?", [match.donation_id]);
    return res.json({ message: 'Allocation declined. Food returned to matching pool.' });
  } else {
    return res.status(400).json({ error: "Action must be 'ACCEPT' or 'REJECT'." });
  }
});

// Update NGO profile
router.put('/my/profile', authenticateToken, requireRole('NGO'), (req, res) => {
  const ngoId = req.user.ngo_id;
  const { ngo_name, address, latitude, longitude, contact_person, phone, default_people_count, category_focus, reg_number } = req.body;

  queryRun(`
    UPDATE ngos SET 
      ngo_name = COALESCE(?, ngo_name),
      address = COALESCE(?, address),
      latitude = COALESCE(?, latitude),
      longitude = COALESCE(?, longitude),
      contact_person = COALESCE(?, contact_person),
      phone = COALESCE(?, phone),
      default_people_count = COALESCE(?, default_people_count),
      category_focus = COALESCE(?, category_focus),
      reg_number = COALESCE(?, reg_number)
    WHERE id = ?
  `, [ngo_name, address, latitude, longitude, contact_person, phone, default_people_count, category_focus, reg_number, ngoId]);

  const updated = queryGet('SELECT * FROM ngos WHERE id = ?', [ngoId]);
  res.json({ message: 'Profile updated successfully', ngo: updated });
});

export default router;
