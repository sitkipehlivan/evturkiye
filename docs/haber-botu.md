# EV Türkiye haber botu: çalışma kuralları

Bu dosya, günlük haber görevinin her çalıştırmada uyduğu kurallardır. Değiştirmek için bu dosyayı düzenlemek yeterlidir.

## 1. Amaç
Türkiye'deki elektrikli araç (EV) kullanıcıları ve alıcıları için **haber değeri olan** gelişmeleri bulmak, kısa ve özgün Türkçe haberler olarak siteye eklemek.

## 2. Taranacak konular ve kaynaklar
Web araması ile (son 24 saat, öncelik son 2 saat):
- Türkiye: Togg, Tesla Türkiye, BYD Türkiye ve diğer markaların fiyat listeleri ve yeni modelleri; ÖTV/MTV ve vergi düzenlemeleri; EPDK şarj düzenlemeleri ve şarj piyasası verileri; ODMD/TÜİK satış ve trafik verileri; şarj operatörlerinin (Trugo, ZES, Eşarj, Voltrun, Astor, WAT, Tesla Supercharger vb.) tarife değişiklikleri, yeni istasyonları ve kampanyaları; sıfır faiz / indirim kampanyaları; yerli batarya ve şarj yatırımları.
- Plug-in hibrit (PHEV, `category: hibrit`): Türkiye'de satılan şarj edilebilir hibrit modellerin fiyat listeleri ve kampanyaları, PHEV ÖTV düzenlemeleri (25 g/km CO2 ve 70 km elektrikli menzil şartı), ODMD'nin PHEV satış verileri, Türkiye'ye gelecek PHEV modeller. Tam hibrit ve mild hibrit haberleri yalnızca elektrikli/PHEV pazarıyla doğrudan ilgiliyse (ör. vergi, pazar payı karşılaştırması) alınır.
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

### 5a. SEO kuralları
- **Başlık:** Okurun Google'a yazacağı ifadeyi başa yakın koy (ör. "Togg T10X fiyat listesi", "elektrikli araç ÖTV", "ZES şarj fiyatı"). Marka ve model adını tam yaz. 60–90 karakter; tıklama tuzağı yok.
- **Açıklama (description):** 140–160 karakter; ana ifade + somut rakam veya tarih ("Ekim 2026", "kWh başına 14,98 TL").
- **İlk paragraf:** Ana ifade ilk 2 cümlede doğal biçimde geçsin; "elektrikli araç" / "elektrikli otomobil" ifadelerinden biri metinde en az bir kez yer alsın (zorlama tekrar yok).
- **Slug:** Kısa ve aranan ifadeyi içeren (ör. `togg-t10x-fiyat-listesi-kasim-2026`), dolgu kelime yok.
- **Ara başlıklar:** Okurun soracağı soruları başlık yap ("Yeni fiyatlar ne kadar?", "Hangi istasyonlarda geçerli?").
- **İç link (her haberde en az 2):** İlgili model sayfası (`/modeller/<marka>/<model>`), marka sayfası (`/modeller/<marka>`) veya konu sayfalarından biri: [Elektrikli Araç Rehberi](/elektrikli-arac), [Şarj Rehberi](/elektrikli-arac-sarj), [Menzil Sıralaması](/elektrikli-arac-menzil), [Şarj Maliyeti](/elektrikli-arac-sarj-maliyeti), [Şarj Fiyatları](/sarj-fiyatlari), [Rota Planlayıcı](/rota-planlayici). Yalnızca `src/data/models.json` içinde olan marka/model sayfalarına link ver.
- **Güncel tutma:** Aynı konunun yeni dönemi çıktığında (yeni ay fiyat listesi gibi) yeni haber yaz ve eski habere "Güncel liste için: …" linki ekle.
- Doğrulayamadığın rakamı yazma.

