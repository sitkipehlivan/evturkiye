# EV Türkiye haber botu: çalışma kuralları

Bu dosya, günlük haber görevinin her çalıştırmada uyduğu kurallardır. Değiştirmek için bu dosyayı düzenlemek yeterlidir.

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
Görev **günde bir kez** çalışır ve son 24 saati tarar. Bir çalıştırmada en fazla **5** haber eklenir. Yeni bir şey yoksa hiçbir şey eklenmez ve commit yapılmaz.

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

## 7. Yayın
Seçilen tüm haberler doğrudan `main` dalına eklenir ve yayınlanır (taslak/onay adımı yok). Bu yüzden doğrulama şarttır: rakamı ve tarihi kaynak sayfada kendin görmediysen yazma; emin olmadığın haberi hiç ekleme.

## 7a. Görsel brifi
Her yeni haber için `docs/gorsel-bekleyenler.md` dosyasına (yoksa oluştur, en yeni üstte) bir satır ekle:
`| <tarih> | <slug>.jpg | <yüklenecek gerçek fotoğrafın kaynağı: üreticinin basın/medya sayfası linki veya Unsplash/Pexels arama kelimesi> | <SCENE satırı: arka plan tarifi, İngilizce> |`
Gerçek araç fotoğrafı yalnızca lisansı uygun kaynaklardan önerilir (üretici basın kiti, Unsplash, Pexels, Wikimedia Commons). Haber sitelerinden veya ajanslardan fotoğraf önerme. Görsel düzenleme kuralları (araç aynen kalır, sadece çevre yapay zekâ ile değişir) `docs/gorsel-duzenleme.md` dosyasındadır.

## 8. Veri tablolarının güncellenmesi
- Bir operatörün resmi tarife değişikliği doğrulanırsa `src/data/operators.json` içindeki fiyatı ve `updated` tarihini de güncelle (doğrudan yayın).
- Kampanya haberi resmi ise `src/content/firsatlar/` altına da kısa bir kayıt ekle (`endDate` biliniyorsa yaz).

## 9. Teknik
- Commit'ten önce `npm ci && npm run build:fast` ile derlemenin geçtiğini doğrula; hata varsa düzelt, düzelmiyorsa o haberi ekleme.
- Bir çalıştırmada `main`e en fazla bir commit (Netlify derleme limitini korumak için). Haberler ve görsel brifi aynı commit'te.
- Commit mesajı: `Haber: <kısa başlık>` (birden fazla ise `Haberler: 2 yeni`).

## 10. Rapor
Çalıştırmanın sonunda: kaç kaynak tarandı, ne eklendi (başlık + link), her haber için hangi gerçek fotoğrafın hazırlanması gerektiği, ne neden elendi. Yeni bir şey yoksa tek satır: "Yeni haber yok."
