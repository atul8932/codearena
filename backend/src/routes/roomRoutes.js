const express = require('express');
const router = express.Router();
const { getRoom } = require('../services/firebase');
const { PROBLEMS } = require('../data/problems');

// GET /api/room/:id — fetch room info
router.get('/:id', async (req, res) => {
  try {
    const room = await getRoom(req.params.id.toUpperCase());
    if (!room) return res.status(404).json({ error: 'Room not found' });
    // Strip hidden test cases
    if (room.problem?.hiddenTestCases) {
      const { hiddenTestCases, ...safeProblem } = room.problem;
      room.problem = safeProblem;
    }
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/room — list non-private rooms (public lobby)
router.get('/', async (req, res) => {
  // For MVP this returns a static list; extend with Firestore query in production
  res.json({ message: 'Use Socket.IO to create/join rooms', problems: PROBLEMS.length });
});

module.exports = router;
