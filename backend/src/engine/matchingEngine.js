import { calculateDistance, estimateTransitTime, checkDeliveryFeasibility } from './routingEngine.js';
import { queryAll, queryGet } from '../db/connection.js';

/**
 * Get active system weights from DB or return defaults
 */
export function getSystemWeights() {
  const defaults = {
    weight_need: 0.30,
    weight_urgency: 0.25,
    weight_compatibility: 0.15,
    weight_distance: 0.10,
    weight_time_feasibility: 0.20
  };

  try {
    const rows = queryAll("SELECT key, value FROM system_configs WHERE category = 'WEIGHTS'");
    rows.forEach(r => {
      if (defaults[r.key] !== undefined) {
        defaults[r.key] = parseFloat(r.value);
      }
    });
  } catch (err) {
    // fallback to defaults
  }

  return defaults;
}

/**
 * Calculate individual factor scores
 */
export function calculateFactorScores(donation, hotel, ngo, requirement) {
  // 1. Need Score (0-100)
  const reqServings = requirement?.servings_required || ngo.default_people_count || 50;
  const donationServings = donation.servings;
  
  // Ratio of donation that can be consumed or how well it fulfills need
  const coverageRatio = Math.min(1.0, donationServings / reqServings);
  const scaleScore = Math.min(100, (reqServings / 150) * 100); // larger beneficiary count has slightly higher need
  const needScore = Math.round((coverageRatio * 60) + (scaleScore * 0.4));

  // 2. Urgency Score (0-100)
  const urgency = (requirement?.urgency || 'MEDIUM').toUpperCase();
  let urgencyScore = 50;
  if (urgency === 'CRITICAL') urgencyScore = 100;
  else if (urgency === 'HIGH') urgencyScore = 80;
  else if (urgency === 'MEDIUM') urgencyScore = 50;
  else if (urgency === 'LOW') urgencyScore = 25;

  // 3. Food Compatibility Score (0-100)
  let compatibilityScore = 70; // Base score
  let requestedCats = [];
  try {
    if (requirement?.food_categories) {
      if (requirement.food_categories.startsWith('[')) {
        requestedCats = JSON.parse(requirement.food_categories);
      } else {
        requestedCats = requirement.food_categories.split(',').map(s => s.trim());
      }
    }
  } catch (e) {
    requestedCats = [requirement?.food_categories || ''];
  }

  const categoryMatches = requestedCats.length === 0 || requestedCats.some(cat => 
    cat.toLowerCase() === donation.category.toLowerCase() || cat.toLowerCase() === 'all' || cat.toLowerCase() === 'other'
  );

  if (categoryMatches) {
    compatibilityScore = 100;
  } else {
    compatibilityScore = 30;
  }

  // Dietary check: if NGO requires Veg Only and food is non-veg, disqualify
  if (requirement?.dietary_restrictions?.toLowerCase().includes('veg only') && donation.is_veg === 0) {
    compatibilityScore = 0;
  }

  // 4. Distance & Logistics Score (0-100)
  const hLat = hotel.latitude !== undefined ? hotel.latitude : hotel.lat;
  const hLng = hotel.longitude !== undefined ? hotel.longitude : hotel.lng;
  const nLat = ngo.latitude !== undefined ? ngo.latitude : ngo.lat;
  const nLng = ngo.longitude !== undefined ? ngo.longitude : ngo.lng;
  const distKm = calculateDistance(hLat, hLng, nLat, nLng);
  const distanceScore = Math.max(0, Math.round(100 - (distKm * 4.5))); // 0km->100, 10km->55, 20km->10

  // 5. Time Feasibility & Food-Life Score (0-100)
  const estTransitMins = estimateTransitTime(distKm);
  const remainingMins = donation.remaining_window_minutes || 120;
  const feasibilityCheck = checkDeliveryFeasibility(estTransitMins, remainingMins, 15);

  let timeFeasibilityScore = 0;
  if (feasibilityCheck.is_feasible) {
    // Score based on how generous the buffer margin is
    const margin = feasibilityCheck.margin_minutes;
    timeFeasibilityScore = Math.min(100, Math.max(20, Math.round(50 + (margin / 2))));
  } else {
    timeFeasibilityScore = 0;
  }

  return {
    need_score: needScore,
    urgency_score: urgencyScore,
    compatibility_score: compatibilityScore,
    distance_score: distanceScore,
    time_feasibility_score: timeFeasibilityScore,
    distance_km: distKm,
    estimated_duration_mins: estTransitMins,
    feasibility: feasibilityCheck,
    requested_servings: reqServings
  };
}

/**
 * Evaluate all candidate NGOs for a food donation
 */
