/**
 * FixBit — Backend Server
 * Node.js + Express + MySQL
 * 
 * Key feature: GET /requests?shop_id=X returns only requests
 * where the shop is within the user's selected radius.
 */

const express    = require('express');
const mysql      = require('mysql2');
const cors       = require('cors');
const multer     = require('multer');
const bodyParser = require('body-parser');
const path       = require('path');

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ─── Static uploads ──────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Database ────────────────────────────────────────────────
const db = mysql.createConnection({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || 'password',   // ← change
  database: process.env.DB_NAME     || 'fixbit'
});

db.connect(err => {
  if (err) { console.error('DB connection failed:', err); return; }
  console.log('✅ MySQL connected');
});

// ─── File upload ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// ─── Haversine formula (server-side) ─────────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    = Math.sin(dLat / 2) ** 2
             + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
             * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ═══════════════════════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════════════════════

// Health check
app.get('/', (req, res) => res.json({ status: 'FixBit API running 🔧', version: '2.0' }));

// ─── REGISTER ────────────────────────────────────────────────
app.post('/register', (req, res) => {
  const { name, email, phone, password, role, latitude, longitude } = req.body;

  if (!phone || !password || !role) {
    return res.status(400).json({ error: 'Phone, password and role required' });
  }

  // Check if phone already registered
  db.query('SELECT id FROM users WHERE phone = ?', [phone], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (rows.length > 0) return res.status(409).json({ error: 'Phone already registered' });

    const sql = `
      INSERT INTO users (name, email, phone, password, role, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [name || null, email || null, phone, password, role, latitude || null, longitude || null], (err2) => {
      if (err2) { console.error(err2); return res.status(500).json({ error: 'Registration failed' }); }
      res.json({ message: 'Registered successfully' });
    });
  });
});

// ─── LOGIN ───────────────────────────────────────────────────
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Invalid login' });
  }

  // Match on email OR phone
  const sql = `
    SELECT id, name, phone, email, role, latitude, longitude
    FROM users
    WHERE (email = ? OR phone = ?) AND password = ?
    LIMIT 1
  `;
  db.query(sql, [email, email, password], (err, result) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Invalid login' }); }
    if (result.length > 0) return res.json(result[0]);
    res.json({ message: 'Invalid login' });
  });
});

// ─── SUBMIT REQUEST ──────────────────────────────────────────
app.post('/request', upload.single('image'), (req, res) => {
  const { user_id, brand, model, issue_type, description, latitude, longitude, radius } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  const sql = `
    INSERT INTO requests 
    (user_id, brand, model, issue_type, description, image, latitude, longitude, radius)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(
    sql,
    [user_id, brand || null, model || null, issue_type || null,
     description || null, image, latitude || null, longitude || null, radius || 10],
    (err) => {
      if (err) { console.error(err); return res.status(500).json({ error: 'Failed to save request' }); }
      res.json({ message: 'Request saved' });
    }
  );
});

// ─── GET REQUESTS (with radius filtering) ────────────────────
/**
 * If shop_id is provided, only return requests where:
 *   distance(shop, user) <= request.radius
 *
 * If no shop_id (admin use), return all.
 */
app.get('/requests', (req, res) => {
  const { shop_id } = req.query;

  if (!shop_id) {
    // No filter — return all (admin / fallback)
    const sql = 'SELECT * FROM requests ORDER BY created_at DESC';
    db.query(sql, (err, result) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json(result);
    });
    return;
  }

  // Get shop location first
  db.query('SELECT latitude, longitude FROM users WHERE id = ?', [shop_id], (err, shopRows) => {
    if (err || shopRows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const shopLat = shopRows[0].latitude;
    const shopLng = shopRows[0].longitude;

    if (!shopLat || !shopLng) {
      // Shop has no location set — return empty
      return res.json([]);
    }

    // Get all requests that have a location and radius set
    const sql = `
      SELECT * FROM requests
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      ORDER BY created_at DESC
    `;
    db.query(sql, (err2, requests) => {
      if (err2) return res.status(500).json({ error: 'DB error' });

      // Filter: shop must be within the user's chosen radius
      const filtered = requests.filter(req => {
        const dist = haversineKm(shopLat, shopLng, req.latitude, req.longitude);
        return dist <= (req.radius || 10);
      });

      // Add distance field for frontend display
      const withDist = filtered.map(r => ({
        ...r,
        distance_km: parseFloat(haversineKm(shopLat, shopLng, r.latitude, r.longitude).toFixed(2))
      }));

      // Sort by distance (nearest first)
      withDist.sort((a, b) => a.distance_km - b.distance_km);

      res.json(withDist);
    });
  });
});

// ─── SEND QUOTE / RESPONSE ───────────────────────────────────
app.post('/response', (req, res) => {
  const { request_id, shop_id, price, message } = req.body;

  if (!request_id || !shop_id || !price) {
    return res.status(400).json({ error: 'request_id, shop_id, price required' });
  }

  // Upsert: if shop already quoted on this request, update price
  const checkSql = 'SELECT id FROM responses WHERE request_id = ? AND shop_id = ?';
  db.query(checkSql, [request_id, shop_id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });

    if (rows.length > 0) {
      db.query(
        'UPDATE responses SET price = ?, message = ? WHERE request_id = ? AND shop_id = ?',
        [price, message || 'Repair available', request_id, shop_id],
        (err2) => {
          if (err2) return res.status(500).json({ error: 'Update failed' });
          res.json({ message: 'Quote updated' });
        }
      );
    } else {
      db.query(
        'INSERT INTO responses (request_id, shop_id, price, message) VALUES (?, ?, ?, ?)',
        [request_id, shop_id, price, message || 'Repair available'],
        (err2) => {
          if (err2) return res.status(500).json({ error: 'Insert failed' });
          res.json({ message: 'Quote sent' });
        }
      );
    }
  });
});

