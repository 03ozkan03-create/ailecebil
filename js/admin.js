// ==================== AILECE BİL! - ADMIN.JS ====================

// ==================== SEKME YÖNETİMİ ====================
function setTab(id, btn) {
  document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  btn.classList.add('active');
  if (id === 'tMessages') { renderConvList(); updateAdminMsgBadge(); }
  if (id === 'tQs') { renderQList(); refreshCatSelects(); }
  if (id === 'tCats') { renderCatStructure(); refreshGradeSelect(); }
  if (id === 'tPlayers') renderPlayers();
  if (id === 'tSuggest') renderSuggestList();
}

// ==================== STATS ==================== 
function updateAdminStats() {
  const s = getStore();
  const el = document.getElementById('adminStatChips'); if (!el) return;
  el.innerHTML = `
    <div class="schip">📝 Sorular: <span>${s.questions.length}</span></div>
    <div class="schip">👥 Oyuncular: <span>${s.users.filter(u => !u.adm).length}</span></div>
    <div class="schip">📂 Kategoriler: <span>${s.adultCats.length + s.grades.length}</span></div>`;
}

// ==================== OYUNCU YÖNETİMİ ====================
function renderPlayers() {
  const s = getStore();
  const search = (document.getElementById('playerSearch')?.value || '').toLowerCase();
  const players = s.users.filter(u => !u.adm && u.u.toLowerCase().includes(search));
  const el = document.getElementById('admUserList'); if (!el) return;
  if (!players.length) { el.innerHTML = '<div class="empty"><span class="ei">👥</span><p>Oyuncu bulunamadı</p></div>'; return; }
  el.innerHTML = players.map(u => `
    <div class="user-row">
      <div class="uname">${esc(u.u)} ${u.b ? '<span style="color:var(--danger);font-size:.75em">🚫</span>' : ''}
        <div class="umeta">${u.s}P · ${u.pl} oyun · ✅${u.c} ❌${u.w}</div>
      </div>
      <div class="uactions">
        <button class="btn btn-sm ${u.b ? 'btn-ok' : 'btn-warn'}" onclick="toggleBan('${u.id}')">${u.b ? '✅ Aç' : '🚫 Ban'}</button>
        <button class="btn btn-danger btn-sm" onclick="deletePlayer('${u.id}')">🗑️</button>
      </div>
    </div>`).join('');
}

function toggleBan(uid) {
  const s = getStore(); const u = s.users.find(x => x.id === uid);
  if (u && !u.adm) { u.b = !u.b; setStore(s); renderPlayers(); }
}
function deletePlayer(uid) {
  if (!confirm('Bu oyuncuyu silmek istediğinize emin misiniz?')) return;
  const s = getStore(); s.users = s.users.filter(x => x.id !== uid); setStore(s);
  renderPlayers(); renderConvList();
}

// ==================== MESAJLAŞMA ====================
let activeConv = null;

function renderConvList() {
  const s = getStore();
  const players = s.users.filter(u => !u.adm && u.m && u.m.length > 0);
  const el = document.getElementById('convList'); if (!el) return;
  if (!players.length) { el.innerHTML = '<div class="empty"><span class="ei">💬</span><p>Mesaj yok</p></div>'; return; }
  el.innerHTML = players.map(u => {
    const unread = u.m.filter(m => m.f === 'user' && !m.r).length;
    return `<div class="conv-item ${activeConv === u.id ? 'active' : ''}" onclick="openConv('${u.id}')">
      <div class="lb-avatar">${u.u[0].toUpperCase()}</div>
      <div style="flex:1;min-width:0"><div style="font-weight:800;font-size:.88em">${esc(u.u)}</div>
        <div style="font-size:.72em;color:var(--txt3)">${u.m.length} mesaj</div></div>
      ${unread > 0 ? `<span class="conv-badge">${unread}</span>` : ''}
    </div>`;
  }).join('');
}

