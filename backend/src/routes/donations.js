import express from 'express';
import { queryGet, queryRun, queryAll } from '../db/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { screenFoodSafety } from '../engine/safetyEngine.js';
import { executeAllocation } from '../engine/allocator.js';

const router = express.Router();

// Preview Food Safety Screening (Without saving)
router.post('/preview-safety', (req, res) => {
  try {
    const safetyResult = screenFoodSafety(req.body);
    return res.json({ safety: safetyResult });
  } catch (err) {
    return res.status(400).json({ error: 'Failed to run safety screening preview.' });
  }
});

// List all donations (with filters)
router.get('/', (req, res) => {
  const { category, safety_status, status, hotel_id } = req.query;

  let sql = `
    SELECT f.*, h.hotel_name, h.address as hotel_address, h.phone as hotel_phone,
      (SELECT COUNT(*) FROM matches WHERE donation_id = f.id) as match_count,
      (SELECT ngo_name FROM matches m JOIN ngos n ON m.ngo_id = n.id WHERE m.donation_id = f.id LIMIT 1) as assigned_ngo_name
    FROM food_donations f
    JOIN hotels h ON f.hotel_id = h.id
    WHERE 1=1
  `;
  const params = [];

  if (category) {
    sql += ' AND f.category = ?';
    params.push(category);
  }
  if (safety_status) {
    sql += ' AND f.safety_status = ?';
    params.push(safety_status);
  }
  if (status) {
    sql += ' AND f.status = ?';
    params.push(status);
  }
  if (hotel_id) {
    sql += ' AND f.hotel_id = ?';
    params.push(hotel_id);
  }

  sql += ' ORDER BY f.created_at DESC';

  const donations = queryAll(sql, params);
  res.json({ donations });
});

// Get specific donation with matches and active deliveries
router.get('/:id', (req, res) => {
  const donation = queryGet(`
    SELECT f.*, h.hotel_name, h.address as hotel_address, h.latitude as hotel_lat, h.longitude as hotel_lng, h.phone as hotel_phone
    FROM food_donations f
    JOIN hotels h ON f.hotel_id = h.id
    WHERE f.id = ?
  `, [req.params.id]);

  if (!donation) {
    return res.status(404).json({ error: 'Food donation not found.' });
  }

  const matches = queryAll(`
    SELECT m.*, n.ngo_name, n.address as ngo_address, n.phone as ngo_phone, n.latitude as ngo_lat, n.longitude as ngo_lng,
      d.id as delivery_id, d.status as delivery_status, d.distance_km, d.estimated_duration_mins, d.route_waypoints_json
    FROM matches m
    JOIN ngos n ON m.ngo_id = n.id
    LEFT JOIN deliveries d ON d.match_id = m.id
    WHERE m.donation_id = ?
    ORDER BY m.created_at DESC
  `, [donation.id]);

  res.json({ donation, matches });
});

// Create new food donation
router.post('/', authenticateToken, requireRole('HOTEL'), async (req, res) => {
  try {
    const hotelId = req.user.hotel_id;
    if (!hotelId) {
      return res.status(400).json({ error: 'No hotel profile linked to this account.' });
    }

    const {
      food_name,
      category,
      quantity,
      unit = 'kg',
      servings,
      preparation_time,
      safe_until,
      storage_method,
      storage_temperature,
      packaging_condition,
      is_veg = 1,
      allergens,
      notes,
      auto_allocate = true
    } = req.body;

    if (!food_name || !category || !servings || !preparation_time || !safe_until || !storage_method || !packaging_condition) {
      return res.status(400).json({ 
        error: 'Missing required food donation fields (food_name, category, servings, preparation_time, safe_until, storage_method, packaging_condition).' 
      });
    }

    // 1. Run Rule-Based Food Safety Screening
    const safetyCheck = screenFoodSafety({
      food_name,
      category,
      quantity: Number(quantity) || 10,
      servings: Number(servings),
      preparation_time,
      safe_until,
      storage_method,
      storage_temperature: storage_temperature ? Number(storage_temperature) : null,
      packaging_condition,
      is_veg: Number(is_veg)
    });

    let initialStatus = 'SUBMITTED';
    if (safetyCheck.safety_status === 'ELIGIBLE') {
      initialStatus = 'SAFETY_PASSED';
    } else if (safetyCheck.safety_status === 'NOT ELIGIBLE') {
      initialStatus = 'REJECTED';
    } else if (safetyCheck.safety_status === 'REVIEW REQUIRED') {
      initialStatus = 'SUBMITTED';
    }

    // 2. Insert into database
    const insertResult = queryRun(`
      INSERT INTO food_donations (
        hotel_id, food_name, category, quantity, unit, servings,
        preparation_time, safe_until, storage_method, storage_temperature,
        packaging_condition, is_veg, allergens, notes,
        safety_status, safety_reason, remaining_window_minutes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      hotelId,
      food_name,
      category,
      Number(quantity) || 10,
      unit,
      Number(servings),
      preparation_time,
      safe_until,
      storage_method,
      storage_temperature !== undefined && storage_temperature !== '' ? Number(storage_temperature) : null,
      packaging_condition,
      Number(is_veg),
      allergens || null,
      notes || null,
      safetyCheck.safety_status,
      safetyCheck.safety_reason,
      safetyCheck.remaining_window_minutes,
      initialStatus
    ]);

    const donationId = Number(insertResult.lastInsertRowid);
    const createdDonation = queryGet('SELECT * FROM food_donations WHERE id = ?', [donationId]);

    // 3. If Eligible and auto_allocate requested, trigger AI Matching & Allocation
    let allocationResult = null;
    if (safetyCheck.safety_status === 'ELIGIBLE' && auto_allocate) {
      try {
        allocationResult = executeAllocation(donationId, { allowPartial: true });
      } catch (allocErr) {
        console.warn('Auto allocation note:', allocErr.message);
      }
    }

    return res.status(201).json({
      message: 'Food donation submitted successfully',
      donation: createdDonation,
      safety_screening: safetyCheck,
      allocation: allocationResult
    });
  } catch (err) {
    console.error('Error creating food donation:', err);
    return res.status(500).json({ error: 'Failed to create food donation.' });
  }
});

// Re-run safety check on existing donation
router.post('/:id/screen-safety', authenticateToken, (req, res) => {
  const donation = queryGet('SELECT * FROM food_donations WHERE id = ?', [req.params.id]);
  if (!donation) {
    return res.status(404).json({ error: 'Donation not found.' });
  }

  const safetyCheck = screenFoodSafety(donation);

  queryRun(`
    UPDATE food_donations 
    SET safety_status = ?, safety_reason = ?, remaining_window_minutes = ?
    WHERE id = ?
  `, [safetyCheck.safety_status, safetyCheck.safety_reason, safetyCheck.remaining_window_minutes, donation.id]);

  const updated = queryGet('SELECT * FROM food_donations WHERE id = ?', [donation.id]);
  res.json({ message: 'Safety check re-evaluated', donation: updated, safety_screening: safetyCheck });
});

export default router;
