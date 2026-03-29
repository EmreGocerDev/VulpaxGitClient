<p align="center">
  <img src="assets/logovulpax.png" alt="Vulpax Git Client" width="120" height="120" style="border-radius: 20px;">
</p>

<h1 align="center">Vulpax Git Client</h1>

<p align="center">
  <strong>Modern, Tam Özellikli GitHub Masaüstü İstemcisi</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows-blue?style=flat-square&logo=windows" alt="Platform">
  <img src="https://img.shields.io/badge/Electron-28.x-47848F?style=flat-square&logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/License-Proprietary-orange?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/Version-1.0.0-green?style=flat-square" alt="Version">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/GitHub%20API-REST%20v3-181717?style=flat-square&logo=github" alt="GitHub API">
  <img src="https://img.shields.io/badge/Node.js-24.x-339933?style=flat-square&logo=node.js" alt="Node.js">
</p>

---

## 📖 Hakkında

**Vulpax Git Client**, GitHub'ın tüm özelliklerini masaüstünüze getiren modern bir Electron uygulamasıdır. GitHub'ın karanlık temasından ilham alan şık arayüzü, 50'den fazla özelliği ve sıfırdan başlayanlar için hazırlanmış Türkçe öğreticileri ile hem yeni başlayanlar hem de deneyimli geliştiriciler için idealdir.

> **Vulpax Digital** tarafından geliştirilmiştir.

---

## ✨ Özellikler

### 🔐 Kimlik Doğrulama
- GitHub Personal Access Token (PAT) ile güvenli giriş
- Token'ın güvenli yerel depolanması
- Otomatik oturum hatırlama
- Güvenli çıkış yapma

### 📦 Repository Yönetimi
- Tüm repoları listeleme (public, private, fork filtresi)
- Yeni repo oluşturma (README, .gitignore, lisans seçenekleri)
- Repo silme
- Repo forklama
- Repo detay görüntüleme
- Repo arama ve filtreleme (isim, yıldız, güncelleme tarihi)
- Clone URL ve origin komutunu kopyalama

### 🔀 Branch Yönetimi
- Tüm branch'leri listeleme
- Yeni branch oluşturma (kaynak branch seçimi)
- Branch silme
- Protected branch gösterimi
- Varsayılan branch gösterimi

### 📝 Commit Geçmişi
- Son 50 commit'i listeleme
- Commit detayı görüntüleme (diff, eklenen/silinen satırlar)
- Dosya bazında değişiklikleri görme
- Commit mesajı, yazar ve tarih bilgileri

### 🔃 Pull Request Yönetimi
- PR listeleme (açık, kapalı, tümü)
- Yeni PR oluşturma (başlık, açıklama, kaynak/hedef branch)
- PR merge etme (merge yöntemi seçimi)
- PR kapatma
- PR durumu gösterimi (open, closed, merged)

### 🐛 Issue Yönetimi
- Issue listeleme (açık, kapalı, tümü)
- Yeni issue oluşturma (başlık, açıklama, etiketler)
- Issue kapatma
- Issue detay görüntüleme
- Yorum ekleme ve okuma
- Etiket (label) desteği

### ⚡ GitHub Actions
- Workflow listeleme
- Workflow çalışmalarını (runs) görüntüleme
- Çalışma durumu gösterimi (başarılı, başarısız, devam ediyor)

### 🚀 Release Yönetimi
- Release listeleme
- Yeni release oluşturma (tag, başlık, notlar)
- Draft ve pre-release desteği
- Tag listeleme

### 📋 Gist Yönetimi
- Gist listeleme
- Yeni gist oluşturma (dosya adı, içerik, public/secret)
- Gist silme

### ⭐ Yıldız (Star) İşlemleri
- Yıldızlı repoları listeleme
- Repo yıldızlama / yıldız kaldırma

### 🔔 Bildirimler
- GitHub bildirimlerini listeleme
- Bildirimi okundu olarak işaretleme
- Bildirim tipi ve repo bilgisi

### 🔍 GitHub Arama
- Repo arama (sonuç sayısı, yıldız, fork bilgisi)
- Kullanıcı arama (profil fotosu, bio)