function openConv(uid) {
  activeConv = uid;
  const s = getStore(); const u = s.users.find(x => x.id === uid); if (!u) return;
  u.m.forEach(m => { if (m.f === 'user') m.r = true; });
  setStore(s); renderConvList(); updateAdminMsgBadge();
  const panel = document.getElementById('chatPanel'); if (!panel) return;
  panel.innerHTML = `
    <div style="font-weight:900;margin-bottom:10px;font-size:.95em">💬 ${esc(u.u)}</div>
    <div class="msg-thread" id="adminThread"></div>
    <div style="display:flex;gap:6px;margin-top:8px">
      <input type="text" class="inp" id="aMsgInp" style="margin:0;flex:1" placeholder="Yanıt yaz..."
        onkeydown="if(event.key==='Enter')sendAdminMsg('${uid}')">
      <button class="btn btn-primary" style="width:auto" onclick="sendAdminMsg('${uid}')">Gönder</button>
      <button class="btn btn-danger btn-sm" onclick="clearChat('${uid}')">🗑️</button>
    </div>`;
  const thread = document.getElementById('adminThread');
  if (thread) {
    thread.innerHTML = u.m.map(m => `
      <div class="${m.f === 'admin' ? 'b-right' : ''}">
        <div class="bubble-name">${m.f === 'admin' ? '🛡️ Sen' : esc(u.u)} · ${m.d || ''}</div>
        <div class="bubble ${m.f === 'admin' ? 'me' : 'them'}">${esc(m.t)}</div>
      </div>`).join('');
    thread.scrollTop = thread.scrollHeight;
  }
}

function sendAdminMsg(uid) {
  const inp = document.getElementById('aMsgInp'); if (!inp) return;
  const text = inp.value.trim(); if (!text) return;
  const s = getStore(); const u = s.users.find(x => x.id === uid); if (!u) return;
  if (!u.m) u.m = [];
  u.m.push({ f: 'admin', t: text, d: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), r: true });
  setStore(s); inp.value = ''; openConv(uid);
}

function clearChat(uid) {
  if (!confirm('Tüm mesajlar silinsin mi?')) return;
  const s = getStore(); const u = s.users.find(x => x.id === uid);
  if (u) { u.m = []; setStore(s); }
  activeConv = null;
  document.getElementById('chatPanel').innerHTML = '<div class="empty"><span class="ei">💬</span><p>Konuşma seçin</p></div>';
  renderConvList(); updateAdminMsgBadge();
}

function updateAdminMsgBadge() {
  const s = getStore();
  const count = s.users.reduce((n, u) => n + (u.m || []).filter(m => m.f === 'user' && !m.r).length, 0);
  const badge = document.getElementById('adminMsgBadge');
  if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'inline-flex' : 'none'; }
}

// ==================== DUYURU ====================
function saveAnnouncement() {
  const title = document.getElementById('annTitle')?.value.trim() || '';
  const text = document.getElementById('annBody')?.value.trim() || '';
  if (!text) { showMsg('annMsg', '❌ Duyuru metni boş olamaz!', 'err'); return; }
  const s = getStore(); s.announcement = { title, text, active: true }; setStore(s);
  showMsg('annMsg', '✅ Duyuru yayına verildi!', 'ok');
}
function clearAnnouncement() {
  if (!confirm('Duyuruyu kaldırmak istiyor musunuz?')) return;
  const s = getStore(); s.announcement = { title: '', text: '', active: false }; setStore(s);
  showMsg('annMsg', '✅ Duyuru kaldırıldı.', 'ok');
}

