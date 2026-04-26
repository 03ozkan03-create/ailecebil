// ==================== AILECE BİL! - AUTH.JS ====================

let currentUser = null;

// ==================== BAŞLANGIÇ ====================
function initAuth() {
  initStore();
  // Ses düzeltme
  document.addEventListener('click', function () {
    if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }, { passive: true });
  // Oturum yükle
  const u = getSession();
  if (u) { currentUser = u; return true; }
  return false;
}

// ==================== AUTH FORM ====================
function switchAuthTab(mode) {
  document.querySelectorAll('.auth-tab').forEach((b, i) =>
    b.classList.toggle('active', (mode === 'login' && i === 0) || (mode === 'register' && i === 1))
  );
  renderAuthForm(mode);
}

function renderAuthForm(mode = 'login') {
  const isLogin = mode === 'login';
  const el = document.getElementById('authContent');
  if (!el) return;
  el.innerHTML = isLogin ? `
    <input type="text" class="inp" id="authUser" placeholder="Kullanıcı adı" autocomplete="username">
    <input type="password" class="inp" id="authPass" placeholder="Şifre" autocomplete="current-password"
      onkeydown="if(event.key==='Enter')doLogin()">
    <button class="btn btn-primary" onclick="doLogin()">🚀 Giriş Yap</button>
    <div id="authMsg" class="info-msg"></div>
  ` : `
    <input type="text" class="inp" id="authUser" placeholder="Kullanıcı adı (en az 3 karakter)">
    <input type="password" class="inp" id="authPass" placeholder="Şifre (en az 4 karakter)">
    <input type="password" class="inp" id="authPass2" placeholder="Şifreyi tekrar girin"
      onkeydown="if(event.key==='Enter')doRegister()">
    <button class="btn btn-ok" onclick="doRegister()">✅ Kayıt Ol</button>
    <div id="authMsg" class="info-msg"></div>
  `;
}

function doLogin() {
  const u = (document.getElementById('authUser')?.value || '').trim();
  const p = (document.getElementById('authPass')?.value || '');
  if (!u || !p) { showMsg('authMsg', '❌ Tüm alanları doldurun!', 'err'); return; }
  const s = getStore();
  const found = s.users.find(x => x.u.toLowerCase() === u.toLowerCase() && x.p === p);
  if (!found) { showMsg('authMsg', '❌ Kullanıcı adı veya şifre hatalı!', 'err'); return; }
  if (found.b) { showMsg('authMsg', '🚫 Hesabınız yasaklanmıştır!', 'err'); return; }
  currentUser = found;
  saveSession(found.id);
  onLoginSuccess();
}

function doRegister() {
  const u = (document.getElementById('authUser')?.value || '').trim();
  const p = (document.getElementById('authPass')?.value || '');
  const p2 = (document.getElementById('authPass2')?.value || '');
  if (!u || !p || !p2) { showMsg('authMsg', '❌ Tüm alanları doldurun!', 'err'); return; }
  if (u.length < 3) { showMsg('authMsg', '❌ Kullanıcı adı en az 3 karakter!', 'err'); return; }
  if (p.length < 4) { showMsg('authMsg', '❌ Şifre en az 4 karakter!', 'err'); return; }
  if (p !== p2) { showMsg('authMsg', '❌ Şifreler eşleşmiyor!', 'err'); return; }
  const s = getStore();
  if (s.users.find(x => x.u.toLowerCase() === u.toLowerCase())) {
    showMsg('authMsg', '❌ Bu kullanıcı adı alınmış!', 'err'); return;
  }
  const newU = {
    id: 'u_' + Date.now(), u, p, s: 0, pl: 0, c: 0, w: 0,
    adm: false, b: false, m: [], badges: [], perf: {},
    perfectCount: 0, streak: 0, lastDay: '', lastPlay: 0,
    weekScore: 0, dayScore: 0
  };
  s.users.push(newU);
  setStore(s);
  currentUser = newU;
  saveSession(newU.id);
  onLoginSuccess();
}

function doLogout() {
  if (!confirm('Çıkış yapmak istediğinize emin misiniz?')) return;
  currentUser = null;
  clearSession();
  window.location.href = 'index.html';
}

// ==================== ŞİFRE DEĞİŞTİR ====================
function changePass() {
  const p = document.getElementById('newPass')?.value;
  if (!p || p.length < 4) { alert('Şifre en az 4 karakter olmalı!'); return; }
  const s = getStore();
  const u = s.users.find(x => x.id === currentUser.id);
  if (u) { u.p = p; setStore(s); currentUser = u; }
  document.getElementById('newPass').value = '';
  alert('✅ Şifre güncellendi!');
}

// Sayfaya göre override edilecek
function onLoginSuccess() {
  window.location.href = 'index.html';
}