### 📂 Yerel Git İşlemleri
- Repo klonlama (HTTPS, token ile otomatik auth)
- Git init (yeni repo başlatma)
- Git status (değişiklikleri görüntüleme)
- Git add (dosya stage'leme)
- Git commit (mesajla kaydetme)
- Git push (GitHub'a gönderme)
- Git pull (GitHub'dan çekme)
- Git fetch
- Git diff (değişiklikleri karşılaştırma)
- Git stash / stash pop
- Git checkout (branch değiştirme)
- Git remote add
- Yerel branch listeleme
- Git log (yerel commit geçmişi)

### 👥 İşbirlikçi Yönetimi
- Collaborator listeleme
- Collaborator ekleme (Read/Write/Admin yetki seçimi)
- Collaborator çıkarma

### 🗂️ Dosya Tarayıcı
- Repo dosya/klasör yapısını görüntüleme
- Dosya içeriğini okuma
- Breadcrumb navigasyonu
- README önizleme

### 🏢 Organizasyonlar
- Üye olunan organizasyonları listeleme

### 👤 Profil
- Profil bilgilerini görüntüleme
- İstatistikler (repo, gist, takipçi, takip edilen)
- Takipçi listesi
- Ek bilgiler (şirket, konum, e-posta, web sitesi)

### 🎨 Tema Desteği
- **Dark** — GitHub karanlık tema (varsayılan)
- **Dark Dimmed** — Yumuşak karanlık tema
- **Light** — Açık tema

### 📖 Öğreticiler
- Sıfırdan GitHub öğretici rehberleri (Türkçe)
- 7 bölüm, 20+ alt başlık
- Her buton ve kavram detaylıca açıklanmış
- SSS (Sık Sorulan Sorular) bölümü

---

## 🖥️ Ekran Görüntüleri

> Uygulama GitHub'ın resmi karanlık temasını kullanır.

---

## 🚀 Kurulum

### Hazır Kurulum (Windows)

1. [Releases](https://github.com/EmreGocerDev/VulpaxGitClient/releases) sayfasından en son sürümü indirin
2. `Vulpax Git Client Setup.exe` dosyasını çalıştırın
3. Kurulum sihirbazını takip edin
4. Uygulamayı başlatın

### Kaynak Koddan Çalıştırma

```bash
# Repoyu klonlayın
git clone https://github.com/EmreGocerDev/VulpaxGitClient.git

# Dizine girin
cd VulpaxGitClient

# Bağımlılıkları yükleyin
npm install

# Uygulamayı başlatın
npm start

# Windows için build alın
npm run build
```

---

## 🔧 Gereksinimler

- **İşletim Sistemi:** Windows 10/11
- **Node.js:** v18+ (geliştirme için)
- **GitHub Hesabı:** Personal Access Token gereklidir

### Token İzinleri (Scopes)

Token oluştururken şu izinleri seçin:
- `repo` — Repo erişimi
- `user` — Kullanıcı bilgileri
- `gist` — Gist işlemleri
- `notifications` — Bildirimler
- `admin:org` — Organizasyon bilgileri
- `delete_repo` — Repo silme
- `workflow` — GitHub Actions

---

## 🛠️ Teknolojiler

| Teknoloji | Kullanım |
|-----------|----------|
| [Electron](https://www.electronjs.org/) | Masaüstü uygulama çatısı |
| [Octokit](https://github.com/octokit/rest.js) | GitHub REST API istemcisi |
| [simple-git](https://github.com/steveukx/git-js) | Node.js Git istemcisi |
| [electron-store](https://github.com/sindresorhus/electron-store) | Güvenli yerel depolama |
| [electron-builder](https://www.electron.build/) | Uygulama paketleme ve dağıtım |

---

## 📁 Proje Yapısı

```
VulpaxGitClient/
├── assets/
│   ├── logovulpax.png      # Uygulama logosu (PNG)
│   ├── icon.ico             # Windows ikonu (ICO)
│   └── icon.svg             # Vektör logo
├── renderer/
│   ├── index.html           # Ana HTML yapısı
│   ├── styles.css           # GitHub temalı stiller
│   └── app.js               # İstemci tarafı uygulama mantığı
├── main.js                  # Electron ana süreç (IPC handlers)
├── preload.js               # Güvenli API köprüsü
├── package.json             # Proje yapılandırması
└── README.md                # Bu dosya
```

---

## 📄 Lisans

**Vulpax Git Client** — Tüm hakları saklıdır.

© 2024-2026 **Vulpax Digital**. Bu yazılım Vulpax Digital'in mülkiyetindedir.

Bu yazılımın kaynak kodu eğitim ve inceleme amaçlı paylaşılmıştır. İzinsiz ticari kullanım, dağıtım veya değiştirme yasaktır. Kişisel kullanım serbesttir.

Detaylı lisans bilgisi için [LICENSE](LICENSE) dosyasına bakın.

---

## 🤝 Katkıda Bulunma

Katkıda bulunmak isterseniz:

1. Repoyu fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik eklendi'`)
4. Branch'inizi push edin (`git push origin feature/yeni-ozellik`)
5. Pull Request açın

---

## 📬 İletişim

- **Geliştirici:** Vulpax Digital
- **GitHub:** [@EmreGocerDev](https://github.com/EmreGocerDev)

---

<p align="center">
  <strong>Vulpax Digital</strong> ile ❤️ ile yapılmıştır.
</p>
