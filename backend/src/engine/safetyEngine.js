import { queryGet } from '../db/connection.js';

/**
 * Rule-Based Food Safety Screening Engine
 * 
 * Evaluates food donations against configurable safety standards:
 * - Time since cooking/preparation
 * - Safe temperature zones (Danger Zone: 5°C to 60°C)
 * - Packaging integrity (Sealed, Foil, Covered, Open)
 * - Category specific shelf lives
 */

// Default Category Shelf Lives (in hours) under different storage modes
const DEFAULT_CATEGORY_LIMITS = {
  'Rice': { ambient: 4, refrigerated: 24, hot_holding: 6 },
  'Roti/Bread': { ambient: 12, refrigerated: 48, hot_holding: 4 },
  'Dal': { ambient: 4, refrigerated: 24, hot_holding: 6 },
  'Vegetables': { ambient: 5, refrigerated: 36, hot_holding: 6 },
  'Curry': { ambient: 4, refrigerated: 24, hot_holding: 6 },
  'Fruits': { ambient: 24, refrigerated: 72, hot_holding: 0 },
  'Desserts': { ambient: 8, refrigerated: 48, hot_holding: 0 },
  'Bakery items': { ambient: 24, refrigerated: 72, hot_holding: 0 },
  'Packaged food': { ambient: 72, refrigerated: 168, hot_holding: 0 },
  'Other': { ambient: 4, refrigerated: 24, hot_holding: 4 }
};

export function screenFoodSafety(foodData, customConfigs = null) {
  const flags = [];
  const reasons = [];

  const prepTime = new Date(foodData.preparation_time);
  const safeUntil = new Date(foodData.safe_until);
  const now = new Date();

  // 1. Time validations
  const timeSincePrepMins = Math.floor((now.getTime() - prepTime.getTime()) / (1000 * 60));
  const remainingMins = Math.floor((safeUntil.getTime() - now.getTime()) / (1000 * 60));

  if (isNaN(prepTime.getTime()) || isNaN(safeUntil.getTime())) {
    return {
      safety_status: 'REVIEW REQUIRED',
      safety_reason: 'Invalid preparation or expiration timestamps provided.',
      remaining_window_minutes: 0,
      flags: ['INVALID_TIMESTAMPS']
    };
  }

  // Check if already expired past declared safe_until
  if (remainingMins <= 0) {
    return {
      safety_status: 'NOT ELIGIBLE',
      safety_reason: `Food has already passed its declared safe-use deadline (${Math.abs(remainingMins)} minutes ago).`,
      remaining_window_minutes: 0,
      flags: ['ALREADY_EXPIRED']
    };
  }

  // 2. Storage Method & Temperature Checks
  const storageMethod = (foodData.storage_method || '').toLowerCase();
  const temp = foodData.storage_temperature !== null && foodData.storage_temperature !== undefined 
    ? Number(foodData.storage_temperature) 
    : null;

  let temperatureValid = true;
  if (storageMethod.includes('refrigerat')) {
    if (temp !== null) {
      if (temp > 8) {
        flags.push('HIGH_REFRIGERATION_TEMP');
        reasons.push(`Refrigeration temperature (${temp}°C) exceeds safe 5-8°C threshold.`);
        temperatureValid = false;
      }
    }
  } else if (storageMethod.includes('hot')) {
    if (temp !== null) {
      if (temp < 60) {
        flags.push('LOW_HOT_HOLDING_TEMP');
        reasons.push(`Hot holding temperature (${temp}°C) is in the danger zone (<60°C).`);
        temperatureValid = false;
      }
    }
  } else if (storageMethod.includes('ambient') || storageMethod.includes('room')) {
    if (temp !== null && temp > 32) {
      flags.push('HIGH_AMBIENT_TEMP');
      reasons.push(`Ambient temperature (${temp}°C) accelerates bacterial proliferation.`);
    }
  }

  // 3. Packaging Condition
  const packaging = (foodData.packaging_condition || '').toLowerCase();
  let packagingValid = true;
  if (packaging.includes('open') || packaging.includes('loose') || packaging.includes('damaged')) {
    flags.push('UNSEALED_PACKAGING');
    reasons.push('Food is packaged in open or loose containers, risking contamination.');
    packagingValid = false;
  }

  // 4. Category-specific maximum ambient time
  const category = foodData.category || 'Other';
  const categoryRule = DEFAULT_CATEGORY_LIMITS[category] || DEFAULT_CATEGORY_LIMITS['Other'];
  
  let maxSafeHours = 4;
  if (storageMethod.includes('refrigerat')) {
    maxSafeHours = categoryRule.refrigerated;
  } else if (storageMethod.includes('hot')) {
    maxSafeHours = categoryRule.hot_holding;
  } else {
    maxSafeHours = categoryRule.ambient;
  }

  const hoursSincePrep = timeSincePrepMins / 60;
  if (hoursSincePrep > maxSafeHours) {
    flags.push('EXCEEDS_STORAGE_TIME_LIMIT');
    reasons.push(`Elapsed time (${hoursSincePrep.toFixed(1)}h) exceeds safe threshold (${maxSafeHours}h) for ${category} under ${foodData.storage_method} storage.`);
  }

  // 5. Compute Final Safety Status
  let status = 'ELIGIBLE';
  let finalReason = '';

  if (flags.includes('ALREADY_EXPIRED') || flags.includes('UNSEALED_PACKAGING') || (flags.includes('LOW_HOT_HOLDING_TEMP') && hoursSincePrep > 2) || hoursSincePrep > (maxSafeHours * 1.5)) {
    status = 'NOT ELIGIBLE';
    finalReason = `Failed safety screening: ${reasons.join(' ')}`;
  } else if (flags.length > 0 || !packaging.includes('sealed') && storageMethod.includes('ambient')) {
    status = 'REVIEW REQUIRED';
    finalReason = `Manual verification recommended: ${reasons.length > 0 ? reasons.join(' ') : 'Non-sealed packaging under ambient conditions.'}`;
  } else {
    status = 'ELIGIBLE';
    finalReason = `Food passes all safety criteria. Remaining safe-use window is ${Math.floor(remainingMins / 60)}h ${remainingMins % 60}m.`;
  }

  return {
    safety_status: status,
    safety_reason: finalReason,
    remaining_window_minutes: Math.max(0, remainingMins),
    time_since_prep_minutes: Math.max(0, timeSincePrepMins),
    flags
  };
}
