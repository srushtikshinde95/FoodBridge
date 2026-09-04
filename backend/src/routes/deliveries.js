import express from 'express';
import { queryGet, queryRun, queryAll } from '../db/connection.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// List all deliveries with details
router.get('/', (req, res) => {
  const { status, hotel_id, ngo_id } = req.query;

  let sql = `
    SELECT d.*, 
      f.food_name, f.category, f.servings, f.remaining_window_minutes,
      h.hotel_name, h.address as hotel_address, h.latitude as hotel_lat, h.longitude as hotel_lng, h.phone as hotel_phone,
      n.ngo_name, n.address as ngo_address, n.latitude as ngo_lat, n.longitude as ngo_lng, n.phone as ngo_phone,
      m.allocated_servings, m.match_score
    FROM deliveries d
    JOIN food_donations f ON d.donation_id = f.id
    JOIN hotels h ON d.hotel_id = h.id
    JOIN ngos n ON d.ngo_id = n.id
    JOIN matches m ON d.match_id = m.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND d.status = ?';
    params.push(status);
  }
  if (hotel_id) {
    sql += ' AND d.hotel_id = ?';
    params.push(hotel_id);
  }
  if (ngo_id) {
    sql += ' AND d.ngo_id = ?';
    params.push(ngo_id);
  }

  sql += ' ORDER BY d.created_at DESC';

  const deliveries = queryAll(sql, params).map(del => {
    let route = null;
    try {
      route = JSON.parse(del.route_waypoints_json);
    } catch (e) {}
    return { ...del, route };
  });

  res.json({ deliveries });
});

// Get specific delivery details and route
router.get('/:id', (req, res) => {
  const delivery = queryGet(`
    SELECT d.*, 
      f.food_name, f.category, f.servings, f.remaining_window_minutes,
      h.hotel_name, h.address as hotel_address, h.latitude as hotel_lat, h.longitude as hotel_lng, h.phone as hotel_phone,
      n.ngo_name, n.address as ngo_address, n.latitude as ngo_lat, n.longitude as ngo_lng, n.phone as ngo_phone,
      m.allocated_servings, m.match_score
    FROM deliveries d
    JOIN food_donations f ON d.donation_id = f.id
    JOIN hotels h ON d.hotel_id = h.id
    JOIN ngos n ON d.ngo_id = n.id
    JOIN matches m ON d.match_id = m.id
    WHERE d.id = ?
  `, [req.params.id]);

  if (!delivery) {
    return res.status(404).json({ error: 'Delivery record not found.' });
  }

  let route = null;
  try {
    route = JSON.parse(delivery.route_waypoints_json);
  } catch (e) {}

  res.json({ delivery: { ...delivery, route } });
});

// Update delivery status (Lifecycle progress)
router.patch('/:id/status', authenticateToken, (req, res) => {
  const { status, driver_name, notes } = req.body;
  const deliveryId = req.params.id;

  const validStatuses = ['ASSIGNED', 'PICKUP_READY', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'FAILED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of [${validStatuses.join(', ')}]` });
  }

  const delivery = queryGet('SELECT * FROM deliveries WHERE id = ?', [deliveryId]);
  if (!delivery) {
    return res.status(404).json({ error: 'Delivery not found.' });
  }

  let pickupTimeUpdate = '';
  let deliveryTimeUpdate = '';
  const params = [status];

  if (status === 'IN_TRANSIT' && !delivery.pickup_time) {
    pickupTimeUpdate = ', pickup_time = CURRENT_TIMESTAMP';
  }
  if ((status === 'DELIVERED' || status === 'COMPLETED') && !delivery.delivery_time) {
    deliveryTimeUpdate = ', delivery_time = CURRENT_TIMESTAMP';
  }

  if (driver_name) {
    params.push(driver_name);
  }
  if (notes) {
    params.push(notes);
  }
  params.push(deliveryId);

  queryRun(`
    UPDATE deliveries 
    SET status = ? ${pickupTimeUpdate} ${deliveryTimeUpdate}
      ${driver_name ? ', driver_name = ?' : ''}
      ${notes ? ', notes = ?' : ''}
    WHERE id = ?
  `, params);

  // Synchronize status on Match and Food Donation
  if (status === 'IN_TRANSIT') {
    queryRun("UPDATE matches SET status = 'IN_TRANSIT' WHERE id = ?", [delivery.match_id]);
    queryRun("UPDATE food_donations SET status = 'IN_TRANSIT' WHERE id = ?", [delivery.donation_id]);
  } else if (status === 'DELIVERED' || status === 'COMPLETED') {
    queryRun("UPDATE matches SET status = 'DELIVERED' WHERE id = ?", [delivery.match_id]);
    queryRun("UPDATE food_donations SET status = 'DELIVERED' WHERE id = ?", [delivery.donation_id]);

    // Send notifications to Hotel & NGO
    const hotelUser = queryGet('SELECT user_id FROM hotels WHERE id = ?', [delivery.hotel_id]);
    if (hotelUser?.user_id) {
      queryRun(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, 'Delivery Completed! 🎉', 'Your food donation has been successfully handed over to the NGO. Thank you for rescuing food!', 'SUCCESS')
      `, [hotelUser.user_id]);
    }
  }

  const updated = queryGet('SELECT * FROM deliveries WHERE id = ?', [deliveryId]);
  res.json({ message: `Delivery status updated to ${status}`, delivery: updated });
});

export default router;
