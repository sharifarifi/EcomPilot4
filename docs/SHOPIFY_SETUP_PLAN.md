# Shopify Bağlantı Planı

## Birebir kod planı

1. `src/config/shopify.js`
   - Shopify mağaza domainini normalize eden yardımcı fonksiyon eklenecek.
   - Install URL üretimi tek merkezde tutulacak.
   - Frontend'in kullanacağı `VITE_SHOPIFY_*` değişkenleri burada okunacak.

2. `src/components/integrations/ShopifyInstallButton.jsx`
   - Tekrar kullanılabilir `Shopify bağla` butonu eklenecek.
   - Buton, bu projedeki Tailwind/Lucide tasarım diline uygun olacak.
   - Tıklamada backend install endpoint'ine yönlendirme yapacak.

3. `src/components/settings/integrations/IntegrationLayout.jsx`
   - Shopify modalında hazır install flow alanı gösterilecek.
   - Kullanıcının girdiği `shopUrl` alanı ile install URL önizlemesi üretilecek.
   - Redirect öncesi Firestore'a `pending_oauth` durumu ve log satırı yazılacak.

4. `.env.example`
   - Firebase web config değerleri kopyala-yapıştır formatında güncellenecek.
   - Shopify/Firebase backend env listesi boş secret alanlarıyla örneklenmiş olacak.
   - Vercel domaini, Shopify domaini ve Pub/Sub service account alanları örneğe eklenecek.

## Install flow özeti

1. Kullanıcı Entegrasyonlar > Shopify modalını açar.
2. `shopUrl` alanında mağaza domaini bulunur.
3. `Shopify bağla` butonu `VITE_SHOPIFY_INSTALL_ENDPOINT` adresine gider.
4. Query parametreleri: `shop`, `redirectUri`, `returnTo`.
5. Backend OAuth başlatır, callback sonunda access token işlemlerini server tarafında tamamlar.
6. Frontend/Firestore kaydı `pending_oauth -> connected` şeklinde güncellenir.

## Firebase / Firestore beklenen veri güncellemesi

`settings/integrations` dokümanında Shopify kaydı için aşağıdaki alanlar tutulmalıdır:

- `fields.shopUrl`
- `shopDomain`
- `status`
- `connectionState`
- `installUrl`
- `updatedAt`
- `logs`

## Notlar

- Shopify secret ve webhook secret frontend'e taşınmamalıdır.
- `VITE_SHOPIFY_INSTALL_ENDPOINT` boş kalırsa varsayılan olarak `/api/shopify/install` kullanılır.
- Callback ve token exchange kodu halen backend tarafında tamamlanmalıdır.
