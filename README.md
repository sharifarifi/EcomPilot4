## 2.4 Auth / Authorization Sınırları

Bu repo, Firebase tabanlı **istemci tarafı kimlik doğrulama** ve **UI seviyesinde yetki kontrolü** içeriyor. İnceleme sonucunda bu depoda bağımsız bir backend enforcement katmanı veya Firestore security rules dosyası bulunamadı.

### Frontend'de yapılan auth kontrolleri

1. **Login akışı Firebase Auth ile başlıyor.**
   - `Login` bileşeni, form submit edildiğinde `AuthContext` içindeki ortak `login` fonksiyonunu çağırıyor.

2. **Login sonrası `team_members/{uid}` kaydı zorunlu tutuluyor.**
   - `login`, önce `signInWithEmailAndPassword` ile giriş yapıyor.
   - Sonrasında Firestore'da `team_members/{uid}` dokümanını arıyor.
   - Doküman yoksa kullanıcıyı anında `signOut` ediyor ve erişim hatası fırlatıyor.

3. **Oturum değişiminde kullanıcı profili tekrar doğrulanıyor.**
   - `onAuthStateChanged` içinde aynı `team_members/{uid}` kaydı tekrar okunuyor.
   - Doküman varsa `userData` state'ine yükleniyor.
   - Doküman yoksa oturum kapatılıyor.

4. **Uygulama kabuğu yalnızca `currentUser` varsa render ediliyor.**
   - `AuthGuard`, yükleme bitene kadar bekliyor.
   - `currentUser` varsa ana uygulamayı, yoksa login ekranını gösteriyor.

### Frontend'de yapılan authorization kontrolleri

#### 1) Genel modül yetkisi: `hasPerm(permId)`

`App.jsx` içinde merkezi bir `hasPerm` fonksiyonu var:

- `Admin`, `Manager`, `CEO`, `Director` rollerine **tam yetki** veriliyor.
- Diğer kullanıcılar için `userData.permissions` dizisi içindeki modül anahtarları kontrol ediliyor.
- Bu kontrol şu ekranların render edilmesinde kullanılıyor:
  - Dashboard
  - Senaryo Planlayıcı
  - İş Emirleri
  - Manuel Siparişler
  - Günlük Raporlar
  - Giriş/Çıkış
  - İzin Sistemi
  - Raporlar
  - Ayarlar

Bu seviyedeki kontrol esas olarak **UI erişimi / görünürlük kontrolü** sağlıyor.

#### 2) Rol bazlı ekran içi yetkiler

Aşağıdaki bileşenlerde ayrıca `userData?.role` üzerinden rol bazlı kontroller uygulanıyor:

- **TaskBoard**
  - `Admin`, `Manager`, `CEO`, `Director` dışındaki kullanıcılar yalnızca kendilerine atanmış görevleri görebiliyor.
  - Yeni görev açma ve görev silme işlemleri manager rolleri ile sınırlı.
  - Görev durumunu ilerletme işlemi manager'a veya görev sahibine açık.

- **LeaveManager**
  - `isManager` olmayan kullanıcılar pratikte kendi izin akışlarına odaklı çalışıyor.
  - Onay / red gibi yönetici aksiyonları manager rolleri için tasarlanmış.

- **ShiftManager**
  - `isManager` olmayan kullanıcılar yalnızca kendi vardiya kayıtlarını görebiliyor.
  - Yönetici tarafında manuel kayıt / geniş görünüm mantığı mevcut.

- **WorkReport**
  - `isManager` olmayan kullanıcılar yalnızca kendi raporlarını görebiliyor.
  - Düzenleme kuralı ayrıca daraltılmış: yönetici değilse yalnızca 24 saat içinde kendi raporunu düzenleyebiliyor.

- **Komisyon ekranları**
  - `RetailCommission`: `Admin`, `Manager`, `Director`, `CEO`
  - `SocialMediaCommission`: `Admin`, `Manager`, `Director`, `CEO`
  - `OperationCommission`: `Admin`, `Manager`, `Director`, `CEO`, `Operations Manager`
  - Bu ekranlarda yetkili kullanıcılar ekip geneli detaylarını görebilirken, yetkisiz kullanıcılar çoğunlukla sadece kendi verisini görebilecek / kaydedebilecek şekilde kurgulanmış.

#### 3) Kullanıcıya özel veri sınırları

Bazı ekranlarda doğrudan `currentUser.uid` / `userData.uid` ile kayıtlar daraltılıyor:

- görev listelerinde `task.assignee === userData?.uid`
- vardiya kayıtlarında `shift.userId === userData?.uid`
- günlük raporlarda `report.userId === userData?.uid`
- komisyon ekranlarında kullanıcının kendi aylık verisi `currentUser.uid` ile çekiliyor
- bildirimler kullanıcı UID'sine göre subscribe ediliyor

Bu kontroller de istemci tarafında uygulanıyor.

## Firestore security rules / backend enforcement durumu

### Repo içinde bulunanlar

- Firebase Web SDK kurulumu var.
- Firestore/Auth/Storage istemci başlatımı var.
- `src/firebase/` altında istemci tarafı veri erişim servisleri var.

### Repo içinde bulunmayanlar

İnceleme sırasında aşağıdakiler bu repo içinde bulunmadı:

- `firestore.rules`
- `firebase.json`
- `.firebaserc`
- Cloud Functions / ayrı backend auth enforcement katmanı
- Firebase Admin SDK kullanan bir servis

### Sonuç

Bu bulgulara göre:

- **Firestore security rules büyük olasılıkla bu repo dışında yönetiliyor** ya da henüz versiyonlanmamış.
- **Backend enforcement bu repo içinde görünmüyor.**
- Bu repo içindeki authorization kontrolleri ağırlıklı olarak **frontend / UI seviyesinde** uygulanıyor.

### Ek not

`teamService.js` içinde kullanıcıyı Firebase Auth'tan silmek için Admin SDK gerektiğini söyleyen açık bir yorum var. Bu da yönetimsel / sunucu tarafı enforcement mantığının bu repo içinde yer almadığını destekliyor.