// ==================== KATEGORİ YÖNETİMİ ====================
function addAdultCategory() {
  const name = document.getElementById('newAdultCat')?.value.trim();
  const icon = document.getElementById('newAdultIcon')?.value.trim() || '📌';
  if (!name) { showMsg('adultCatMsg', '❌ Kategori adı boş olamaz!', 'err'); return; }
  const s = getStore();
  if (s.adultCats.find(c => c.name === name)) { showMsg('adultCatMsg', '❌ Bu kategori zaten var!', 'err'); return; }
  s.adultCats.push({ name, icon }); setStore(s);
  document.getElementById('newAdultCat').value = ''; document.getElementById('newAdultIcon').value = '';
  showMsg('adultCatMsg', `✅ "${name}" eklendi!`, 'ok');
  renderCatStructure(); refreshCatSelects();
}
function deleteAdultCat(name) {
  if (!confirm(`"${name}" kategorisini silmek istiyor musunuz?`)) return;
  const s = getStore(); s.adultCats = s.adultCats.filter(c => c.name !== name); setStore(s);
  renderCatStructure(); refreshCatSelects();
}
function addGrade() {
  const name = document.getElementById('newGradeName')?.value.trim();
  const icon = document.getElementById('newGradeIcon')?.value.trim() || '📚';
  if (!name) { showMsg('gradeCatMsg', '❌ Sınıf adı boş olamaz!', 'err'); return; }
  const s = getStore();
  if (s.grades.find(g => g.name === name)) { showMsg('gradeCatMsg', '❌ Bu sınıf zaten var!', 'err'); return; }
  s.grades.push({ name, icon, subjects: [] }); setStore(s);
  document.getElementById('newGradeName').value = ''; document.getElementById('newGradeIcon').value = '';
  showMsg('gradeCatMsg', `✅ "${name}" sınıfı eklendi!`, 'ok');
  renderCatStructure(); refreshGradeSelect();
}
function deleteGrade(name) {
  if (!confirm(`"${name}" sınıfını silmek istiyor musunuz?`)) return;
  const s = getStore(); s.grades = s.grades.filter(g => g.name !== name); setStore(s);
  renderCatStructure(); refreshGradeSelect();
}
function addSubject() {
  const gName = document.getElementById('subjectGradeSelect')?.value;
  const name = document.getElementById('newSubjectName')?.value.trim();
  const icon = document.getElementById('newSubjectIcon')?.value.trim() || '📚';
  if (!gName || !name) { showMsg('subjectMsg', '❌ Sınıf ve konu adını doldurun!', 'err'); return; }
  const s = getStore(); const g = s.grades.find(x => x.name === gName); if (!g) return;
  if (g.subjects.find(sub => sub.name === name)) { showMsg('subjectMsg', '❌ Bu konu zaten var!', 'err'); return; }
  g.subjects.push({ name, icon }); setStore(s);
  document.getElementById('newSubjectName').value = ''; document.getElementById('newSubjectIcon').value = '';
  showMsg('subjectMsg', `✅ "${name}" konusu eklendi!`, 'ok');
  renderCatStructure(); refreshCatSelects();
}
function deleteSubject(gradeName, subName) {
  if (!confirm(`"${subName}" konusunu silmek istiyor musunuz?`)) return;
  const s = getStore(); const g = s.grades.find(x => x.name === gradeName);
  if (g) g.subjects = g.subjects.filter(sub => sub.name !== subName);
  setStore(s); renderCatStructure(); refreshCatSelects();
}
function refreshGradeSelect() {
  const s = getStore(); const sel = document.getElementById('subjectGradeSelect'); if (!sel) return;
  sel.innerHTML = s.grades.map(g => `<option value="${esc(g.name)}">${g.icon} ${esc(g.name)}</option>`).join('');
}
function refreshCatSelects() {
  const s = getStore();
  const aOpts = s.adultCats.map(c => `<option value="${esc(c.name)}">${c.icon} ${esc(c.name)}</option>`).join('');
  const kOpts = s.grades.flatMap(g => g.subjects.map(sub =>
    `<option value="${esc(g.name)}|${esc(sub.name)}">${g.icon} ${esc(g.name)} → ${sub.icon} ${esc(sub.name)}</option>`)).join('');
  const allOpts = `<optgroup label="🧑 Büyükler">${aOpts}</optgroup><optgroup label="🧒 Çocuklar">${kOpts}</optgroup>`;
  ['nq_cat', 'qCatFilter', 'bulkCatHelp'].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    if (id === 'qCatFilter') el.innerHTML = '<option value="">Tümü</option>' + allOpts;
    else el.innerHTML = allOpts;
  });
}
function renderCatStructure() {
  const s = getStore();
  const counts = {}; s.questions.forEach(q => { counts[q.c] = (counts[q.c] || 0) + 1; });
  let html = `<div style="margin-bottom:14px">
    <div style="font-weight:900;color:var(--pr);margin-bottom:8px">🧑 Büyükler</div>
    ${s.adultCats.map(c => `<div class="cat-manage-item">
      <span style="font-size:1.2em">${c.icon}</span>
      <span style="flex:1;font-weight:800">${esc(c.name)}</span>
      <span style="font-size:.75em;color:var(--txt3)">${counts[c.name] || 0} soru</span>
      <button class="btn btn-danger btn-sm" onclick="deleteAdultCat('${esc(c.name)}')">🗑️</button>
    </div>`).join('')}
  </div>
  <div class="divider"></div>
  <div><div style="font-weight:900;color:var(--kids-pr);margin-bottom:8px">🧒 Çocuklar</div>
    ${s.grades.map(g => `<div class="grade-manage">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span>${g.icon}</span><span style="flex:1;font-weight:900">${esc(g.name)}</span>
        <button class="btn btn-danger btn-sm" onclick="deleteGrade('${esc(g.name)}')">🗑️ Sil</button>
      </div>
      ${g.subjects.map(sub => `<div class="subject-manage-item">
        <span>${sub.icon}</span><span style="flex:1;font-size:.88em;font-weight:700">${esc(sub.name)}</span>
        <span style="font-size:.72em;color:var(--txt3)">${counts[g.name + '|' + sub.name] || 0} soru</span>
        <button class="btn btn-danger btn-sm" onclick="deleteSubject('${esc(g.name)}','${esc(sub.name)}')">🗑️</button>
      </div>`).join('')}
      ${!g.subjects.length ? '<div style="font-size:.82em;color:var(--txt3);padding:4px">Henüz konu yok</div>' : ''}
    </div>`).join('')}
  </div>`;
  const el = document.getElementById('catStructure'); if (el) el.innerHTML = html;
}