export function evaluateCandidatesForDonation(donationId) {
  const donation = queryGet(`
    SELECT f.*, h.hotel_name, h.latitude as hotel_lat, h.longitude as hotel_lng, h.address as hotel_address 
    FROM food_donations f 
    JOIN hotels h ON f.hotel_id = h.id 
    WHERE f.id = ?
  `, [donationId]);

  if (!donation) {
    throw new Error(`Donation ${donationId} not found`);
  }

  const hotel = {
    id: donation.hotel_id,
    hotel_name: donation.hotel_name,
    latitude: donation.hotel_lat,
    longitude: donation.hotel_lng,
    address: donation.hotel_address
  };

  // Check safety status first
  if (donation.safety_status === 'NOT ELIGIBLE') {
    return {
      donation,
      hotel,
      status: 'DISQUALIFIED_SAFETY',
      message: 'Donation failed food safety screening criteria. Matching halted.',
      candidates: []
    };
  }

  const weights = getSystemWeights();

  // Fetch all registered NGOs and their active requirements (or fallback to NGO profile)
  const ngos = queryAll(`
    SELECT n.*, 
      nr.id as requirement_id, nr.food_categories, nr.servings_required, 
      nr.urgency, nr.required_by, nr.dietary_restrictions, nr.notes as req_notes
    FROM ngos n
    LEFT JOIN ngo_requirements nr ON nr.ngo_id = n.id AND nr.status = 'ACTIVE'
  `);

  const results = [];

  for (const item of ngos) {
    const ngo = {
      id: item.id,
      ngo_name: item.ngo_name,
      address: item.address,
      latitude: item.latitude,
      longitude: item.longitude,
      contact_person: item.contact_person,
      phone: item.phone,
      default_people_count: item.default_people_count,
      category_focus: item.category_focus
    };

    const requirement = item.requirement_id ? {
      id: item.requirement_id,
      food_categories: item.food_categories,
      servings_required: item.servings_required,
      urgency: item.urgency,
      required_by: item.required_by,
      dietary_restrictions: item.dietary_restrictions,
      notes: item.req_notes
    } : null;

    const scores = calculateFactorScores(donation, hotel, ngo, requirement);

    // Compute composite weighted match score
    const weightedScore = Number((
      (scores.need_score * weights.weight_need) +
      (scores.urgency_score * weights.weight_urgency) +
      (scores.compatibility_score * weights.weight_compatibility) +
      (scores.distance_score * weights.weight_distance) +
      (scores.time_feasibility_score * weights.weight_time_feasibility)
    ).toFixed(1));

    const isFeasible = scores.feasibility.is_feasible && scores.compatibility_score > 0;

    // Build explainable reasons
    const pros = [];
    const cons = [];

    if (scores.need_score >= 70) pros.push(`High beneficiary need (${scores.requested_servings} servings needed)`);
    if (scores.urgency_score >= 80) pros.push(`High urgency priority (${requirement?.urgency || 'HIGH'})`);
    if (scores.compatibility_score === 100) pros.push(`Exact food category compatibility (${donation.category})`);
    if (scores.distance_km <= 5.0) pros.push(`Close proximity (${scores.distance_km} km / ${scores.estimated_duration_mins} min ETA)`);
    if (scores.feasibility.margin_minutes >= 30) pros.push(`Safe buffer window (${scores.feasibility.margin_minutes} min remaining after delivery)`);

    if (!scores.feasibility.is_feasible) {
      cons.push(`Excluded: Delivery duration (${scores.estimated_duration_mins}m) exceeds food safe usable window (${donation.remaining_window_minutes}m)`);
    }
    if (scores.compatibility_score === 0) {
      cons.push('Disqualified: Dietary restriction mismatch (Requires Veg Only)');
    }
    if (scores.distance_km > 10.0) {
      cons.push(`Long transit distance (${scores.distance_km} km)`);
    }

    let recommendation = 'INFEASIBLE';
    if (isFeasible) {
      if (weightedScore >= 80) recommendation = 'TOP RECOMMENDATION';
      else if (weightedScore >= 65) recommendation = 'HIGH PRIORITY';
      else recommendation = 'FEASIBLE ALTERNATIVE';
    }

    results.push({
      ngo,
      requirement,
      scores,
      weights,
      final_match_score: isFeasible ? weightedScore : 0,
      is_feasible: isFeasible,
      recommendation,
      reasons: {
        pros,
        cons,
        summary: isFeasible 
          ? `Ranked with ${weightedScore}/100 match score based on urgency (${scores.urgency_score}), need demand (${scores.need_score}), and safe delivery ETA (${scores.estimated_duration_mins} min).`
          : scores.feasibility.reason
      }
    });
  }

  // Sort descending: Feasible candidates first by match score, then infeasible
  results.sort((a, b) => {
    if (a.is_feasible && !b.is_feasible) return -1;
    if (!a.is_feasible && b.is_feasible) return 1;
    return b.final_match_score - a.final_match_score;
  });

  return {
    donation,
    hotel,
    weights,
    candidates: results,
    top_match: results.find(r => r.is_feasible) || null
  };
}
