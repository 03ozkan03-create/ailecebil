// ==================== AILECE BİL! - STORE.JS (GÜVENLİ GÜNCELLEME) ====================
const STORE_KEY = 'ailecebil_v1';
const SESSION_KEY = 'ailecebil_v1_session';
const SHEETS_KEY = 'ailecebil_sheets_url';

// ==================== GOOGLE SHEETS URL ====================
// skor-api.js içinde tanımlı — burada sadece referans
// Değiştirmek için: Admin → Ayarlar → Google Sheets


// 🔥 ÖNEMLİ: Soruları güncellediğinde bu sayıyı artır (Örn: 2 -> 3)
const QUESTIONS_VERSION = 2; 

// ==================== LOCALSTORAGE YARDIMCI ====================
const LS = {
  get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};

// ==================== VARSAYILAN VERİ ====================
function buildDefaultStore() {
  return {
    version: QUESTIONS_VERSION, // Mevcut versiyonu kaydet
    users: [{
      id: 'admin', u: 'admin', p: 'admin1234', s: 0, pl: 0, c: 0, w: 0,
      adm: true, b: false, m: [], badges: [], perf: {},
      perfectCount: 0, streak: 0, lastDay: '', lastPlay: 0,
      weekScore: 0, dayScore: 0
    }],
    questions: getDefaultQuestions(),
    adultCats: [
      { name: 'Genel Kültür', icon: '💡' },
      { name: 'Tarih', icon: '🏛️' },
      { name: 'Bilim', icon: '🔬' },
      { name: 'Coğrafya', icon: '🗺️' },
      { name: 'Spor', icon: '⚽' },
      { name: 'Teknoloji', icon: '💻' }
    ],
    grades: [
      { name: '1. Sınıf', icon: '🌱', subjects: [{ name: 'Türkçe', icon: '📖' }, { name: 'Matematik', icon: '🔢' }, { name: 'Hayat Bilgisi', icon: '🌍' }] },
      { name: '2. Sınıf', icon: '📗', subjects: [{ name: 'Türkçe', icon: '📖' }, { name: 'Matematik', icon: '🔢' }, { name: 'Hayat Bilgisi', icon: '🌍' }] },
      { name: '3. Sınıf', icon: '📘', subjects: [{ name: 'Türkçe', icon: '📖' }, { name: 'Matematik', icon: '🔢' }, { name: 'Fen Bilimleri', icon: '🔬' }, { name: 'Sosyal Bilgiler', icon: '🗺️' }] },
      { name: '4. Sınıf', icon: '📙', subjects: [{ name: 'Türkçe', icon: '📖' }, { name: 'Matematik', icon: '🔢' }, { name: 'Fen Bilimleri', icon: '🔬' }, { name: 'Sosyal Bilgiler', icon: '🗺️' }] },
      { name: '5. Sınıf', icon: '📕', subjects: [{ name: 'Türkçe', icon: '📖' }, { name: 'Matematik', icon: '🔢' }, { name: 'Fen Bilimleri', icon: '🔬' }, { name: 'Sosyal Bilgiler', icon: '🗺️' }, { name: 'İngilizce', icon: '🇬🇧' }] },
      { name: '6. Sınıf', icon: '🎯', subjects: [{ name: 'Türkçe', icon: '📖' }, { name: 'Matematik', icon: '🔢' }, { name: 'Fen Bilimleri', icon: '🔬' }, { name: 'İngilizce', icon: '🇬🇧' }] },
      { name: '7. Sınıf', icon: '🚀', subjects: [{ name: 'Türkçe', icon: '📖' }, { name: 'Matematik', icon: '🔢' }, { name: 'Fen Bilimleri', icon: '🔬' }, { name: 'İngilizce', icon: '🇬🇧' }] },
      { name: '8. Sınıf', icon: '🎓', subjects: [{ name: 'Türkçe', icon: '📖' }, { name: 'Matematik', icon: '🔢' }, { name: 'Fen Bilimleri', icon: '🔬' }, { name: 'İngilizce', icon: '🇬🇧' }] }
    ],
    announcement: { title: '', text: '', active: false },
    broadcasts: [],
    nextId: 5000
  };
}

// ==================== STORE CRUD & GÜNCELLEME MANTIĞI ====================
function getStore() {
  return LS.get(STORE_KEY) || buildDefaultStore();
}

function setStore(s) {
  LS.set(STORE_KEY, s);
}

function initStore() {
  let currentData = LS.get(STORE_KEY);

  // 1. Durum: Hiç veri yoksa (İlk kez giriş)
  if (!currentData) {
    console.log("🆕 İlk kurulum yapılıyor...");
    setStore(buildDefaultStore());
    return;
  }

  // 2. Durum: Veri var ama versiyon eskiyse (Soruları Güncelle)
  if (currentData.version !== QUESTIONS_VERSION) {
    console.log(`🔄 Versiyon güncellemesi tespit edildi (${currentData.version} -> ${QUESTIONS_VERSION}). Sorular yenileniyor...`);
    
    // Eski verideki kullanıcıları ve ayarları koru, sadece soruları değiştir
    const newDefaults = buildDefaultStore();
    
    // Kullanıcıları eski veriden al (Skorlar kaybolmasın diye)
    // Not: Eğer admin şifresi değiştiyse burayı düzenleyebilirsin ama genelde users array'i korunur.
    currentData.questions = newDefaults.questions;
    currentData.adultCats = newDefaults.adultCats;
    currentData.grades = newDefaults.grades;
    currentData.version = QUESTIONS_VERSION; // Versiyonu güncelle
    
    setStore(currentData);
    console.log("✅ Sorular başarıyla güncellendi! Skorlar korundu.");
  } else {
    // 3. Durum: Versiyon aynıysa sadece tekrarları temizle
    dedupQuestions();
  }

  // Sheets'ten soruları arka planda yükle (skor-api.js yüklüyse)
  if (typeof loadAndMergeSheetQuestions === 'function') {
    loadAndMergeSheetQuestions().catch(() => {});
  }
}

// ==================== MÜKERRER SORU TEMİZLE ====================
function dedupQuestions() {
  const s = getStore();
  const seen = new Set();
  const before = s.questions.length;
  s.questions = s.questions.filter(q => {
    const k = q.q.trim().toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
  if (s.questions.length < before) {
    setStore(s);
    console.log(`🧹 ${before - s.questions.length} mükerrer soru silindi.`);
  }
}

// ==================== SESSION ====================
function getSession() {
  const sid = LS.get(SESSION_KEY);
  if (!sid) return null;
  const s = getStore();
  const u = s.users.find(u => u.id === sid);
  return (u && !u.b) ? u : null;
}
function saveSession(userId) { LS.set(SESSION_KEY, userId); }
function clearSession() { LS.del(SESSION_KEY); }

// ==================== KULLANICI ====================
function saveUser(user) {
  const s = getStore();
  const idx = s.users.findIndex(u => u.id === user.id);
  if (idx !== -1) s.users[idx] = user;
  setStore(s);
}

// ==================== SEVİYE ====================
const LEVELS = [
  { min: 0, name: 'Acemi', icon: '🌱' },
  { min: 50, name: 'Başlangıç', icon: '📗' },
  { min: 150, name: 'Gelişen', icon: '⭐' },
  { min: 300, name: 'Orta', icon: '🔥' },
  { min: 600, name: 'İleri', icon: '💎' },
  { min: 1000, name: 'Usta', icon: '🏆' },
  { min: 2000, name: 'Efsane', icon: '🦁' }
];
function getLevel(score) {
  let l = LEVELS[0];
  for (const x of LEVELS) if (score >= x.min) l = x;
  return l;
}
function getNextLevel(score) {
  for (const x of LEVELS) if (score < x.min) return x;
  return null;
}

// ==================== ROZETLER ====================
const BADGES = [
  { id: 'first', icon: '🌟', name: 'İlk Adım', check: u => u.pl >= 1 },
  { id: 'ten', icon: '🔟', name: '10 Oyun', check: u => u.pl >= 10 },
  { id: 'fifty', icon: '🎯', name: '50 Oyun', check: u => u.pl >= 50 },
  { id: 'perfect', icon: '💎', name: 'Mükemmel', check: u => (u.perfectCount || 0) > 0 },
  { id: 'k1000', icon: '🏆', name: '1000 Puan', check: u => u.s >= 1000 },
  { id: 'streak3', icon: '🔥', name: '3 Gün Üst Üste', check: u => (u.streak || 0) >= 3 },
  { id: 'c50', icon: '✅', name: '50 Doğru', check: u => u.c >= 50 },
  { id: 'c500', icon: '🧠', name: '500 Doğru', check: u => u.c >= 500 }
];

function checkAndGrantBadges(user) {
  if (!user) return;
  const s = getStore();
  const u = s.users.find(x => x.id === user.id);
  if (!u) return;
  if (!u.badges) u.badges = [];
  let newBadge = null;
  BADGES.forEach(b => {
    if (!u.badges.includes(b.id) && b.check(u)) {
      u.badges.push(b.id);
      if (!newBadge) newBadge = b;
    }
  });
  setStore(s);
  if (newBadge) showBadgeToast(newBadge);
  return u;
}

function showBadgeToast(badge) {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#f59e0b,#d97706);color:white;padding:14px 22px;border-radius:16px;font-weight:900;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.3);font-family:Nunito,sans-serif';
  div.textContent = badge.icon + ' Yeni Rozet: ' + badge.name + '!';
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// ==================== GOOGLE SHEETS ====================
let SHEETS_URL = LS.get(SHEETS_KEY) || '';
function sendToSheets(data) {
  if (!SHEETS_URL) return;
  fetch(SHEETS_URL, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).catch(() => {});
}

// ==================== YARDIMCI ====================
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function showMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'info-msg ' + type;
  setTimeout(() => { if (el.className.includes(type)) el.className = 'info-msg'; }, 5000);
}
function fmtDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }) + ' ' +
    d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}
function nextId() {
  const s = getStore();
  if (!s.nextId || typeof s.nextId !== 'number') s.nextId = 5000;
  s.nextId++;
  setStore(s);
  return s.nextId;
}

