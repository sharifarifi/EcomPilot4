# E-ComPilot 4

E-ComPilot 4, e-ticaret ekiplerinin günlük operasyonlarını tek panelden yönetebilmesi için hazırlanmış bir React + Firebase yönetim uygulamasıdır. Uygulama; dashboard, görev ve sipariş takibi, izin/vardiya yönetimi, raporlar, komisyon ekranları ve entegrasyon ayarları gibi modülleri tek bir arayüzde birleştirir.

## Proje Amacı

Bu proje aşağıdaki operasyonel ihtiyaçları tek yerde toplamak için geliştirilmiştir:

- ekip üyelerinin giriş yapabildiği rol/izin odaklı bir yönetim paneli sunmak,
- günlük iş emirleri, manuel siparişler, vardiyalar ve izin süreçlerini takip etmek,
- satış, operasyon, personel ve finans raporlarını görselleştirmek,
- mağaza / sosyal medya / operasyon komisyon senaryolarını yönetmek,
- entegrasyon ve genel sistem ayarlarını merkezi bir arayüzden düzenlemek.

## Teknoloji Stack

### Uygulama Katmanı
- React 19
- React Router DOM 7
- Vite (rolldown-vite)
- Tailwind CSS
- Lucide React
- Recharts
- XLSX

### Backend / Servisler
- Firebase Authentication
- Cloud Firestore
- Firebase Storage

### Geliştirme Araçları
- ESLint 9
- PostCSS
- Autoprefixer
- npm

## Temel Özellikler

- Kimlik doğrulama ve kullanıcı profili kontrolü
- Rol/izin bazlı ekran görünürlüğü
- Dashboard ve dönem filtreleri
- Senaryo planlayıcı
- İş emirleri ve manuel sipariş yönetimi
- Günlük rapor, vardiya ve izin akışları
- Satış, personel, operasyon ve finans raporları
- Komisyon modülleri
- Entegrasyon ve sistem ayarları

## Proje Yapısı

Aşağıdaki klasörler onboarding açısından en önemli giriş noktalarıdır:

- `src/App.jsx`: ana uygulama kabuğu, navigasyon ve ekran geçişleri.
- `src/context/AuthContext.jsx`: oturum yönetimi ve kullanıcı profili yükleme akışı.
- `src/firebase/`: Firestore/Auth/Storage erişimi ve servis katmanı.
- `src/components/`: ekranlar ve modüler UI bileşenleri.
- `src/demo-data/`: demo amaçlı rapor ve entegrasyon verileri.
- `.env.example`: gerekli Vite/Firebase ortam değişkenleri.

## Gereksinimler

Projeyi lokal ortamda çalıştırmak için önerilen minimum gereksinimler:

- Node.js 20+
- npm 10+
- aktif bir Firebase projesi

## Kurulum Adımları

1. Repoyu klonlayın.
2. Bağımlılıkları yükleyin.
3. Ortam değişkenlerini tanımlayın.
4. Firebase tarafında Authentication ve Firestore kurulumunu tamamlayın.
5. Geliştirme sunucusunu başlatın.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Uygulama varsayılan olarak Vite geliştirme sunucusunda açılır. Terminal çıktısındaki lokal adresi kullanarak erişebilirsiniz.

## Setup Checklist

Yeni geliştirici için hızlı kurulum kontrol listesi:

- [ ] Node.js sürümü `20+`
- [ ] `npm install` çalıştırıldı
- [ ] `.env.local` dosyası `.env.example` baz alınarak hazırlandı
- [ ] Firebase projesi oluşturuldu ve web app config değerleri ortama eklendi
- [ ] `npm run dev` ile lokal geliştirme sunucusu açıldı
- [ ] `npm run build` ile production build doğrulandı
- [ ] `npm run lint` ile temel statik analiz çalıştırıldı

Bu checklist özellikle sözlü onboarding bilgisini azaltmak ve yeni gelen geliştiricinin ilk gün doğrulamasını standartlaştırmak için eklenmiştir.

## Environment Değişkenleri

Uygulama açılırken Firebase ayarları eksikse hata fırlatır. Bu nedenle aşağıdaki değişkenlerin tamamı zorunludur:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Örnek dosya: `.env.example`.

### Önemli Notlar
- Bu değişkenler istemci tarafında `src/firebase/firebaseConfig.js` içinde doğrulanır.
- Değerlerden biri boş bırakılırsa uygulama başlatma aşamasında hata verir.
- Lokal geliştirmede `.env.local` kullanılması önerilir.

## Firebase Setup

Bu repo Firebase Web SDK kullanır ve uygulama açılışında aşağıdaki servisleri başlatır:

- Auth
- Firestore
- Storage

### Kurulum Adımları

1. Firebase Console üzerinden bir proje oluşturun.
2. Web app ekleyin.
3. Authentication'ı etkinleştirin.
4. Firestore Database oluşturun.
5. Gerekliyse Storage'ı etkinleştirin.
6. Web app config değerlerini `.env.local` dosyanıza ekleyin.

### Auth Akışı Hakkında

- Login işlemi Firebase Auth ile yapılır.
- Giriş sonrası kullanıcı için `team_members/{uid}` kaydının bulunması beklenir.
- Bu profil kaydı yoksa kullanıcı oturumu kapatılır.
- Ana uygulama kabuğu `AuthContext` üzerinden yüklenen kullanıcı durumuna göre render edilir.

