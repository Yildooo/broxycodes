# Broxy Code - Profesyonel Web Tasarım ve Geliştirme

## 🚀 Hakkımızda
Broxy Code, modern ve kullanıcı dostu web siteleri geliştiren profesyonel bir web tasarım şirketidir. Kurucu ve baş geliştirici Yılmaz Demircioğlu liderliğinde, işletmenizi dijital dünyada öne çıkaracak çözümler sunuyoruz.

## 👨‍💻 Kurucu
**Yılmaz Demircioğlu** - Kurucu & Baş Geliştirici
- Modern web teknolojileri uzmanı
- Responsive tasarım ve SEO optimizasyonu konularında deneyimli
- Müşteri odaklı çözümler sunan profesyonel geliştirici

## 🌟 Hizmetlerimiz
- **Responsive Web Tasarım** - Tüm cihazlarda mükemmel görünüm
- **E-Ticaret Siteleri** - Modern online mağaza çözümleri
- **Kurumsal Websiteler** - Profesyonel şirket siteleri
- **Restaurant Websites** - Online rezervasyon ve menü yönetimi
- **Kişisel Portfolio** - Modern tasarım ve admin paneli
- **SEO Optimizasyonu** - Google'da üst sıralarda yer alın
- **Mobil Uyumlu Tasarım** - Mobil cihazlar için optimize edilmiş

## 📞 İletişim
- **Telefon:** 05520017538
- **E-posta:** yilma.0601z@gmail.com
- **Website:** [broxycode.github.io](https://broxycode.github.io)

## 🛠️ Teknolojiler
- HTML5 & CSS3
- JavaScript (ES6+)
- Bootstrap 5
- PHP & MySQL
- React & Node.js
- MongoDB & Express
- Responsive Design
- SEO Optimization
- Chart.js (Analytics)

## 🎨 Özellikler
- **Modern BX Logo** - Gradient tasarım ve hover efektleri
- **Admin Panel** - Portfolio yönetimi, mesaj takibi, analitik
- **4 Portfolio Projesi** - Çeşitli sektörlerden örnekler
- **Enhanced Animations** - Smooth transitions ve parallax effects
- **Mobile-First Design** - Responsive ve kullanıcı dostu
- **SEO Optimized** - Google indexing için hazır

## 📊 Admin Panel Özellikleri
- Dashboard ile genel bakış
- Portfolio projelerini ekleme/düzenleme/silme
- İletişim mesajlarını yönetme
- Şirket bilgilerini güncelleme
- Analitik ve istatistikler
- Responsive admin interface

## 🚀 Vercel Deployment

### Gereksinimler
- Node.js 18+
- MongoDB Atlas hesabı
- Vercel hesabı

### Deployment Adımları

1. **Repository'yi Fork/Clone edin**
```bash
git clone https://github.com/yourusername/broxy-code-website.git
cd broxy-code-website
```

2. **Dependencies'leri yükleyin**
```bash
npm install
```

3. **MongoDB Atlas Setup**
- [MongoDB Atlas](https://cloud.mongodb.com) hesabı oluşturun
- Yeni cluster oluşturun
- Database user ekleyin
- Network access ayarlayın (0.0.0.0/0 for Vercel)
- Connection string'i kopyalayın

4. **Vercel'e Deploy edin**
```bash
# Vercel CLI yükleyin
npm i -g vercel

# Deploy edin
vercel
```

5. **Environment Variables (Vercel Dashboard'da ayarlayın)**

Vercel Dashboard > Project > Settings > Environment Variables:

- **Variable Name:** `MONGODB_URI`
- **Value:** `mongodb+srv://username:password@cluster0.mongodb.net/broxycode?retryWrites=true&w=majority`

Veya alternatif olarak:

- **Variable Name:** `MONGO_URL`
- **Value:** `mongodb+srv://username:password@cluster0.mongodb.net/broxycode?retryWrites=true&w=majority`

**MongoDB Atlas Connection String Alma:**
1. MongoDB Atlas > Clusters > Connect
2. "Connect your application" seçin
3. Driver: Node.js, Version: 4.1 or later
4. Connection string'i kopyalayın
5. `<password>` yerine gerçek şifrenizi yazın

### Local Development
```bash
# Development server başlatın
npm run dev

# Vercel dev server
vercel dev
```

## 📊 Real Backend Features

### ✅ Gerçek Özellikler
- **Real Contact Form**: Mesajlar MongoDB'ye kaydediliyor
- **Real Analytics**: Ziyaretçi takibi, sayfa görüntülemeleri
- **Real Admin Panel**: Gerçek verilerle çalışan dashboard
- **Real Portfolio Management**: CRUD operations
- **Real Statistics**: Günlük/haftalık/aylık istatistikler

### 🔧 API Endpoints
- `POST /api/contact` - Contact form submission
- `GET /api/contact` - Get contact messages
- `POST /api/analytics` - Track events
- `GET /api/analytics` - Get analytics data
- `GET/POST/PUT/DELETE /api/portfolio` - Portfolio management

### 📈 Analytics Tracking
- Page views
- Section views
- Button clicks
- Portfolio item clicks
- Contact form submissions
- Device type detection
- Referrer tracking

## 🔒 Security Features
- Input validation and sanitization
- XSS protection
- CORS configuration
- Rate limiting ready
- Environment variables for sensitive data

## 📱 Mobile-First & Responsive
- Fully responsive design
- Touch-friendly admin panel
- Mobile analytics tracking
- Progressive Web App ready

---
© 2024 Broxy Code - Yılmaz Demircioğlu. Tüm hakları saklıdır.