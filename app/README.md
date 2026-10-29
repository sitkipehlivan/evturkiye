# EV Türkiye mobil uygulaması (iOS + Android)

Capacitor 8 ile hazırlanmış yerel kabuk. Uygulama canlı siteyi (https://evturkiye.online) açar; içerik ve araçlar
siteyle birlikte anında güncellenir, mağazaya yeniden gönderim gerekmez. İnternet yoksa `www/index.html` gösterilir.

- Paket kimliği: `com.evturkiye.app` · Uygulama adı: EV Türkiye
- Simge ve açılış ekranı: `resources/` → `npx capacitor-assets generate`
- Yerel eklentiler: konum, bildirim (push), paylaşım, açılış ekranı, durum çubuğu, uygulama içi tarayıcı

## Derleme
- Android: `npm ci && npx cap sync android && npx cap open android` (Android Studio) → imzalı AAB → Google Play Console
- iOS: Mac + Xcode: `npm ci && npx cap sync ios && npx cap open ios` → Archive → App Store Connect

## Yayın öncesi yapılacaklar
1. Google ile giriş: web açılır pencereleri uygulama içinde engellenir → `@capacitor-firebase/authentication` ile yerel Google girişi.
2. Apple ile giriş: Google girişi sunan iOS uygulamalarında App Store kuralı gereği zorunlu (Firebase'de Apple sağlayıcısı + Apple Developer anahtarı).
3. Push bildirimleri: Firebase Cloud Messaging (Android `google-services.json`, iOS APNs anahtarı + `GoogleService-Info.plist`).
4. Mağaza bilgileri: açıklama, ekran görüntüleri, gizlilik politikası adresi, veri güvenliği formu.
