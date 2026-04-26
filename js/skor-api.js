// ==================== AILECE BİL! - SKOR-API.JS ====================
// Google Sheets entegrasyonu — tüm online işlemler burada

const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwA8RKrdrY3zWUHUxgVTm2F1O-d7fF1Sp7m2-XzfoJEfeCIJqu07LrOXuW2j9grT239/exec';

// ==================== TEMEL İSTEK FONKSİYONU ====================
async function sheetsRequest(data) {
  try {
    const res = await fetch(SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors', // CORS bypass için
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    // no-cors modunda response body okunamaz ama istek gider
    return { ok: true };
  } catch (err) {
    console.warn('Sheets isteği başarısız:', err.message);
    return { ok: false, error: err.message };
  }
}

// no-cors olmadan veri almak için (GET istekleri)
async function sheetsGet(action, params = {}) {
  try {
    const url = new URL(SHEETS_URL);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('Sheets GET hatası:', err.message);
    return { ok: false, error: err.message };
  }
}

// ==================== SKOR KAYDET ====================
// Quiz bitince otomatik çağrılır
async function saveScoreToSheets(user, score, correct, wrong, cat) {
  if (!user) return;
  const result = await sheetsRequest({
    action: 'saveScore',
    user: user.u,
    score, correct, wrong, cat,
    ts: new Date().toISOString()
  });
  if (result.ok) {
    console.log('✅ Skor Sheets\'e kaydedildi');
  }
}

// ==================== MESAJ GÖNDER (Oyuncu → Admin) ====================
async function sendMessageToSheets(from, text) {
  return await sheetsRequest({
    action: 'sendMessage',
    from, to: 'admin', text,
    ts: new Date().toISOString()
  });
}

// ==================== GLOBAL SKORLARI ÇEK ====================
// liderlik.html'de kullanılır
async function getGlobalScores() {
  try {
    const data = await sheetsGet('getScores');
    if (!data.ok || !data.data) return [];
    // Kullanıcı başına en yüksek skoru al
    const best = {};
    data.data.forEach(row => {
      if (!best[row.user] || row.score > best[row.user].score) {
        best[row.user] = row;
      }
    });
    return Object.values(best).sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

// ==================== SORULARI SHEETS'TEN ÇEK ====================
// Admin Sorular sekmesine soru girerse herkes görür
async function fetchQuestionsFromSheets() {
  try {
    const data = await sheetsGet('getQuestions');
    if (!data.ok || !data.data || !data.data.length) return null;
    return data.data;
  } catch {
    return null;
  }
}

// ==================== MESAJLARI ÇEK ====================
async function fetchMessagesFromSheets(username) {
  try {
    const data = await sheetsGet('getMessages', { user: username });
    if (!data.ok || !data.data) return [];
    return data.data;
  } catch {
    return [];
  }
}

// ==================== SHEETS'TEN SORULARI YÜKLE VE MERGE ET ====================
// Sayfa açılınca çağrılır — Sheets'teki sorular varsa yerel sorularla birleştirir
async function loadAndMergeSheetQuestions() {
  const sheetQuestions = await fetchQuestionsFromSheets();
  if (!sheetQuestions || !sheetQuestions.length) {
    console.log('📋 Sheets\'te soru bulunamadı, yerel sorular kullanılıyor.');
    return;
  }

  const s = getStore();
  const existingIds = new Set(s.questions.map(q => String(q.id)));
  let added = 0;

  sheetQuestions.forEach(q => {
    if (!q.q || !q.o || q.o.length !== 4) return;
    const key = String(q.id || q.q.trim().toLowerCase());
    if (!existingIds.has(key)) {
      s.questions.push({
        id: q.id || nextId(),
        q: q.q, o: q.o,
        a: parseInt(q.a), c: q.c || 'Genel Kültür'
      });
      added++;
    }
  });

  if (added > 0) {
    dedupQuestions();
    setStore(s);
    console.log(`✅ Sheets'ten ${added} yeni soru yüklendi!`);
  }
}

// ==================== GLOBAL LİDERLİK TABLOSU ====================
async function renderGlobalLeaderboard(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;font-weight:700">⏳ Online skorlar yükleniyor...</div>';

  const scores = await getGlobalScores();

  if (!scores.length) {
    el.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;font-weight:700">Henüz online skor yok</div>';
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  el.innerHTML = scores.slice(0, 20).map((row, i) => `
    <div style="display:flex;align-items:center;gap:10px;padding:11px 14px;
      background:${i === 0 ? '#fef3c7' : 'white'};
      border:1.5px solid ${i === 0 ? '#f59e0b' : '#e2e8f0'};
      border-radius:14px;margin-bottom:7px">
      <div style="font-size:1.2em;font-weight:900;min-width:34px;text-align:center">${medals[i] || i + 1}</div>
      <div style="width:34px;height:34px;border-radius:50%;
        background:linear-gradient(135deg,#f97316,#ea580c);
        color:white;display:flex;align-items:center;justify-content:center;
        font-weight:900;flex-shrink:0">${(row.user || '?')[0].toUpperCase()}</div>
      <div style="flex:1">
        <div style="font-weight:800;font-size:.92em">${esc(row.user || 'Anonim')}</div>
        <div style="font-size:.72em;color:#94a3b8">${row.cat || ''} · ${row.correct || 0} doğru</div>
      </div>
      <div style="font-weight:900;color:#f97316;font-size:1.05em">${row.score} P</div>
    </div>`).join('');
}

// ==================== BAĞLANTI TESTİ ====================
async function testSheetsConnection() {
  try {
    const result = await sheetsRequest({ action: 'test', ts: new Date().toISOString() });
    return result.ok;
  } catch {
    return false;
  }
}