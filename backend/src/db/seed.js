import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, queryRun, queryGet } from './connection.js';
import { generateRoute } from '../engine/routingEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedDatabase() {
  console.log('🌱 Seeding FoodBridge AI database with rich scenario data...');

  // Read and execute schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec('PRAGMA foreign_keys = OFF;');
  
  // Drop existing tables for clean seed
  const tables = ['notifications', 'deliveries', 'matches', 'ngo_requirements', 'food_donations', 'ngos', 'hotels', 'system_configs', 'users'];
  for (const t of tables) {
    db.exec(`DROP TABLE IF EXISTS ${t};`);
  }
  
  db.exec(schemaSql);
  db.exec('PRAGMA foreign_keys = ON;');

  // 1. Seed System Configs (Priority Weights & Parameters)
  const configs = [
    { key: 'weight_need', value: '0.30', data_type: 'number', category: 'WEIGHTS', description: 'Beneficiary Need & Serving Demand Weight (30%)' },
    { key: 'weight_urgency', value: '0.25', data_type: 'number', category: 'WEIGHTS', description: 'NGO Urgency Level Weight (25%)' },
    { key: 'weight_compatibility', value: '0.15', data_type: 'number', category: 'WEIGHTS', description: 'Food Category & Dietary Match Weight (15%)' },
    { key: 'weight_distance', value: '0.10', data_type: 'number', category: 'WEIGHTS', description: 'Proximity & Distance Score Weight (10%)' },
    { key: 'weight_time_feasibility', value: '0.20', data_type: 'number', category: 'WEIGHTS', description: 'Delivery Time vs Food Safe Life Weight (20%)' },
    { key: 'max_ambient_hours_cooked', value: '4', data_type: 'number', category: 'SAFETY', description: 'Max allowed hours for cooked food at ambient temp' },
    { key: 'max_refrig_hours_cooked', value: '24', data_type: 'number', category: 'SAFETY', description: 'Max allowed hours for cooked food refrigerated (4°C)' },
    { key: 'danger_zone_min_temp', value: '5', data_type: 'number', category: 'SAFETY', description: 'Minimum temperature for safe refrigeration (°C)' },
    { key: 'danger_zone_max_temp', value: '60', data_type: 'number', category: 'SAFETY', description: 'Minimum temperature for hot holding (°C)' },
    { key: 'delivery_safety_buffer_mins', value: '15', data_type: 'number', category: 'ROUTING', description: 'Mandatory safety buffer between ETA and food safe deadline' }
  ];

  for (const c of configs) {
    queryRun(`
      INSERT INTO system_configs (key, value, data_type, category, description)
      VALUES (?, ?, ?, ?, ?)
    `, [c.key, c.value, c.data_type, c.category, c.description]);
  }

  // 2. Seed Users & Organizations
  const adminPass = await bcrypt.hash('admin123', 10);
  const hotelPass = await bcrypt.hash('hotel123', 10);
  const ngoPass = await bcrypt.hash('ngo123', 10);

  // Admin
  queryRun(`
    INSERT INTO users (name, email, password_hash, role, phone)
    VALUES ('FoodBridge Central Admin', 'admin@foodbridge.org', ?, 'ADMIN', '+91 98000 00001')
  `, [adminPass]);

  // 5 Hotels
  const hotelUsers = [
    { name: 'Hotel Sunrise Banquet', email: 'sunrise@hotel.com', phone: '+91 98230 11111', hotel_name: 'Hotel Sunrise', address: '12 Shivaji Nagar, Near Central Mall, Pune', lat: 18.5314, lng: 73.8446, fssai: '11518012000452' },
    { name: 'Hotel Royal Orchid', email: 'royal@hotel.com', phone: '+91 98230 22222', hotel_name: 'Hotel Royal Orchid', address: '45 Kalyani Nagar Main Road, Pune', lat: 18.5477, lng: 73.9027, fssai: '11519013000781' },
    { name: 'Grand Heritage Palace', email: 'heritage@hotel.com', phone: '+91 98230 33333', hotel_name: 'Grand Heritage Palace', address: '88 Senapati Bapat Road, Pune', lat: 18.5284, lng: 73.8290, fssai: '11520014000912' },
    { name: 'Spice Route Bistro', email: 'spiceroute@hotel.com', phone: '+91 98230 44444', hotel_name: 'Spice Route Bistro', address: '23 Koregaon Park Lane 5, Pune', lat: 18.5362, lng: 73.8940, fssai: '11521015000123' },
    { name: 'Green Leaf Organic Kitchen', email: 'greenleaf@hotel.com', phone: '+91 98230 55555', hotel_name: 'Green Leaf Kitchen', address: '10 Aundh Road, Pune', lat: 18.5580, lng: 73.8073, fssai: '11522016000674' }
  ];

  const hotelIds = [];
  for (const h of hotelUsers) {
    const userRes = queryRun(`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES (?, ?, ?, 'HOTEL', ?)
    `, [h.name, h.email, hotelPass, h.phone]);
    const uId = Number(userRes.lastInsertRowid);

    const hRes = queryRun(`
      INSERT INTO hotels (user_id, hotel_name, address, latitude, longitude, contact_person, phone, email, fssai_license)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [uId, h.hotel_name, h.address, h.lat, h.lng, h.name, h.phone, h.email, h.fssai]);
    hotelIds.push(Number(hRes.lastInsertRowid));
  }

  // 8 NGOs
  const ngoUsers = [
    { name: 'Hope Foundation Children Home', email: 'hope@ngo.org', phone: '+91 97650 11001', ngo_name: 'Hope Foundation', address: '7 Bund Garden Road, Pune', lat: 18.5348, lng: 73.8789, people: 120, focus: 'Orphanage & Children' },
    { name: 'Care Foundation Elders Home', email: 'care@ngo.org', phone: '+91 97650 22002', ngo_name: 'Care Foundation', address: '19 Camp MG Road, Pune', lat: 18.5173, lng: 73.8786, people: 60, focus: 'Elderly & Destitute' },
    { name: 'Helping Hands Community Shelter', email: 'hands@ngo.org', phone: '+91 97650 33003', ngo_name: 'Helping Hands Shelter', address: '104 Hadapsar Industrial Area, Pune', lat: 18.5089, lng: 73.9260, people: 200, focus: 'Homeless & Migrant Workers' },
    { name: 'Bal Asha Orphanage Trust', email: 'balasha@ngo.org', phone: '+91 97650 44004', ngo_name: 'Bal Asha Trust', address: '32 Kothrud Hill View, Pune', lat: 18.5074, lng: 73.8077, people: 85, focus: 'Underprivileged Children' },
    { name: 'Annapurna Seva Kitchen', email: 'annapurna@ngo.org', phone: '+91 97650 55005', ngo_name: 'Annapurna Kitchen', address: '55 Swargate Chowk, Pune', lat: 18.5018, lng: 73.8580, people: 150, focus: 'Community Kitchen' },
    { name: 'Snehalaya Rehabilitation Home', email: 'snehalaya@ngo.org', phone: '+91 97650 66006', ngo_name: 'Snehalaya Center', address: '14 Yerwada Main Road, Pune', lat: 18.5529, lng: 73.8828, people: 95, focus: 'Women & Children' },
    { name: 'Smile Care Community Relief', email: 'smile@ngo.org', phone: '+91 97650 77007', ngo_name: 'Smile Care Relief', address: '88 Baner Road, Pune', lat: 18.5590, lng: 73.7868, people: 40, focus: 'Slum Education & Food' },
    { name: 'Jeevan Dhara Welfare Trust', email: 'jeevandhara@ngo.org', phone: '+91 97650 88008', ngo_name: 'Jeevan Dhara Trust', address: '62 Viman Nagar, Pune', lat: 18.5679, lng: 73.9143, people: 180, focus: 'Night Shelter' }
  ];

  const ngoIds = [];
  for (const n of ngoUsers) {
    const userRes = queryRun(`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES (?, ?, ?, 'NGO', ?)
    `, [n.name, n.email, ngoPass, n.phone]);
    const uId = Number(userRes.lastInsertRowid);

    const nRes = queryRun(`
      INSERT INTO ngos (user_id, ngo_name, address, latitude, longitude, contact_person, phone, email, default_people_count, category_focus, reg_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [uId, n.ngo_name, n.address, n.lat, n.lng, n.name, n.phone, n.email, n.people, n.focus, `MH/2018/NGO/${Math.floor(1000 + Math.random() * 9000)}`]);
    ngoIds.push(Number(nRes.lastInsertRowid));
  }

  // 3. Seed Active NGO Requirements
  const requirements = [
    { ngo_idx: 0, cats: '["Rice", "Dal", "Vegetables"]', servings: 120, urgency: 'HIGH', dietary: 'Veg Only', notes: 'Evening dinner for 120 children.' },
    { ngo_idx: 1, cats: '["Curry", "Roti/Bread", "Dal"]', servings: 60, urgency: 'MEDIUM', dietary: 'Soft Cooked / Low Spice', notes: 'Senior citizens dinner meal.' },
    { ngo_idx: 2, cats: '["Rice", "Curry", "Roti/Bread", "Dal"]', servings: 200, urgency: 'CRITICAL', dietary: 'Any', notes: 'Urgent night shelter food for 200 migrant workers.' },
    { ngo_idx: 3, cats: '["Fruits", "Bakery items", "Desserts"]', servings: 85, urgency: 'HIGH', dietary: 'Veg Only', notes: 'Evening snack for orphanage students.' },
    { ngo_idx: 4, cats: '["Rice", "Vegetables", "Dal"]', servings: 150, urgency: 'HIGH', dietary: 'Any', notes: 'Daily community meal distribution.' },
    { ngo_idx: 5, cats: '["Rice", "Roti/Bread", "Curry"]', servings: 95, urgency: 'MEDIUM', dietary: 'Veg Only', notes: 'Dinner meal for residential shelter.' },
    { ngo_idx: 6, cats: '["Packaged food", "Fruits", "Bakery items"]', servings: 40, urgency: 'LOW', dietary: 'Any', notes: 'After-school nutrition packets.' },
    { ngo_idx: 7, cats: '["Rice", "Dal", "Curry", "Vegetables"]', servings: 180, urgency: 'CRITICAL', dietary: 'Any', notes: 'Displaced community relief batch.' }
  ];

  const now = new Date();
  const reqIds = [];
  for (const r of requirements) {
    const requiredBy = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
    const res = queryRun(`
      INSERT INTO ngo_requirements (
        ngo_id, food_categories, servings_required, urgency, required_by, dietary_restrictions, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `, [ngoIds[r.ngo_idx], r.cats, r.servings, r.urgency, requiredBy, r.dietary, r.notes]);
    reqIds.push(Number(res.lastInsertRowid));
  }

  // 4. Seed 15 Diverse Food Donations (Eligible, In-Transit, Delivered, Partial Split, Safety Failed, Expired)
  const donations = [
    // Donation 1: Hotel Sunrise -> 100 Servings Rice & Dal (Eligible & Assigned to Hope Foundation)
    {
      hotel_idx: 0,
      name: 'Steamed Basmati Rice & Tadka Dal',
      cat: 'Rice',
      qty: 35,
      servings: 100,
      prep_offset_hrs: -1.5,
      safe_offset_hrs: 2.5,
      storage: 'Hot Holding',
      temp: 68,
      pkg: 'Sealed Containers',
      is_veg: 1,
      safety_status: 'ELIGIBLE',
      safety_reason: 'Food passes all safety criteria. Hot holding maintained at safe 68°C.',
      status: 'ASSIGNED'
    },
    // Donation 2: Hotel Royal -> 60 Servings Paneer Butter Masala (Eligible & In Transit to Care Foundation)
    {
      hotel_idx: 1,
      name: 'Paneer Butter Masala & Tandoori Roti',
      cat: 'Curry',
      qty: 24,
      servings: 60,
      prep_offset_hrs: -1.0,
      safe_offset_hrs: 3.0,
      storage: 'Refrigerated',
      temp: 4,
      pkg: 'Sealed Containers',
      is_veg: 1,
      safety_status: 'ELIGIBLE',
      safety_reason: 'Optimal refrigeration at 4°C with sealed food-grade packaging.',
      status: 'IN_TRANSIT'
    },
    // Donation 3: Grand Heritage -> 200 Servings Vegetable Dum Biryani (Eligible & Partially Assigned)
    {
      hotel_idx: 2,
      name: 'Hyderabadi Vegetable Dum Biryani',
      cat: 'Rice',
      qty: 70,
      servings: 200,
      prep_offset_hrs: -0.5,
      safe_offset_hrs: 3.5,
      storage: 'Hot Holding',
      temp: 72,
      pkg: 'Sealed Containers',
      is_veg: 1,
      safety_status: 'ELIGIBLE',
      safety_reason: 'Freshly prepared banquet surplus maintained at 72°C hot holding.',
      status: 'PARTIALLY_ASSIGNED'
    },
    // Donation 4: Spice Route -> 45 Servings Fresh Fruit Platter (Eligible & Delivered)
    {
      hotel_idx: 3,
      name: 'Fresh Seasonal Fruit Salad & Melons',
      cat: 'Fruits',
      qty: 18,
      servings: 45,
      prep_offset_hrs: -4.0,
      safe_offset_hrs: 20.0,
      storage: 'Refrigerated',
      temp: 3,
      pkg: 'Food-grade foil wrap',
      is_veg: 1,
      safety_status: 'ELIGIBLE',
      safety_reason: 'Chilled fresh fruits in hygienic sealed foil wrap.',
      status: 'DELIVERED'
    },
    // Donation 5: Green Leaf -> 80 Servings Mixed Veg Pulao & Raita (Eligible & Completed)
    {
      hotel_idx: 4,
      name: 'Organic Garden Veg Pulao',
      cat: 'Rice',
      qty: 28,
      servings: 80,
      prep_offset_hrs: -6.0,
      safe_offset_hrs: 18.0,
      storage: 'Refrigerated',
      temp: 4,
      pkg: 'Sealed Containers',
      is_veg: 1,
      safety_status: 'ELIGIBLE',
      safety_reason: 'Refrigerated organic vegetable preparation, completely safe.',
      status: 'COMPLETED'
    },
    // Donation 6: Hotel Sunrise -> 120 Servings Gulab Jamun & Halwa (Eligible, Ready for Matching)
    {
      hotel_idx: 0,
      name: 'Festive Gulab Jamun & Moong Dal Halwa',
      cat: 'Desserts',
      qty: 25,
      servings: 120,
      prep_offset_hrs: -2.0,
      safe_offset_hrs: 10.0,
      storage: 'Ambient/Room Temp',
      temp: 22,
      pkg: 'Sealed Containers',
      is_veg: 1,
      safety_status: 'ELIGIBLE',
      safety_reason: 'Sealed traditional sweets within safe ambient shelf-life window.',
      status: 'SAFETY_PASSED'
    },
    // Donation 7: Hotel Royal -> 50 Servings Dinner Bread & Rolls (Eligible, Submitted)
    {
      hotel_idx: 1,
      name: 'Fresh Artisanal Bread Buns & Rolls',
      cat: 'Bakery items',
      qty: 15,
      servings: 50,
      prep_offset_hrs: -3.0,
      safe_offset_hrs: 21.0,
      storage: 'Ambient/Room Temp',
      temp: 24,
      pkg: 'Sealed Containers',
      is_veg: 1,
      safety_status: 'ELIGIBLE',
      safety_reason: 'Dry bakery batch in airtight packaging.',
      status: 'SAFETY_PASSED'
    },
    // Donation 8: Cooked Rice Left in Ambient for 8 Hours (NOT ELIGIBLE - SPOILAGE RISK)
    {
      hotel_idx: 2,
      name: 'Boiled Rice & Yellow Dal',
      cat: 'Rice',
      qty: 30,
      servings: 90,
      prep_offset_hrs: -8.0,
      safe_offset_hrs: -1.0,
      storage: 'Ambient/Room Temp',
      temp: 34,
      pkg: 'Covered Trays',
      is_veg: 1,
      safety_status: 'NOT ELIGIBLE',
      safety_reason: 'Failed safety screening: Elapsed time (8.0h) exceeds safe threshold (4h) for Rice under Ambient storage.',
      status: 'REJECTED'
    },
    // Donation 9: Open/Loose Chicken Curry (NOT ELIGIBLE - CONTAMINATION RISK)
    {
      hotel_idx: 3,
      name: 'Butter Chicken Gravy',
      cat: 'Curry',
      qty: 15,
      servings: 40,
      prep_offset_hrs: -2.5,
      safe_offset_hrs: 1.5,
      storage: 'Ambient/Room Temp',
      temp: 31,
      pkg: 'Open/Loose',
      is_veg: 0,
      safety_status: 'NOT ELIGIBLE',
      safety_reason: 'Failed safety screening: Food is packaged in open or loose containers, risking contamination.',
      status: 'REJECTED'
    },
    // Donation 10: Expired Buffet Salads (EXPIRED)
    {
      hotel_idx: 4,
      name: 'Russian Mayonnaise Salad',
      cat: 'Vegetables',
      qty: 12,
      servings: 35,
      prep_offset_hrs: -12.0,
      safe_offset_hrs: -2.0,
      storage: 'Ambient/Room Temp',
      temp: 26,
      pkg: 'Covered Trays',
      is_veg: 1,
      safety_status: 'NOT ELIGIBLE',
      safety_reason: 'Food has already passed its declared safe-use deadline (120 minutes ago).',
      status: 'EXPIRED'
    },
    // Donation 11: Hotel Sunrise -> 75 Servings Dal Makhani & Jeera Rice (Eligible)
    {
      hotel_idx: 0,
      name: 'Dal Makhani & Jeera Rice Combo',
      cat: 'Dal',
      qty: 26,
      servings: 75,
      prep_offset_hrs: -1.0,
      safe_offset_hrs: 3.0,
      storage: 'Hot Holding',
      temp: 65,
      pkg: 'Sealed Containers',
      is_veg: 1,
      safety_status: 'ELIGIBLE',
      safety_reason: 'Hot holding compliant at 65°C.',
      status: 'SAFETY_PASSED'
    },
    // Donation 12: Spice Route -> 90 Servings Stir Fried Noodles & Manchurian (Eligible)
    {
      hotel_idx: 3,
      name: 'Veg Hakka Noodles & Manchurian Gravy',
      cat: 'Vegetables',
      qty: 32,
      servings: 90,
      prep_offset_hrs: -1.8,
      safe_offset_hrs: 2.2,
      storage: 'Hot Holding',
      temp: 64,
      pkg: 'Sealed Containers',
      is_veg: 1,
      safety_status: 'ELIGIBLE',
      safety_reason: 'Food passes temperature and container sealing screening.',
      status: 'SAFETY_PASSED'
    },
    // Donation 13: Grand Heritage -> 65 Servings Assorted Sandwiches (Review Required)
    {
      hotel_idx: 2,
      name: 'Cold Cut Veg & Cheese Sandwiches',
      cat: 'Bakery items',
      qty: 14,
      servings: 65,
      prep_offset_hrs: -3.0,
      safe_offset_hrs: 1.5,
      storage: 'Ambient/Room Temp',
      temp: 28,
      pkg: 'Covered Trays',
      is_veg: 1,
      safety_status: 'REVIEW REQUIRED',
      safety_reason: 'Manual verification recommended: Non-sealed packaging under ambient conditions.',
      status: 'SUBMITTED'
    },
    // Donation 14: Hotel Royal -> 110 Servings Sambar & Medu Vada (Eligible)
    {
      hotel_idx: 1,
      name: 'South Indian Sambar & Idli / Vada',
      cat: 'Dal',
      qty: 38,
      servings: 110,
      prep_offset_hrs: -0.8,
      safe_offset_hrs: 3.2,
      storage: 'Hot Holding',
      temp: 70,
      pkg: 'Sealed Containers',
      is_veg: 1,
      safety_status: 'ELIGIBLE',
      safety_reason: 'Fresh South Indian buffet surplus under sealed hot holding.',
      status: 'SAFETY_PASSED'
    },
    // Donation 15: Green Leaf -> 55 Servings Spiced Chickpeas (Chole) & Puri (Eligible)
    {
      hotel_idx: 4,
      name: 'Punjabi Chole & Methi Puri',
      cat: 'Curry',
      qty: 20,
      servings: 55,
      prep_offset_hrs: -2.0,
      safe_offset_hrs: 2.5,
      storage: 'Refrigerated',
      temp: 4,
      pkg: 'Sealed Containers',
      is_veg: 1,
      safety_status: 'ELIGIBLE',
      safety_reason: 'Refrigerated cooked pulse preparation in sealed boxes.',
      status: 'SAFETY_PASSED'
    }
  ];

  const donationIds = [];
  for (const d of donations) {
    const prepTime = new Date(now.getTime() + d.prep_offset_hrs * 60 * 60 * 1000).toISOString();
    const safeUntil = new Date(now.getTime() + d.safe_offset_hrs * 60 * 60 * 1000).toISOString();
    const remainingMins = Math.max(0, Math.round(d.safe_offset_hrs * 60));

    const res = queryRun(`
      INSERT INTO food_donations (
        hotel_id, food_name, category, quantity, unit, servings,
        preparation_time, safe_until, storage_method, storage_temperature,
        packaging_condition, is_veg, safety_status, safety_reason,
        remaining_window_minutes, status
      ) VALUES (?, ?, ?, ?, 'kg', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      hotelIds[d.hotel_idx],
      d.name,
      d.cat,
      d.qty,
      d.servings,
      prepTime,
      safeUntil,
      d.storage,
      d.temp,
      d.pkg,
      d.is_veg,
      d.safety_status,
      d.safety_reason,
      remainingMins,
      d.status
    ]);
    donationIds.push(Number(res.lastInsertRowid));
  }

  // 5. Seed Matches & Deliveries for active/delivered scenarios
  // Match 1: Donation 1 (Rice & Dal 100 servings) -> NGO 0 (Hope Foundation)
  const hotel1 = hotelUsers[0];
  const ngo1 = ngoUsers[0];
  const route1 = generateRoute(hotel1, ngo1);

  const m1 = queryRun(`
    INSERT INTO matches (
      donation_id, ngo_id, requirement_id, match_score, 
      need_score, urgency_score, compatibility_score, distance_score, time_feasibility_score,
      allocated_servings, explanation_json, status
    ) VALUES (?, ?, ?, 94.2, 92, 80, 100, 85, 96, 100, ?, 'ACCEPTED')
  `, [
    donationIds[0],
    ngoIds[0],
    reqIds[0],
    JSON.stringify({
      scores: { need: 92, urgency: 80, compatibility: 100, distance: 85, time_feasibility: 96, final_match_score: 94.2 },
      metrics: { distance_km: route1.distance_km, estimated_duration_mins: route1.estimated_duration_mins, allocated_servings: 100, requested_servings: 120, food_remaining_window_mins: 150 },
      reasons: {
        pros: ['High beneficiary need (120 children)', 'High urgency priority (HIGH)', 'Exact food category compatibility (Rice)', 'Close proximity (3.8 km / 16 min ETA)', 'Safe buffer window (119 min margin)'],
        cons: [],
        summary: 'Top ranked recommendation: Best fit for Hope Foundation dinner with optimal route feasibility.'
      }
    })
  ]);
  const m1Id = Number(m1.lastInsertRowid);

  queryRun(`
    INSERT INTO deliveries (
      match_id, donation_id, hotel_id, ngo_id, distance_km, estimated_duration_mins,
      route_waypoints_json, status, driver_name, driver_phone, vehicle_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ASSIGNED', 'Vikram Shinde', '+91 98888 12345', 'MH-12-DE-1092')
  `, [m1Id, donationIds[0], hotelIds[0], ngoIds[0], route1.distance_km, route1.estimated_duration_mins, JSON.stringify(route1)]);

  // Match 2: Donation 2 (Paneer Masala 60 servings) -> NGO 1 (Care Foundation) - IN_TRANSIT
  const hotel2 = hotelUsers[1];
  const ngo2 = ngoUsers[1];
  const route2 = generateRoute(hotel2, ngo2);

  const m2 = queryRun(`
    INSERT INTO matches (
      donation_id, ngo_id, requirement_id, match_score, 
      need_score, urgency_score, compatibility_score, distance_score, time_feasibility_score,
      allocated_servings, explanation_json, status
    ) VALUES (?, ?, ?, 88.5, 100, 50, 100, 80, 95, 60, ?, 'IN_TRANSIT')
  `, [
    donationIds[1],
    ngoIds[1],
    reqIds[1],
    JSON.stringify({
      scores: { need: 100, urgency: 50, compatibility: 100, distance: 80, time_feasibility: 95, final_match_score: 88.5 },
      metrics: { distance_km: route2.distance_km, estimated_duration_mins: route2.estimated_duration_mins, allocated_servings: 60, requested_servings: 60, food_remaining_window_mins: 180 },
      reasons: {
        pros: ['Exact 100% serving fulfillment (60 servings)', 'Category match (Curry)', 'Feasible delivery (4.2 km / 18 min ETA)'],
        cons: [],
        summary: 'Fully covers Care Foundation senior residents dinner.'
      }
    })
  ]);
  const m2Id = Number(m2.lastInsertRowid);

  queryRun(`
    INSERT INTO deliveries (
      match_id, donation_id, hotel_id, ngo_id, distance_km, estimated_duration_mins,
      route_waypoints_json, status, pickup_time, driver_name, driver_phone, vehicle_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'IN_TRANSIT', datetime('now', '-10 minutes'), 'Amit Joshi', '+91 97777 54321', 'MH-12-TR-9901')
  `, [m2Id, donationIds[1], hotelIds[1], ngoIds[1], route2.distance_km, route2.estimated_duration_mins, JSON.stringify(route2)]);

  // Match 3 & 4: Donation 3 (Veg Biryani 200 Servings) -> PARTIAL SPLIT:
  // 120 Servings to Helping Hands Shelter + 80 Servings to Annapurna Kitchen
  const hotel3 = hotelUsers[2];
  const ngo3 = ngoUsers[2];
  const route3 = generateRoute(hotel3, ngo3);

  const m3 = queryRun(`
    INSERT INTO matches (
      donation_id, ngo_id, requirement_id, match_score, 
      need_score, urgency_score, compatibility_score, distance_score, time_feasibility_score,
      allocated_servings, explanation_json, status
    ) VALUES (?, ?, ?, 96.0, 95, 100, 100, 70, 92, 120, ?, 'ACCEPTED')
  `, [
    donationIds[2],
    ngoIds[2],
    reqIds[2],
    JSON.stringify({
      scores: { need: 95, urgency: 100, compatibility: 100, distance: 70, time_feasibility: 92, final_match_score: 96.0 },
      metrics: { distance_km: route3.distance_km, estimated_duration_mins: route3.estimated_duration_mins, allocated_servings: 120, requested_servings: 200, food_remaining_window_mins: 210 },
      reasons: {
        pros: ['Critical urgency priority (Homeless night shelter)', 'Large capacity utilization (120 servings allocated)', 'High compatibility (Rice)'],
        cons: [],
        summary: 'Primary partial allocation: 120 servings allocated to critical urgency shelter.'
      }
    })
  ]);
  const m3Id = Number(m3.lastInsertRowid);

  queryRun(`
    INSERT INTO deliveries (
      match_id, donation_id, hotel_id, ngo_id, distance_km, estimated_duration_mins,
      route_waypoints_json, status, driver_name, driver_phone, vehicle_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PICKUP_READY', 'Suresh Rathod', '+91 96666 43210', 'MH-12-DL-4412')
  `, [m3Id, donationIds[2], hotelIds[2], ngoIds[2], route3.distance_km, route3.estimated_duration_mins, JSON.stringify(route3)]);

  // Match 5: Donation 4 (Fruit salad 45 servings) -> Bal Asha Trust (DELIVERED)
  const hotel4 = hotelUsers[3];
  const ngo4 = ngoUsers[3];
  const route4 = generateRoute(hotel4, ngo4);

  const m4 = queryRun(`
    INSERT INTO matches (
      donation_id, ngo_id, requirement_id, match_score, 
      need_score, urgency_score, compatibility_score, distance_score, time_feasibility_score,
      allocated_servings, explanation_json, status
    ) VALUES (?, ?, ?, 91.0, 80, 80, 100, 82, 98, 45, ?, 'DELIVERED')
  `, [
    donationIds[3],
    ngoIds[3],
    reqIds[3],
    JSON.stringify({
      scores: { need: 80, urgency: 80, compatibility: 100, distance: 82, time_feasibility: 98, final_match_score: 91.0 },
      metrics: { distance_km: route4.distance_km, estimated_duration_mins: route4.estimated_duration_mins, allocated_servings: 45, requested_servings: 85, food_remaining_window_mins: 1200 },
      reasons: {
        pros: ['Delivered successfully on time', 'Children received fresh vitamin-rich fruit snacks', 'Zero food waste achieved'],
        cons: [],
        summary: 'Completed delivery: Bal Asha children nutrition snack.'
      }
    })
  ]);
  const m4Id = Number(m4.lastInsertRowid);

  queryRun(`
    INSERT INTO deliveries (
      match_id, donation_id, hotel_id, ngo_id, distance_km, estimated_duration_mins,
      route_waypoints_json, status, pickup_time, delivery_time, driver_name, driver_phone, vehicle_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'DELIVERED', datetime('now', '-2 hours'), datetime('now', '-1 hour'), 'Mahesh Gole', '+91 95555 12345', 'MH-12-DL-2211')
  `, [m4Id, donationIds[3], hotelIds[3], ngoIds[3], route4.distance_km, route4.estimated_duration_mins, JSON.stringify(route4)]);

  // 6. Seed sample notifications
  queryRun(`
    INSERT INTO notifications (user_id, title, message, type)
    VALUES 
    (1, 'System Ready', 'FoodBridge AI engine initialized and monitoring real-time logistics.', 'INFO'),
    (2, 'Donation Assigned', 'Your donation of Steamed Basmati Rice (100 servings) was matched with Hope Foundation.', 'SUCCESS'),
    (7, 'Food On The Way!', 'Amit Joshi is en route with 60 servings of Paneer Butter Masala from Hotel Royal.', 'URGENT')
  `);

  console.log('✅ Seeding completed successfully!');
  console.log(`- 1 Admin account (admin@foodbridge.org / admin123)`);
  console.log(`- 5 Hotels (${hotelUsers.map(h => h.email).join(', ')})`);
  console.log(`- 8 NGOs (${ngoUsers.map(n => n.email).join(', ')})`);
  console.log(`- ${donations.length} Diverse food donations (Eligible, In-Review, Ineligible, Expired, Assigned)`);
  console.log(`- Configurable AI weights & Rule-based food safety engine initialized.`);
}

// If run directly via `node src/db/seed.js`
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
}
