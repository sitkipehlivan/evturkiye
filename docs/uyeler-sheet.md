# Üye listesini Google E-Tablolar'da görmek

Üyeler Firebase'de tutulur (Authentication + Firestore `users`). Bu kurulum, listeyi her 10 dakikada bir
Drive'daki bir Google E-Tablosu'na aktarır. Anahtar veya şifre gerekmez; script, Firebase projesinin sahibi olan
Google hesabınızla (sitki.pehlivan@advancedigital.media) çalışır.

## Kurulum (5 dakika)
1. Drive'da yeni bir Google E-Tablosu açın, adını "EV Türkiye Üyeler" koyun.
2. **Uzantılar → Apps Script**.
3. Soldaki **Proje Ayarları** (çark) → **"appsscript.json" manifest dosyasını düzenleyicide göster** kutusunu işaretleyin.
4. **Düzenleyici**'ye dönün:
   - `appsscript.json` dosyasının içeriğini aşağıdakiyle değiştirin.
   - `Kod.gs` dosyasının içeriğini silip `docs/uyeler-sheet.gs` dosyasının tamamını yapıştırın.
5. Kaydedin (💾). Üstteki fonksiyon listesinden **otomatikGuncellemeKur**'u seçip **Çalıştır**'a basın.
6. Google izin isteyecek: **İzinleri incele → hesabınızı seçin → Gelişmiş → (güvenli değil) projesine git → İzin ver**.
   (Script sizin yazdığınız bir proje olduğu için bu uyarı normaldir.)
7. E-Tabloya dönün: **Üyeler** ve **Özet** sayfaları oluşmuş olur. Bundan sonra her 10 dakikada bir güncellenir;
   anında güncellemek için menüde **EV Türkiye → Üyeleri şimdi güncelle**.

### appsscript.json
```json
{
  "timeZone": "Europe/Istanbul",
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets.currentonly",
    "https://www.googleapis.com/auth/datastore",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/script.scriptapp",
    "https://www.googleapis.com/auth/script.send_mail"
  ]
}
```

## Yeni üye e-posta bildirimi (isteğe bağlı)
Apps Script → **Proje Ayarları → Komut dosyası özellikleri → Özellik ekle**:
`BILDIRIM_EPOSTA` = bildirim gidecek adres. Yeni üye geldiğinde (10 dakikalık kontrolde) e-posta gelir.

## Notlar
- Tablo kişisel veri içerir (ad, e-posta). Yalnızca gerekli kişilerle paylaşın; KVKK aydınlatma metnindeki
  amaçlar dışında kullanmayın. Ticari e-posta yalnızca "Ticari ileti onayı: Evet" olanlara gönderilebilir (İYS).
- Hesabını silen üye bir sonraki güncellemede tablodan da düşer.
- Hata alırsanız: script'i çalıştıran hesabın Firebase projesinde (evturkiye-uyelik) Sahip/Düzenleyici olduğundan
  emin olun.
