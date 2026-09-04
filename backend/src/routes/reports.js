import express from 'express';
import { queryAll, queryGet } from '../db/connection.js';

const router = express.Router();

router.get('/summary', (req, res) => {
  // Food by Category
  const foodByCategory = queryAll(`
    SELECT category, 
      COUNT(*) as donation_count, 
      COALESCE(SUM(servings), 0) as total_servings,
      COALESCE(SUM(quantity), 0) as total_kg
    FROM food_donations
    GROUP BY category
    ORDER BY total_servings DESC
  `);

  // Top Donor Hotels
  const topHotels = queryAll(`
    SELECT h.hotel_name, h.address,
      COUNT(f.id) as donation_count,
      COALESCE(SUM(f.servings), 0) as total_servings,
      COALESCE(SUM(f.quantity), 0) as total_kg
    FROM hotels h
    LEFT JOIN food_donations f ON f.hotel_id = h.id
    GROUP BY h.id
    ORDER BY total_servings DESC
    LIMIT 6
  `);

  // Top Beneficiary NGOs
  const topNgos = queryAll(`
    SELECT n.ngo_name, n.address, n.default_people_count,
      COUNT(m.id) as allocations_count,
      COALESCE(SUM(m.allocated_servings), 0) as servings_received
    FROM ngos n
    LEFT JOIN matches m ON m.ngo_id = n.id AND m.status IN ('ACCEPTED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED')
    GROUP BY n.id
    ORDER BY servings_received DESC
    LIMIT 6
  `);

  // Safety Pass vs Reject Statistics
  const safetyBreakdown = queryAll(`
    SELECT safety_status, COUNT(*) as count 
    FROM food_donations 
    GROUP BY safety_status
  `);

  // Deliveries by Status
  const deliveryStatusBreakdown = queryAll(`
    SELECT status, COUNT(*) as count 
    FROM deliveries 
    GROUP BY status
  `);

  // Time Feasibility & Speed Metrics
  const avgSpeedMetrics = queryGet(`
    SELECT 
      AVG(distance_km) as avg_distance,
      AVG(estimated_duration_mins) as avg_duration,
      MIN(estimated_duration_mins) as fastest_delivery,
      MAX(estimated_duration_mins) as longest_delivery
    FROM deliveries
  `);

  res.json({
    food_by_category: foodByCategory,
    top_hotels: topHotels,
    top_ngos: topNgos,
    safety_breakdown: safetyBreakdown,
    delivery_status_breakdown: deliveryStatusBreakdown,
    speed_metrics: {
      avg_distance_km: Number((avgSpeedMetrics?.avg_distance || 4.5).toFixed(1)),
      avg_duration_mins: Math.round(avgSpeedMetrics?.avg_duration || 18),
      fastest_mins: Math.round(avgSpeedMetrics?.fastest_delivery || 8),
      longest_mins: Math.round(avgSpeedMetrics?.longest_delivery || 45)
    }
  });
});

export default router;
