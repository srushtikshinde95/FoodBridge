/**
 * Routing & Logistics Optimization Engine
 * Calculates Haversine distance, realistic urban travel times,
 * waypoint paths for maps, and validates delivery feasibility against food shelf-life.
 */

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Calculate Haversine distance between two coordinates
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = EARTH_RADIUS_KM * c;
  
  return Number(distanceKm.toFixed(2));
}

/**
 * Estimate transit duration in minutes
 * Assumptions:
 * - City traffic average speed: 22 km/h
 * - Pickup & handover buffer: 6 minutes
 */
export function estimateTransitTime(distanceKm, trafficMultiplier = 1.0) {
  const citySpeedKmPerHour = 22 / trafficMultiplier;
  const transitMins = (distanceKm / citySpeedKmPerHour) * 60;
  const handoverBufferMins = 6;
  const totalMins = Math.round(transitMins + handoverBufferMins);
  return Math.max(8, totalMins); // Minimum 8 minutes for realistic dispatch
}

/**
 * Generate simulated street-level waypoints between Hotel and NGO
 * for realistic Leaflet polyline rendering and turn-by-turn directions.
 */
export function generateRoute(hotel, ngo) {
  const hLat = hotel.latitude !== undefined ? hotel.latitude : hotel.lat;
  const hLng = hotel.longitude !== undefined ? hotel.longitude : hotel.lng;
  const nLat = ngo.latitude !== undefined ? ngo.latitude : ngo.lat;
  const nLng = ngo.longitude !== undefined ? ngo.longitude : ngo.lng;

  const dist = calculateDistance(hLat, hLng, nLat, nLng);
  const duration = estimateTransitTime(dist);

  // Generate 4-6 realistic intermediate waypoints with slight realistic jitter
  const stepsCount = Math.max(3, Math.min(6, Math.round(dist * 1.2)));
  const waypoints = [
    { lat: hLat, lng: hLng, name: hotel.hotel_name || 'Hotel Hub' }
  ];

  const roadSegments = [
    'Hotel Outpost Road',
    'Main Commercial Boulevard',
    'Outer Ring Expressway Link',
    'Metro Station Underpass',
    'Central Junction Crossway',
    'Community Welfare Avenue',
    'Shelter Access Lane'
  ];

  const turnDirections = [];
  turnDirections.push(`Depart from ${hotel.hotel_name || 'Hotel'} onto ${roadSegments[0]}`);

  for (let i = 1; i <= stepsCount; i++) {
    const fraction = i / (stepsCount + 1);
    // Add small realistic curvature / deviation
    const deviation = Math.sin(fraction * Math.PI) * 0.003 * (i % 2 === 0 ? 1 : -1);
    const lat = hLat + (nLat - hLat) * fraction + deviation;
    const lng = hLng + (nLng - hLng) * fraction + deviation;
    
    const roadName = roadSegments[Math.min(i, roadSegments.length - 1)];
    waypoints.push({ lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)), name: roadName });
    turnDirections.push(`Proceed along ${roadName} (${(dist / (stepsCount + 1)).toFixed(1)} km)`);
  }

  waypoints.push({ lat: nLat, lng: nLng, name: ngo.ngo_name || 'NGO Destination' });
  turnDirections.push(`Arrive at ${ngo.ngo_name || 'NGO Shelter'} for food distribution`);

  return {
    distance_km: dist,
    estimated_duration_mins: duration,
    waypoints,
    turn_directions: turnDirections,
    origin: {
      name: hotel.hotel_name,
      lat: hLat,
      lng: hLng,
      address: hotel.address
    },
    destination: {
      name: ngo.ngo_name,
      lat: nLat,
      lng: nLng,
      address: ngo.address
    }
  };
}

/**
 * Validates delivery feasibility against remaining usable food window
 */
export function checkDeliveryFeasibility(estimatedDurationMins, remainingWindowMins, safetyBufferMins = 15) {
  const isFeasible = (estimatedDurationMins + safetyBufferMins) <= remainingWindowMins;
  const timeDifferenceMins = remainingWindowMins - (estimatedDurationMins + safetyBufferMins);

  return {
    is_feasible: isFeasible,
    estimated_duration_mins: estimatedDurationMins,
    remaining_window_mins: remainingWindowMins,
    safety_buffer_mins: safetyBufferMins,
    margin_minutes: timeDifferenceMins,
    reason: isFeasible
      ? `Delivery feasible: Food arrives with ${timeDifferenceMins} minutes safety buffer before safe-use deadline.`
      : `Delivery INFEASIBLE: Transit time (${estimatedDurationMins}m + ${safetyBufferMins}m buffer) exceeds food remaining safe window (${remainingWindowMins}m).`
  };
}