### Firestore ile İlgili Beklenti

Repo içinde istemci tarafı servisler vardır ancak Firebase proje içi güvenlik kuralları bu repoda yer almaz. Bu nedenle gerçek ortamda aşağıdakileri ayrıca yapılandırmanız gerekir:

- Firestore security rules
- kullanıcı rollerine uygun erişim politikaları
- gerekiyorsa backend / admin operasyonları

## npm Script'leri

`package.json` içinde tanımlı script'ler:

- `npm run dev`: geliştirme sunucusunu başlatır.
- `npm run build`: production build üretir.
- `npm run preview`: build çıktısını lokal olarak önizler.
- `npm run lint`: tüm projede ESLint çalıştırır.
- `npm run check`: sırasıyla build ve lint çalıştırır.

## Build ve Lint Komutları

Geliştirme sırasında en sık kullanılacak komutlar:

```bash
npm run dev
npm run build
npm run lint
npm run check
```

Önerilen akış:

1. geliştirme sırasında `npm run dev`,
2. değişiklik sonrası `npm run build`,
3. PR öncesi `npm run lint` veya `npm run check`.

## Bilinen Kısıtlar

Projeyi devralacak geliştiriciler için mevcut sınırlamalar:

- Repo ağırlıklı olarak istemci tarafı uygulama kodu içerir; bağımsız bir backend enforcement katmanı görünmez.
- Firestore security rules, `firebase.json` ve `.firebaserc` bu repoda yer almamaktadır.
- Bazı raporlar ve entegrasyon ekranları gerçek API yerine demo veri ile çalışır.
- Yetkilendirme mantığının önemli bir kısmı UI seviyesinde uygulanır; bu tek başına güvenlik kontrolü olarak yeterli değildir.
- Build çıktısında büyük bundle uyarısı görülebilir; ileri aşamada code-splitting değerlendirilebilir.
- Firebase bağımlılığı nedeniyle gerçek kullanımda doğru environment değişkenleri olmadan uygulama açılamaz.

## Deploy Notları

Bu repo içinde net bir deploy pipeline tanımı bulunmuyor. Yine de mevcut yapı Vite tabanlı statik dağıtıma uygundur.

### Genel Deploy Akışı

1. Production ortam değişkenlerini tanımlayın.
2. `npm run build` ile dağıtım çıktısını üretin.
3. `dist/` klasörünü statik hosting ortamına yükleyin.
4. Firebase kullanıyorsanız ilgili Auth / Firestore / Storage yapılandırmalarının production projede hazır olduğundan emin olun.

### Uygun Hosting Seçenekleri

- Firebase Hosting
- Vercel
- Netlify
- herhangi bir statik dosya servis edebilen CDN / hosting çözümü

### Dikkat Edilecek Noktalar

- Tüm `VITE_FIREBASE_*` değişkenleri deploy ortamında tanımlı olmalıdır.
- Route yönetimi client-side olduğu için SPA fallback ayarı gerekebilir.
- Prod ortamında Firestore kuralları ve kullanıcı rollerinin doğru yapılandırılması kritik önemdedir.

## Geliştirme Notları

- UI bileşenleri büyük ölçüde Tailwind utility sınıfları ile stillenir.
- Yeni servis eklerken `src/firebase/` altındaki mevcut servis desenlerini takip edin.
- Demo veri kullanılan ekranlarda mümkünse statik listeleri `src/demo-data/` altında toplayın.
- Büyük ekran bileşenlerini modüler alt bileşenlere ayırmak bakım maliyetini düşürür.

## Sorun Giderme

### Uygulama açılır açılmaz Firebase config hatası alıyorum
- `.env.local` dosyanızın var olduğundan emin olun.
- Tüm `VITE_FIREBASE_*` alanlarının dolu olduğunu kontrol edin.
- Geliştirme sunucusunu environment değişikliği sonrası yeniden başlatın.

### Giriş yapabiliyorum ama panel açılmıyor
- İlgili kullanıcının Firestore içindeki `team_members/{uid}` kaydını kontrol edin.
- Kullanıcının rol ve izin alanlarının beklenen formatta olduğundan emin olun.

### Build sırasında büyük chunk uyarısı görüyorum
- Bu şu anda bilinen bir kısıttır.
- İleride route-level veya feature-level code splitting uygulanabilir.

## Lisans / Kullanım

Bu repo içinde açık bir lisans bildirimi bulunmamaktadır. Kurumsal ya da ekip içi kullanım koşulları için depo sahibinin tercih ettiği lisanslama yaklaşımı netleştirilmelidir.

## Katkı ve Kodlama Standartları

Repo için kısa geliştirme standartları `CONTRIBUTING.md` içinde tutulur. Bu doküman aşağıdaki konuları kapsar:

- import naming ve import path standardı,
- dosya isimlendirme standardı,
- component boyutu ve parçalama beklentisi,
- hook kullanım ilkeleri,
- mock/demo data konumu,
- Firebase/service katmanı standardı,
- önerilen test stratejisi.

Yeni bir feature geliştirirken README ile birlikte `CONTRIBUTING.md` okunması önerilir.
