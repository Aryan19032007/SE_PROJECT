/* ================================================================
   FixBit — script.js
   All frontend logic: register, login, requests, responses, radius
   ================================================================ */

const API = "http://localhost:3000";

// ─── Selected radius (default 10km) ────────────────────────────
let selectedRadius = 10;
let userLat = null;
let userLng = null;

// ─── Leaflet map vars ───────────────────────────────────────────
let map, marker, selectedLat = null, selectedLng = null;

/* ================================================================
   TOAST NOTIFICATIONS
   ================================================================ */
function showToast(message, type = 'success', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span style="font-size:1.1rem">${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = '.3s';
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

/* ================================================================
   RADIUS SELECTOR
   ================================================================ */
function selectRadius(km, btn) {
  selectedRadius = km;
  document.querySelectorAll('.radius-btn').forEach(b => b.classList.remove('selected'));
  if (btn) btn.classList.add('selected');
}

/* ================================================================
   GEOLOCATION
   ================================================================ */
function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

/* ================================================================
   USER REGISTER
   ================================================================ */
async function registerUser() {
  const name     = document.getElementById('name')?.value.trim();
  const phone    = document.getElementById('phone')?.value.trim();
  const email    = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value.trim();
  const errEl    = document.getElementById('errMsg');
  const btn      = document.getElementById('regBtn');

  // Validate
  if (!phone || !password) {
    errEl.textContent = '⚠️ Phone number and password are required.';
    errEl.style.display = 'block';
    return;
  }
  if (password.length < 6) {
    errEl.textContent = '⚠️ Password must be at least 6 characters.';
    errEl.style.display = 'block';
    return;
  }

  errEl.style.display = 'none';
  btn.classList.add('btn-loading');

  try {
    const res = await fetch(API + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email, password, role: 'user' })
    });

    if (!res.ok) throw new Error('Registration failed');

    showToast('Account created! Please log in.', 'success');
    setTimeout(() => window.location.href = 'login.html', 1200);
  } catch (err) {
    errEl.textContent = '❌ Registration failed. ' + (err.message || '');
    errEl.style.display = 'block';
  } finally {
    btn.classList.remove('btn-loading');
  }
}

/* ================================================================
   SHOP MAP
   ================================================================ */