// ==================== VARSAYILAN SORULAR (317 SORU) ====================
function getDefaultQuestions() {
  return [
    // BÜYÜKLER
    {id:1,q:"Türkiye'nin başkenti neresidir?",o:["İstanbul","Ankara","İzmir","Bursa"],a:1,c:"Genel Kültür"},
    {id:2,q:"Dünyanın en büyük okyanusu hangisidir?",o:["Atlantik","Hint","Arktik","Pasifik"],a:3,c:"Genel Kültür"},
    {id:3,q:"Hangi gezegen Güneş Sistemi'nin en büyüğüdür?",o:["Satürn","Jüpiter","Neptün","Uranüs"],a:1,c:"Bilim"},
    {id:4,q:"İstanbul hangi yılda fethedildi?",o:["1389","1402","1453","1492"],a:2,c:"Tarih"},
    {id:5,q:"Osmanlı İmparatorluğu'nun kurucusu kimdir?",o:["Orhan Gazi","Osman Gazi","Murat I","Yıldırım Bayezid"],a:1,c:"Tarih"},
    {id:6,q:"Dünyanın en büyük kıtası hangisidir?",o:["Afrika","Amerika","Asya","Avustralya"],a:2,c:"Coğrafya"},
    {id:7,q:"Türkiye'nin en uzun nehri hangisidir?",o:["Dicle","Fırat","Kızılırmak","Sakarya"],a:2,c:"Coğrafya"},
    {id:8,q:"Futbolda bir takımda sahada kaç oyuncu olur?",o:["9","10","11","12"],a:2,c:"Spor"},
    {id:9,q:"Hangi ülke 2022 FIFA Dünya Kupası'nı kazandı?",o:["Fransa","Brezilya","Arjantin","Hırvatistan"],a:2,c:"Spor"},
    {id:10,q:"WWW'nin açılımı nedir?",o:["Wide World Web","World Wide Web","World Web Wide","Web Wide World"],a:1,c:"Teknoloji"},
    {id:11,q:"Türkiye Cumhuriyeti hangi yılda kuruldu?",o:["1919","1920","1923","1925"],a:2,c:"Tarih"},
    {id:12,q:"Suyun kimyasal formülü nedir?",o:["CO2","H2O2","H2O","O2"],a:2,c:"Bilim"},
    {id:13,q:"Işığın boşluktaki hızı yaklaşık ne kadardır?",o:["200.000 km/s","250.000 km/s","300.000 km/s","350.000 km/s"],a:2,c:"Bilim"},
    {id:14,q:"Nil Nehri hangi ülkede denize dökülür?",o:["Sudan","Etiyopya","Mısır","Libya"],a:2,c:"Coğrafya"},
    {id:15,q:"Japonya'nın başkenti neresidir?",o:["Osaka","Kyoto","Tokyo","Hiroshima"],a:2,c:"Coğrafya"},
    // ÇOCUKLAR
    {id:101,q:"A, E, I, O, U hangi harf türüdür?",o:["Ünsüz","Sessiz","Sesli","Yarı sesli"],a:2,c:"1. Sınıf|Türkçe"},
    {id:102,q:"'Anne' kelimesinde kaç hece var?",o:["1","2","3","4"],a:1,c:"1. Sınıf|Türkçe"},
    {id:103,q:"3 + 4 = ?",o:["5","6","7","8"],a:2,c:"1. Sınıf|Matematik"},
    {id:104,q:"10 - 6 = ?",o:["3","4","5","6"],a:1,c:"1. Sınıf|Matematik"},
    {id:105,q:"Bitkiler büyümek için neye ihtiyaç duyar?",o:["Sadece su","Sadece güneş","Su, toprak, güneş","Sadece toprak"],a:2,c:"1. Sınıf|Hayat Bilgisi"},
    {id:106,q:"Trafik ışığında geçiş rengi hangisidir?",o:["Kırmızı","Sarı","Yeşil","Mavi"],a:2,c:"1. Sınıf|Hayat Bilgisi"},
    {id:107,q:"25 + 17 = ?",o:["40","41","42","43"],a:2,c:"2. Sınıf|Matematik"},
    {id:108,q:"3 x 7 = ?",o:["18","19","20","21"],a:3,c:"2. Sınıf|Matematik"},
    {id:109,q:"'Hızlı' kelimesinin zıt anlamlısı nedir?",o:["Çabuk","Yavaş","Koşan","Giden"],a:1,c:"2. Sınıf|Türkçe"},
    {id:110,q:"150 + 75 = ?",o:["215","220","225","230"],a:2,c:"3. Sınıf|Matematik"},
    {id:111,q:"9 x 8 = ?",o:["63","72","81","90"],a:1,c:"3. Sınıf|Matematik"},
    {id:112,q:"Fotosentez nerede gerçekleşir?",o:["Kök","Gövde","Yaprak","Çiçek"],a:2,c:"3. Sınıf|Fen Bilimleri"},
    {id:113,q:"500 x 6 = ?",o:["2800","3000","3200","3400"],a:1,c:"4. Sınıf|Matematik"},
    {id:114,q:"Türkiye'nin başkenti neresidir?",o:["İstanbul","Ankara","İzmir","Bursa"],a:1,c:"4. Sınıf|Sosyal Bilgiler"},
    {id:115,q:"Bir üçgenin iç açıları toplamı kaçtır?",o:["90°","120°","180°","360°"],a:2,c:"5. Sınıf|Matematik"},
    {id:116,q:"'Kitap' İngilizce'de nasıl söylenir?",o:["Pen","Desk","Book","Chair"],a:2,c:"5. Sınıf|İngilizce"},
    {id:117,q:"I ___ a student. Boşluğa ne gelir?",o:["am","is","are","be"],a:0,c:"5. Sınıf|İngilizce"},
    // YENİ EKLENEN 100 SORU (ID: 118-217)
    {id:118,q:"Hangi elementin sembolü 'Au' dur?",o:["Gümüş","Altın","Alüminyum","Argon"],a:1,c:"Bilim"},
    {id:119,q:"Mona Lisa tablosu hangi müzede sergilenir?",o:["British Museum","Louvre Müzesi","Uffizi Galerisi","Prado Müzesi"],a:1,c:"Genel Kültür"},
    {id:120,q:"Türkiye'nin yüzölçümü en büyük ili hangisidir?",o:["Ankara","İstanbul","Konya","Sivas"],a:2,c:"Coğrafya"},
    {id:121,q:"İstiklal Marşı'nın şairi kimdir?",o:["Namık Kemal","Ziya Gökalp","Mehmet Akif Ersoy","Tevfik Fikret"],a:2,c:"Tarih"},
    {id:122,q:"Dünyanın en derin noktası neresidir?",o:["Mariana Çukuru","Java Çukuru","Puerto Rico Çukuru","Tonga Çukuru"],a:0,c:"Coğrafya"},
    {id:123,q:"Hangi vitamin güneş ışığıyla vücutta sentezlenir?",o:["C Vitamini","D Vitamini","A Vitamini","B12 Vitamini"],a:1,c:"Bilim"},
    {id:124,q:"Osmanlı Devleti'nde ilk anayasa (Kanun-i Esasi) kaç yılında ilan edilmiştir?",o:["1876","1908","1920","1924"],a:0,c:"Tarih"},
    {id:125,q:"Bir futbol maçında normal süre kaç dakikadır?",o:["45","60","90","120"],a:2,c:"Spor"},
    {id:126,q:"Hangi gezegenin halkaları en belirgindir?",o:["Jüpiter","Satürn","Uranüs","Neptün"],a:1,c:"Bilim"},
    {id:127,q:"Türkiye'nin komşusu olmayan ülke hangisidir?",o:["Yunanistan","Bulgaristan","Romanya","Irak"],a:2,c:"Coğrafya"},
    {id:128,q:"Elektriği bulan bilim insanı olarak bilinen kimdir?",o:["Newton","Einstein","Benjamin Franklin","Tesla"],a:2,c:"Bilim"},
    {id:129,q:"Malazgirt Meydan Muharebesi hangi yılda yapılmıştır?",o:["1071","1299","1402","1453"],a:0,c:"Tarih"},
    {id:130,q:"Dünyanın en küçük kıtası hangisidir?",o:["Avrupa","Antarktika","Avustralya","Güney Amerika"],a:2,c:"Coğrafya"},
    {id:131,q:"Hangi hayvan memeli değildir?",o:["Yarasa","Balina","Penguen","Yunus"],a:2,c:"Bilim"},
    {id:132,q:"Türkiye Büyük Millet Meclisi (TBMM) ne zaman açılmıştır?",o:["23 Nisan 1920","29 Ekim 1923","19 Mayıs 1919","30 Ağustos 1922"],a:0,c:"Tarih"},
    {id:133,q:"Periyodik tabloda 'O' simgesi hangi elementi temsil eder?",o:["Osmiyum","Oksijen","Opak","Odun"],a:1,c:"Bilim"},
    {id:134,q:"Amazon Nehri hangi kıtadadır?",o:["Afrika","Asya","Güney Amerika","Kuzey Amerika"],a:2,c:"Coğrafya"},
    {id:135,q:"Basketbolda bir takım sahada kaç oyuncuyla oynar?",o:["5","6","7","11"],a:0,c:"Spor"},
    {id:136,q:"Hangi ülke 'Güneşin Doğduğu Ülke' olarak bilinir?",o:["Çin","Hindistan","Japonya","Kore"],a:2,c:"Coğrafya"},
    {id:137,q:"Suyun donma noktası kaç derecedir?",o:["0°C","100°C","-10°C","32°C"],a:0,c:"Bilim"},
    {id:138,q:"Fatih Sultan Mehmet'in hocası kimdir?",o:["Akşemseddin","Molla Gürani","Ebussuud Efendi","Şeyh Edebali"],a:0,c:"Tarih"},
    {id:139,q:"Dünyanın en kalabalık ülkesi hangisidir? (2023 itibariyle)",o:["Hindistan","Çin","ABD","Endonezya"],a:0,c:"Coğrafya"},
    {id:140,q:"Hangi organ kanı pompalar?",o:["Akciğer","Karaciğer","Kalp","Böbrek"],a:2,c:"Bilim"},
    {id:141,q:"Kurtuluş Savaşı'nın başlangıcı kabul edilen tarih nedir?",o:["19 Mayıs 1919","23 Nisan 1920","29 Ekim 1923","30 Ağustos 1922"],a:0,c:"Tarih"},
    {id:142,q:"Everest Dağı hangi iki ülke sınırındadır?",o:["Çin-Hindistan","Nepal-Çin","Pakistan-Hindistan","Nepal-Hindistan"],a:1,c:"Coğrafya"},
    {id:143,q:"Hangi gaz yanıcıdır?",o:["Oksijen","Azot","Hidrojen","Helyum"],a:2,c:"Bilim"},
    {id:144,q:"Osmanlı'nın son padişahı kimdir?",o:["II. Abdülhamid","V. Mehmet Reşad","VI. Mehmet Vahdettin","Abdülmecid"],a:2,c:"Tarih"},
    {id:145,q:"Dünyanın uydusu hangisidir?",o:["Güneş","Mars","Ay","Venüs"],a:2,c:"Bilim"},
    {id:146,q:"Hangi renk trafik lambasında 'Dur' anlamına gelir?",o:["Yeşil","Sarı","Kırmızı","Mavi"],a:2,c:"Genel Kültür"},
    {id:147,q:"Türkiye'nin en yüksek dağı hangisidir?",o:["Erciyes","Uludağ","Ağrı Dağı","Kaçkarlar"],a:2,c:"Coğrafya"},
    {id:148,q:"Bir yıl kaç haftadır?",o:["48","50","52","54"],a:2,c:"Genel Kültür"},
    {id:149,q:"Hangi element sıvı haldedir (oda sıcaklığında)?",o:["Demir","Cıva","Kurşun","Bakır"],a:1,c:"Bilim"},
    {id:150,q:"Çanakkale Zaferi hangi yılda kazanılmıştır?",o:["1915","1918","1920","1922"],a:0,c:"Tarih"},
    {id:151,q:"Dünyanın en büyük çölü hangisidir?",o:["Sahra","Gobi","Kalahari","Antarktika Çölü"],a:3,c:"Coğrafya"},
    {id:152,q:"Hangi hayvan en hızlı koşan kara hayvanıdır?",o:["Aslan","Çita","At","Gazelle"],a:1,c:"Bilim"},
    {id:153,q:"Lozan Antlaşması hangi yılda imzalanmıştır?",o:["1920","1923","1924","1938"],a:1,c:"Tarih"},
    {id:154,q:"Hangi gezegen 'Kızıl Gezegen' olarak bilinir?",o:["Venüs","Mars","Jüpiter","Satürn"],a:1,c:"Bilim"},
    {id:155,q:"Türkiye'nin plaka kodu 34 olan ili hangisidir?",o:["Ankara","İzmir","İstanbul","Bursa"],a:2,c:"Coğrafya"},
    {id:156,q:"Hangi spor dalında file kullanılır?",o:["Futbol","Basketbol","Voleybol","Tenis"],a:2,c:"Spor"},
    {id:157,q:"DNA'nın açılımı nedir?",o:["Deoksiribo Nükleik Asit","Dinamik Nükleer Alan","Doğal Nitelik Analizi","Diğerleri"],a:0,c:"Bilim"},
    {id:158,q:"Anıtkabir hangi şehrimizdedir?",o:["İstanbul","Ankara","İzmir","Samsun"],a:1,c:"Tarih"},
    {id:159,q:"Dünyanın en uzun nehri hangisidir?",o:["Amazon","Nil","Mississippi","Yangtze"],a:1,c:"Coğrafya"},
    {id:160,q:"Hangi meyve C vitamini açısından zengindir?",o:["Muz","Portakal","Elma","Armut"],a:1,c:"Bilim"},
    {id:161,q:"Cumhuriyetin ilanı hangi tarihte gerçekleşmiştir?",o:["23 Nisan 1920","29 Ekim 1923","19 Mayıs 1919","30 Ağustos 1922"],a:1,c:"Tarih"},
    {id:162,q:"Hangi ülke Avrupa kıtasında değildir?",o:["Fransa","Almanya","Mısır","İtalya"],a:2,c:"Coğrafya"},
    {id:163,q:"Atomun merkezinde ne bulunur?",o:["Elektron","Proton ve Nötron","Sadece Proton","Sadece Nötron"],a:1,c:"Bilim"},
    {id:164,q:"Topkapı Sarayı hangi padişah döneminde yapılmaya başlanmıştır?",o:["Fatih Sultan Mehmet","Kanuni Sultan Süleyman","Yıldırım Bayezid","II. Abdülhamid"],a:0,c:"Tarih"},
    {id:165,q:"Dünyanın en soğuk kıtası hangisidir?",o:["Kuzey Amerika","Avrupa","Antarktika","Asya"],a:2,c:"Coğrafya"},
    {id:166,q:"Hangi kuş uçamaz?",o:["Serçe","Kartal","Penguen","Martı"],a:2,c:"Bilim"},
    {id:167,q:"Türkiye'nin para birimi nedir?",o:["Euro","Dolar","Türk Lirası","Sterlin"],a:2,c:"Genel Kültür"},
    // --- ÇOCUKLAR (1-4. Sınıf Seviyesi) ---
    {id:168,q:"5 + 5 kaç eder?",o:["8","9","10","11"],a:2,c:"1. Sınıf|Matematik"},
    {id:169,q:"'Kedi' kelimesinin çoğulu nedir?",o:["Kediler","Kedeler","Kedilar","Kedeler"],a:0,c:"1. Sınıf|Türkçe"},
    {id:170,q:"Hangi mevsimde kar yağar?",o:["Yaz","Sonbahar","Kış","İlkbahar"],a:2,c:"1. Sınıf|Hayat Bilgisi"},
    {id:171,q:"10 - 3 kaç eder?",o:["6","7","8","9"],a:1,c:"1. Sınıf|Matematik"},
    {id:172,q:"'Okul' kelimesinde kaç harf var?",o:["3","4","5","6"],a:1,c:"1. Sınıf|Türkçe"},
    {id:173,q:"Trafikte yaya geçidi rengi nedir?",o:["Kırmızı","Sarı","Beyaz-Siyah","Mavi"],a:2,c:"1. Sınıf|Hayat Bilgisi"},
    {id:174,q:"2 x 3 kaç eder?",o:["5","6","7","8"],a:1,c:"2. Sınıf|Matematik"},
    {id:175,q:"'Güzel' kelimesinin zıt anlamlısı nedir?",o:["İyi","Çirkin","Büyük","Küçük"],a:1,c:"2. Sınıf|Türkçe"},
    {id:176,q:"Bir hafta kaç gündür?",o:["5","6","7","8"],a:2,c:"2. Sınıf|Hayat Bilgisi"},
    {id:177,q:"4 x 4 kaç eder?",o:["12","14","16","18"],a:2,c:"2. Sınıf|Matematik"},
    {id:178,q:"'Dağ' kelimesinin eş anlamlısı nedir?",o:["Tepe","Ova","Vadi","Deniz"],a:0,c:"2. Sınıf|Türkçe"},
    {id:179,q:"Sağlıklı olmak için ne yapmalıyız?",o:["Çok şeker yemek","Spor yapmak","Geç yatmak","Hamburger yemek"],a:1,c:"2. Sınıf|Hayat Bilgisi"},
    {id:180,q:"15 + 15 kaç eder?",o:["20","25","30","35"],a:2,c:"3. Sınıf|Matematik"},
    {id:181,q:"'Kitap' kelimesinin çoğulu nedir?",o:["Kitaplar","Kitapler","Kitaplar","Kitaplar"],a:0,c:"3. Sınıf|Türkçe"},
    {id:182,q:"Bitkilerin yeşil olmasını sağlayan madde nedir?",o:["Su","Toprak","Klorofil","Güneş"],a:2,c:"3. Sınıf|Fen Bilimleri"},
    {id:183,q:"6 x 7 kaç eder?",o:["40","42","44","46"],a:1,c:"3. Sınıf|Matematik"},
    {id:184,q:"'Hızlı' kelimesinin eş anlamlısı nedir?",o:["Yavaş","Çabuk","Ağır","Durak"],a:1,c:"3. Sınıf|Türkçe"},
    {id:185,q:"Dünya'nın şekli nasıldır?",o:["Kare","Dikdörtgen","Yuvarlak (Küre)","Üçgen"],a:2,c:"3. Sınıf|Fen Bilimleri"},
    {id:186,q:"20 x 5 kaç eder?",o:["50","100","150","200"],a:1,c:"4. Sınıf|Matematik"},
    {id:187,q:"'Öğretmen' kelimesindeki ünlü harfler hangileridir?",o:["Ö, e, e","Ğ, t, m","R, n","Ö, ğ, r"],a:0,c:"4. Sınıf|Türkçe"},
    {id:188,q:"Hangi organ nefes almamızı sağlar?",o:["Kalp","Mide","Akciğer","Karaciğer"],a:2,c:"4. Sınıf|Fen Bilimleri"},
    {id:189,q:"100 / 4 kaç eder?",o:["20","25","30","40"],a:1,c:"4. Sınıf|Matematik"},
    {id:190,q:"'Sevgi' kelimesinin zıt anlamlısı nedir?",o:["Mutluluk","Nefret","Saygı","Dostluk"],a:1,c:"4. Sınıf|Türkçe"},
    {id:191,q:"Güneş sistemindeki gezegen sayısı kaçtır?",o:["7","8","9","10"],a:1,c:"4. Sınıf|Fen Bilimleri"},
    {id:192,q:"30 + 40 + 10 kaç eder?",o:["70","80","90","100"],a:1,c:"4. Sınıf|Matematik"},
    {id:193,q:"'Masal' kelimesindeki sessiz harfler hangileridir?",o:["M, s, l","A, a","M, a, s","S, l, a"],a:0,c:"4. Sınıf|Türkçe"},
    {id:194,q:"Hangi hayvan sürüngendir?",o:["Kedi","Yılan","Kuş","Balık"],a:1,c:"4. Sınıf|Fen Bilimleri"},
    {id:195,q:"50 x 2 kaç eder?",o:["50","100","150","200"],a:1,c:"4. Sınıf|Matematik"},
    {id:196,q:"'Gülmek' fiilinin olumsuzu nedir?",o:["Gülmemek","Gülüyor","Güldü","Gülecek"],a:0,c:"4. Sınıf|Türkçe"},
    {id:197,q:"Dünya'nın Güneş etrafında dönmesi sonucu ne oluşur?",o:["Gece-Gündüz","Mevsimler","Gel-Git","Deprem"],a:1,c:"4. Sınıf|Fen Bilimleri"},
    {id:198,q:"12 x 12 kaç eder?",o:["122","144","148","150"],a:1,c:"4. Sınıf|Matematik"},
    {id:199,q:"'Ev' kelimesinin eş seslisi (sesteşi) var mıdır?",o:["Evet","Hayır","Bazen","Belki"],a:1,c:"4. Sınıf|Türkçe"},
    {id:200,q:"Hangi duygu organımızla kokuları algılarız?",o:["Göz","Kulak","Burun","Dil"],a:2,c:"4. Sınıf|Fen Bilimleri"},
    {id:201,q:"80 - 35 kaç eder?",o:["40","45","50","55"],a:1,c:"4. Sınıf|Matematik"},
    {id:202,q:"'Çiçek' kelimesindeki hece sayısı kaçtır?",o:["1","2","3","4"],a:1,c:"4. Sınıf|Türkçe"},
    {id:203,q:"Hangi madde manyetik özellik gösterir?",o:["Tahta","Plastik","Demir","Cam"],a:2,c:"4. Sınıf|Fen Bilimleri"},
    {id:204,q:"25 x 4 kaç eder?",o:["50","75","100","125"],a:2,c:"4. Sınıf|Matematik"},
    {id:205,q:"'Koşmak' fiilinin geniş zaman hali nedir?",o:["Koştum","Koşar","Koşacak","Koşuyor"],a:1,c:"4. Sınıf|Türkçe"},
    {id:206,q:"Hangi gezegen Güneş'e en yakındır?",o:["Venüs","Merkür","Mars","Dünya"],a:1,c:"4. Sınıf|Fen Bilimleri"},
    {id:207,q:"99 + 1 kaç eder?",o:["90","100","101","110"],a:1,c:"4. Sınıf|Matematik"},
    {id:208,q:"'Renkli' kelimesindeki kök hangisidir?",o:["Renk","Renkli","Li","Ren"],a:0,c:"4. Sınıf|Türkçe"},
    {id:209,q:"Hangi canlı fotosentez yapar?",o:["İnsan","Kedi","Çam Ağacı","Köpek"],a:2,c:"4. Sınıf|Fen Bilimleri"},
    {id:210,q:"150 / 3 kaç eder?",o:["30","40","50","60"],a:2,c:"4. Sınıf|Matematik"},
    {id:211,q:"'Okulda' kelimesindeki ek hangisidir?",o:["Okul","-da","Oku","-l"],a:1,c:"4. Sınıf|Türkçe"},
    {id:212,q:"Hangi madde suda yüzer?",o:["Taş","Demir","Tahta","Cam"],a:2,c:"4. Sınıf|Fen Bilimleri"},
    {id:213,q:"7 x 8 kaç eder?",o:["54","56","58","60"],a:1,c:"4. Sınıf|Matematik"},
    {id:214,q:"'Güzelce' kelimesindeki yapım eki hangisidir?",o:["Güzel","-ce","Güz","-el"],a:1,c:"4. Sınıf|Türkçe"},
    {id:215,q:"Hangi organ kanı temizler?",o:["Kalp","Böbrek","Mide","Bağırsak"],a:1,c:"4. Sınıf|Fen Bilimleri"},
    {id:216,q:"45 + 55 kaç eder?",o:["90","100","110","120"],a:1,c:"4. Sınıf|Matematik"},
    {id:217,q:"'Yazmak' fiilinin emir kipi (sen) nedir?",o:["Yaz","Yazsın","Yazalım","Yazınız"],a:0,c:"4. Sınıf|Türkçe"},
    // YENİ EKLENEN 100 SORU (ID: 218-317)
    {id:218,q:"Hangi elementin sembolü 'Ag' dir?",o:["Altın","Gümüş","Alüminyum","Argon"],a:1,c:"Bilim"},
    {id:219,q:"Dünyanın en büyük adası hangisidir?",o:["Avustralya","Grönland","Madagaskar","Borneo"],a:1,c:"Coğrafya"},
    {id:220,q:"Türkiye'nin ilk cumhurbaşkanı kimdir?",o:["İsmet İnönü","Mustafa Kemal Atatürk","Celal Bayar","Fevzi Çakmak"],a:1,c:"Tarih"},
    {id:221,q:"Hangi gezegen Güneş'e en uzaktır?",o:["Neptün","Uranüs","Satürn","Jüpiter"],a:0,c:"Bilim"},
    {id:222,q:"Bir düzine kaç tanedir?",o:["6","10","12","24"],a:2,c:"Genel Kültür"},
    {id:223,q:"Hangi ülke 'Gül Diyarı' olarak bilinir?",o:["Fransa","Hollanda","Bulgaristan","İtalya"],a:2,c:"Coğrafya"},
    {id:224,q:"Suyun kaynama noktası kaç derecedir (deniz seviyesinde)?",o:["90°C","100°C","110°C","80°C"],a:1,c:"Bilim"},
    {id:225,q:"Osmanlı Devleti'nin başkenti son olarak neresi olmuştur?",o:["Bursa","Edirne","İstanbul","Ankara"],a:2,c:"Tarih"},
    {id:226,q:"Hangi hayvan en uzun yaşayan kara hayvanıdır?",o:["Fil","Kaplumbağa","Aslan","Zebra"],a:1,c:"Bilim"},
    {id:227,q:"Türkiye'nin plaka kodu 06 olan ili hangisidir?",o:["İstanbul","Ankara","İzmir","Adana"],a:1,c:"Coğrafya"},
    {id:228,q:"Hangi spor dalında 'set' terimi kullanılır?",o:["Futbol","Basketbol","Tenis","Voleybol"],a:2,c:"Spor"},
    {id:229,q:"Dünyanın en yüksek şelalesi hangisidir?",o:["Niagara","Angel Şelalesi","Victoria","Iguazu"],a:1,c:"Coğrafya"},
    {id:230,q:"Hangi vitamin portakalda bolca bulunur?",o:["A Vitamini","B Vitamini","C Vitamini","D Vitamini"],a:2,c:"Bilim"},
    {id:231,q:"Kurtuluş Savaşı'nın komutanı kimdir?",o:["İsmet İnönü","Mustafa Kemal Atatürk","Fevzi Çakmak","Kazım Karabekir"],a:1,c:"Tarih"},
    {id:232,q:"Hangi gezegenin uydusu yoktur?",o:["Mars","Venüs","Jüpiter","Satürn"],a:1,c:"Bilim"},
    {id:233,q:"Türkiye'nin en kalabalık ikinci şehri hangisidir?",o:["Ankara","İzmir","Bursa","Antalya"],a:1,c:"Coğrafya"},
    {id:234,q:"Hangi renk ışığı trafik lambasında 'Hazır Ol' anlamına gelir?",o:["Kırmızı","Sarı","Yeşil","Mavi"],a:1,c:"Genel Kültür"},
    {id:235,q:"Bir yıl kaç aydır?",o:["10","11","12","13"],a:2,c:"Genel Kültür"},
    {id:236,q:"Hangi element gaz halindedir (oda sıcaklığında)?",o:["Demir","Oksijen","Altın","Kurşun"],a:1,c:"Bilim"},
    {id:237,q:"Malazgirt Zaferi hangi padişah döneminde kazanılmıştır?",o:["Alp Arslan","Melikşah","Tuğrul Bey","Çağrı Bey"],a:0,c:"Tarih"},
    {id:238,q:"Dünyanın en büyük gölü hangisidir?",o:["Baykal Gölü","Hazar Denizi","Victoria Gölü","Superior Gölü"],a:1,c:"Coğrafya"},
    {id:239,q:"Hangi hayvan sürüngen değildir?",o:["Yılan","Kertenkele","Kurbağa","Timsah"],a:2,c:"Bilim"},
    {id:240,q:"Türkiye Büyük Millet Meclisi nerede açılmıştır?",o:["İstanbul","Ankara","Samsun","Erzurum"],a:1,c:"Tarih"},
    {id:241,q:"Hangi gezegen 'Mavi Gezegen' olarak da bilinir?",o:["Mars","Venüs","Dünya","Neptün"],a:2,c:"Bilim"},
    {id:242,q:"Türkiye'nin en uzun kıyı şeridine sahip ili hangisidir?",o:["Muğla","Antalya","İzmir","Balıkesir"],a:0,c:"Coğrafya"},
    {id:243,q:"Hangi spor dalında 'faul' terimi kullanılır?",o:["Tenis","Basketbol","Yüzme","Atletizm"],a:1,c:"Spor"},
    {id:244,q:"DNA hangi hücre bölümünde bulunur?",o:["Sitoplazma","Çekirdek","Mitokondri","Ribozom"],a:1,c:"Bilim"},
    {id:245,q:"Lozan Barış Antlaşması nerede imzalanmıştır?",o:["Paris","Londra","Lozan","Versay"],a:2,c:"Tarih"},
    {id:246,q:"Dünyanın en küçük ülkesi hangisidir?",o:["Monako","Vatikan","San Marino","Lihtenştayn"],a:1,c:"Coğrafya"},
    {id:247,q:"Hangi meyve çekirdeksiz olabilir?",o:["Elma","Armut","Muz","Portakal"],a:2,c:"Bilim"},
    {id:248,q:"Cumhuriyetin ilanı nerede gerçekleşmiştir?",o:["İstanbul","Ankara","Samsun","İzmir"],a:1,c:"Tarih"},
    {id:249,q:"Hangi gezegen halkalıdır?",o:["Mars","Venüs","Satürn","Merkür"],a:2,c:"Bilim"},
    {id:250,q:"Türkiye'nin en yüksek barajı hangisidir?",o:["Atatürk Barajı","Karakaya Barajı","Deriner Barajı","Ilısu Barajı"],a:2,c:"Coğrafya"},
    {id:251,q:"Hangi organ sindirim sistemine aittir?",o:["Kalp","Akciğer","Mide","Böbrek"],a:2,c:"Bilim"},
    {id:252,q:"Topkapı Sarayı hangi şehirde yer alır?",o:["Ankara","İzmir","İstanbul","Bursa"],a:2,c:"Tarih"},
    {id:253,q:"Dünyanın en soğuk yeri neresidir?",o:["Sibirya","Antarktika","Grönland","Alaska"],a:1,c:"Coğrafya"},
    {id:254,q:"Hangi kuş gece avlanır?",o:["Serçe","Kartal","Baykuş","Martı"],a:2,c:"Bilim"},
    {id:255,q:"Türkiye'nin para biriminin kısaltması nedir?",o:["USD","EUR","TRY","GBP"],a:2,c:"Genel Kültür"},
    {id:256,q:"Hangi element sıvı haldedir (oda sıcaklığında)?",o:["Cıva","Demir","Bakır","Alüminyum"],a:0,c:"Bilim"},
    {id:257,q:"Çanakkale Boğazı hangi iki denizi birbirine bağlar?",o:["Karadeniz-Akdeniz","Ege-Marmara","Marmara-Karadeniz","Akdeniz-Ege"],a:2,c:"Coğrafya"},
    {id:258,q:"Hangi spor dalında 'gol' terimi kullanılır?",o:["Basketbol","Voleybol","Futbol","Tenis"],a:2,c:"Spor"},
    {id:259,q:"Atomun çekirdeğinde ne bulunur?",o:["Elektron","Proton ve Nötron","Sadece Proton","Sadece Elektron"],a:1,c:"Bilim"},
    {id:260,q:"Anıtkabir'in mimarı kimdir?",o:["Mimar Sinan","Vedat Tek","Emin Onat","Ahmet Kemalettin"],a:2,c:"Tarih"},
    {id:261,q:"Dünyanın en uzun sıradağı hangisidir?",o:["Alpler","And Dağları","Himalayalar","Kayalık Dağlar"],a:1,c:"Coğrafya"},
    {id:262,q:"Hangi hayvan memeli değildir?",o:["Yarasa","Balina","Penguen","Yunus"],a:2,c:"Bilim"},
    {id:263,q:"Türkiye Cumhuriyeti'nin ilk anayasası kaç yılında kabul edilmiştir?",o:["1921","1924","1961","1982"],a:1,c:"Tarih"},
    {id:264,q:"Dünyanın en büyük çölü hangisidir?",o:["Sahra","Gobi","Kalahari","Antarktika Çölü"],a:3,c:"Coğrafya"},
    {id:265,q:"Hangi gaz solunum için gereklidir?",o:["Azot","Karbondioksit","Oksijen","Helyum"],a:2,c:"Bilim"},
    {id:266,q:"Osmanlı Devleti'nin kurucusu Osman Bey'in babası kimdir?",o:["Orhan Gazi","Ertuğrul Gazi","Süleyman Şah","Gündüz Alp"],a:1,c:"Tarih"},
    {id:267,q:"Dünyanın en derin gölü hangisidir?",o:["Baykal Gölü","Hazar Denizi","Victoria Gölü","Tanganika Gölü"],a:0,c:"Coğrafya"},
    // --- ÇOCUKLAR (1-4. Sınıf Seviyesi) ---
    {id:268,q:"2 + 2 kaç eder?",o:["3","4","5","6"],a:1,c:"1. Sınıf|Matematik"},
    {id:269,q:"'Elma' kelimesinin çoğulu nedir?",o:["Elmalar","Elmeler","Elmalar","Elmalar"],a:0,c:"1. Sınıf|Türkçe"},
    {id:270,q:"Hangi mevsimde yapraklar dökülür?",o:["İlkbahar","Yaz","Sonbahar","Kış"],a:2,c:"1. Sınıf|Hayat Bilgisi"},
    {id:271,q:"8 - 3 kaç eder?",o:["4","5","6","7"],a:1,c:"1. Sınıf|Matematik"},
    {id:272,q:"'Araba' kelimesinde kaç harf var?",o:["4","5","6","7"],a:1,c:"1. Sınıf|Türkçe"},
    {id:273,q:"Trafikte kırmızı ışık ne anlama gelir?",o:["Geç","Dur","Hazır Ol","Yavaşla"],a:1,c:"1. Sınıf|Hayat Bilgisi"},
    {id:274,q:"3 x 2 kaç eder?",o:["5","6","7","8"],a:1,c:"2. Sınıf|Matematik"},
    {id:275,q:"'Büyük' kelimesinin zıt anlamlısı nedir?",o:["Küçük","Geniş","Dar","Uzun"],a:0,c:"2. Sınıf|Türkçe"},
    {id:276,q:"Bir gün kaç saattir?",o:["12","24","48","60"],a:1,c:"2. Sınıf|Hayat Bilgisi"},
    {id:277,q:"5 x 5 kaç eder?",o:["20","25","30","35"],a:1,c:"2. Sınıf|Matematik"},
    {id:278,q:"'Güzel' kelimesinin eş anlamlısı nedir?",o:["Çirkin","Hoş","Kötü","Zor"],a:1,c:"2. Sınıf|Türkçe"},
    {id:279,q:"Sağlıklı beslenmek için ne yemeliyiz?",o:["Cips","Meyve","Şeker","Kola"],a:1,c:"2. Sınıf|Hayat Bilgisi"},
    {id:280,q:"20 + 20 kaç eder?",o:["30","40","50","60"],a:1,c:"3. Sınıf|Matematik"},
    {id:281,q:"'Çiçek' kelimesinin çoğulu nedir?",o:["Çiçekler","Çiçekler","Çiçekler","Çiçekler"],a:0,c:"3. Sınıf|Türkçe"},
    {id:282,q:"Bitkiler suyu nereden alır?",o:["Yaprak","Kök","Gövde","Çiçek"],a:1,c:"3. Sınıf|Fen Bilimleri"},
    {id:283,q:"7 x 6 kaç eder?",o:["40","42","44","46"],a:1,c:"3. Sınıf|Matematik"},
    {id:284,q:"'Yavaş' kelimesinin eş anlamlısı nedir?",o:["Hızlı","Ağır","Çabuk","Koşar"],a:1,c:"3. Sınıf|Türkçe"},
    {id:285,q:"Ay'ın Dünya etrafında dönmesi sonucu ne oluşur?",o:["Mevsimler","Ay Evreleri","Gel-Git","Deprem"],a:1,c:"3. Sınıf|Fen Bilimleri"},
    {id:286,q:"30 x 3 kaç eder?",o:["60","90","120","150"],a:1,c:"4. Sınıf|Matematik"},
    {id:287,q:"'Öğrenci' kelimesindeki ünlü harfler hangileridir?",o:["Ö, e, i","Ğ, r, c","N, t","Ö, ğ, r"],a:0,c:"4. Sınıf|Türkçe"},
    {id:288,q:"Hangi organ kanı pompalar?",o:["Akciğer","Kalp","Mide","Karaciğer"],a:1,c:"4. Sınıf|Fen Bilimleri"},
    {id:289,q:"100 / 5 kaç eder?",o:["10","20","25","50"],a:1,c:"4. Sınıf|Matematik"},
    {id:290,q:"'Mutlu' kelimesinin zıt anlamlısı nedir?",o:["Sevinçli","Üzgün","Neşeli","Güler"],a:1,c:"4. Sınıf|Türkçe"},
    {id:291,q:"Güneş sistemindeki en büyük gezegen hangisidir?",o:["Dünya","Mars","Jüpiter","Satürn"],a:2,c:"4. Sınıf|Fen Bilimleri"},
    {id:292,q:"40 + 60 kaç eder?",o:["90","100","110","120"],a:1,c:"4. Sınıf|Matematik"},
    {id:293,q:"'Masal' kelimesindeki sessiz harfler hangileridir?",o:["M, s, l","A, a","M, a, s","S, l, a"],a:0,c:"4. Sınıf|Türkçe"},
    {id:294,q:"Hangi hayvan uçabilir?",o:["Kedi","Kuş","Balık","Yılan"],a:1,c:"4. Sınıf|Fen Bilimleri"},
    {id:295,q:"60 x 2 kaç eder?",o:["100","120","140","160"],a:1,c:"4. Sınıf|Matematik"},
    {id:296,q:"'Gülmek' fiilinin olumsuzu nedir?",o:["Gülmemek","Gülüyor","Güldü","Gülecek"],a:0,c:"4. Sınıf|Türkçe"},
    {id:297,q:"Dünya'nın kendi ekseni etrafında dönmesi sonucu ne oluşur?",o:["Mevsimler","Gece-Gündüz","Gel-Git","Deprem"],a:1,c:"4. Sınıf|Fen Bilimleri"},
    {id:298,q:"11 x 11 kaç eder?",o:["111","121","131","141"],a:1,c:"4. Sınıf|Matematik"},
    {id:299,q:"'Ev' kelimesinin eş seslisi (sesteşi) var mıdır?",o:["Evet","Hayır","Bazen","Belki"],a:1,c:"4. Sınıf|Türkçe"},
    {id:300,q:"Hangi duygu organımızla tatları algılarız?",o:["Göz","Kulak","Burun","Dil"],a:3,c:"4. Sınıf|Fen Bilimleri"},
    {id:301,q:"90 - 45 kaç eder?",o:["40","45","50","55"],a:1,c:"4. Sınıf|Matematik"},
    {id:302,q:"'Çiçek' kelimesindeki hece sayısı kaçtır?",o:["1","2","3","4"],a:1,c:"4. Sınıf|Türkçe"},
    {id:303,q:"Hangi madde manyetik özellik gösterir?",o:["Tahta","Plastik","Demir","Cam"],a:2,c:"4. Sınıf|Fen Bilimleri"},
    {id:304,q:"25 x 4 kaç eder?",o:["50","75","100","125"],a:2,c:"4. Sınıf|Matematik"},
    {id:305,q:"'Koşmak' fiilinin geniş zaman hali nedir?",o:["Koştum","Koşar","Koşacak","Koşuyor"],a:1,c:"4. Sınıf|Türkçe"},
    {id:306,q:"Hangi gezegen Güneş'e en yakındır?",o:["Venüs","Merkür","Mars","Dünya"],a:1,c:"4. Sınıf|Fen Bilimleri"},
    {id:307,q:"99 + 1 kaç eder?",o:["90","100","101","110"],a:1,c:"4. Sınıf|Matematik"},
    {id:308,q:"'Renkli' kelimesindeki kök hangisidir?",o:["Renk","Renkli","Li","Ren"],a:0,c:"4. Sınıf|Türkçe"},
    {id:309,q:"Hangi canlı fotosentez yapar?",o:["İnsan","Kedi","Çam Ağacı","Köpek"],a:2,c:"4. Sınıf|Fen Bilimleri"},
    {id:310,q:"150 / 3 kaç eder?",o:["30","40","50","60"],a:2,c:"4. Sınıf|Matematik"},
    {id:311,q:"'Okulda' kelimesindeki ek hangisidir?",o:["Okul","-da","Oku","-l"],a:1,c:"4. Sınıf|Türkçe"},
    {id:312,q:"Hangi madde suda yüzer?",o:["Taş","Demir","Tahta","Cam"],a:2,c:"4. Sınıf|Fen Bilimleri"},
    {id:313,q:"7 x 8 kaç eder?",o:["54","56","58","60"],a:1,c:"4. Sınıf|Matematik"},
    {id:314,q:"'Güzelce' kelimesindeki yapım eki hangisidir?",o:["Güzel","-ce","Güz","-el"],a:1,c:"4. Sınıf|Türkçe"},
    {id:315,q:"Hangi organ kanı temizler?",o:["Kalp","Böbrek","Mide","Bağırsak"],a:1,c:"4. Sınıf|Fen Bilimleri"},
    {id:316,q:"45 + 55 kaç eder?",o:["90","100","110","120"],a:1,c:"4. Sınıf|Matematik"},
    {id:317,q:"'Yazmak' fiilinin emir kipi (sen) nedir?",o:["Yaz","Yazsın","Yazalım","Yazınız"],a:0,c:"4. Sınıf|Türkçe"},    {id:318,q:"Hangi elementin sembolü 'Fe' dir?",o:["Flor","Demir","Fosfor","Kurşun"],a:1,c:"Bilim"},
    {id:319,q:"Dünyanın en büyük ikinci okyanusu hangisidir?",o:["Pasifik","Atlantik","Hint","Arktik"],a:1,c:"Coğrafya"},
    {id:320,q:"Türkiye'nin ilk kadın başbakanı kimdir?",o:["Tansu Çiller","Sabiha Gökçen","Halide Edip","Afife Jale"],a:0,c:"Tarih"},
    {id:321,q:"Hangi gezegen Güneş Sistemi'nin en küçüğüdür?",o:["Merkür","Venüs","Mars","Plüton"],a:0,c:"Bilim"},
    {id:322,q:"Bir gross kaç tanedir?",o:["12","144","100","60"],a:1,c:"Genel Kültür"},
    {id:323,q:"Hangi ülke 'Bin Göller Ülkesi' olarak bilinir?",o:["Finlandiya","Kanada","İsveç","Norveç"],a:0,c:"Coğrafya"},
    {id:324,q:"Suyun yoğunluğu en fazla hangi derecededir?",o:["0°C","4°C","100°C","-4°C"],a:1,c:"Bilim"},
    {id:325,q:"Osmanlı Devleti'nin son halifesi kimdir?",o:["Abdülmecid Efendi","Vahdettin","Reşat","Abdülaziz"],a:0,c:"Tarih"},
    {id:326,q:"Hangi hayvan en hızlı uçan kuştur?",o:["Şahin","Kartal","Peregrine Şahini","Baykuş"],a:2,c:"Bilim"},
    {id:327,q:"Türkiye'nin plaka kodu 35 olan ili hangisidir?",o:["Ankara","İzmir","İstanbul","Bursa"],a:1,c:"Coğrafya"},
    {id:328,q:"Hangi spor dalında 'smash' terimi kullanılır?",o:["Tenis","Badminton","Voleybol","Hepsi"],a:3,c:"Spor"},
    {id:329,q:"Dünyanın en uzun mağarası hangisidir?",o:["Mammoth Mağarası","Son Doong","Optimisticheskaya","Carlsbad"],a:0,c:"Coğrafya"},
    {id:330,q:"Hangi vitamin havuçta bolca bulunur?",o:["C Vitamini","A Vitamini","B Vitamini","D Vitamini"],a:1,c:"Bilim"},
    {id:331,q:"Kurtuluş Savaşı'nda Doğu Cephesi komutanı kimdir?",o:["Kazım Karabekir","Ali Fuat Cebesoy","Refet Bele","İsmet İnönü"],a:0,c:"Tarih"},
    {id:332,q:"Hangi gezegenin halkası yoktur?",o:["Satürn","Jüpiter","Mars","Uranüs"],a:2,c:"Bilim"},
    {id:333,q:"Türkiye'nin en kalabalık üçüncü şehri hangisidir?",o:["Ankara","İzmir","Bursa","Antalya"],a:2,c:"Coğrafya"},
    {id:334,q:"Hangi renk ışığı trafik lambasında 'Geç' anlamına gelir?",o:["Kırmızı","Sarı","Yeşil","Mavi"],a:2,c:"Genel Kültür"},
    {id:335,q:"Bir asır kaç yıldır?",o:["10","50","100","1000"],a:2,c:"Genel Kültür"},
    {id:336,q:"Hangi element katı haldedir (oda sıcaklığında)?",o:["Oksijen","Azot","Demir","Helyum"],a:2,c:"Bilim"},
    {id:337,q:"Malazgirt Zaferi sonrası Anadolu'nun kapıları kime açılmıştır?",o:["Selçuklular","Osmanlılar","Bizans","Moğollar"],a:0,c:"Tarih"},
    {id:338,q:"Dünyanın en tuzlu gölü hangisidir?",o:["Ölü Deniz","Hazar Denizi","Baykal Gölü","Tuz Gölü"],a:0,c:"Coğrafya"},
    {id:339,q:"Hangi hayvan amfibi değildir?",o:["Kurbağa","Semender","Kertenkele","Balık"],a:2,c:"Bilim"},
    {id:340,q:"TBMM'nin ilk başkanı kimdir?",o:["Mustafa Kemal Atatürk","İsmet İnönü","Fevzi Çakmak","Kazım Karabekir"],a:0,c:"Tarih"},
    {id:341,q:"Hangi gezegen 'Sabah Yıldızı' olarak da bilinir?",o:["Mars","Venüs","Jüpiter","Merkür"],a:1,c:"Bilim"},
    {id:342,q:"Türkiye'nin en kısa kıyı şeridine sahip ili hangisidir?",o:["Artvin","Rize","Trabzon","Giresun"],a:0,c:"Coğrafya"},
    {id:343,q:"Hangi spor dalında 'penaltı' terimi kullanılır?",o:["Basketbol","Futbol","Voleybol","Tenis"],a:1,c:"Spor"},
    {id:344,q:"RNA'nın açılımı nedir?",o:["Ribonükleik Asit","Deoksiribo Nükleik Asit","Protein","Enzim"],a:0,c:"Bilim"},
    {id:345,q:"Lozan Antlaşması hangi savaşın sonunda imzalanmıştır?",o:["I. Dünya Savaşı","Kurtuluş Savaşı","II. Dünya Savaşı","Balkan Savaşları"],a:1,c:"Tarih"},
    {id:346,q:"Dünyanın en küçük adası hangisidir?",o:["Bishop Rock","Just Room Enough Island","Nauru","Tuvalu"],a:1,c:"Coğrafya"},
    {id:347,q:"Hangi meyve çekirdekli olabilir?",o:["Muz","Portakal","Elma","Karpuz"],a:2,c:"Bilim"},
    {id:348,q:"Cumhuriyetin ilanı sonrası ilk cumhurbaşkanı kimdir?",o:["İsmet İnönü","Mustafa Kemal Atatürk","Celal Bayar","Fevzi Çakmak"],a:1,c:"Tarih"},
    {id:349,q:"Hangi gezegen halkalıdır?",o:["Mars","Venüs","Uranüs","Merkür"],a:2,c:"Bilim"},
    {id:350,q:"Türkiye'nin en büyük barajı hangisidir?",o:["Atatürk Barajı","Karakaya Barajı","Deriner Barajı","Ilısu Barajı"],a:0,c:"Coğrafya"},
    {id:351,q:"Hangi organ boşaltım sistemine aittir?",o:["Kalp","Akciğer","Böbrek","Mide"],a:2,c:"Bilim"},
    {id:352,q:"Dolmabahçe Sarayı hangi şehirde yer alır?",o:["Ankara","İzmir","İstanbul","Bursa"],a:2,c:"Tarih"},
    {id:353,q:"Dünyanın en sıcak yeri neresidir?",o:["Sahra Çölü","Death Valley","Lut Çölü","Rub' al Khali"],a:2,c:"Coğrafya"},
    {id:354,q:"Hangi kuş gündüz avlanır?",o:["Baykuş","Kartal","Yarasa","Gece Kuşu"],a:1,c:"Bilim"},
    {id:355,q:"Türkiye'nin para biriminin sembolü nedir?",o:["$","€","₺","£"],a:2,c:"Genel Kültür"},
    {id:356,q:"Hangi element gaz halindedir (oda sıcaklığında)?",o:["Cıva","Demir","Helyum","Altın"],a:2,c:"Bilim"},
    {id:357,q:"İstanbul Boğazı hangi iki denizi birbirine bağlar?",o:["Karadeniz-Akdeniz","Ege-Marmara","Marmara-Karadeniz","Akdeniz-Ege"],a:2,c:"Coğrafya"},
    {id:358,q:"Hangi spor dalında 'sayı' terimi kullanılır?",o:["Futbol","Basketbol","Tenis","Voleybol"],a:1,c:"Spor"},
    {id:359,q:"Atomun dış kısmında ne bulunur?",o:["Proton","Nötron","Elektron","Çekirdek"],a:2,c:"Bilim"},
    {id:360,q:"Anıtkabir'in yapımı kaç yılında tamamlanmıştır?",o:["1944","1953","1960","1938"],a:1,c:"Tarih"},
    {id:361,q:"Dünyanın en geniş sıradağı hangisidir?",o:["Alpler","And Dağları","Himalayalar","Kayalık Dağlar"],a:2,c:"Coğrafya"},
    {id:362,q:"Hangi hayvan memelidir?",o:["Penguen","Yarasa","Timsah","Yılan"],a:1,c:"Bilim"},
    {id:363,q:"Türkiye Cumhuriyeti'nin ikinci anayasası kaç yılında kabul edilmiştir?",o:["1921","1924","1961","1982"],a:2,c:"Tarih"},
    {id:364,q:"Dünyanın en büyük çölü hangisidir?",o:["Sahra","Gobi","Kalahari","Antarktika Çölü"],a:3,c:"Coğrafya"},
    {id:365,q:"Hangi gaz solunum için gereklidir?",o:["Azot","Karbondioksit","Oksijen","Helyum"],a:2,c:"Bilim"},
    {id:366,q:"Osmanlı Devleti'nin kurucusu Osman Bey'in dedesi kimdir?",o:["Orhan Gazi","Ertuğrul Gazi","Süleyman Şah","Gündüz Alp"],a:2,c:"Tarih"},
    {id:367,q:"Dünyanın en derin noktası hangi okyanustadır?",o:["Atlantik","Hint","Pasifik","Arktik"],a:2,c:"Coğrafya"},

    // --- ÇOCUKLAR (1-4. Sınıf Seviyesi) ---
    {id:368,q:"1 + 1 kaç eder?",o:["1","2","3","4"],a:1,c:"1. Sınıf|Matematik"},
    {id:369,q:"'Kalem' kelimesinin çoğulu nedir?",o:["Kalemler","Kalemler","Kalemler","Kalemler"],a:0,c:"1. Sınıf|Türkçe"},
    {id:370,q:"Hangi mevsimde çiçekler açar?",o:["Kış","Sonbahar","İlkbahar","Yaz"],a:2,c:"1. Sınıf|Hayat Bilgisi"},
    {id:371,q:"7 - 2 kaç eder?",o:["4","5","6","7"],a:1,c:"1. Sınıf|Matematik"},
    {id:372,q:"'Okul' kelimesinde kaç sesli harf var?",o:["1","2","3","4"],a:1,c:"1. Sınıf|Türkçe"},
    {id:373,q:"Trafikte sarı ışık ne anlama gelir?",o:["Geç","Dur","Hazır Ol","Yavaşla"],a:2,c:"1. Sınıf|Hayat Bilgisi"},
    {id:374,q:"4 x 2 kaç eder?",o:["6","8","10","12"],a:1,c:"2. Sınıf|Matematik"},
    {id:375,q:"'Küçük' kelimesinin zıt anlamlısı nedir?",o:["Büyük","Geniş","Dar","Uzun"],a:0,c:"2. Sınıf|Türkçe"},
    {id:376,q:"Bir ay kaç haftadır?",o:["2","3","4","5"],a:2,c:"2. Sınıf|Hayat Bilgisi"},
    {id:377,q:"6 x 6 kaç eder?",o:["30","36","42","48"],a:1,c:"2. Sınıf|Matematik"},
    {id:378,q:"'İyi' kelimesinin eş anlamlısı nedir?",o:["Kötü","Güzel","Zor","Kolay"],a:1,c:"2. Sınıf|Türkçe"},
    {id:379,q:"Sağlıklı olmak için ne içmeliyiz?",o:["Kola","Su","Şekerli İçecek","Çay"],a:1,c:"2. Sınıf|Hayat Bilgisi"},
    {id:380,q:"25 + 25 kaç eder?",o:["40","50","60","70"],a:1,c:"3. Sınıf|Matematik"},
    {id:381,q:"'Ağaç' kelimesinin çoğulu nedir?",o:["Ağaçlar","Ağaçlar","Ağaçlar","Ağaçlar"],a:0,c:"3. Sınıf|Türkçe"},
    {id:382,q:"Bitkiler besinini nereden üretir?",o:["Toprak","Su","Yaprak","Kök"],a:2,c:"3. Sınıf|Fen Bilimleri"},
    {id:383,q:"8 x 8 kaç eder?",o:["60","64","68","72"],a:1,c:"3. Sınıf|Matematik"},
    {id:384,q:"'Yavaş' kelimesinin zıt anlamlısı nedir?",o:["Hızlı","Ağır","Çabuk","Koşar"],a:0,c:"3. Sınıf|Türkçe"},
    {id:385,q:"Ay'ın Dünya etrafında dönmesi sonucu ne oluşur?",o:["Mevsimler","Ay Evreleri","Gel-Git","Deprem"],a:1,c:"3. Sınıf|Fen Bilimleri"},
    {id:386,q:"40 x 2 kaç eder?",o:["60","80","100","120"],a:1,c:"4. Sınıf|Matematik"},
    {id:387,q:"'Öğretmen' kelimesindeki sessiz harfler hangileridir?",o:["Ğ, r, t, m, n","Ö, e, i","Ö, ğ, r","T, m, n"],a:0,c:"4. Sınıf|Türkçe"},
    {id:388,q:"Hangi organ sindirim sistemine aittir?",o:["Kalp","Akciğer","Mide","Böbrek"],a:2,c:"4. Sınıf|Fen Bilimleri"},
    {id:389,q:"100 / 10 kaç eder?",o:["10","20","25","50"],a:0,c:"4. Sınıf|Matematik"},
    {id:390,q:"'Mutlu' kelimesinin eş anlamlısı nedir?",o:["Sevinçli","Üzgün","Neşeli","Güler"],a:0,c:"4. Sınıf|Türkçe"},
    {id:391,q:"Güneş sistemindeki en küçük gezegen hangisidir?",o:["Dünya","Mars","Merkür","Venüs"],a:2,c:"4. Sınıf|Fen Bilimleri"},
    {id:392,q:"50 + 50 kaç eder?",o:["90","100","110","120"],a:1,c:"4. Sınıf|Matematik"},
    {id:393,q:"'Masal' kelimesindeki ünlü harfler hangileridir?",o:["M, s, l","A, a","M, a, s","S, l, a"],a:1,c:"4. Sınıf|Türkçe"},
    {id:394,q:"Hangi hayvan sürüngen değildir?",o:["Yılan","Kertenkele","Kurbağa","Timsah"],a:2,c:"4. Sınıf|Fen Bilimleri"},
    {id:395,q:"70 x 2 kaç eder?",o:["100","120","140","160"],a:2,c:"4. Sınıf|Matematik"},
    {id:396,q:"'Gülmek' fiilinin olumsuzu nedir?",o:["Gülmemek","Gülüyor","Güldü","Gülecek"],a:0,c:"4. Sınıf|Türkçe"},
    {id:397,q:"Dünya'nın kendi ekseni etrafında dönmesi sonucu ne oluşur?",o:["Mevsimler","Gece-Gündüz","Gel-Git","Deprem"],a:1,c:"4. Sınıf|Fen Bilimleri"},
    {id:398,q:"13 x 13 kaç eder?",o:["169","179","189","199"],a:0,c:"4. Sınıf|Matematik"},
    {id:399,q:"'Ev' kelimesinin eş seslisi (sesteşi) var mıdır?",o:["Evet","Hayır","Bazen","Belki"],a:1,c:"4. Sınıf|Türkçe"},
    {id:400,q:"Hangi duygu organımızla dokunmayı algılarız?",o:["Göz","Kulak","Deri","Dil"],a:2,c:"4. Sınıf|Fen Bilimleri"},
    {id:401,q:"95 - 45 kaç eder?",o:["40","50","60","70"],a:1,c:"4. Sınıf|Matematik"},
    {id:402,q:"'Çiçek' kelimesindeki hece sayısı kaçtır?",o:["1","2","3","4"],a:1,c:"4. Sınıf|Türkçe"},
    {id:403,q:"Hangi madde manyetik özellik göstermez?",o:["Tahta","Demir","Nikel","Kobalt"],a:0,c:"4. Sınıf|Fen Bilimleri"},
    {id:404,q:"30 x 4 kaç eder?",o:["100","120","140","160"],a:1,c:"4. Sınıf|Matematik"},
    {id:405,q:"'Koşmak' fiilinin geniş zaman hali nedir?",o:["Koştum","Koşar","Koşacak","Koşuyor"],a:1,c:"4. Sınıf|Türkçe"},
    {id:406,q:"Hangi gezegen Güneş'e en uzaktır?",o:["Venüs","Merkür","Mars","Neptün"],a:3,c:"4. Sınıf|Fen Bilimleri"},
    {id:407,q:"98 + 2 kaç eder?",o:["90","100","101","110"],a:1,c:"4. Sınıf|Matematik"},
    {id:408,q:"'Renkli' kelimesindeki kök hangisidir?",o:["Renk","Renkli","Li","Ren"],a:0,c:"4. Sınıf|Türkçe"},
    {id:409,q:"Hangi canlı fotosentez yapmaz?",o:["İnsan","Kedi","Çam Ağacı","Köpek"],a:0,c:"4. Sınıf|Fen Bilimleri"},
    {id:410,q:"180 / 3 kaç eder?",o:["30","40","50","60"],a:3,c:"4. Sınıf|Matematik"},
    {id:411,q:"'Okulda' kelimesindeki ek hangisidir?",o:["Okul","-da","Oku","-l"],a:1,c:"4. Sınıf|Türkçe"},
    {id:412,q:"Hangi madde suda batar?",o:["Tahta","Demir","Strafor","Plastik"],a:1,c:"4. Sınıf|Fen Bilimleri"},
    {id:413,q:"9 x 9 kaç eder?",o:["81","82","83","84"],a:0,c:"4. Sınıf|Matematik"},
    {id:414,q:"'Güzelce' kelimesindeki yapım eki hangisidir?",o:["Güzel","-ce","Güz","-el"],a:1,c:"4. Sınıf|Türkçe"},
    {id:415,q:"Hangi organ kanı temizler?",o:["Kalp","Böbrek","Mide","Bağırsak"],a:1,c:"4. Sınıf|Fen Bilimleri"},
    {id:416,q:"55 + 45 kaç eder?",o:["90","100","110","120"],a:1,c:"4. Sınıf|Matematik"},
    {id:417,q:"'Yazmak' fiilinin emir kipi (sen) nedir?",o:["Yaz","Yazsın","Yazalım","Yazınız"],a:0,c:"4. Sınıf|Türkçe"},         // ==================== YENİ EKLENEN 100 SORU (ID: 318-417) ====================
    
    // --- BÜYÜKLER (Genel Kültür, Tarih, Bilim, Coğrafya, Spor) ---
    {id:318,q:"Hangi elementin sembolü 'Fe' dir?",o:["Flor","Demir","Fosfor","Kurşun"],a:1,c:"Bilim"},
    {id:319,q:"Dünyanın en büyük ikinci okyanusu hangisidir?",o:["Pasifik","Atlantik","Hint","Arktik"],a:1,c:"Coğrafya"},
    {id:320,q:"Türkiye'nin ilk kadın başbakanı kimdir?",o:["Tansu Çiller","Sabiha Gökçen","Halide Edip","Afife Jale"],a:0,c:"Tarih"},
    {id:321,q:"Hangi gezegen Güneş Sistemi'nin en küçüğüdür?",o:["Merkür","Venüs","Mars","Plüton"],a:0,c:"Bilim"},
    {id:322,q:"Bir gross kaç tanedir?",o:["12","144","100","60"],a:1,c:"Genel Kültür"},
    {id:323,q:"Hangi ülke 'Bin Göller Ülkesi' olarak bilinir?",o:["Finlandiya","Kanada","İsveç","Norveç"],a:0,c:"Coğrafya"},
    {id:324,q:"Suyun yoğunluğu en fazla hangi derecededir?",o:["0°C","4°C","100°C","-4°C"],a:1,c:"Bilim"},
    {id:325,q:"Osmanlı Devleti'nin son halifesi kimdir?",o:["Abdülmecid Efendi","Vahdettin","Reşat","Abdülaziz"],a:0,c:"Tarih"},
    {id:326,q:"Hangi hayvan en hızlı uçan kuştur?",o:["Şahin","Kartal","Peregrine Şahini","Baykuş"],a:2,c:"Bilim"},
    {id:327,q:"Türkiye'nin plaka kodu 35 olan ili hangisidir?",o:["Ankara","İzmir","İstanbul","Bursa"],a:1,c:"Coğrafya"},
    {id:328,q:"Hangi spor dalında 'smash' terimi kullanılır?",o:["Tenis","Badminton","Voleybol","Hepsi"],a:3,c:"Spor"},
    {id:329,q:"Dünyanın en uzun mağarası hangisidir?",o:["Mammoth Mağarası","Son Doong","Optimisticheskaya","Carlsbad"],a:0,c:"Coğrafya"},
    {id:330,q:"Hangi vitamin havuçta bolca bulunur?",o:["C Vitamini","A Vitamini","B Vitamini","D Vitamini"],a:1,c:"Bilim"},
    {id:331,q:"Kurtuluş Savaşı'nda Doğu Cephesi komutanı kimdir?",o:["Kazım Karabekir","Ali Fuat Cebesoy","Refet Bele","İsmet İnönü"],a:0,c:"Tarih"},
    {id:332,q:"Hangi gezegenin halkası yoktur?",o:["Satürn","Jüpiter","Mars","Uranüs"],a:2,c:"Bilim"},
    {id:333,q:"Türkiye'nin en kalabalık üçüncü şehri hangisidir?",o:["Ankara","İzmir","Bursa","Antalya"],a:2,c:"Coğrafya"},
    {id:334,q:"Hangi renk ışığı trafik lambasında 'Geç' anlamına gelir?",o:["Kırmızı","Sarı","Yeşil","Mavi"],a:2,c:"Genel Kültür"},
    {id:335,q:"Bir asır kaç yıldır?",o:["10","50","100","1000"],a:2,c:"Genel Kültür"},
    {id:336,q:"Hangi element katı haldedir (oda sıcaklığında)?",o:["Oksijen","Azot","Demir","Helyum"],a:2,c:"Bilim"},
    {id:337,q:"Malazgirt Zaferi sonrası Anadolu'nun kapıları kime açılmıştır?",o:["Selçuklular","Osmanlılar","Bizans","Moğollar"],a:0,c:"Tarih"},
    {id:338,q:"Dünyanın en tuzlu gölü hangisidir?",o:["Ölü Deniz","Hazar Denizi","Baykal Gölü","Tuz Gölü"],a:0,c:"Coğrafya"},
    {id:339,q:"Hangi hayvan amfibi değildir?",o:["Kurbağa","Semender","Kertenkele","Balık"],a:2,c:"Bilim"},
    {id:340,q:"TBMM'nin ilk başkanı kimdir?",o:["Mustafa Kemal Atatürk","İsmet İnönü","Fevzi Çakmak","Kazım Karabekir"],a:0,c:"Tarih"},
    {id:341,q:"Hangi gezegen 'Sabah Yıldızı' olarak da bilinir?",o:["Mars","Venüs","Jüpiter","Merkür"],a:1,c:"Bilim"},
    {id:342,q:"Türkiye'nin en kısa kıyı şeridine sahip ili hangisidir?",o:["Artvin","Rize","Trabzon","Giresun"],a:0,c:"Coğrafya"},
    {id:343,q:"Hangi spor dalında 'penaltı' terimi kullanılır?",o:["Basketbol","Futbol","Voleybol","Tenis"],a:1,c:"Spor"},
    {id:344,q:"RNA'nın açılımı nedir?",o:["Ribonükleik Asit","Deoksiribo Nükleik Asit","Protein","Enzim"],a:0,c:"Bilim"},
    {id:345,q:"Lozan Antlaşması hangi savaşın sonunda imzalanmıştır?",o:["I. Dünya Savaşı","Kurtuluş Savaşı","II. Dünya Savaşı","Balkan Savaşları"],a:1,c:"Tarih"},
    {id:346,q:"Dünyanın en küçük adası hangisidir?",o:["Bishop Rock","Just Room Enough Island","Nauru","Tuvalu"],a:1,c:"Coğrafya"},
    {id:347,q:"Hangi meyve çekirdekli olabilir?",o:["Muz","Portakal","Elma","Karpuz"],a:2,c:"Bilim"},
    {id:348,q:"Cumhuriyetin ilanı sonrası ilk cumhurbaşkanı kimdir?",o:["İsmet İnönü","Mustafa Kemal Atatürk","Celal Bayar","Fevzi Çakmak"],a:1,c:"Tarih"},
    {id:349,q:"Hangi gezegen halkalıdır?",o:["Mars","Venüs","Uranüs","Merkür"],a:2,c:"Bilim"},
    {id:350,q:"Türkiye'nin en büyük barajı hangisidir?",o:["Atatürk Barajı","Karakaya Barajı","Deriner Barajı","Ilısu Barajı"],a:0,c:"Coğrafya"},
    {id:351,q:"Hangi organ boşaltım sistemine aittir?",o:["Kalp","Akciğer","Böbrek","Mide"],a:2,c:"Bilim"},
    {id:352,q:"Dolmabahçe Sarayı hangi şehirde yer alır?",o:["Ankara","İzmir","İstanbul","Bursa"],a:2,c:"Tarih"},
    {id:353,q:"Dünyanın en sıcak yeri neresidir?",o:["Sahra Çölü","Death Valley","Lut Çölü","Rub' al Khali"],a:2,c:"Coğrafya"},
    {id:354,q:"Hangi kuş gündüz avlanır?",o:["Baykuş","Kartal","Yarasa","Gece Kuşu"],a:1,c:"Bilim"},
    {id:355,q:"Türkiye'nin para biriminin sembolü nedir?",o:["$","€","₺","£"],a:2,c:"Genel Kültür"},
    {id:356,q:"Hangi element gaz halindedir (oda sıcaklığında)?",o:["Cıva","Demir","Helyum","Altın"],a:2,c:"Bilim"},
    {id:357,q:"İstanbul Boğazı hangi iki denizi birbirine bağlar?",o:["Karadeniz-Akdeniz","Ege-Marmara","Marmara-Karadeniz","Akdeniz-Ege"],a:2,c:"Coğrafya"},
    {id:358,q:"Hangi spor dalında 'sayı' terimi kullanılır?",o:["Futbol","Basketbol","Tenis","Voleybol"],a:1,c:"Spor"},
    {id:359,q:"Atomun dış kısmında ne bulunur?",o:["Proton","Nötron","Elektron","Çekirdek"],a:2,c:"Bilim"},
    {id:360,q:"Anıtkabir'in yapımı kaç yılında tamamlanmıştır?",o:["1944","1953","1960","1938"],a:1,c:"Tarih"},
    {id:361,q:"Dünyanın en geniş sıradağı hangisidir?",o:["Alpler","And Dağları","Himalayalar","Kayalık Dağlar"],a:2,c:"Coğrafya"},
    {id:362,q:"Hangi hayvan memelidir?",o:["Penguen","Yarasa","Timsah","Yılan"],a:1,c:"Bilim"},
    {id:363,q:"Türkiye Cumhuriyeti'nin ikinci anayasası kaç yılında kabul edilmiştir?",o:["1921","1924","1961","1982"],a:2,c:"Tarih"},
    {id:364,q:"Dünyanın en büyük çölü hangisidir?",o:["Sahra","Gobi","Kalahari","Antarktika Çölü"],a:3,c:"Coğrafya"},
    {id:365,q:"Hangi gaz solunum için gereklidir?",o:["Azot","Karbondioksit","Oksijen","Helyum"],a:2,c:"Bilim"},
    {id:366,q:"Osmanlı Devleti'nin kurucusu Osman Bey'in dedesi kimdir?",o:["Orhan Gazi","Ertuğrul Gazi","Süleyman Şah","Gündüz Alp"],a:2,c:"Tarih"},
    {id:367,q:"Dünyanın en derin noktası hangi okyanustadır?",o:["Atlantik","Hint","Pasifik","Arktik"],a:2,c:"Coğrafya"},

    // --- ÇOCUKLAR (1-4. Sınıf Seviyesi) ---
    {id:368,q:"1 + 1 kaç eder?",o:["1","2","3","4"],a:1,c:"1. Sınıf|Matematik"},
    {id:369,q:"'Kalem' kelimesinin çoğulu nedir?",o:["Kalemler","Kalemler","Kalemler","Kalemler"],a:0,c:"1. Sınıf|Türkçe"},
    {id:370,q:"Hangi mevsimde çiçekler açar?",o:["Kış","Sonbahar","İlkbahar","Yaz"],a:2,c:"1. Sınıf|Hayat Bilgisi"},
    {id:371,q:"7 - 2 kaç eder?",o:["4","5","6","7"],a:1,c:"1. Sınıf|Matematik"},
    {id:372,q:"'Okul' kelimesinde kaç sesli harf var?",o:["1","2","3","4"],a:1,c:"1. Sınıf|Türkçe"},
    {id:373,q:"Trafikte sarı ışık ne anlama gelir?",o:["Geç","Dur","Hazır Ol","Yavaşla"],a:2,c:"1. Sınıf|Hayat Bilgisi"},
    {id:374,q:"4 x 2 kaç eder?",o:["6","8","10","12"],a:1,c:"2. Sınıf|Matematik"},
    {id:375,q:"'Küçük' kelimesinin zıt anlamlısı nedir?",o:["Büyük","Geniş","Dar","Uzun"],a:0,c:"2. Sınıf|Türkçe"},
    {id:376,q:"Bir ay kaç haftadır?",o:["2","3","4","5"],a:2,c:"2. Sınıf|Hayat Bilgisi"},
    {id:377,q:"6 x 6 kaç eder?",o:["30","36","42","48"],a:1,c:"2. Sınıf|Matematik"},
    {id:378,q:"'İyi' kelimesinin eş anlamlısı nedir?",o:["Kötü","Güzel","Zor","Kolay"],a:1,c:"2. Sınıf|Türkçe"},
    {id:379,q:"Sağlıklı olmak için ne içmeliyiz?",o:["Kola","Su","Şekerli İçecek","Çay"],a:1,c:"2. Sınıf|Hayat Bilgisi"},
    {id:380,q:"25 + 25 kaç eder?",o:["40","50","60","70"],a:1,c:"3. Sınıf|Matematik"},
    {id:381,q:"'Ağaç' kelimesinin çoğulu nedir?",o:["Ağaçlar","Ağaçlar","Ağaçlar","Ağaçlar"],a:0,c:"3. Sınıf|Türkçe"},
    {id:382,q:"Bitkiler besinini nereden üretir?",o:["Toprak","Su","Yaprak","Kök"],a:2,c:"3. Sınıf|Fen Bilimleri"},
    {id:383,q:"8 x 8 kaç eder?",o:["60","64","68","72"],a:1,c:"3. Sınıf|Matematik"},
    {id:384,q:"'Yavaş' kelimesinin zıt anlamlısı nedir?",o:["Hızlı","Ağır","Çabuk","Koşar"],a:0,c:"3. Sınıf|Türkçe"},
    {id:385,q:"Ay'ın Dünya etrafında dönmesi sonucu ne oluşur?",o:["Mevsimler","Ay Evreleri","Gel-Git","Deprem"],a:1,c:"3. Sınıf|Fen Bilimleri"},
    {id:386,q:"40 x 2 kaç eder?",o:["60","80","100","120"],a:1,c:"4. Sınıf|Matematik"},
    {id:387,q:"'Öğretmen' kelimesindeki sessiz harfler hangileridir?",o:["Ğ, r, t, m, n","Ö, e, i","Ö, ğ, r","T, m, n"],a:0,c:"4. Sınıf|Türkçe"},
    {id:388,q:"Hangi organ sindirim sistemine aittir?",o:["Kalp","Akciğer","Mide","Böbrek"],a:2,c:"4. Sınıf|Fen Bilimleri"},
    {id:389,q:"100 / 10 kaç eder?",o:["10","20","25","50"],a:0,c:"4. Sınıf|Matematik"},
    {id:390,q:"'Mutlu' kelimesinin eş anlamlısı nedir?",o:["Sevinçli","Üzgün","Neşeli","Güler"],a:0,c:"4. Sınıf|Türkçe"},
    {id:391,q:"Güneş sistemindeki en küçük gezegen hangisidir?",o:["Dünya","Mars","Merkür","Venüs"],a:2,c:"4. Sınıf|Fen Bilimleri"},
    {id:392,q:"50 + 50 kaç eder?",o:["90","100","110","120"],a:1,c:"4. Sınıf|Matematik"},
    {id:393,q:"'Masal' kelimesindeki ünlü harfler hangileridir?",o:["M, s, l","A, a","M, a, s","S, l, a"],a:1,c:"4. Sınıf|Türkçe"},
    {id:394,q:"Hangi hayvan sürüngen değildir?",o:["Yılan","Kertenkele","Kurbağa","Timsah"],a:2,c:"4. Sınıf|Fen Bilimleri"},
    {id:395,q:"70 x 2 kaç eder?",o:["100","120","140","160"],a:2,c:"4. Sınıf|Matematik"},
    {id:396,q:"'Gülmek' fiilinin olumsuzu nedir?",o:["Gülmemek","Gülüyor","Güldü","Gülecek"],a:0,c:"4. Sınıf|Türkçe"},
    {id:397,q:"Dünya'nın kendi ekseni etrafında dönmesi sonucu ne oluşur?",o:["Mevsimler","Gece-Gündüz","Gel-Git","Deprem"],a:1,c:"4. Sınıf|Fen Bilimleri"},
    {id:398,q:"13 x 13 kaç eder?",o:["169","179","189","199"],a:0,c:"4. Sınıf|Matematik"},
    {id:399,q:"'Ev' kelimesinin eş seslisi (sesteşi) var mıdır?",o:["Evet","Hayır","Bazen","Belki"],a:1,c:"4. Sınıf|Türkçe"},
    {id:400,q:"Hangi duygu organımızla dokunmayı algılarız?",o:["Göz","Kulak","Deri","Dil"],a:2,c:"4. Sınıf|Fen Bilimleri"},
    {id:401,q:"95 - 45 kaç eder?",o:["40","50","60","70"],a:1,c:"4. Sınıf|Matematik"},
    {id:402,q:"'Çiçek' kelimesindeki hece sayısı kaçtır?",o:["1","2","3","4"],a:1,c:"4. Sınıf|Türkçe"},
    {id:403,q:"Hangi madde manyetik özellik göstermez?",o:["Tahta","Demir","Nikel","Kobalt"],a:0,c:"4. Sınıf|Fen Bilimleri"},
    {id:404,q:"30 x 4 kaç eder?",o:["100","120","140","160"],a:1,c:"4. Sınıf|Matematik"},
    {id:405,q:"'Koşmak' fiilinin geniş zaman hali nedir?",o:["Koştum","Koşar","Koşacak","Koşuyor"],a:1,c:"4. Sınıf|Türkçe"},
    {id:406,q:"Hangi gezegen Güneş'e en uzaktır?",o:["Venüs","Merkür","Mars","Neptün"],a:3,c:"4. Sınıf|Fen Bilimleri"},
    {id:407,q:"98 + 2 kaç eder?",o:["90","100","101","110"],a:1,c:"4. Sınıf|Matematik"},
    {id:408,q:"'Renkli' kelimesindeki kök hangisidir?",o:["Renk","Renkli","Li","Ren"],a:0,c:"4. Sınıf|Türkçe"},
    {id:409,q:"Hangi canlı fotosentez yapmaz?",o:["İnsan","Kedi","Çam Ağacı","Köpek"],a:0,c:"4. Sınıf|Fen Bilimleri"},
    {id:410,q:"180 / 3 kaç eder?",o:["30","40","50","60"],a:3,c:"4. Sınıf|Matematik"},
    {id:411,q:"'Okulda' kelimesindeki ek hangisidir?",o:["Okul","-da","Oku","-l"],a:1,c:"4. Sınıf|Türkçe"},
    {id:412,q:"Hangi madde suda batar?",o:["Tahta","Demir","Strafor","Plastik"],a:1,c:"4. Sınıf|Fen Bilimleri"},
    {id:413,q:"9 x 9 kaç eder?",o:["81","82","83","84"],a:0,c:"4. Sınıf|Matematik"},
    {id:414,q:"'Güzelce' kelimesindeki yapım eki hangisidir?",o:["Güzel","-ce","Güz","-el"],a:1,c:"4. Sınıf|Türkçe"},
    {id:415,q:"Hangi organ kanı temizler?",o:["Kalp","Böbrek","Mide","Bağırsak"],a:1,c:"4. Sınıf|Fen Bilimleri"},
    {id:416,q:"55 + 45 kaç eder?",o:["90","100","110","120"],a:1,c:"4. Sınıf|Matematik"},
    {id:417,q:"'Yazmak' fiilinin emir kipi (sen) nedir?",o:["Yaz","Yazsın","Yazalım","Yazınız"],a:0,c:"4. Sınıf|Türkçe"}
    ];
}