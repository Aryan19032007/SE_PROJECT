require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rate limit
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// DB connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) throw err;
  console.log("MySQL Connected...");
});

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ success: false, message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

// Multer setup
const storage = multer.diskStorage({
  destination: path.join(__dirname, "uploads"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"), false);
  }
});

// REGISTER
app.post("/register", async (req, res) => {
  const { name, email, phone, password, role, latitude, longitude } = req.body;

  if (!phone || !password)
    return res.json({ success: false, message: "Phone & password required" });

  const hashed = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (name, email, phone, password, role, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [name, email, phone, hashed, role, latitude, longitude],
    (err) => {
      if (err) return res.json({ success: false, message: err.message });
      res.json({ success: true, message: "Registered" });
    }
  );
});

// LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE (email=? OR phone=?)",
    [email, email],
    async (err, result) => {
      if (err) return res.json({ success: false });

      if (result.length === 0)
        return res.json({ success: false, message: "User not found" });

      const user = result[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match)
        return res.json({ success: false, message: "Wrong password" });

      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);

      res.json({ success: true, user, token });
    }
  );
});

// SUBMIT REQUEST
app.post("/request", auth, upload.single("image"), (req, res) => {
  const { description, latitude, longitude } = req.body;
  const image = req.file.filename;

  db.query(
    "INSERT INTO requests (user_id, description, image, latitude, longitude) VALUES (?, ?, ?, ?, ?)",
    [req.user.id, description, image, latitude, longitude],
    () => res.json({ success: true })
  );
});

// GET REQUESTS (SHOP)
app.get("/requests/:shop_id", auth, (req, res) => {
  const shop_id = req.params.shop_id;

  db.query("SELECT latitude, longitude FROM users WHERE id=?", [shop_id], (err, shop) => {
    const lat = shop[0].latitude;
    const lng = shop[0].longitude;

    const sql = `
      SELECT *, (
        6371 * acos(
          cos(radians(?)) *
          cos(radians(latitude)) *
          cos(radians(longitude) - radians(?)) +
          sin(radians(?)) *
          sin(radians(latitude))
        )
      ) AS distance
      FROM requests
      HAVING distance <= 20
      ORDER BY distance ASC
    `;

    db.query(sql, [lat, lng, lat], (err, result) => res.json(result));
  });
});

// SEND RESPONSE
app.post("/response", auth, (req, res) => {
  const { request_id, price } = req.body;

  db.query(
    "INSERT INTO responses (request_id, shop_id, price) VALUES (?, ?, ?)",
    [request_id, req.user.id, price],
    () => res.json({ success: true })
  );
});

// ACCEPT OFFER
app.post("/accept", auth, (req, res) => {
  const { response_id } = req.body;

  db.query("UPDATE responses SET accepted=1 WHERE id=?", [response_id], () =>
    res.json({ success: true })
  );
});

// START SERVER
app.listen(process.env.PORT, () => {
  console.log("Server running...");
});