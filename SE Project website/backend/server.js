const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(bodyParser.json());

// SERVE UPLOADED IMAGES
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// DATABASE CONNECTION
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",   // 🔴 change if needed
  database: "fixbit"
});

db.connect(err => {
  if (err) {
    console.error("DB Error:", err);
    return;
  }
  console.log("MySQL Connected...");
});

// ================= IMAGE UPLOAD =================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// ================= ROUTES =================

// ROOT CHECK
app.get("/", (req, res) => {
  res.send("FixBit Backend Running 🚀");
});

// ================= REGISTER =================
app.post("/register", (req, res) => {
  const { name, email, password, role } = req.body;

  const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
  
  db.query(sql, [name, email, password, role], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Registration failed");
    }
    res.send("Registered Successfully");
  });
});

// ================= LOGIN =================
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email=? AND password=?";
  
  db.query(sql, [email, password], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Login error");
    }

    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.json({ message: "Invalid login" });
    }
  });
});

// ================= SUBMIT REQUEST =================
app.post("/request", upload.single("image"), (req, res) => {
  const { user_id, description, latitude, longitude } = req.body;
  const image = req.file ? req.file.filename : null;

  const sql = `
    INSERT INTO requests (user_id, description, image, latitude, longitude)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [user_id, description, image, latitude, longitude], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error saving request");
    }
    res.send("Request Saved Successfully");
  });
});

// ================= GET ALL REQUESTS =================
app.get("/requests", (req, res) => {
  const sql = "SELECT * FROM requests ORDER BY created_at DESC";

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching requests");
    }
    res.json(result);
  });
});

// ================= SEND RESPONSE =================
app.post("/response", (req, res) => {
  const { request_id, shop_id, price, message } = req.body;

  const sql = `
    INSERT INTO responses (request_id, shop_id, price, message)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [request_id, shop_id, price, message], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error sending response");
    }
    res.send("Response Sent Successfully");
  });
});

// ================= START SERVER =================
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
app.get("/user-responses/:user_id", (req, res) => {
  const user_id = req.params.user_id;

  const sql = `
    SELECT responses.*, requests.description, requests.image
    FROM responses
    JOIN requests ON responses.request_id = requests.id
    WHERE requests.user_id = ?
    ORDER BY responses.id DESC
  `;

  db.query(sql, [user_id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching responses");
    }
    res.json(result);
  });
});