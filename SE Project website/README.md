# FixBit v2 — Mobile Repair Marketplace

A production-ready local repair marketplace.  
Users post repair jobs → nearby shops quote → user accepts the best deal.

---

## 📁 Folder Structure

```
fixbit/
├── frontend/                   # All HTML, CSS, JS (serve statically)
│   ├── index.html              # Landing page
│   ├── login.html              # Login (user or shop)
│   ├── user-register.html      # Customer registration
│   ├── shop-register.html      # Shop registration (with map)
│   ├── user-dashboard.html     # Customer dashboard
│   ├── shop-dashboard.html     # Shopkeeper dashboard
│   ├── style.css               # All styles
│   └── script.js               # All frontend logic (v2)
│
├── backend/
│   ├── src/
│   │   └── server.js           # Express API (v2)
│   ├── package.json
│   └── .env                    # (create this — see below)
│
├── uploads/                    # Auto-created by multer
└── schema.sql                  # Run this once to set up DB
```

---

## 🚀 Setup

### 1. Database
```bash
mysql -u root -p < schema.sql
```

### 2. Backend
```bash
cd backend
npm install
```

Create a `.env` file:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fixbit
PORT=3000
```

```bash
npm start       # production
npm run dev     # with nodemon (auto-restart)
```

### 3. Frontend
Point `const API` in `script.js` to your backend URL.  
For local dev: `http://localhost:3000`  
For production: `https://your-api-domain.com`

Serve the frontend folder with any static server:
```bash
npx serve frontend/
# or just open index.html directly in the browser for local testing
```

### 4. Capacitor (Android/iOS)
```bash
npm init @capacitor/app
npx cap add android
# Set server.url in capacitor.config.json to your hosted API
npx cap sync
npx cap open android
```

---

## ✅ Features (v2)

| Feature | Status |
|---|---|
| bcrypt password hashing | ✅ |
| Phone + email login | ✅ |
| Input validation | ✅ |
| Duplicate phone prevention | ✅ |
| Radius-based shop filtering | ✅ |
| Distance (km) on every result | ✅ |
| Accept offer system (1 shop/request) | ✅ |
| Phone/WhatsApp revealed after accept | ✅ |
| Request lifecycle (pending → completed) | ✅ |
| Shop updates status (in_progress/completed) | ✅ |
| Star rating & review after completion | ✅ |
| Average rating cached on shop profile | ✅ |
| Basic in-app chat (per request) | ✅ |
| Quote update (upsert) | ✅ |
| Image upload (5MB) | ✅ |
| Standardised JSON responses | ✅ |
| async/await throughout | ✅ |
| Mobile-first responsive UI | ✅ |
| Configurable API base URL | ✅ |
| DB indexes for performance | ✅ |

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | /register | Register user or shop |
| POST | /login | Login (email or phone) |
| POST | /request | Submit repair request |
| GET | /requests?shop_id=X | Get nearby requests for shop |
| GET | /user-requests/:id | User's request list |
| GET | /user-responses/:id | Quotes received by user |
| POST | /response | Shop sends/updates quote |
| POST | /accept | User accepts a shop's offer |
| PATCH | /request/:id/status | Shop updates job status |
| GET | /shop-sent/:id | Shop's sent quotes |
| POST | /review | Submit star review |
| GET | /reviews/:shop_id | Shop's reviews |
| POST | /message | Send a chat message |
| GET | /messages/:req_id/:user_id | Load chat thread |

All responses follow: `{ success: true/false, data: ..., message: ... }`

---

## 🔐 Security Notes

- Passwords hashed with bcrypt (salt rounds: 10)
- Shop phone is **only revealed** to the user after they accept an offer
- SQL injection prevented via parameterised queries (mysql2)
- File uploads limited to 5MB
- For production: add JWT auth, rate limiting (express-rate-limit), and HTTPS