// ─── USER: GET THEIR RESPONSES ───────────────────────────────
app.get('/user-responses/:user_id', (req, res) => {
  const { user_id } = req.params;

  const sql = `
    SELECT 
      responses.id,
      responses.request_id,
      responses.shop_id,
      responses.price,
      responses.message,
      requests.description,
      requests.image,
      requests.brand,
      requests.model,
      requests.issue_type,
      requests.radius,
      users.name AS shop_name,
      users.phone AS shop_phone
    FROM responses
    JOIN requests ON responses.request_id = requests.id
    LEFT JOIN users ON responses.shop_id = users.id
    WHERE requests.user_id = ?
    ORDER BY responses.id DESC
  `;
  db.query(sql, [user_id], (err, result) => {
    if (err) { console.error(err); return res.status(500).json({ error: 'DB error' }); }
    res.json(result);
  });
});

// ─── USER: COUNT THEIR REQUESTS ──────────────────────────────
app.get('/user-requests/:user_id', (req, res) => {
  db.query(
    'SELECT id, brand, model, issue_type, created_at FROM requests WHERE user_id = ? ORDER BY created_at DESC',
    [req.params.user_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json(result);
    }
  );
});

// ─── SHOP: GET THEIR SENT QUOTES ─────────────────────────────
app.get('/shop-sent/:shop_id', (req, res) => {
  const sql = `
    SELECT 
      responses.id,
      responses.price,
      responses.message,
      requests.brand,
      requests.model,
      requests.issue_type,
      requests.description
    FROM responses
    JOIN requests ON responses.request_id = requests.id
    WHERE responses.shop_id = ?
    ORDER BY responses.id DESC
  `;
  db.query(sql, [req.params.shop_id], (err, result) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(result);
  });
});

// ─── START ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🔧 FixBit backend running → http://localhost:${PORT}`);
  console.log(`   Radius-based filtering: enabled ✅\n`);
});
