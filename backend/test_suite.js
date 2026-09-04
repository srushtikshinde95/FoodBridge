import { screenFoodSafety } from './src/engine/safetyEngine.js';
import { evaluateCandidatesForDonation } from './src/engine/matchingEngine.js';
import { executeAllocation } from './src/engine/allocator.js';
import { generateRoute, checkDeliveryFeasibility } from './src/engine/routingEngine.js';
import { queryGet, queryAll, queryRun } from './src/db/connection.js';

console.log('🧪 Starting FoodBridge AI Automated Verification Test Suite...\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    testsFailed++;
  }
}

// 1. Test Rule-Based Food Safety Screening
console.log('--- 1. Testing Food Safety Screening Engine ---');

const eligibleFood = {
  food_name: 'Hot Basmati Rice & Dal',
  category: 'Rice',
  preparation_time: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  safe_until: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
  storage_method: 'Hot Holding',
  storage_temperature: 68,
  packaging_condition: 'Sealed Containers'
};
const res1 = screenFoodSafety(eligibleFood);
assert(res1.safety_status === 'ELIGIBLE', 'Eligible hot holding food passes screening');
assert(res1.remaining_window_minutes > 150, 'Calculates correct safe remaining window');

const spoiledAmbientFood = {
  food_name: 'Room Temp Cooked Rice',
  category: 'Rice',
  preparation_time: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
  safe_until: new Date(Date.now() + 1 * 3600 * 1000).toISOString(),
  storage_method: 'Ambient/Room Temp',
  storage_temperature: 32,
  packaging_condition: 'Open/Loose'
};
const res2 = screenFoodSafety(spoiledAmbientFood);
assert(res2.safety_status === 'NOT ELIGIBLE', 'Spoiled/Open packaging food fails screening (NOT ELIGIBLE)');
assert(res2.flags.includes('UNSEALED_PACKAGING'), 'Detects unsealed packaging flag');

// 2. Test Routing & Distance Calculation
console.log('\n--- 2. Testing Routing & Delivery Feasibility Engine ---');

const hotelSunrise = queryGet("SELECT * FROM hotels WHERE hotel_name = 'Hotel Sunrise'");
const hopeFoundation = queryGet("SELECT * FROM ngos WHERE ngo_name = 'Hope Foundation'");
assert(hotelSunrise && hopeFoundation, 'Fetched Hotel Sunrise and Hope Foundation from DB');

const route = generateRoute(hotelSunrise, hopeFoundation);
assert(route.distance_km > 0 && route.distance_km < 10, `Calculates realistic distance (${route.distance_km} km)`);
assert(route.estimated_duration_mins > 10, `Calculates realistic duration (${route.estimated_duration_mins} mins)`);
assert(route.waypoints.length >= 4, `Generates street-level waypoints (${route.waypoints.length} points)`);
assert(route.turn_directions.length >= 4, `Generates turn-by-turn directions (${route.turn_directions.length} steps)`);

// 3. Test Food-Life Aware Feasibility Gating
const feasibleCheck = checkDeliveryFeasibility(15, 120, 15);
assert(feasibleCheck.is_feasible === true, 'Short delivery within generous safe window is feasible');

const infeasibleCheck = checkDeliveryFeasibility(50, 40, 15);
assert(infeasibleCheck.is_feasible === false, 'Long delivery exceeding food safe window is gated out (INFEASIBLE)');
assert(infeasibleCheck.reason.includes('exceeds food remaining safe window'), 'Provides clear explainable gating explanation');

// 4. Test Multi-Factor Matching Algorithm
console.log('\n--- 3. Testing AI Matching Engine & Explainability ---');

// Donation 1 is 100 servings Basmati Rice
const evalResult = evaluateCandidatesForDonation(1);
assert(evalResult.candidates.length >= 8, `Evaluates all candidate NGOs (${evalResult.candidates.length} evaluated)`);
assert(evalResult.top_match !== null, 'Identifies top feasible recommendation');

const topCandidate = evalResult.top_match;
assert(topCandidate.final_match_score > 80, `Top match receives high score (${topCandidate.final_match_score}/100)`);
assert(topCandidate.reasons.pros.length > 0, 'Generates explainable pros/strengths');
assert(topCandidate.scores.need_score > 0 && topCandidate.scores.urgency_score > 0, 'Calculates individual factor scores (Need, Urgency, Distance)');

// 5. Test Partial Allocation
console.log('\n--- 4. Testing Multi-NGO Partial Allocation ---');

// Donation 6 is 120 servings sweets
const allocResult = executeAllocation(6, { allowPartial: true });
assert(allocResult.success === true, 'Executes auto-allocation successfully');
assert(allocResult.allocations.length > 0, `Creates allocation records (${allocResult.allocations.length} allocated)`);
assert(allocResult.allocated_servings > 0, `Allocated ${allocResult.allocated_servings} of ${allocResult.total_servings} servings`);

console.log(`\n========================================`);
console.log(`Test Results: ${testsPassed} Passed, ${testsFailed} Failed.`);
console.log(`========================================\n`);

if (testsFailed > 0) {
  process.exit(1);
}
