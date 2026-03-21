# Contributing / Coding Guidelines

Bu repo için amaç; import karmaşasını, casing farklarını, aşırı büyük component dosyalarını ve dağınık service kullanımını azaltmaktır. Yeni geliştirmelerde aşağıdaki standartlar takip edilmelidir.

## 1. Import Naming Standardı

- Aynı klasördeki dosyalarda relative import kullanın; çok derinleşen yapılarda klasör içi barrel eklemek düşünülebilir ancak gereksiz soyutlama eklemeyin.
- Import path casing'i gerçek dosya adı ile birebir aynı olmalıdır. Örneğin `./FinanceReportHeader` varsa farklı büyük/küçük harf varyasyonları kullanılmamalıdır.
- Named export ve default export birlikte kullanılacaksa önce third-party, sonra local import sıralaması tercih edilmelidir.
- Kullanılmayan import bırakmayın; lint temiz kalmalıdır.

Önerilen sıra:

1. React / framework importları
2. üçüncü parti paketler
3. uygulama içi mutlak/üst seviye importlar
4. local relative importlar
5. stil dosyaları

## 2. Dosya İsimlendirme Standardı

- React component dosyaları: `PascalCase.jsx`
- Hook dosyaları: `useSomething.js` veya `useSomething.jsx`
- Service dosyaları: `camelCaseService.js`
- Sabit/config dosyaları: `camelCase.js` veya anlamlı domain adı (`constants.js`, `catalog.js`)
- Demo/mock veri dosyaları: `src/demo-data/` altında domain bazlı konumlandırılmalıdır.

## 3. Component Büyüklüğü Sınırı

- Tek bir component dosyası mümkün olduğunca yaklaşık 200 satırı aşmamalıdır.
- 250+ satır seviyesine gelen componentler için presentational alt bileşenlere veya hook'lara bölme değerlendirilmelidir.
- Bir component hem yoğun UI render'ı hem de yoğun iş kuralı içeriyorsa business logic özel hook/helper katmanına çıkarılmalıdır.

## 4. Hook Kullanım İlkeleri

- Custom hook'lar yalnızca tekrar kullanılabilir state, derived data veya event orchestration mantığı taşımalıdır.
- Hook içine sadece component'e özel JSX yerleştirilmemelidir.
- Hesaplama ağırlıklı derived değerler için gerektiğinde `useMemo`, callback referans kararlılığı gerçekten önemliyse `useCallback` kullanılmalıdır.
- Hook'lar side-effect içeriyorsa veri bağımlılıkları açık ve minimal tutulmalıdır.

## 5. Mock / Demo Data Yeri

- Demo veri component dosyalarının içinde inline tanımlanmamalıdır.
- Tekrar kullanılan demo katalogları ve rapor örnekleri `src/demo-data/` altında domain klasörleriyle tutulmalıdır.
- Demo veri ile gerçek servis verisi birbirine karışmamalı; isimlendirme bu farkı açık etmelidir.

## 6. Service Katmanı Standardı

- Firebase erişimi doğrudan büyük UI component'lerin içine yazılmamalıdır.
- Firestore/Auth/Storage erişimi `src/firebase/` altındaki service dosyalarında tutulmalıdır.
- Aynı CRUD/subscription deseni birden fazla yerde tekrar ediyorsa ortak helper/service abstraction tercih edilmelidir.
- Service fonksiyonları girdileri doğrulamalı, hata mesajları bağlam içermeli ve mümkün olduğunca saf veri dönmelidir.
- UI katmanı service detaylarını değil, iş akışını bilmeli; mümkün olduğunda service çağrıları hook veya controller benzeri katmanlardan yapılmalıdır.

## 7. Test Stratejisi

Bu repo için önce test stratejisi netleştirilmelidir; her bileşene otomatik test eklemek başlangıç için en doğru yatırım olmayabilir. Önerilen öncelik sırası:

### Aşama 1 — Minimum Güvence
- Her PR'da en az `npm run build` zorunlu smoke check olmalıdır.
- Mümkünse `npm run lint` de zorunlu kalite kapısı olarak çalıştırılmalıdır.

### Aşama 2 — Unit Test Öncelikleri
Önce saf iş kuralları test edilmelidir:

- komisyon hesaplama helper'ları,
- senaryo planlama hesapları,
- veri dönüştürme / mapper fonksiyonları,
- Firestore service helper'larının girdi/çıktı davranışı.

Bu alanlar UI snapshot testlerinden daha yüksek geri dönüş sağlar.

### Aşama 3 — Component Test Öncelikleri
Component testleri tüm ekranlar için değil, kritik davranışlar için eklenmelidir:

- form submit ve validasyon akışları,
- rol/izin nedeniyle değişen kritik render koşulları,
- modal aç/kapat ve kaydet akışları,
- hata/boş durum ekranları.

### Aşama 4 — Entegrasyon / E2E
Ekip ihtiyacı büyüdüğünde aşağıdaki akışlar için E2E düşünülmelidir:

- login + dashboard açılışı,
- görev oluşturma / güncelleme,
- izin talebi akışı,
- rapor ekranlarının temel yüklenmesi.

### Hangi Test Tipi Gerçekten Gerekli?
Şu anki mimariye göre en mantıklı başlangıç:

1. build + lint smoke kontrolleri,
2. saf helper/service unit testleri,
3. kritik component davranış testleri.

Tam kapsamlı component snapshot yaklaşımı şu aşamada öncelikli değildir.
