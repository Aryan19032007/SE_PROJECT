const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// List of admin emails (add yours here)
const ADMIN_EMAILS = ['admin@fixbit.com', 'admin@gmail.com'];

// Admin check middleware
const adminAuth = (req, res, next) => {
  const userEmail = req.user.email;
  console.log('Admin check - User email:', userEmail);
  
  if (!userEmail) {
    return res.status(403).json({ success: false, message: 'No email in token' });
  }
  
  if (!ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
    return res.status(403).json({ success: false, message: 'Admin access only' });
  }
  next();
};

// Get all users
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, phone, role, latitude, longitude, avg_rating, banned, created_at FROM users'
    );
    res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// Get all requests
router.get('/requests', auth, adminAuth, async (req, res) => {
  try {
    const [requests] = await db.query(
      `SELECT r.*, u.name as user_name, s.name as shop_name 
       FROM requests r 
       JOIN users u ON r.user_id = u.id 
       LEFT JOIN users s ON r.accepted_shop_id = s.id 
       ORDER BY r.created_at DESC`
    );
    res.json({ success: true, requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
});

// Toggle user ban
router.put('/users/:id/ban', auth, adminAuth, async (req, res) => {
  const { banned } = req.body;
  try {
    await db.query('UPDATE users SET banned = ? WHERE id = ?', [banned ? 1 : 0, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// Delete request
router.delete('/requests/:id', auth, adminAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM requests WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete request' });
  }
});

module.exports = router;