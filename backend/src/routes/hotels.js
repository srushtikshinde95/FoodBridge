import express from 'express';
import { queryGet, queryRun, queryAll } from '../db/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List all hotels
router.get('/', (req, res) => {
  const hotels = queryAll(`
    SELECT h.*, 
      (SELECT COUNT(*) FROM food_donations WHERE hotel_id = h.id) as total_donations,
      (SELECT COALESCE(SUM(servings), 0) FROM food_donations WHERE hotel_id = h.id AND status IN ('DELIVERED', 'COMPLETED')) as total_servings_donated
    FROM hotels h
    ORDER BY h.hotel_name
  `);
  res.json({ hotels });
});

// Get Hotel Dashboard Data
router.get('/my/dashboard', authenticateToken, requireRole('HOTEL'), (req, res) => {
  const hotelId = req.user.hotel_id;
  if (!hotelId) {
    return res.status(400).json({ error: 'Hotel profile not found for this account.' });
  }

  const hotel = queryGet('SELECT * FROM hotels WHERE id = ?', [hotelId]);

  const activeDonationsCount = queryGet(`
    SELECT COUNT(*) as count FROM food_donations 
    WHERE hotel_id = ? AND status IN ('SUBMITTED', 'SAFETY_PASSED', 'MATCHING', 'ASSIGNED', 'PARTIALLY_ASSIGNED', 'PICKUP_READY', 'IN_TRANSIT')
  `, [hotelId])?.count || 0;

  const totalServingsDonated = queryGet(`
    SELECT COALESCE(SUM(servings), 0) as total FROM food_donations 
    WHERE hotel_id = ? AND status IN ('ASSIGNED', 'PARTIALLY_ASSIGNED', 'PICKUP_READY', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED')
  `, [hotelId])?.total || 0;

  const completedDonationsCount = queryGet(`
    SELECT COUNT(*) as count FROM food_donations 
    WHERE hotel_id = ? AND status IN ('DELIVERED', 'COMPLETED')
  `, [hotelId])?.count || 0;

  const peopleServed = Math.round(totalServingsDonated * 1.0);

  // Recent donations with match & delivery info
  const recentDonations = queryAll(`
    SELECT f.*, 
      m.id as match_id, m.allocated_servings, m.match_score,
      n.ngo_name, n.address as ngo_address,
      d.id as delivery_id, d.status as delivery_status, d.estimated_duration_mins, d.distance_km
    FROM food_donations f
    LEFT JOIN matches m ON m.donation_id = f.id
    LEFT JOIN ngos n ON m.ngo_id = n.id
    LEFT JOIN deliveries d ON d.match_id = m.id
    WHERE f.hotel_id = ?
    ORDER BY f.created_at DESC
    LIMIT 10
  `, [hotelId]);

  // Donation Categories Breakdown
  const categoryStats = queryAll(`
    SELECT category, COUNT(*) as count, SUM(servings) as total_servings
    FROM food_donations
    WHERE hotel_id = ?
    GROUP BY category
  `, [hotelId]);

  res.json({
    hotel,
    stats: {
      active_donations: activeDonationsCount,
      total_servings_donated: totalServingsDonated,
      completed_donations: completedDonationsCount,
      people_served: peopleServed,
      food_saved_kg: Number((totalServingsDonated * 0.35).toFixed(1))
    },
    recent_donations: recentDonations,
    category_stats: categoryStats
  });
});

// Get specific hotel by ID
router.get('/:id', (req, res) => {
  const hotel = queryGet('SELECT * FROM hotels WHERE id = ?', [req.params.id]);
  if (!hotel) {
    return res.status(404).json({ error: 'Hotel not found.' });
  }
  res.json({ hotel });
});

// Update hotel profile
router.put('/my/profile', authenticateToken, requireRole('HOTEL'), (req, res) => {
  const hotelId = req.user.hotel_id;
  const { hotel_name, address, latitude, longitude, contact_person, phone, fssai_license } = req.body;

  queryRun(`
    UPDATE hotels SET 
      hotel_name = COALESCE(?, hotel_name),
      address = COALESCE(?, address),
      latitude = COALESCE(?, latitude),
      longitude = COALESCE(?, longitude),
      contact_person = COALESCE(?, contact_person),
      phone = COALESCE(?, phone),
      fssai_license = COALESCE(?, fssai_license)
    WHERE id = ?
  `, [hotel_name, address, latitude, longitude, contact_person, phone, fssai_license, hotelId]);

  const updated = queryGet('SELECT * FROM hotels WHERE id = ?', [hotelId]);
  res.json({ message: 'Profile updated successfully', hotel: updated });
});

export default router;