// ==================== SORU YÖNETİMİ ====================
function addQuestion() {
  const q = document.getElementById('nq_q')?.value.trim();
  const a = document.getElementById('nq_a')?.value.trim();
  const b = document.getElementById('nq_b')?.value.trim();
  const c = document.getElementById('nq_c')?.value.trim();
  const d = document.getElementById('nq_d')?.value.trim();
  const correct = parseInt(document.getElementById('nq_correct')?.value);
  const cat = document.getElementById('nq_cat')?.value;
  if (!q || !a || !b || !c || !d) { showMsg('nqMsg', '❌ Tüm alanları doldurun!', 'err'); return; }
  const s = getStore();
  s.questions.push({ id: nextId(), q, o: [a, b, c, d], a: correct, c: cat });
  setStore(s);
  ['nq_q', 'nq_a', 'nq_b', 'nq_c', 'nq_d'].forEach(i => { const el = document.getElementById(i); if (el) el.value = ''; });
  showMsg('nqMsg', `✅ Soru eklendi! Toplam: ${s.questions.length}`, 'ok');
  renderQList(); updateAdminStats();
}

function doBulk() {
  const raw = document.getElementById('bulkJson')?.value.trim();
  if (!raw) { showMsg('bulkMsg', '❌ JSON verisi girin.', 'err'); return; }
  let parsed;
  try { parsed = JSON.parse(raw); } catch (e) { showMsg('bulkMsg', '❌ Geçersiz JSON: ' + e.message, 'err'); return; }
  if (!Array.isArray(parsed)) { showMsg('bulkMsg', '❌ JSON dizi [] olmalı.', 'err'); return; }
  const s = getStore();
  const validCats = new Set([
    ...s.adultCats.map(c => c.name),
    ...s.grades.flatMap(g => g.subjects.map(sub => g.name + '|' + sub.name))
  ]);
  let added = 0; const errs = [];
  parsed.forEach((item, i) => {
    if (!item.q || !Array.isArray(item.o) || item.o.length !== 4 || typeof item.a !== 'number') {
      errs.push(`#${i + 1} format hatası`); return;
    }
    const cat = item.c && validCats.has(item.c) ? item.c : 'Genel Kültür';
    if (item.c && !validCats.has(item.c)) errs.push(`#${i + 1}: "${item.c}" geçersiz kategori, Genel Kültür'e eklendi`);
    s.questions.push({ id: nextId(), q: item.q.trim(), o: item.o.map(String), a: item.a, c: cat });
    added++;
  });
  setStore(s);
  dedupQuestions();
  let msg = `✅ ${added} soru eklendi! Toplam: ${getStore().questions.length}`;
  if (errs.length) msg += ` ⚠️ ${errs.length} uyarı`;
  showMsg('bulkMsg', msg, added > 0 ? 'ok' : 'err');
  if (added > 0) { document.getElementById('bulkJson').value = ''; renderQList(); updateAdminStats(); }
}

function showValidCats() {
  const el = document.getElementById('validCatList'); if (!el) return;
  if (el.style.display !== 'none') { el.style.display = 'none'; return; }
  const s = getStore();
  const adult = s.adultCats.map(c => `<span style="background:#e0e7ff;border-radius:6px;padding:2px 8px;margin:2px;display:inline-block;font-size:.82em;font-weight:800">${c.icon} ${c.name}</span>`).join('');
  const kids = s.grades.flatMap(g => g.subjects.map(sub =>
    `<span style="background:#fce7f3;border-radius:6px;padding:2px 8px;margin:2px;display:inline-block;font-size:.82em;font-weight:800">${g.name}|${sub.name}</span>`)).join('');
  el.innerHTML = `<div style="margin-bottom:5px;font-weight:900;color:var(--pr);font-size:.82em">🧑 Büyükler:</div>${adult}<div style="margin:8px 0 5px;font-weight:900;color:var(--kids-pr);font-size:.82em">🧒 Çocuklar:</div>${kids}`;
  el.style.display = 'block';
}

