import express from 'express';
import { queryGet, queryRun, queryAll } from '../db/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { seedDatabase } from '../db/seed.js';

const router = express.Router();

// System KPIs
router.get('/metrics', (req, res) => {
  const totalHotels = queryGet('SELECT COUNT(*) as c FROM hotels')?.c || 0;
  const totalNgos = queryGet('SELECT COUNT(*) as c FROM ngos')?.c || 0;
  
  const donationStats = queryGet(`
    SELECT 
      COUNT(*) as total_donations,
      COALESCE(SUM(servings), 0) as total_servings,
      COALESCE(SUM(quantity), 0) as total_quantity_kg,
      SUM(CASE WHEN safety_status = 'ELIGIBLE' THEN 1 ELSE 0 END) as safety_passed_count,
      SUM(CASE WHEN safety_status = 'NOT ELIGIBLE' THEN 1 ELSE 0 END) as safety_rejected_count,
      SUM(CASE WHEN safety_status = 'REVIEW REQUIRED' THEN 1 ELSE 0 END) as safety_review_count,
      SUM(CASE WHEN status IN ('ASSIGNED', 'PARTIALLY_ASSIGNED', 'PICKUP_READY', 'IN_TRANSIT') THEN 1 ELSE 0 END) as active_donations,
      SUM(CASE WHEN status IN ('DELIVERED', 'COMPLETED') THEN 1 ELSE 0 END) as completed_donations,
      SUM(CASE WHEN status IN ('EXPIRED', 'REJECTED') THEN 1 ELSE 0 END) as expired_or_rejected
    FROM food_donations
  `);

  const deliveryStats = queryGet(`
    SELECT 
      COUNT(*) as total_deliveries,
      SUM(CASE WHEN status IN ('ASSIGNED', 'PICKUP_READY', 'IN_TRANSIT') THEN 1 ELSE 0 END) as active_deliveries,
      SUM(CASE WHEN status IN ('DELIVERED', 'COMPLETED') THEN 1 ELSE 0 END) as successful_deliveries,
      COALESCE(AVG(distance_km), 0) as avg_distance_km,
      COALESCE(AVG(estimated_duration_mins), 0) as avg_duration_mins
    FROM deliveries
  `);

  const totalServingsRescued = queryGet(`
    SELECT COALESCE(SUM(allocated_servings), 0) as total 
    FROM matches 
    WHERE status IN ('ACCEPTED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED')
  `)?.total || 0;

  const totalBeneficiaries = totalServingsRescued;
  const foodSavedKg = Number((totalServingsRescued * 0.35).toFixed(1));

  res.json({
    metrics: {
      total_hotels: totalHotels,
      total_ngos: totalNgos,
      total_donations: donationStats.total_donations,
      active_donations: donationStats.active_donations,
      completed_donations: donationStats.completed_donations,
      expired_or_rejected: donationStats.expired_or_rejected,
      active_deliveries: deliveryStats.active_deliveries,
      successful_deliveries: deliveryStats.successful_deliveries,
      meals_rescued: totalServingsRescued,
      people_served: totalBeneficiaries,
      food_saved_kg: foodSavedKg,
      safety_passed_count: donationStats.safety_passed_count,
      safety_rejected_count: donationStats.safety_rejected_count,
      safety_review_count: donationStats.safety_review_count,
      safety_pass_rate: donationStats.total_donations > 0 
        ? Math.round((donationStats.safety_passed_count / donationStats.total_donations) * 100) 
        : 100,
      avg_delivery_distance_km: Number(deliveryStats.avg_distance_km.toFixed(1)),
      avg_delivery_time_mins: Math.round(deliveryStats.avg_duration_mins)
    }
  });
});

// Real-Time Supply Chain Pipeline
router.get('/supply-chain', (req, res) => {
  const submitted = queryAll(`
    SELECT f.*, h.hotel_name 
    FROM food_donations f JOIN hotels h ON f.hotel_id = h.id 
    WHERE f.status = 'SUBMITTED' ORDER BY f.created_at DESC LIMIT 5
  `);

  const screening = queryAll(`
    SELECT f.*, h.hotel_name 
    FROM food_donations f JOIN hotels h ON f.hotel_id = h.id 
    WHERE f.safety_status IN ('REVIEW REQUIRED', 'PENDING') ORDER BY f.created_at DESC LIMIT 5
  `);

  const eligibleForMatching = queryAll(`
    SELECT f.*, h.hotel_name 
    FROM food_donations f JOIN hotels h ON f.hotel_id = h.id 
    WHERE f.safety_status = 'ELIGIBLE' AND f.status IN ('SAFETY_PASSED', 'MATCHING') 
    ORDER BY f.created_at DESC LIMIT 5
  `);

  const activeDeliveries = queryAll(`
    SELECT d.*, f.food_name, f.servings, h.hotel_name, n.ngo_name 
    FROM deliveries d 
    JOIN food_donations f ON d.donation_id = f.id
    JOIN hotels h ON d.hotel_id = h.id
    JOIN ngos n ON d.ngo_id = n.id
    WHERE d.status IN ('ASSIGNED', 'PICKUP_READY', 'IN_TRANSIT')
    ORDER BY d.created_at DESC LIMIT 5
  `);

  const completed = queryAll(`
    SELECT d.*, f.food_name, m.allocated_servings, h.hotel_name, n.ngo_name 
    FROM deliveries d 
    JOIN food_donations f ON d.donation_id = f.id
    JOIN matches m ON d.match_id = m.id
    JOIN hotels h ON d.hotel_id = h.id
    JOIN ngos n ON d.ngo_id = n.id
    WHERE d.status IN ('DELIVERED', 'COMPLETED')
    ORDER BY d.delivery_time DESC LIMIT 5
  `);

  res.json({
    pipeline: {
      step1_registered_surplus: { count: submitted.length, items: submitted },
      step2_safety_screening: { count: screening.length, items: screening },
      step3_ai_matching: { count: eligibleForMatching.length, items: eligibleForMatching },
      step4_active_logistics: { count: activeDeliveries.length, items: activeDeliveries },
      step5_delivered_meals: { count: completed.length, items: completed }
    }
  });
});

// System Configurations
router.get('/config', (req, res) => {
  const configs = queryAll('SELECT * FROM system_configs ORDER BY category, key');
  res.json({ configs });
});

// Update System Configuration
router.post('/config', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const { configs } = req.body; // Array of { key, value }

  if (!Array.isArray(configs)) {
    return res.status(400).json({ error: 'Configs must be an array of key-value pairs.' });
  }

  for (const item of configs) {
    queryRun(`
      UPDATE system_configs 
      SET value = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE key = ?
    `, [String(item.value), item.key]);
  }

  const updatedConfigs = queryAll('SELECT * FROM system_configs ORDER BY category, key');
  res.json({ message: 'System configurations updated successfully', configs: updatedConfigs });
});

// Reset Demo Data
router.post('/reset-demo', async (req, res) => {
  try {
    await seedDatabase();
    res.json({ message: 'Database reset to initial demo scenario successfully.' });
  } catch (err) {
    console.error('Failed to reset demo database:', err);
    res.status(500).json({ error: 'Failed to reset demo database.' });
  }
});

export default router;