## 6. Dosya biçimi
Yol: `src/content/haberler/<kisa-slug>.md` (Türkçe karakterler ASCII'ye: ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u; küçük harf, tire).

```
---
title: "Başlık (60–90 karakter)"
description: "Google'da görünecek özet, 140–160 karakter."
image: "/images/haberler/<kisa-slug>.jpg"
category: turkiye | dunya | hibrit | rehber
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

## 7a. Görsel (Gemini ile otomatik)
Her yeni haberin ön bilgisine (frontmatter) görsel alanlarını yaz; görseli GitHub'daki "Haber görselleri (Gemini)" işlemi otomatik hazırlar ve siteye ekler. Hazırlanana kadar otomatik markalı kapak görünür.

- **Görselde araç olacaksa → `imageMode: edit`**. Araç MUTLAKA gerçek bir fotoğraftan gelir; Gemini yalnızca arka planı, ışığı ve rengi değiştirir.
  - **Tercih edilen yol — `imageWiki`:** Haber belirli bir modelle ilgiliyse (fiyat listesi, lansman, kampanya, özel seri) aracın Wikipedia makale adını yaz (ör. `imageWiki: "Togg T10X"`). İşlem makalenin ana fotoğrafını Commons'tan alır, yalnızca serbest lisansları kabul eder ve `imageCredit`'i kendisi yazar; bu durumda `imageCredit` yazma. Makale adı İngilizce Wikipedia'daki başlık olmalı.
  - Alternatif — `imageSource`: lisansı uygun gerçek fotoğrafın **doğrudan görsel adresi** (.jpg/.png/.webp). Uygun kaynaklar: üreticinin basın/medya sitesi, Wikimedia Commons (`upload.wikimedia.org/...` adresi), Unsplash (`images.unsplash.com/...`), Pexels (`images.pexels.com/...`). Haber sitelerinden ve ajanslardan (AA, DHA, Getty, Reuters vb.) ASLA alma.
  - `imageCredit`: "Togg Basın" / "Wikimedia Commons / <fotoğrafçı>, <lisans>" / "Unsplash / <fotoğrafçı>".
  - Uygun gerçek fotoğraf bulamazsan araçsız bir sahneyle `generate` modunu kullan.
- **Görselde araç olmayacaksa → `imageMode: generate`** (fiş, şarj ünitesi, masa, belge, yol, istasyon, batarya vb.). Sahne kesinlikle araç içermez. `imageCredit: "EV Türkiye / yapay zekâ ile üretildi"`.
- `imageScene`: İngilizce, tek cümlelik sahne tarifi (konu, ortam, ışık). Metin, logo, marka adı isteme.

Örnek:
```
imageMode: edit
imageWiki: "Togg T10X"
imageScene: "bright minimalist showroom with polished light-grey floor and soft daylight"
```

## 8. Veri tablolarının güncellenmesi
- Bir operatörün resmi tarife değişikliği doğrulanırsa `src/data/operators.json` içindeki fiyatı ve `updated` tarihini de güncelle (doğrudan yayın).
- Kampanya haberi resmi ise `src/content/firsatlar/` altına da kısa bir kayıt ekle (`endDate` biliniyorsa yaz).
- Kampanyalar: Her çalıştırmada elektrikli ve plug-in hibrit modellerde yeni sıfır faiz / indirim / takas desteği kampanyası var mı bak; varsa `src/content/firsatlar/<marka-model-ay-yil>.md` olarak ekle. Alanlar: `title`, `type: arac|sarj`, `powertrain: elektrikli|plug-in-hibrit`, `brand`, `summary` (tutar, vade, faiz, kime geçerli), `date`, `endDate` (biliniyorsa), `sourceUrl`. Ay başlarında (1–7'si arası) o ayın kampanya derlemelerini tarayıp toplu ekle; süresi dolan kampanyalar sitede otomatik gizlenir.

## 9. Teknik
- Commit'ten önce `npm ci && npm run build:fast` ile derlemenin geçtiğini doğrula; hata varsa düzelt, düzelmiyorsa o haberi ekleme.
- Bir çalıştırmada `main`e en fazla bir commit (Netlify derleme limitini korumak için). Görsel alanları haberle aynı commit'te.
- Commit mesajı: `Haber: <kısa başlık>` (birden fazla ise `Haberler: 2 yeni`).

## 10. Rapor
Çalıştırmanın sonunda: kaç kaynak tarandı, ne eklendi (başlık + link), her haber için seçilen görsel modu (edit/generate) ve kaynak, ne neden elendi. Yeni bir şey yoksa tek satır: "Yeni haber yok."
