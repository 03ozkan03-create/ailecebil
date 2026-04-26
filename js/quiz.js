// ==================== AILECE BİL! - QUIZ.JS ====================

// ==================== SES MOTORU ====================
let audioCtx = null;
function playSound(f, t, d) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  try {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = t; o.frequency.value = f;
    g.gain.setValueAtTime(0.07, audioCtx.currentTime);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + d);
  } catch {}
}
const sounds = {
  tick: () => playSound(400, 'sine', 0.04),
  win: () => { playSound(523, 'sine', 0.1); setTimeout(() => playSound(659, 'sine', 0.15), 100); setTimeout(() => playSound(784, 'sine', 0.2), 220); },
  fail: () => playSound(150, 'sawtooth', 0.3)
};

// ==================== QUIZ STATE ====================
let quizState = null;
let lastQuizParams = null;
let selectedSpeed = 20;
let speedQuizParams = null;

// ==================== SÜRE MODU ====================
function setSpeed(sec, el) {
  document.querySelectorAll('.speed-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedSpeed = sec;
}

function openSubjectSpeed(catKey, label) {
  speedQuizParams = { catKey, label };
  document.getElementById('speedLabel').textContent = label;
  const backBtn = document.getElementById('speedBackBtn');
  if (backBtn) backBtn.onclick = () => history.back();
  showSection('speedSection');
}

function openSpeedMode(catKey = 'Karma', label = 'Karma Quiz') {
  speedQuizParams = { catKey, label };
  document.getElementById('speedLabel').textContent = label;
  const backBtn = document.getElementById('speedBackBtn');
  if (backBtn) backBtn.onclick = () => showSection('homeSection');
  showSection('speedSection');
}

function startSpeedQuiz() {
  if (!speedQuizParams) speedQuizParams = { catKey: 'Karma', label: 'Karma' };
  const s = getStore();
  const pool = s.questions.filter(q => speedQuizParams.catKey === 'Karma' ? true : q.c === speedQuizParams.catKey);
  if (!pool.length) { alert('Bu kategoride soru yok!'); return; }
  lastQuizParams = speedQuizParams;
  const selected = pool.sort(() => Math.random() - .5).slice(0, 10);
  quizState = {
    cat: speedQuizParams.catKey, label: speedQuizParams.label,
    questions: selected, idx: 0, score: 0, correct: 0, wrong: 0, timeout: 0,
    timeLeft: selectedSpeed, timer: null,
    jokers: { half: true, skip: true, extra: true }
  };
  document.getElementById('qMeta').textContent = speedQuizParams.label + ' (' + selectedSpeed + 'sn)';
  showSection('quizSection');
  renderJokers();
  loadQuestion();
}

// ==================== JOKERLER ====================
function renderJokers() {
  const el = document.getElementById('jokerBar');
  if (!el) return;
  if (!quizState || !quizState.jokers) { el.innerHTML = ''; return; }
  const j = quizState.jokers;
  el.innerHTML = `
    <button class="joker-btn" ${!j.half ? 'disabled' : ''} onclick="useJoker('half')">🎯 50/50</button>
    <button class="joker-btn" ${!j.skip ? 'disabled' : ''} onclick="useJoker('skip')">⏭️ Geç</button>
    <button class="joker-btn" ${!j.extra ? 'disabled' : ''} onclick="useJoker('extra')">⏱️ +10sn</button>
  `;
}

function useJoker(type) {
  if (!quizState || !quizState.jokers || !quizState.jokers[type]) return;
  quizState.jokers[type] = false;
  sounds.win();
  if (type === 'half') {
    const q = quizState.questions[quizState.idx]; let r = 0;
    document.querySelectorAll('.choice-btn').forEach((b, i) => {
      if (i !== q.a && r < 2 && !b.disabled) { b.disabled = true; b.style.opacity = '.2'; r++; }
    });
  } else if (type === 'skip') {
    clearInterval(quizState.timer); quizState.timeout++; quizState.idx++;
    setTimeout(() => { quizState.idx < quizState.questions.length ? loadQuestion() : endQuiz(); }, 300);
  } else if (type === 'extra') {
    quizState.timeLeft += 10; updateTimerUI();
  }
  renderJokers();
}

// ==================== NORMAL QUIZ BAŞLAT ====================
function startQuiz(catKey, label) {
  speedQuizParams = { catKey, label };
  lastQuizParams = { catKey, label };
  const s = getStore();
  const pool = s.questions.filter(q => catKey === 'Karma' ? true : q.c === catKey);
  if (!pool.length) {
    alert(`⚠️ "${label}" kategorisinde henüz soru yok!\nAdmin panelinden soru ekleyin.`);
    return;
  }
  const selected = pool.sort(() => Math.random() - .5).slice(0, Math.min(10, pool.length));
  quizState = {
    cat: catKey, label, questions: selected,
    idx: 0, score: 0, correct: 0, wrong: 0, timeout: 0,
    timeLeft: selectedSpeed, timer: null,
    jokers: { half: true, skip: true, extra: true }
  };
  document.getElementById('qMeta').textContent = label;
  showSection('quizSection');
  renderJokers();
  loadQuestion();
}

// ==================== SORU YÜKLE ====================
function loadQuestion() {
  if (!quizState) return;
  if (quizState.idx >= quizState.questions.length) { endQuiz(); return; }
  const q = quizState.questions[quizState.idx];
  const tot = quizState.questions.length;
  const pct = ((quizState.idx + 1) / tot) * 100;

  document.getElementById('qCounter').textContent = `${quizState.idx + 1} / ${tot}`;
  document.getElementById('progFill').style.width = pct + '%';
  document.getElementById('qScore').textContent = '🌟 ' + quizState.score;
  document.getElementById('qCat').textContent = q.c.replace('|', ' → ');
  document.getElementById('qText').textContent = q.q;

  const letters = ['A', 'B', 'C', 'D'];
  document.getElementById('choiceArea').innerHTML = q.o.map((opt, i) => `
    <button class="choice-btn" onclick="checkAnswer(${i})">
      <span class="choice-letter">${letters[i]}</span>${esc(opt)}
    </button>`).join('');

  startTimer();
  renderJokers();
}

// ==================== ZAMANLAYICI ====================
function startTimer() {
  clearInterval(quizState.timer);
  quizState.timeLeft = selectedSpeed;
  updateTimerUI();
  quizState.timer = setInterval(() => {
    quizState.timeLeft--;
    updateTimerUI();
    sounds.tick();
    if (quizState.timeLeft <= 0) { clearInterval(quizState.timer); checkAnswer(-1); }
  }, 1000);
}

function updateTimerUI() {
  const el = document.getElementById('timerRing');
  const txt = document.getElementById('timerTxt');
  if (txt) txt.textContent = quizState.timeLeft;
  if (el) el.classList.toggle('timer-low', quizState.timeLeft <= 5);
}

// ==================== CEVAP KONTROL ====================
function checkAnswer(idx) {
  clearInterval(quizState.timer);
  const q = quizState.questions[quizState.idx];
  document.querySelectorAll('.choice-btn').forEach((b, i) => {
    b.disabled = true; b.onclick = null;
    if (i === q.a) b.classList.add('correct');
    else if (i === idx) b.classList.add('wrong');
  });
  if (idx === q.a) {
    quizState.score += (10 + quizState.timeLeft);
    quizState.correct++;
    sounds.win();
  } else {
    quizState.wrong++;
    sounds.fail();
    document.querySelector('.card')?.classList.add('shake');
    setTimeout(() => document.querySelector('.card')?.classList.remove('shake'), 400);
    if (idx === -1) quizState.timeout++;
  }
  document.getElementById('qScore').textContent = '🌟 ' + quizState.score;
  setTimeout(() => { quizState.idx++; loadQuestion(); }, 1400);
}

// ==================== QUIZ BİTİŞ ====================
function endQuiz() {
  clearInterval(quizState?.timer);

  // Performans & istatistik kaydet
  if (currentUser && quizState) {
    const s = getStore();
    const u = s.users.find(x => x.id === currentUser.id);
    if (u) {
      if (!u.perf) u.perf = {};
      const cat = quizState.cat;
      if (!u.perf[cat]) u.perf[cat] = { correct: 0, total: 0 };
      u.perf[cat].correct += quizState.correct;
      u.perf[cat].total += quizState.questions.length;
      if (quizState.correct === quizState.questions.length) u.perfectCount = (u.perfectCount || 0) + 1;
      u.s += quizState.score;
      u.pl++;
      u.c += quizState.correct;
      u.w += quizState.wrong;
      // Streak
      const today = new Date().toDateString();
      if (u.lastDay !== today) {
        u.streak = (u.lastDay === new Date(Date.now() - 86400000).toDateString()) ? (u.streak || 0) + 1 : 1;
        u.lastDay = today; u.dayScore = 0;
      }
      u.lastPlay = Date.now();
      u.weekScore = (u.weekScore || 0) + quizState.score;
      u.dayScore = (u.dayScore || 0) + quizState.score;
      setStore(s);
      currentUser = u;
      saveSession(u.id);
      setTimeout(() => checkAndGrantBadges(currentUser), 800);
      // Google Sheets — skor-api.js üzerinden kaydet
      if (typeof saveScoreToSheets === 'function') {
        saveScoreToSheets(u, u.s, quizState.correct, quizState.wrong, quizState.cat);
      }
    }
  }

  // Sonuç ekranı
  const pct = Math.round((quizState.correct / quizState.questions.length) * 100);
  let icon = '💪', title = 'Devam Et!';
  if (pct === 100) { icon = '🏆'; title = 'Mükemmel!'; }
  else if (pct >= 80) { icon = '🥇'; title = 'Harika!'; }
  else if (pct >= 60) { icon = '⭐'; title = 'Güzel!'; }
  else if (pct >= 40) { icon = '👍'; title = 'Fena Değil!'; }

  document.getElementById('resIcon').textContent = icon;
  document.getElementById('resTitle').textContent = title;
  document.getElementById('resScore').textContent = quizState.score;
  document.getElementById('resOk').textContent = quizState.correct;
  document.getElementById('resBad').textContent = quizState.wrong;
  document.getElementById('resTo').textContent = quizState.timeout;
  document.getElementById('resPct').textContent = '%' + pct;

  showSection('resultSection');
}

function replayQuiz() {
  if (lastQuizParams) startQuiz(lastQuizParams.catKey, lastQuizParams.label);
}
function quitQuiz() {
  if (confirm('Quizden çıkmak istiyor musunuz?')) {
    clearInterval(quizState?.timer); quizState = null;
    showSection('homeSection');
  }
}

// ==================== ÇOKLU OYUNCU ====================
let mpState = null;

function openMultiplayer() { showSection('mpSetupSection'); fillMpCats(); }

function fillMpCats() {
  const s = getStore();
  const sel = document.getElementById('mpCatSelect'); if (!sel) return;
  const aOpts = s.adultCats.map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('');
  const kOpts = s.grades.flatMap(g => g.subjects.map(sub =>
    `<option value="${g.name}|${sub.name}">${g.icon} ${g.name} → ${sub.name}</option>`)).join('');
  sel.innerHTML = `<option value="Karma">🎲 Karma</option>${aOpts}${kOpts}`;
}

function addMpPlayer() {
  const inputs = document.getElementById('mpPlayerInputs');
  const count = inputs.querySelectorAll('input').length;
  if (count >= 6) { showMsg('mpSetupMsg', '❌ Maksimum 6 oyuncu!', 'err'); return; }
  const inp = document.createElement('input');
  inp.className = 'inp'; inp.placeholder = (count + 1) + '. Oyuncu adı'; inp.id = 'mp' + count;
  inputs.appendChild(inp);
}

function startMultiplayer() {
  const inputs = document.getElementById('mpPlayerInputs').querySelectorAll('input');
  const players = []; inputs.forEach(i => { const n = i.value.trim(); if (n) players.push(n); });
  if (players.length < 2) { showMsg('mpSetupMsg', '❌ En az 2 oyuncu!', 'err'); return; }
  const cat = document.getElementById('mpCatSelect').value;
  const qCount = parseInt(document.getElementById('mpQCount').value);
  const speed = parseInt(document.getElementById('mpSpeed').value);
  const s = getStore();
  const pool = s.questions.filter(q => cat === 'Karma' ? true : q.c === cat);
  if (!pool.length) { showMsg('mpSetupMsg', '❌ Bu kategoride soru yok!', 'err'); return; }
  mpState = {
    players: players.map(n => ({ name: n, score: 0, correct: 0 })),
    currentPlayer: 0, currentQ: 0,
    questions: pool.sort(() => Math.random() - .5).slice(0, qCount),
    speed, timer: null, timeLeft: speed
  };
  showSection('mpGameSection');
  renderMpScoreCards();
  loadMpQuestion();
}

function renderMpScoreCards() {
  if (!mpState) return;
  document.getElementById('mpScoreCards').innerHTML = mpState.players.map((p, i) => `
    <div class="mp-score-card ${i === mpState.currentPlayer ? 'active-player' : ''}">
      <div class="mpn">${esc(p.name)}</div><div class="mps">${p.score}</div>
    </div>`).join('');
}

function loadMpQuestion() {
  if (!mpState) return;
  const p = mpState.players[mpState.currentPlayer];
  const q = mpState.questions[mpState.currentQ];
  const tot = mpState.questions.length;
  document.getElementById('mpTurnName').textContent = p.name;
  document.getElementById('mpTurnSub').textContent = (mpState.currentQ + 1) + '. soru sırası sende!';
  document.getElementById('mpQCounter').textContent = 'S ' + (mpState.currentQ + 1) + '/' + tot;
  document.getElementById('mpProgFill').style.width = ((mpState.currentQ + 1) / tot * 100) + '%';
  document.getElementById('mpCurScore').textContent = '🌟 ' + p.score;
  document.getElementById('mpQText').textContent = q.q;
  const letters = ['A', 'B', 'C', 'D'];
  document.getElementById('mpChoiceArea').innerHTML = q.o.map((opt, i) => `
    <button class="choice-btn" onclick="checkMpAnswer(${i})">
      <span class="choice-letter">${letters[i]}</span>${esc(opt)}
    </button>`).join('');
  clearInterval(mpState.timer);
  mpState.timeLeft = mpState.speed; updateMpTimer();
  mpState.timer = setInterval(() => {
    mpState.timeLeft--; updateMpTimer(); sounds.tick();
    if (mpState.timeLeft <= 0) { clearInterval(mpState.timer); checkMpAnswer(-1); }
  }, 1000);
}

function updateMpTimer() {
  if (!mpState) return;
  document.getElementById('mpTimerTxt').textContent = mpState.timeLeft;
  document.getElementById('mpTimerRing').classList.toggle('timer-low', mpState.timeLeft <= 5);
}

function checkMpAnswer(idx) {
  if (!mpState) return;
  clearInterval(mpState.timer);
  const q = mpState.questions[mpState.currentQ];
  const p = mpState.players[mpState.currentPlayer];
  document.querySelectorAll('#mpChoiceArea .choice-btn').forEach((b, i) => {
    b.disabled = true; b.onclick = null;
    if (i === q.a) b.classList.add('correct');
    else if (i === idx) b.classList.add('wrong');
  });
  if (idx === q.a) { p.score += (10 + mpState.timeLeft); p.correct++; sounds.win(); }
  else sounds.fail();
  document.getElementById('mpCurScore').textContent = '🌟 ' + p.score;
  setTimeout(() => {
    mpState.currentPlayer = (mpState.currentPlayer + 1) % mpState.players.length;
    if (mpState.currentPlayer === 0) mpState.currentQ++;
    if (mpState.currentQ >= mpState.questions.length) { endMultiplayer(); return; }
    renderMpScoreCards(); loadMpQuestion();
  }, 1400);
}

function endMultiplayer() {
  clearInterval(mpState?.timer);
  const sorted = [...mpState.players].sort((a, b) => b.score - a.score);
  const medals = ['🥇', '🥈', '🥉'];
  document.getElementById('mpFinalScores').innerHTML = sorted.map((p, i) => `
    <div class="lb-row" style="background:${i === 0 ? '#fef3c7' : 'white'};border-color:${i === 0 ? 'var(--warn)' : 'var(--border)'}">
      <div class="lb-rank">${medals[i] || i + 1}</div>
      <div class="lb-name">${esc(p.name)}<div class="lb-sub">${p.correct} doğru</div></div>
      <div class="lb-score">${p.score} P</div>
    </div>`).join('');
  showSection('mpResultSection');
}

// ==================== GÜNÜN SORUSU ====================
function renderDailyQuestion() {
  const el = document.getElementById('dailyQZone'); if (!el) return;
  const s = getStore(); if (!s.questions.length) { el.innerHTML = ''; return; }
  const d = new Date();
  const dayKey = d.getFullYear() * 10000 + ((d.getMonth() + 1) * 100) + d.getDate();
  const idx = dayKey % s.questions.length;
  const q = s.questions[idx];
  const doneKey = 'dq_' + dayKey;
  const done = LS.get(doneKey);
  if (done) {
    el.innerHTML = `<div class="dq-card" style="cursor:default;opacity:.72">
      <div class="dq-title">📅 Günün Sorusu — Bugün tamamladın! ✅</div>
      <div class="dq-q">${esc(q.q)}</div></div>`;
    return;
  }
  el.innerHTML = `<div class="dq-card" onclick="startDailyQ(${idx})">
    <div class="dq-title">📅 Günün Sorusu — Tıkla, cevapla!</div>
    <div class="dq-q">${esc(q.q)}</div>
    <div class="dq-bonus">🎁 Doğru cevapla +25 bonus puan!</div>
  </div>`;
}

function startDailyQ(idx) {
  const s = getStore(); const q = s.questions[idx];
  const d = new Date();
  const dayKey = d.getFullYear() * 10000 + ((d.getMonth() + 1) * 100) + d.getDate();
  const doneKey = 'dq_' + dayKey;
  const letters = ['A', 'B', 'C', 'D'];
  let modal = document.getElementById('dqModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'dqModal';
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:999;width:92%;max-width:560px;background:white;border-radius:24px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.4);max-height:90vh;overflow-y:auto';
    const overlay = document.createElement('div');
    overlay.id = 'dqOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:998';
    overlay.onclick = () => { modal.remove(); overlay.remove(); renderDailyQuestion(); };
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div style="font-weight:900;font-size:1.1em;color:#7c3aed;margin-bottom:12px">📅 Günün Sorusu</div>
    <div style="font-weight:700;font-size:1.05em;margin-bottom:14px;line-height:1.5">${esc(q.q)}</div>
    ${q.o.map((opt, i) => `<button class="choice-btn" id="dqBtn${i}" onclick="checkDQ(${i},${idx},'${doneKey}')"><span class="choice-letter">${letters[i]}</span>${esc(opt)}</button>`).join('')}
    <div id="dqMsg" style="margin-top:8px;font-weight:800;min-height:22px"></div>
    <button class="btn btn-gray btn-sm" style="margin-top:10px" onclick="document.getElementById('dqModal').remove();document.getElementById('dqOverlay')?.remove();renderDailyQuestion()">Kapat</button>`;
}

function checkDQ(sel, idx, doneKey) {
  const s = getStore(); const q = s.questions[idx];
  [0, 1, 2, 3].forEach(i => {
    const b = document.getElementById('dqBtn' + i); if (!b) return;
    b.disabled = true; b.onclick = null;
    if (i === q.a) b.classList.add('correct');
    else if (i === sel) b.classList.add('wrong');
  });
  LS.set(doneKey, true);
  const msgEl = document.getElementById('dqMsg');
  if (sel === q.a) {
    sounds.win();
    if (msgEl) msgEl.innerHTML = '<span style="color:var(--ok)">🎉 Doğru! +25 puan!</span>';
    if (currentUser) {
      const s2 = getStore(); const u = s2.users.find(x => x.id === currentUser.id);
      if (u) { u.s += 25; setStore(s2); currentUser = u; saveSession(u.id); }
    }
  } else {
    sounds.fail();
    if (msgEl) msgEl.innerHTML = '<span style="color:var(--danger)">❌ Yanlış! Yarın tekrar dene.</span>';
  }
}