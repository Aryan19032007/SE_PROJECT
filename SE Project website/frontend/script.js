/* ================================================================
   FixBit v2 — script.js (JWT READY VERSION)
   ================================================================ */

const API = (typeof window.API_BASE !== 'undefined')
  ? window.API_BASE
  : 'http://localhost:3000';

function getToken() {
  return localStorage.getItem("token");
}

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

/* ================= LOGIN ================= */
async function login() {
  const emailVal = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value;

  const res = await fetch(API + '/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailVal, password })
  });

  const json = await res.json();

  if (!json.success) {
    alert(json.message);
    return;
  }

  // ✅ IMPORTANT CHANGES
  localStorage.setItem('user', JSON.stringify(json.user));
  localStorage.setItem('token', json.token);

  if (json.user.role === "user") {
    window.location.href = "user-dashboard.html";
  } else {
    window.location.href = "shop-dashboard.html";
  }
}

/* ================= SUBMIT REQUEST ================= */
async function submitRequest() {
  const desc = document.getElementById("desc").value;
  const image = document.getElementById("image").files[0];
  const user = getStoredUser();

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const formData = new FormData();
    formData.append("description", desc);
    formData.append("image", image);
    formData.append("user_id", user.id);
    formData.append("latitude", pos.coords.latitude);
    formData.append("longitude", pos.coords.longitude);

    await fetch(API + "/request", {
      method: "POST",
      headers: {
        "Authorization": getToken()   // ✅ JWT added
      },
      body: formData
    });

    alert("Request Sent!");
  });
}

/* ================= LOAD REQUESTS (SHOP) ================= */
async function loadRequests() {
  const user = getStoredUser();

  const res = await fetch(API + "/requests/" + user.id, {
    headers: {
      "Authorization": getToken()
    }
  });

  const data = await res.json();

  const div = document.getElementById("requests");
  div.innerHTML = "";

  data.forEach(req => {
    div.innerHTML += `
      <div class="card">
        <p>${req.description}</p>
        <img src="${API}/uploads/${req.image}" width="100"/>

        <input id="price-${req.id}" placeholder="Enter price">
        <button onclick="sendResponse(${req.id})">Send</button>
      </div>
    `;
  });
}

/* ================= SEND RESPONSE ================= */
async function sendResponse(request_id) {
  const price = document.getElementById("price-" + request_id).value;

  await fetch(API + "/response", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": getToken()   // ✅ JWT added
    },
    body: JSON.stringify({
      request_id,
      price
    })
  });

  alert("Response Sent!");
}

/* ================= LOAD USER RESPONSES ================= */
async function loadUserResponses() {
  const user = getStoredUser();

  const res = await fetch(API + "/user-responses/" + user.id, {
    headers: {
      "Authorization": getToken()
    }
  });

  const data = await res.json();

  const div = document.getElementById("responses");
  div.innerHTML = "";

  data.forEach(r => {
    div.innerHTML += `
      <div class="card">
        <p>${r.description}</p>
        <p>₹${r.price}</p>

        <button onclick="acceptOffer(${r.request_id}, ${r.shop_id})">
          Accept
        </button>
      </div>
    `;
  });
}

/* ================= ACCEPT OFFER ================= */
async function acceptOffer(request_id, shop_id) {
  await fetch(API + "/accept", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": getToken()   // ✅ JWT added
    },
    body: JSON.stringify({
      request_id,
      shop_id
    })
  });

  alert("Offer Accepted!");
}

/* ================= UPDATE STATUS ================= */
async function updateStatus(request_id, status) {
  await fetch(API + "/request/" + request_id + "/status", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": getToken()   // ✅ JWT added
    },
    body: JSON.stringify({ status })
  });

  alert("Status updated");
}

/* ================= SUBMIT REVIEW ================= */
async function submitReview(request_id, shop_id) {
  const rating = 5;

  await fetch(API + "/review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": getToken()   // ✅ JWT added
    },
    body: JSON.stringify({
      request_id,
      shop_id,
      rating
    })
  });

  alert("Review submitted");
}
/* ================= MAP ================= */

let map;
let marker;

function initMap() {
  if (!document.getElementById("map")) return;

  map = L.map('map').setView([26.75, 83.36], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);

  map.on('click', function (e) {
    placeMarker(e.latlng.lat, e.latlng.lng);
  });

  // 🔥 IMPORTANT FIX (your question)
  setTimeout(() => {
    map.invalidateSize();
  }, 300);
}

function placeMarker(lat, lng) {
  if (marker) {
    marker.setLatLng([lat, lng]);
  } else {
    marker = L.marker([lat, lng]).addTo(map);
  }

  // optional (for backend use later)
  window.selectedLat = lat;
  window.selectedLng = lng;
}

function getLiveLocation() {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      let lat = pos.coords.latitude;
      let lng = pos.coords.longitude;

      map.setView([lat, lng], 15);
      placeMarker(lat, lng);
    },
    () => alert("Location permission denied")
  );
}

window.onload = function () {
  if (document.getElementById("map")) {
    initMap();
  }
};