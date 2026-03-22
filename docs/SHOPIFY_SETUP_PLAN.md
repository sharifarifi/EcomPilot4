# Shopify Bağlantı Planı

## Birebir kod planı

1. `functions/src/handlers/startInstall.ts`
   - `shop` ve `returnTo` alacak.
   - Güvenli state oturumu oluşturup Firestore'a yazacak.
   - Frontend'e doğrudan Shopify authorize URL dönecek.

2. `functions/src/handlers/authCallback.ts`
   - HMAC ve state doğrulayacak.
   - Token exchange sonucunu kaydedecek.
   - `shopify_stores` ile birlikte `settings/integrations` dokümanını da güncelleyecek.
   - İşlem sonunda kullanıcıyı `APP_BASE_URL + returnTo` adresine geri yönlendirecek.

3. `src/config/shopify.js`
   - Frontend sadece güvenli Functions endpoint URL'ini üretecek.
   - Shopify authorize URL frontend'de üretilmeyecek.
   - `.myshopify.com` validasyonu burada yapılacak.

4. `src/components/integrations/ShopifyInstallButton.jsx`
   - Buton önce `shopifyStartInstall` endpoint'ini çağıracak.
   - Dönen `installUrl` ile Shopify'ye yönlendirme yapacak.
   - Hata durumunu parent component'e iletecek.

5. `src/components/settings/integrations/IntegrationLayout.jsx`
   - Shopify modalında güvenli install flow açıklaması gösterilecek.
   - Install isteği Firestore'a `pending_oauth` olarak işlenecek.
   - Endpoint hataları toast/log olarak kullanıcıya gösterilecek.

6. `.env.example`
   - Frontend için sadece `VITE_SHOPIFY_FUNCTIONS_BASE_URL` örneği verilecek.
   - Callback URL artık backend tarafından `SHOPIFY_APP_URL` üzerinden hesaplanacak.

## Install flow özeti

1. Kullanıcı Entegrasyonlar > Shopify modalını açar.
2. `shopUrl` alanında mağaza domaini bulunur.
3. `Shopify bağla` butonu `shopifyStartInstall` endpoint'ine gider.
4. Backend state oluşturur ve Shopify authorize URL döner.
5. Frontend kullanıcıyı Shopify OAuth ekranına yönlendirir.
6. Shopify callback sonrası backend token exchange yapar ve kullanıcıyı uygulamaya geri yönlendirir.

## Firebase / Firestore beklenen veri güncellemesi

- `shopify_install_sessions/{stateHash}`
- `shopify_stores/{shopDomain}`
- `settings/integrations` içindeki `1` numaralı Shopify kaydı

## Notlar

- Shopify secret ve webhook secret frontend'e taşınmamalıdır.
- Frontend yalnızca Functions endpoint'ine gider; authorize URL backend tarafından üretilir.
- Access token halen plaintext Firestore'a yazılmamalıdır.
