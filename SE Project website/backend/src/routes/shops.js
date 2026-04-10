const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// Update shop location
router.put('/location', auth, async (req, res) => {
  if (req.user.role !== 'shop') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const { latitude, longitude } = req.body;
  try {
    await db.query('UPDATE users SET latitude = ?, longitude = ? WHERE id = ?',
      [latitude, longitude, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update location' });
  }
});

module.exports = router;