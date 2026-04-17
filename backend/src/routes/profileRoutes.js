const express = require('express');
const router  = express.Router();
const { getUserProfile } = require('../services/firebase');

// GET /api/profile/:uid
router.get('/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) return res.status(400).json({ error: 'uid required' });

    const profile = await getUserProfile(uid);
    if (!profile) return res.json({ stats: {}, activity: {}, battles: [] });

    res.json(profile);
  } catch (err) {
    console.error('profile route error:', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

module.exports = router;