function initMap() {
  // Default center: India
  map = L.map('map').setView([20.5937, 78.9629], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  // Click to select
  map.on('click', e => {
    selectedLat = e.latlng.lat;
    selectedLng = e.latlng.lng;

    if (marker) {
      marker.setLatLng(e.latlng);
    } else {
      marker = L.marker(e.latlng, {
        icon: L.divIcon({
          className: '',
          html: '<div style="background:#0d9488;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(map);
    }

    // Show coords
    const info = document.getElementById('locationInfo');
    const coords = document.getElementById('coordsText');
    if (info && coords) {
      coords.textContent = `${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}`;
      info.style.display = 'block';
    }
  });
}

function getLiveLocation() {
  const btn = document.getElementById('liveLocBtn');
  if (btn) { btn.classList.add('btn-loading'); }

  navigator.geolocation.getCurrentPosition(
    pos => {
      selectedLat = pos.coords.latitude;
      selectedLng = pos.coords.longitude;

      map.setView([selectedLat, selectedLng], 16);

      if (marker) {
        marker.setLatLng([selectedLat, selectedLng]);
      } else {
        marker = L.marker([selectedLat, selectedLng], {
          icon: L.divIcon({
            className: '',
            html: '<div style="background:#0d9488;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>',
            iconSize: [20, 20], iconAnchor: [10, 10]
          })
        }).addTo(map);
      }

      const info = document.getElementById('locationInfo');
      const coords = document.getElementById('coordsText');
      if (info && coords) {
        coords.textContent = `${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}`;
        info.style.display = 'block';
      }

      showToast('Location detected!', 'success');
      if (btn) btn.classList.remove('btn-loading');
    },
    err => {
      showToast('Could not get location: ' + err.message, 'error');
      if (btn) btn.classList.remove('btn-loading');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

/* ================================================================
   SHOP REGISTER
   ================================================================ */
async function registerShop() {
  const name     = document.getElementById('name')?.value.trim();
  const phone    = document.getElementById('phone')?.value.trim();
  const email    = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value.trim();
  const errEl    = document.getElementById('errMsg');
  const btn      = document.getElementById('regBtn');

  if (!phone || !password) {
    errEl.textContent = '⚠️ Phone and password are required.';
    errEl.style.display = 'block';
    return;
  }
  if (!selectedLat || !selectedLng) {
    errEl.textContent = '⚠️ Please select your shop location on the map.';
    errEl.style.display = 'block';
    return;
  }

  errEl.style.display = 'none';
  btn.classList.add('btn-loading');

  try {
    const res = await fetch(API + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, phone, email, password,
        role: 'shop',
        latitude: selectedLat,
        longitude: selectedLng
      })
    });

    if (!res.ok) throw new Error('Registration failed');

    showToast('Shop registered! Please log in.', 'success');
    setTimeout(() => window.location.href = 'login.html', 1200);
  } catch (err) {
    errEl.textContent = '❌ ' + (err.message || 'Registration failed. Try again.');
    errEl.style.display = 'block';
  } finally {
    btn.classList.remove('btn-loading');
  }
}

/* ================================================================
   LOGIN
   ================================================================ */
async function login() {
  const emailVal = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value.trim();
  const errEl    = document.getElementById('errorMsg');
  const btn      = document.getElementById('loginBtn');

  if (!emailVal || !password) {
    errEl.style.display = 'block';
    errEl.textContent = '⚠️ Please enter your email/phone and password.';
    return;
  }

  errEl.style.display = 'none';
  btn.classList.add('btn-loading');

  try {
    const res = await fetch(API + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailVal, password })
    });

    const data = await res.json();

    if (data.message === 'Invalid login') {
      errEl.style.display = 'block';
      errEl.textContent = '❌ Invalid email/phone or password.';
      btn.classList.remove('btn-loading');
      return;
    }

    localStorage.setItem('user', JSON.stringify(data));
    showToast('Welcome back!', 'success');

    setTimeout(() => {
      window.location.href = data.role === 'user' ? 'user-dashboard.html' : 'shop-dashboard.html';
    }, 600);
  } catch (err) {
    errEl.style.display = 'block';
    errEl.textContent = '❌ Could not connect to server. Is it running?';
    btn.classList.remove('btn-loading');
  }
}

/* ================================================================
   HAVERSINE DISTANCE (client-side fallback)
   ================================================================ */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ================================================================
   USER — SUBMIT REQUEST
   ================================================================ */
async function submitRequest() {
  const brand  = document.getElementById('brand')?.value;
  const model  = document.getElementById('model')?.value.trim();
  const issue  = document.getElementById('issue')?.value;
  const desc   = document.getElementById('desc')?.value.trim();
  const image  = document.getElementById('image')?.files[0];
  const errEl  = document.getElementById('submitErr');
  const btn    = document.getElementById('submitBtn');

  if (!brand || !model || !issue || !desc) {
    errEl.textContent = '⚠️ Please fill in brand, model, issue, and description.';
    errEl.style.display = 'block';
    return;
  }

  errEl.style.display = 'none';
  btn.classList.add('btn-loading');

  // Update location status
  const locStatus = document.getElementById('locationStatus');
  if (locStatus) locStatus.textContent = '📡 Getting your location...';

  try {
    const pos = await getUserLocation();
    userLat = pos.lat;
    userLng = pos.lng;

    if (locStatus) locStatus.textContent = `✅ Location captured (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`;

    const user = JSON.parse(localStorage.getItem('user'));
    const formData = new FormData();
    formData.append('brand', brand);
    formData.append('model', model);
    formData.append('issue_type', issue);
    formData.append('description', desc);
    formData.append('user_id', user.id);
    formData.append('latitude', userLat);
    formData.append('longitude', userLng);
    formData.append('radius', selectedRadius);
    if (image) formData.append('image', image);

    const res = await fetch(API + '/request', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Server error');

    showToast(`Request sent to shops within ${selectedRadius}km! 🎉`, 'success', 4000);

    // Reset form
    document.getElementById('brand').value = '';
    document.getElementById('model').value = '';
    document.getElementById('issue').value = '';
    document.getElementById('desc').value = '';
    document.getElementById('image').value = '';
    document.getElementById('imgPreview').style.display = 'none';

    // Switch to responses tab after delay
    setTimeout(() => {
      const tabBtn = document.querySelector('.nav-item:nth-child(2)');
      if (tabBtn) showTab('myResponses', tabBtn);
    }, 2000);

  } catch (err) {
    if (err.code === 1) {
      errEl.textContent = '📍 Location permission denied. Please enable location access in your browser.';
    } else {
      errEl.textContent = '❌ ' + (err.message || 'Could not submit request.');
    }
    errEl.style.display = 'block';
    if (locStatus) locStatus.textContent = '❌ Location unavailable';
  } finally {
    btn.classList.remove('btn-loading');
  }
}

/* ================================================================
   SHOP — LOAD REQUESTS (filtered by radius on server)
   ================================================================ */
async function loadRequests() {
  const user  = JSON.parse(localStorage.getItem('user'));
  const div   = document.getElementById('requests');
  if (!div) return;

  // Show skeleton loaders
  div.innerHTML = `
    <div class="grid grid-cols-1 gap-4">
      ${[1,2,3].map(() => `
        <div class="request-card">
          <div class="skeleton" style="height:18px; width:60%; margin-bottom:.5rem;"></div>
          <div class="skeleton" style="height:14px; width:40%; margin-bottom:1rem;"></div>
          <div class="skeleton" style="height:12px; width:80%;"></div>
        </div>
      `).join('')}
    </div>
  `;

  try {
    const res  = await fetch(`${API}/requests?shop_id=${user.id}`);
    const data = await res.json();

    if (data.length === 0) {
      div.innerHTML = `
        <div class="empty-state">
          <span class="icon">📭</span>
          <h4 class="font-outfit font-bold text-slate-600 mb-2">No requests in your area</h4>
          <p>Requests from users within their chosen radius will appear here.</p>
        </div>
      `;
      // Update stats
      setEl('statNearby', '0');
      setEl('reqCountBadge', '0');
      return;
    }

    setEl('statNearby', data.length);
    setEl('reqCountBadge', data.length);

    // Compute average radius
    const avgRadius = (data.reduce((s, r) => s + (r.radius || 10), 0) / data.length).toFixed(0);
    setEl('statRadius', avgRadius + 'km');

    div.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">` + data.map(req => {
      // Distance from shop to user
      let distHtml = '';
      if (user.latitude && user.longitude && req.latitude && req.longitude) {
        const dist = haversineKm(user.latitude, user.longitude, req.latitude, req.longitude);
        distHtml = `<span class="dist-badge">📍 ${dist.toFixed(1)} km away</span>`;
      }

      const issueColors = {
        'Screen Damage': 'badge-orange',
        'Battery Issue': 'badge-teal',
        'Water Damage': 'badge-slate',
        'Charging Problem': 'badge-teal',
      };
      const issueBadgeClass = issueColors[req.issue_type] || 'badge-slate';

      return `
        <div class="request-card animate-fadeUp" style="opacity:0; animation-fill-mode:forwards;">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h4 class="font-outfit font-bold text-slate-800">
                ${req.brand || '?'} ${req.model || ''}
              </h4>
              <div class="flex items-center gap-2 mt-1 flex-wrap">
                <span class="badge ${issueBadgeClass}">${req.issue_type || 'Unknown'}</span>
                ${distHtml}
                <span class="dist-badge">📡 Radius: ${req.radius || 10}km</span>
              </div>
            </div>
            <span style="font-size:.72rem; color:var(--slate-300);">#${req.id}</span>
          </div>

          <p style="font-size:.82rem; color:var(--slate-600); margin-bottom:.8rem; line-height:1.5;">
            ${req.description || '—'}
          </p>

          ${req.image ? `
            <img src="${API}/uploads/${req.image}" 
                 style="width:100%; max-height:140px; object-fit:cover; border-radius:10px; margin-bottom:.8rem;"
                 onerror="this.style.display='none'" alt="Repair photo"/>
          ` : ''}

          <div style="background:var(--slate-50); border-radius:10px; padding:.75rem; margin-top:.5rem;">
            <label style="font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--slate-500); display:block; margin-bottom:.4rem;">
              Your Quoted Price (₹)
            </label>
            <div style="display:flex; gap:.5rem;">
              <input type="number" 
                     class="form-input" 
                     id="price-${req.id}" 
                     placeholder="e.g. 1200"
                     style="margin:0; font-size:.9rem;"
                     min="1"/>
              <button onclick="sendResponse(${req.id})" 
                      id="send-${req.id}"
                      class="btn btn-primary btn-sm"
                      style="white-space:nowrap;">
                Send Quote
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('') + `</div>`;

    // Animate cards in
    setTimeout(() => {
      div.querySelectorAll('.request-card').forEach((el, i) => {
        el.style.animationDelay = (i * 0.07) + 's';
        el.style.opacity = '';
      });
    }, 50);

  } catch (err) {
    div.innerHTML = `
      <div class="empty-state">
        <span class="icon">⚠️</span>
        <h4 class="font-outfit font-bold text-red-500 mb-2">Could not load requests</h4>
        <p>Make sure the backend server is running on port 3000.</p>
      </div>
    `;
  }
}

/* ================================================================
   SHOP — SEND RESPONSE / QUOTE
   ================================================================ */
async function sendResponse(request_id) {
  const priceInput = document.getElementById('price-' + request_id);
  const price = priceInput?.value.trim();
  const btn   = document.getElementById('send-' + request_id);
  const user  = JSON.parse(localStorage.getItem('user'));

  if (!price || isNaN(price) || Number(price) <= 0) {
    showToast('Please enter a valid price', 'error');
    return;
  }

  btn.classList.add('btn-loading');

  try {
    const res = await fetch(API + '/response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id,
        shop_id: user.id,
        price: Number(price),
        message: 'Repair available'
      })
    });

    if (!res.ok) throw new Error();

    showToast(`Quote of ₹${price} sent! ✅`, 'success');

    // Mark card as quoted
    priceInput.disabled = true;
    btn.disabled = true;
    btn.textContent = '✅ Sent';
    btn.style.background = 'var(--teal-600)';

    // Update sent count
    const sentEl = document.getElementById('statSent');
    if (sentEl && sentEl.textContent !== '—') {
      sentEl.textContent = Number(sentEl.textContent) + 1;
    } else if (sentEl) {
      sentEl.textContent = 1;
    }

  } catch {
    showToast('Failed to send quote', 'error');
  } finally {
    btn.classList.remove('btn-loading');
  }
}

/* ================================================================
   USER — LOAD RESPONSES
   ================================================================ */
async function loadUserResponses() {
  const user = JSON.parse(localStorage.getItem('user'));
  const div  = document.getElementById('responses');
  if (!div) return;

  div.innerHTML = `
    <div class="grid grid-cols-1 gap-4">
      ${[1,2].map(() => `
        <div class="request-card">
          <div class="skeleton" style="height:18px; width:50%; margin-bottom:.5rem;"></div>
          <div class="skeleton" style="height:14px; width:30%; margin-bottom:1rem;"></div>
          <div class="skeleton" style="height:40px; width:100%;"></div>
        </div>
      `).join('')}
    </div>
  `;

  try {
    const res  = await fetch(`${API}/user-responses/${user.id}`);
    const data = await res.json();

    // Update stats
    setEl('statResponses', data.length);
    if (data.length > 0) {
      const min = Math.min(...data.map(r => r.price));
      setEl('statBestPrice', '₹' + min.toLocaleString('en-IN'));
    }

    // Show response count badge in sidebar
    const badge = document.getElementById('responseBadge');
    if (badge && data.length > 0) {
      badge.textContent = data.length;
      badge.style.display = 'inline';
    }

    if (data.length === 0) {
      div.innerHTML = `
        <div class="empty-state">
          <span class="icon">⏳</span>
          <h4 class="font-outfit font-bold text-slate-600 mb-2">No quotes yet</h4>
          <p>Submit a repair request and shops near you will send their best prices.</p>
        </div>
      `;
      return;
    }

    // Group by request
    const grouped = {};
    data.forEach(r => {
      if (!grouped[r.request_id]) grouped[r.request_id] = [];
      grouped[r.request_id].push(r);
    });

    let html = '<div class="grid grid-cols-1 gap-5">';

    Object.values(grouped).forEach(quotes => {
      const first = quotes[0];
      const prices = quotes.map(q => q.price);
      const minPrice = Math.min(...prices);

      html += `
        <div class="card p-5 animate-fadeUp" style="animation-fill-mode:forwards;">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h4 class="font-outfit font-bold text-slate-800 text-base">
                ${first.brand || '?'} ${first.model || ''}
              </h4>
              <span class="badge badge-slate mt-1">${first.issue_type || 'Repair'}</span>
            </div>
            <span class="badge badge-teal">${quotes.length} quote${quotes.length > 1 ? 's' : ''}</span>
          </div>

          <p style="font-size:.82rem; color:var(--slate-500); margin-bottom:1rem;">${first.description || ''}</p>

          ${first.image ? `
            <img src="${API}/uploads/${first.image}"
                 style="width:100%; max-height:140px; object-fit:cover; border-radius:10px; margin-bottom:1rem;"
                 onerror="this.style.display='none'" alt=""/>
          ` : ''}

          <div class="grid grid-cols-1 gap-2">
            ${quotes.sort((a,b) => a.price - b.price).map((q, i) => `
              <div style="
                display:flex; align-items:center; justify-content:space-between;
                padding:.7rem 1rem;
                border-radius:10px;
                background: ${i === 0 ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'var(--slate-50)'};
                border: 1.5px solid ${i === 0 ? '#86efac' : 'var(--slate-100)'};
              ">
                <div style="display:flex; align-items:center; gap:.5rem;">
                  ${i === 0 ? '<span title="Best price">🏆</span>' : '<span>🏪</span>'}
                  <span style="font-size:.82rem; color:var(--slate-600);">Shop #${q.shop_id}</span>
                  ${i === 0 ? '<span class="badge badge-teal" style="font-size:.65rem;">BEST</span>' : ''}
                </div>
                <div class="price-tag" style="font-size:${i === 0 ? '1.5rem' : '1.2rem'}; color:${i === 0 ? 'var(--teal-600)' : 'var(--slate-700)'};">
                  ₹${Number(q.price).toLocaleString('en-IN')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    html += '</div>';
    div.innerHTML = html;

  } catch {
    div.innerHTML = `
      <div class="empty-state">
        <span class="icon">⚠️</span>
        <p>Could not load responses. Is the server running?</p>
      </div>
    `;
  }
}

/* ================================================================
   SHOP — LOAD SENT QUOTES
   ================================================================ */
async function loadSentQuotes() {
  const user = JSON.parse(localStorage.getItem('user'));
  const div  = document.getElementById('sentQuotes');
  if (!div) return;

  div.innerHTML = `<div class="skeleton" style="height:100px; border-radius:12px;"></div>`;

  try {
    const res  = await fetch(`${API}/shop-sent/${user.id}`);
    const data = await res.json();

    if (data.length === 0) {
      div.innerHTML = `
        <div class="empty-state">
          <span class="icon">📤</span>
          <p>You haven't sent any quotes yet.</p>
        </div>
      `;
      return;
    }

    setEl('statSent', data.length);

    div.innerHTML = '<div class="grid grid-cols-1 gap-4">' + data.map(q => `
      <div class="request-card">
        <div class="flex justify-between items-start">
          <div>
            <h4 class="font-outfit font-bold text-slate-800">${q.brand || '?'} ${q.model || ''}</h4>
            <span class="badge badge-slate mt-1">${q.issue_type || 'Repair'}</span>
          </div>
          <div class="price-tag">₹${Number(q.price).toLocaleString('en-IN')}</div>
        </div>
        <p style="font-size:.8rem; color:var(--slate-400); margin-top:.5rem;">${q.description || ''}</p>
      </div>
    `).join('') + '</div>';

  } catch {
    div.innerHTML = `<div class="empty-state"><p>Could not load quotes.</p></div>`;
  }
}

/* ================================================================
   HELPER: Safe set element text
   ================================================================ */
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ================================================================
   DASHBOARD INIT — populate sidebar info
   ================================================================ */
function initDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) { window.location.href = 'login.html'; return; }

  const name = user.name || user.phone || 'User';
  setEl('sidebarName', name);
  setEl('topbarGreeting', `Welcome back, ${name.split(' ')[0]}!`);

  const initial = document.getElementById('sidebarInitial');
  if (initial) initial.textContent = (name[0] || 'U').toUpperCase();

  // Stats placeholder
  setEl('statRequests', '—');
  setEl('statResponses', '—');
  setEl('statBestPrice', '—');
}

/* ================================================================
   AUTO-DETECT LOCATION on user dashboard load
   ================================================================ */
function initUserLocation() {
  const locStatus = document.getElementById('locationStatus');
  if (!locStatus) return;

  if (!navigator.geolocation) {
    locStatus.textContent = '❌ Geolocation not supported in this browser';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      userLat = pos.coords.latitude;
      userLng = pos.coords.longitude;
      locStatus.textContent = `✅ Location ready (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`;
      locStatus.style.color = 'var(--teal-600)';
    },
    err => {
      if (err.code === 1) {
        locStatus.innerHTML = '⚠️ Location permission denied. <a href="#" onclick="retryLocation()" style="color:var(--teal-600)">Click to retry</a>';
      } else {
        locStatus.textContent = '⚠️ Could not detect location. Will retry on submit.';
      }
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

function retryLocation() {
  initUserLocation();
}

/* ================================================================
   PAGE-SPECIFIC AUTO INIT
   ================================================================ */
window.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path.includes('shop-register.html')) {
    initMap();
  }

  if (path.includes('user-dashboard.html')) {
    initDashboard();
    initUserLocation();

    // Load stats
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      fetch(`${API}/user-responses/${user.id}`)
        .then(r => r.json())
        .then(data => {
          setEl('statResponses', data.length);
          if (data.length > 0) {
            const min = Math.min(...data.map(r => r.price));
            setEl('statBestPrice', '₹' + min.toLocaleString('en-IN'));
          } else {
            setEl('statBestPrice', '—');
          }
        })
        .catch(() => {});

      // Count user requests
      fetch(`${API}/user-requests/${user.id}`)
        .then(r => r.json())
        .then(data => setEl('statRequests', data.length))
        .catch(() => {});
    }
  }

  if (path.includes('shop-dashboard.html')) {
    initDashboard();
    loadRequests();
  }
});