function deleteQuestion(id) {
  if (!confirm('Bu soruyu sil?')) return;
  const s = getStore(); s.questions = s.questions.filter(q => q.id !== id); setStore(s);
  renderQList(); updateAdminStats();
}

function renderQList() {
  const s = getStore();
  const search = (document.getElementById('qSearch')?.value || '').toLowerCase();
  const cat = document.getElementById('qCatFilter')?.value || '';
  const filtered = s.questions.filter(q =>
    (!search || q.q.toLowerCase().includes(search)) && (!cat || q.c === cat));
  const el = document.getElementById('qList'); if (!el) return;
  if (!filtered.length) { el.innerHTML = '<div class="empty"><span class="ei">📝</span><p>Soru bulunamadı</p></div>'; return; }
  el.innerHTML = filtered.slice(0, 80).map(q => `
    <div class="q-preview">
      <div class="qp-text" title="${esc(q.q)}">${esc(q.q)}</div>
      <div class="qp-cat">${esc(q.c.replace('|', ' → '))}</div>
      <button class="btn btn-danger btn-sm" style="padding:5px 8px" onclick="deleteQuestion(${q.id})">🗑️</button>
    </div>`).join('') +
    (filtered.length > 80 ? `<p style="text-align:center;color:var(--txt3);padding:8px;font-size:.85em">...${filtered.length - 80} soru daha</p>` : '');
}

function resetQuestions() {
  if (!confirm('Tüm sorular silinip varsayılanlara dönülsün mü?')) return;
  const s = getStore(); s.questions = getDefaultQuestions(); setStore(s);
  renderQList(); updateAdminStats(); alert('✅ Sorular sıfırlandı!');
}

// ==================== AYARLAR ====================
function changeAdminPass() {
  const old = document.getElementById('oldPass')?.value;
  const n = document.getElementById('newAdminPass')?.value;
  const n2 = document.getElementById('newAdminPass2')?.value;
  if (!old || !n || !n2) { showMsg('passMsg', '❌ Tüm alanları doldurun!', 'err'); return; }
  const s = getStore(); const admin = s.users.find(u => u.adm);
  if (admin.p !== old) { showMsg('passMsg', '❌ Mevcut şifre hatalı!', 'err'); return; }
  if (n.length < 4) { showMsg('passMsg', '❌ Şifre en az 4 karakter!', 'err'); return; }
  if (n !== n2) { showMsg('passMsg', '❌ Şifreler eşleşmiyor!', 'err'); return; }
  admin.p = n; setStore(s);
  ['oldPass', 'newAdminPass', 'newAdminPass2'].forEach(i => { const el = document.getElementById(i); if (el) el.value = ''; });
  showMsg('passMsg', '✅ Admin şifresi güncellendi!', 'ok');
}

function saveSheetsUrl() {
  const url = (document.getElementById('sheetsUrlInp')?.value || '').trim();
  if (!url) { alert('URL girin!'); return; }
  SHEETS_URL = url; LS.set(SHEETS_KEY, url); alert('✅ Google Sheets bağlandı!');
}

function nukeAll() {
  if (!confirm('TÜM veriler silinecek! Emin misiniz?')) return;
  if (!confirm('GERİ ALINAMAZ! Devam?')) return;
  LS.del(STORE_KEY); LS.del(SESSION_KEY); location.reload();
}

function runTerminal() {
  const code = document.getElementById('termInp')?.value;
  if (!code) { showMsg('termMsg', '❌ Komut girin!', 'err'); return; }
  try {
    // eslint-disable-next-line no-eval
    eval(code);
    setStore(getStore());
    showMsg('termMsg', '✅ Komut başarıyla çalıştırıldı!', 'ok');
  } catch (e) { showMsg('termMsg', '❌ Hata: ' + e.message, 'err');     


// Sheets URL'yi admin.js'den kaydetmek için
function saveSheetsUrl() {
  const url = document.getElementById('sheetsUrlInp')?.value?.trim();
  if (!url) { alert('URL girin!'); return; }
  if (!url.includes('script.google.com')) { alert('Geçerli bir Google Apps Script URL girin!'); return; }
  SHEETS_URL = url;
  LS.set(SHEETS_KEY, url);
  alert('✅ Google Sheets bağlandı! Sayfayı yenileyin.');
  setTimeout(() => location.reload(), 500);
}


   }
}
