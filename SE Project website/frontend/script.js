const API = "http://localhost:3000";

// ================= USER REGISTER =================
async function registerUser() {
  let name = document.getElementById("name").value.trim();
  let phone = document.getElementById("phone").value.trim();
  let email = document.getElementById("email").value.trim();
  let password = document.getElementById("password").value.trim();

  if (!phone || !password) {
    alert("Phone and Password required");
    return;
  }

  await fetch(API + "/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      phone,
      email,
      password,
      role: "user"
    })
  });

  alert("User Registered!");
  window.location.href = "login.html";
}

// ================= SHOP REGISTER =================
let map;
let marker;
let selectedLat = null;
let selectedLng = null;

function initMap() {
  map = L.map('map').setView([26.75, 83.36], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);

  // click to select location
  map.on('click', function (e) {
    selectedLat = e.latlng.lat;
    selectedLng = e.latlng.lng;

    if (marker) {
      marker.setLatLng(e.latlng);
    } else {
      marker = L.marker(e.latlng).addTo(map);
    }
  });
}

// 📍 LIVE LOCATION BUTTON
function getLiveLocation() {
  navigator.geolocation.getCurrentPosition((pos) => {
    selectedLat = pos.coords.latitude;
    selectedLng = pos.coords.longitude;

    map.setView([selectedLat, selectedLng], 15);

    if (marker) {
      marker.setLatLng([selectedLat, selectedLng]);
    } else {
      marker = L.marker([selectedLat, selectedLng]).addTo(map);
    }
  });
}

// 🏪 FINAL SHOP REGISTER
async function registerShop() {
  let name = document.getElementById("name").value.trim();
  let phone = document.getElementById("phone").value.trim();
  let email = document.getElementById("email").value.trim();
  let password = document.getElementById("password").value.trim();

  if (!phone || !password) {
    alert("Phone and Password required");
    return;
  }

  if (!selectedLat || !selectedLng) {
    alert("Select location on map");
    return;
  }

  await fetch(API + "/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      phone,
      email,
      password,
      role: "shop",
      latitude: selectedLat,
      longitude: selectedLng
    })
  });

  alert("Shop Registered!");
  window.location.href = "login.html";
}

// ================= LOGIN =================
async function login() {
  let email = document.getElementById("email").value.trim();
  let password = document.getElementById("password").value.trim();

  let res = await fetch(API + "/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  let data = await res.json();

  if (data.message === "Invalid login") {
    alert("Invalid Email or Password ❌");
    return;
  }

  localStorage.setItem("user", JSON.stringify(data));

  if (data.role === "user") {
    window.location.href = "user-dashboard.html";
  } else {
    window.location.href = "shop-dashboard.html";
  }
}

// ================= USER REQUEST =================
async function submitRequest() {
  let desc = document.getElementById("desc").value;
  let image = document.getElementById("image").files[0];

  let user = JSON.parse(localStorage.getItem("user"));

  navigator.geolocation.getCurrentPosition(async (pos) => {
    let lat = pos.coords.latitude;
    let lng = pos.coords.longitude;

    let formData = new FormData();
    formData.append("description", desc);
    formData.append("image", image);
    formData.append("user_id", user.id);
    formData.append("latitude", lat);
    formData.append("longitude", lng);

    await fetch(API + "/request", {
      method: "POST",
      body: formData
    });

    alert("Request Sent!");
  });
}

// ================= SHOP LOAD REQUESTS =================
async function loadRequests() {
  let res = await fetch(API + "/requests");
  let data = await res.json();

  let div = document.getElementById("requests");
  if (!div) return;

  div.innerHTML = "";

  if (data.length === 0) {
    div.innerHTML = "<p>No requests available</p>";
    return;
  }

  data.forEach(req => {
    div.innerHTML += `
      <div style="border:1px solid #ccc; padding:10px; margin:10px;">
        <p><b>Problem:</b> ${req.description}</p>
        <img src="${API}/uploads/${req.image}" width="120"/>
        <br><br>
        <input placeholder="Enter price" id="price-${req.id}">
        <button onclick="sendResponse(${req.id})">Send</button>
      </div>
    `;
  });
}

// ================= SEND RESPONSE =================
async function sendResponse(request_id) {
  let price = document.getElementById("price-" + request_id).value;
  let user = JSON.parse(localStorage.getItem("user"));

  await fetch(API + "/response", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      request_id,
      shop_id: user.id,
      price,
      message: "Repair available"
    })
  });

  alert("Response Sent!");
}

// ================= USER SEE RESPONSES =================
async function loadUserResponses() {
  let user = JSON.parse(localStorage.getItem("user"));

  let res = await fetch(API + "/user-responses/" + user.id);
  let data = await res.json();

  let div = document.getElementById("responses");
  if (!div) return;

  div.innerHTML = "";

  if (data.length === 0) {
    div.innerHTML = "<p>No responses yet</p>";
    return;
  }

  data.forEach(r => {
    div.innerHTML += `
      <div style="border:1px solid #ccc; padding:10px; margin:10px;">
        <p><b>Problem:</b> ${r.description}</p>
        <img src="${API}/uploads/${r.image}" width="100"/>
        <p><b>Price:</b> ₹${r.price}</p>
      </div>
    `;
  });
}

// ================= AUTO LOAD =================
window.onload = function () {

  if (window.location.href.includes("shop-register.html")) {
    initMap();
  }

  if (window.location.href.includes("shop-dashboard.html")) {
    loadRequests();
  }

  if (window.location.href.includes("user-dashboard.html")) {
    loadUserResponses();
  }
};