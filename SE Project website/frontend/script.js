const API = "http://localhost:3000";

// ================= REGISTER =================
async function register() {
  let name = document.getElementById("name").value.trim();
  let email = document.getElementById("email").value.trim();
  let password = document.getElementById("password").value.trim();
  let role = document.getElementById("role").value;

  let res = await fetch(API + "/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, email, password, role })
  });

  let data = await res.text();
  alert(data);
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

  console.log("LOGIN RESPONSE:", data);

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

// ================= SUBMIT REQUEST =================
async function submitRequest() {
  let desc = document.getElementById("desc").value;
  let image = document.getElementById("image").files[0];

  let user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    alert("Login first");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    let lat = pos.coords.latitude;
    let lng = pos.coords.longitude;

    let formData = new FormData();
    formData.append("description", desc);
    formData.append("image", image);
    formData.append("user_id", user.id);   // ✅ VERY IMPORTANT
    formData.append("latitude", lat);
    formData.append("longitude", lng);

    await fetch(API + "/request", {
      method: "POST",
      body: formData
    });

    alert("Request Sent!");
  });
}

// ================= LOAD REQUESTS (SHOP) =================
async function loadRequests() {
  try {
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

  } catch (err) {
    console.error("Error loading requests:", err);
  }
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

// ================= AUTO LOAD =================
window.onload = function () {
  if (window.location.href.includes("shop-dashboard.html")) {
    loadRequests();
  }

  if (window.location.href.includes("user-dashboard.html")) {
    loadUserResponses();
  }
};
async function loadUserResponses() {
  let user = JSON.parse(localStorage.getItem("user"));

  if (!user) return;

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
        <p><b>Message:</b> ${r.message}</p>
      </div>
    `;
  });
}