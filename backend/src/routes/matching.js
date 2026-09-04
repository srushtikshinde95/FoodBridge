import express from 'express';
import { evaluateCandidatesForDonation } from '../engine/matchingEngine.js';
import { executeAllocation } from '../engine/allocator.js';
import { queryAll, queryGet } from '../db/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Evaluate and get Explainable AI decision breakdown for a donation
router.get('/evaluate/:donationId', (req, res) => {
  try {
    const evaluation = evaluateCandidatesForDonation(req.params.donationId);
    res.json({ evaluation });
  } catch (err) {
    console.error('Error evaluating matching candidates:', err);
    res.status(400).json({ error: err.message });
  }
});

// Execute AI Allocation (Single, Partial, or Manual selection)
router.post('/allocate/:donationId', authenticateToken, (req, res) => {
  try {
    const { allowPartial = true, manualCandidateId = null, partialServings = null } = req.body;
    
    const result = executeAllocation(req.params.donationId, {
      allowPartial,
      manualCandidateId,
      partialServings
    });

    res.json({
      message: result.success ? 'Food allocated successfully' : result.message,
      result
    });
  } catch (err) {
    console.error('Error allocating donation:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get Match History with full explainability metadata
router.get('/history', (req, res) => {
  const matches = queryAll(`
    SELECT m.*,
      f.food_name, f.category, f.servings as total_servings, f.is_veg,
      h.hotel_name, h.address as hotel_address,
      n.ngo_name, n.address as ngo_address,
      d.id as delivery_id, d.status as delivery_status, d.distance_km, d.estimated_duration_mins
    FROM matches m
    JOIN food_donations f ON m.donation_id = f.id
    JOIN hotels h ON f.hotel_id = h.id
    JOIN ngos n ON m.ngo_id = n.id
    LEFT JOIN deliveries d ON d.match_id = m.id
    ORDER BY m.created_at DESC
    LIMIT 50
  `);

  const formatted = matches.map(m => {
    let explanation = {};
    try {
      explanation = JSON.parse(m.explanation_json);
    } catch (e) {}
    return { ...m, explanation };
  });

  res.json({ matches: formatted });
});

export default router;
