import { evaluateCandidatesForDonation } from './matchingEngine.js';
import { generateRoute } from './routingEngine.js';
import { queryRun, queryGet, queryAll } from '../db/connection.js';

/**
 * Automatically or manually allocate food donations to top feasible NGOs.
 * Supports partial allocation if available servings exceed the top NGO's requested count.
 */
export function executeAllocation(donationId, options = {}) {
  const { allowPartial = true, manualCandidateId = null, partialServings = null } = options;

  const evaluation = evaluateCandidatesForDonation(donationId);
  const donation = evaluation.donation;
  const hotel = evaluation.hotel;

  if (donation.safety_status === 'NOT ELIGIBLE') {
    throw new Error(`Cannot allocate donation ${donationId}: Food is marked NOT ELIGIBLE by safety screening.`);
  }

  const feasibleCandidates = evaluation.candidates.filter(c => c.is_feasible);

  if (feasibleCandidates.length === 0) {
    // Update donation status to indicate no match found
    queryRun("UPDATE food_donations SET status = 'SAFETY_PASSED' WHERE id = ?", [donationId]);
    return {
      success: false,
      message: 'No feasible NGO match found within the safe food window.',
      allocations: []
    };
  }

  let remainingServings = donation.servings;
  const allocations = [];

  if (manualCandidateId) {
    const selected = feasibleCandidates.find(c => c.ngo.id === Number(manualCandidateId));
    if (!selected) {
      throw new Error(`Candidate NGO ${manualCandidateId} is not feasible for this donation.`);
    }

    const servingsToAllocate = partialServings ? Math.min(remainingServings, Number(partialServings)) : Math.min(remainingServings, selected.scores.requested_servings);
    const allocResult = createMatchAndDelivery(donation, hotel, selected, servingsToAllocate);
    allocations.push(allocResult);
    remainingServings -= servingsToAllocate;
  } else {
    // Automatic allocation
    for (const candidate of feasibleCandidates) {
      if (remainingServings <= 0) break;

      const needed = candidate.scores.requested_servings;
      const servingsToAllocate = Math.min(remainingServings, needed);

      if (servingsToAllocate > 0) {
        const allocResult = createMatchAndDelivery(donation, hotel, candidate, servingsToAllocate);
        allocations.push(allocResult);
        remainingServings -= servingsToAllocate;

        if (!allowPartial) {
          break; // Single allocation only
        }
      }
    }
  }

  // Update donation overall status
  const finalDonationStatus = remainingServings === 0 ? 'ASSIGNED' : (remainingServings < donation.servings ? 'PARTIALLY_ASSIGNED' : 'MATCHING');
  queryRun("UPDATE food_donations SET status = ? WHERE id = ?", [finalDonationStatus, donationId]);

  return {
    success: true,
    donation_id: donationId,
    total_servings: donation.servings,
    allocated_servings: donation.servings - remainingServings,
    unallocated_servings: remainingServings,
    donation_status: finalDonationStatus,
    allocations
  };
}

/**
 * Helper to record Match and Delivery records in DB
 */
function createMatchAndDelivery(donation, hotel, candidate, allocatedServings) {
  const ngo = candidate.ngo;
  const req = candidate.requirement;
  const scores = candidate.scores;

  const explanation = {
    scores: {
      need: scores.need_score,
      urgency: scores.urgency_score,
      compatibility: scores.compatibility_score,
      distance: scores.distance_score,
      time_feasibility: scores.time_feasibility_score,
      final_match_score: candidate.final_match_score
    },
    metrics: {
      distance_km: scores.distance_km,
      estimated_duration_mins: scores.estimated_duration_mins,
      allocated_servings: allocatedServings,
      requested_servings: scores.requested_servings,
      food_remaining_window_mins: donation.remaining_window_minutes
    },
    reasons: candidate.reasons
  };

  // Insert match
  const matchResult = queryRun(`
    INSERT INTO matches (
      donation_id, ngo_id, requirement_id, match_score, 
      need_score, urgency_score, compatibility_score, distance_score, time_feasibility_score,
      allocated_servings, explanation_json, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACCEPTED')
  `, [
    donation.id,
    ngo.id,
    req?.id || null,
    candidate.final_match_score,
    scores.need_score,
    scores.urgency_score,
    scores.compatibility_score,
    scores.distance_score,
    scores.time_feasibility_score,
    allocatedServings,
    JSON.stringify(explanation)
  ]);

  const matchId = Number(matchResult.lastInsertRowid);

  // Generate realistic route
  const route = generateRoute(hotel, ngo);

  // Insert delivery
  const deliveryResult = queryRun(`
    INSERT INTO deliveries (
      match_id, donation_id, hotel_id, ngo_id,
      distance_km, estimated_duration_mins, route_waypoints_json,
      status, driver_name, driver_phone, vehicle_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ASSIGNED', 'Ramesh Kumar (Volunteer)', '+91 98765 43210', 'MH-12-FB-8842')
  `, [
    matchId,
    donation.id,
    hotel.id,
    ngo.id,
    route.distance_km,
    route.estimated_duration_mins,
    JSON.stringify(route)
  ]);

  const deliveryId = Number(deliveryResult.lastInsertRowid);

  // Update NGO requirement status if fulfilled
  if (req?.id) {
    const isFullyFulfilled = allocatedServings >= req.servings_required;
    queryRun(`
      UPDATE ngo_requirements 
      SET status = ? 
      WHERE id = ?
    `, [isFullyFulfilled ? 'FULFILLED' : 'PARTIALLY_FULFILLED', req.id]);
  }

  // Create notifications for Hotel and NGO
  // Hotel Notification
  const hotelUser = queryGet("SELECT user_id FROM hotels WHERE id = ?", [hotel.id]);
  if (hotelUser?.user_id) {
    queryRun(`
      INSERT INTO notifications (user_id, title, message, type, metadata_json)
      VALUES (?, ?, ?, 'SUCCESS', ?)
    `, [
      hotelUser.user_id,
      'Food Donation Assigned',
      `Your donation of ${donation.food_name} (${allocatedServings} servings) has been assigned to ${ngo.ngo_name}. Distance: ${route.distance_km} km. ETA: ${route.estimated_duration_mins} mins.`,
      JSON.stringify({ donationId: donation.id, ngoId: ngo.id, matchId, deliveryId })
    ]);
  }

  // NGO Notification
  const ngoUser = queryGet("SELECT user_id FROM ngos WHERE id = ?", [ngo.id]);
  if (ngoUser?.user_id) {
    queryRun(`
      INSERT INTO notifications (user_id, title, message, type, metadata_json)
      VALUES (?, ?, ?, 'URGENT', ?)
    `, [
      ngoUser.user_id,
      'Surplus Food Allocated!',
      `${allocatedServings} servings of ${donation.food_name} allocated from ${hotel.hotel_name}. Estimated arrival in ~${route.estimated_duration_mins} mins.`,
      JSON.stringify({ donationId: donation.id, hotelId: hotel.id, matchId, deliveryId })
    ]);
  }

  return {
    match_id: matchId,
    delivery_id: deliveryId,
    ngo: {
      id: ngo.id,
      name: ngo.ngo_name,
      address: ngo.address
    },
    allocated_servings: allocatedServings,
    route_summary: {
      distance_km: route.distance_km,
      duration_mins: route.estimated_duration_mins,
      waypoints_count: route.waypoints.length
    },
    match_score: candidate.final_match_score,
    explanation
  };
}
