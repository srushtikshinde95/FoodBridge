CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('HOTEL', 'NGO', 'ADMIN')),
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hotels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE,
  hotel_name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  fssai_license TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ngos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE,
  ngo_name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  default_people_count INTEGER DEFAULT 50,
  category_focus TEXT,
  reg_number TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS food_donations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hotel_id INTEGER NOT NULL,
  food_name TEXT NOT NULL,
  category TEXT NOT NULL, -- Rice, Roti/Bread, Dal, Vegetables, Curry, Fruits, Desserts, Bakery items, Packaged food, Other
  quantity REAL NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  servings INTEGER NOT NULL,
  preparation_time DATETIME NOT NULL,
  safe_until DATETIME NOT NULL,
  storage_method TEXT NOT NULL, -- Refrigerated, Ambient/Room Temp, Hot Holding, Frozen
  storage_temperature REAL, -- in Celsius
  packaging_condition TEXT NOT NULL, -- Sealed Containers, Food-grade foil wrap, Covered Trays, Open/Loose
  is_veg INTEGER NOT NULL DEFAULT 1, -- 1=veg, 0=non-veg
  allergens TEXT,
  notes TEXT,
  safety_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(safety_status IN ('PENDING', 'ELIGIBLE', 'REVIEW REQUIRED', 'NOT ELIGIBLE')),
  safety_reason TEXT,
  remaining_window_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK(status IN ('SUBMITTED', 'SAFETY_PASSED', 'MATCHING', 'ASSIGNED', 'PARTIALLY_ASSIGNED', 'PICKUP_READY', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'REJECTED', 'EXPIRED', 'CANCELLED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ngo_requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ngo_id INTEGER NOT NULL,
  food_categories TEXT NOT NULL, -- JSON array or comma separated e.g. ["Rice", "Dal", "Vegetables"]
  quantity_required REAL,
  servings_required INTEGER NOT NULL,
  urgency TEXT NOT NULL CHECK(urgency IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  required_by DATETIME NOT NULL,
  dietary_restrictions TEXT, -- Veg Only, Halal, Any, etc.
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'PARTIALLY_FULFILLED', 'FULFILLED', 'EXPIRED', 'CANCELLED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  donation_id INTEGER NOT NULL,
  ngo_id INTEGER NOT NULL,
  requirement_id INTEGER,
  match_score REAL NOT NULL,
  need_score REAL NOT NULL,
  urgency_score REAL NOT NULL,
  compatibility_score REAL NOT NULL,
  distance_score REAL NOT NULL,
  time_feasibility_score REAL NOT NULL,
  allocated_servings INTEGER NOT NULL,
  explanation_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PROPOSED' CHECK(status IN ('PROPOSED', 'ACCEPTED', 'REJECTED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donation_id) REFERENCES food_donations(id) ON DELETE CASCADE,
  FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE,
  FOREIGN KEY (requirement_id) REFERENCES ngo_requirements(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL,
  donation_id INTEGER NOT NULL,
  hotel_id INTEGER NOT NULL,
  ngo_id INTEGER NOT NULL,
  distance_km REAL NOT NULL,
  estimated_duration_mins INTEGER NOT NULL,
  route_waypoints_json TEXT,
  status TEXT NOT NULL DEFAULT 'ASSIGNED' CHECK(status IN ('ASSIGNED', 'PICKUP_READY', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'FAILED')),
  pickup_time DATETIME,
  delivery_time DATETIME,
  driver_name TEXT,
  driver_phone TEXT,
  vehicle_number TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (donation_id) REFERENCES food_donations(id) ON DELETE CASCADE,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS system_configs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  data_type TEXT NOT NULL DEFAULT 'string', -- 'number', 'string', 'json', 'boolean'
  category TEXT NOT NULL, -- 'WEIGHTS', 'SAFETY', 'ROUTING', 'GENERAL'
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'INFO', -- 'INFO', 'SUCCESS', 'WARNING', 'URGENT'
  is_read INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
