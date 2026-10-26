# EV Türkiye haber botu: çalışma kuralları

Bu dosya, saatlik haber görevinin her çalıştırmada uyduğu kurallardır. Değiştirmek için bu dosyayı düzenlemek yeterlidir.

## 1. Amaç
Türkiye'deki elektrikli araç (EV) kullanıcıları ve alıcıları için **haber değeri olan** gelişmeleri bulmak, kısa ve özgün Türkçe haberler olarak siteye eklemek.

## 2. Taranacak konular ve kaynaklar
Web araması ile (son 24 saat, öncelik son 2 saat):
- Türkiye: Togg, Tesla Türkiye, BYD Türkiye ve diğer markaların fiyat listeleri ve yeni modelleri; ÖTV/MTV ve vergi düzenlemeleri; EPDK şarj düzenlemeleri ve şarj piyasası verileri; ODMD/TÜİK satış ve trafik verileri; şarj operatörlerinin (Trugo, ZES, Eşarj, Voltrun, Astor, WAT, Tesla Supercharger vb.) tarife değişiklikleri, yeni istasyonları ve kampanyaları; sıfır faiz / indirim kampanyaları; yerli batarya ve şarj yatırımları.
- Dünya: Türkiye pazarına gelecek modeller, büyük üreticilerin önemli kararları, batarya teknolojisinde somut gelişmeler. Dünya haberi yalnızca Türkiye'deki okur için anlamı varsa seçilir.
- Kaynak önceliği: resmi kurum ve şirket duyuruları (EPDK, Resmî Gazete, ODMD, üreticinin kendi sitesi/bülteni) > ulusal haber siteleri ve sektör yayınları > yabancı sektör yayınları (Electrek, InsideEVs, Reuters, Bloomberg vb.).

## 3. Haber değeri filtresi
Seç: fiyat/vergi değişikliği, yeni model Türkiye lansmanı veya fiyatı, şarj tarifesi değişikliği, resmi veri açıklaması (satış, soket sayısı), düzenleme, büyük yatırım, kampanya.
Seçme: söylenti, tekrar eden analiz yazıları, reklam/advertorial, Türkiye ile ilgisi zayıf dünya haberleri, 48 saatten eski olaylar.
Bir çalıştırmada en fazla **3** haber eklenir. Yeni bir şey yoksa hiçbir şey eklenmez ve commit yapılmaz.

## 4. Tekrarı önleme
Eklemeden önce `src/content/haberler/` altındaki dosyaları kontrol et:
- Aynı `sourceUrl` zaten varsa ekleme.
- Aynı olay başka kaynaktan zaten haberleştirildiyse ekleme. Yeni rakam varsa mevcut haberi güncelle (tarih alanını değiştirme, metnin sonuna "Güncelleme:" notu ekle).

## 5. Yazım kuralları
- Çeviri veya kopya yok: kaynağı oku, kendi cümlelerinle yaz. Kaynaktan en fazla tek, kısa alıntı.
- Uzunluk 250–500 kelime. İlk paragraf haberin özü (kim, ne, ne zaman, rakam).
- Ara başlıklar (`##`), gerektiğinde tablo. Rakamlar birimleriyle (TL, kWh, km, kW).
- Ses tonu: sade, tarafsız, abartısız, "sen/siz" yerine nötr haber dili. Başlıkta tıklama tuzağı yok.
- Uygunsa sitenin araçlarına iç link ver: [Rota Planlayıcı](/rota-planlayici), [Şarj Fiyatları](/sarj-fiyatlari), [Modeller](/modeller), [Fırsatlar](/firsatlar).
- Doğrulayamadığın rakamı yazma.

## 6. Dosya biçimi
Yol: `src/content/haberler/<kisa-slug>.md` (Türkçe karakterler ASCII'ye: ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u; küçük harf, tire).

```
---
title: "Başlık (60–90 karakter)"
description: "Google'da görünecek özet, 140–160 karakter."
image: "/images/haberler/<kisa-slug>.jpg"
category: turkiye | dunya | rehber
date: YYYY-MM-DD
source: "Kaynak adı"
sourceUrl: "https://…"
featured: false
draft: false
---
Metin…
```
`image` alanı her zaman yazılır. Dosya yoksa site derlenirken başlık ve kategoriyle otomatik markalı bir kapak üretir (scripts/covers.mjs); gerçek görsel sonradan aynı adla `public/images/haberler/` içine eklenince otomatik kapak devreden çıkar. Bot görsel indirmez ve yapay zekâ görseli üretmez.

## 7. Doğrudan yayın mı, taslak mı? (karışık mod)
**Doğrudan yayın (`main` dalına commit):** yalnızca resmi ve kesin veriye dayanan haberler: üreticinin resmi fiyat listesi, EPDK/Resmî Gazete düzenlemesi, ODMD/TÜİK/EPDK verisi, operatörün kendi sitesinde ilan ettiği tarife değişikliği, markanın resmi kampanya duyurusu.
**Taslak (onaya gider):** diğer her şey: yorum veya analiz gerektiren haberler, dünya haberleri, ikinci el kaynaktan gelen bilgiler, emin olunmayan rakamlar.

Taslaklar `taslak-haberler` dalında toplanır ve bu daldan `main`e açık tek bir Pull Request tutulur (yoksa açılır, varsa üzerine eklenir). PR açıklamasında her taslak için: başlık, kaynak linki, neden taslak olduğu. Sıtkı PR'ı GitHub'da "Merge" ederek yayınlar; istemediği dosyayı PR'dan siler.

## 8. Veri tablolarının güncellenmesi
- Bir operatörün resmi tarife değişikliği doğrulanırsa `src/data/operators.json` içindeki fiyatı ve `updated` tarihini de güncelle (doğrudan yayın).
- Kampanya haberi resmi ise `src/content/firsatlar/` altına da kısa bir kayıt ekle (`endDate` biliniyorsa yaz).

## 9. Teknik
- Commit'ten önce `npm ci && npm run build:fast` ile derlemenin geçtiğini doğrula; hata varsa düzelt, düzelmiyorsa o haberi ekleme.
- Bir çalıştırmada `main`e en fazla bir commit (Netlify derleme limitini korumak için).
- Commit mesajı: `Haber: <kısa başlık>` (birden fazla ise `Haberler: 2 yeni`).

## 10. Rapor
Çalıştırmanın sonunda: kaç kaynak tarandı, ne eklendi (doğrudan / taslak), ne neden elendi. Yeni bir şey yoksa tek satır: "Yeni haber yok."
