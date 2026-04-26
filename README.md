# 🏠 Ailece Bil! — Aile Bilgi Yarışması

**Beraber düşün, birlikte kazan!**

---

## 📁 Dosya Yapısı

```
ailecebil/
├── index.html          ← Ana sayfa (giriş + mod seçimi + quiz)
├── admin.html          ← Admin paneli
├── liderlik.html       ← Sıralama tablosu
├── profil.html         ← Kullanıcı profili
├── css/
│   └── style.css       ← Tüm stiller
└── js/
    ├── store.js        ← localStorage yönetimi (tüm sayfalar kullanır)
    ├── auth.js         ← Giriş / kayıt
    ├── quiz.js         ← Quiz motoru
    └── admin.js        ← Admin fonksiyonları
```

---

## 🚀 GitHub Pages'e Yükleme

### 1. GitHub'da Repo Oluştur
- github.com → New repository
- İsim: `ailece-bil` (veya istediğin isim)
- Public seç
- Create repository

### 2. Dosyaları Yükle
```bash
git init
git add .
git commit -m "İlk sürüm"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/ailece-bil.git
git push -u origin main
```

### 3. GitHub Pages Aktif Et
- Repo → Settings → Pages
- Source: Deploy from a branch
- Branch: main / root
- Save

### 4. URL'n Hazır!
```
https://KULLANICI_ADIN.github.io/ailece-bil/
```

---

## 🔑 Varsayılan Admin Girişi
- Kullanıcı adı: `admin`
- Şifre: `admin1234`

> **Önemli:** İlk girişten sonra şifreyi değiştirin!

---

## ✨ Özellikler

| Özellik | Açıklama |
|---|---|
| 🧒 Çocuk Modu | Sınıf ve konu bazlı sorular |
| 🧑 Büyük Modu | Genel kategori soruları |
| ⏱️ Süre Modu | 10 / 20 / 30 saniye seçimi |
| 🎯 Çok Oyunculu | Aynı cihazda 2-6 kişi |
| 💡 Jokerler | 50/50, Geç, +10sn |
| 📅 Günün Sorusu | +25 bonus puan |
| 🏆 Liderlik | Günlük / Haftalık / Tüm zamanlar |
| 🔔 Rozetler | 8 farklı başarı rozeti |
| 📊 Performans | Konu bazlı başarı grafikleri |
| 📢 Duyuru | Admin kayan yazı duyurusu |
| 📦 Toplu Soru | JSON formatında toplu yükleme |

---

## 📊 Google Sheets Entegrasyonu

1. Google Sheets'te yeni tablo oluştur
2. Uzantılar → Apps Script
3. Şu kodu yapıştır:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(),
    data.user,
    data.score,
    data.correct,
    data.wrong,
    data.cat
  ]);
  return ContentService.createTextOutput('OK');
}
```

4. Dağıt → Web uygulaması olarak dağıt → Herkes erişebilir
5. URL'yi kopyala → Admin → Ayarlar → Google Sheets'e yapıştır

---

## 📝 Toplu Soru Ekleme Formatı

```json
[
  {
    "q": "Soru metni",
    "o": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],
    "a": 1,
    "c": "Genel Kültür"
  }
]
```

**Çocuklar için kategori formatı:** `"1. Sınıf|Matematik"`

---

*Ailece Bil! v1 — Tüm hakları saklıdır*
