# Günlük SEO görevi: kurallar ve iş listesi

Bu dosya her gün çalışan "Günlük SEO" görevinin kurallarıdır. Görev bu dosyayı okur, aşağıdaki iş listesinden
sıradaki işleri yapar, yaptıklarını "Yapılanlar günlüğü"ne ekler. Haber yazımı bu görevin işi DEĞİLDİR
(o iş `docs/haber-botu.md` ile ayrı görevde). Görsel ekleme ve operatör fiyat güncellemesi de ayrı görevlerdir.

## Her gün sırayla

### 1. Teknik sağlık kontrolü (her gün, 10 dakikayı geçmesin)
- `npm ci && npm run build` derlemesi hatasız mı?
- `dist/` içinde: kırık iç bağlantı (var olmayan sayfaya giden `href`), boş ya da 60 karakteri aşan `<title>`,
  boş ya da 160 karakteri aşan `meta description`, aynı başlığa sahip iki sayfa, canonical eksikliği,
  `noindex` olmaması gerekirken noindex olan sayfa. Bulunanları düzelt.
- JSON-LD blokları geçerli JSON mu (parse edilebiliyor mu)?
- `sitemap-index.xml` ve `news-sitemap.xml` üretiliyor mu?

### 2. İçerik büyütme (her gün iş listesinden en fazla 2 madde)
İş listesinde ilk işaretlenmemiş maddeden başla. Her içerik:
- Gerçek bir arama niyetine cevap verir (başlık aranan ifadeyle başlar, ilk paragraf 40-60 kelimelik net cevap).
- Rakamlar sitenin kendi verisinden (`src/data/*.json`) ya da açıp okuduğun resmi kaynaktan gelir.
  Doğrulayamadığın rakamı yazma. Kaynakları sayfada belirt.
- SSS (FAQPage şeması) en az 3 soru; iç bağlantı en az 3 (ilgili model, rehber, rota/il sayfası).
- Var olan bir sayfayı tekrar eden yeni sayfa açma; o durumda var olan sayfayı güçlendir.

### 3. İç bağlantı (her gün)
- Son 7 günün haberlerinde geçen model, il, operatör ve rota adlarından ilgili sayfalara bağlantı
  verilmemişse bağlantı ekle (haber metnini yeniden yazma, sadece ilk geçtiği yere link).

### 4. Mesai Mutfak teknik kontrol (haftada bir, pazartesi)
- `sitkipehlivan/mesaimutfak` deposunda YALNIZCA teknik SEO: derleme, kırık iç bağlantı, title/description
  uzunlukları, Recipe şeması geçerliliği, sitemap. Tarif içerik dosyalarına (`src/tarifler/` ve tarif verisi)
  DOKUNMA; o içerikleri başka bir oturum yönetiyor. Push'tan önce `git pull --rebase`.

## İş listesi (sırayla; tamamlananı [x] yap)

### İl sayfaları (81 ile tamamla; 81 il tamam)
- [x] `src/lib/iller.ts` listesine kalan illeri ekle, her gün en fazla 10 il. Öncelik nüfus ve otoyol
      güzergâhı: kalan il yok (Hakkari 2026-11-11'de eklendi).
      Var olanlar: İstanbul, Kocaeli, Bursa, Sakarya, Tekirdağ, Balıkesir, Çanakkale, Edirne, İzmir, Muğla, Aydın,
      Denizli, Manisa, Afyonkarahisar, Antalya, Adana, Mersin, Hatay, Ankara, Konya, Eskişehir, Kayseri, Nevşehir,
      Bolu, Samsun, Trabzon, Düzce, Gaziantep, Diyarbakır, Erzurum, Şanlıurfa, Kahramanmaraş, Malatya, Van, Elazığ, Sivas, Kütahya,
      Uşak, Isparta, Zonguldak, Ordu, Tokat, Çorum, Kırıkkale, Aksaray, Karaman, Osmaniye, Batman, Mardin, Adıyaman,
      Bilecik, Kırşehir, Yozgat, Amasya, Giresun, Rize, Kastamonu, Karabük, Bartın, Sinop, Niğde, Kırklareli,
      Yalova, Burdur, Siirt, Şırnak, Kilis, Bitlis, Muş, Bingöl, Çankırı, Erzincan, Gümüşhane, Bayburt, Artvin, Ağrı,
      Iğdır, Kars, Ardahan, Tunceli, Hakkari.

### Rota sayfaları (41 → 100)
- [ ] `src/data/routes.json` listesine popüler şehirlerarası rotalar ekle (her gün en fazla 5).
      km ve süre değerlerini OSRM ya da güvenilir kaynaktan al; tahmin yazma.

### Rehber sayfaları (her biri ayrı gün)
<!-- Not: ÖTV/MTV (elektrikli-arac-otv-mtv-2026), kış menzili, batarya ömrü, ikinci el batarya sağlığı ve uzun yol
     ipuçları için rehber zaten var (src/content/haberler/). Bu maddelerde yeni sayfa açma, var olanı güçlendir.
     Rehberlerde "## Sık sorulan sorular" + "### Soru" başlıkları otomatik FAQPage şemasına dönüşür; `updated:` alanı dateModified olur. -->
- [x] Evde şarj istasyonu (wallbox) kurulumu: maliyet, başvuru, apartmanda kurulum (KMK izni)
- [x] Elektrikli araç ÖTV oranları (güncel, resmi kaynaklı)
- [x] Elektrikli araç kasko ve trafik sigortası farkları
- [x] Kışın elektrikli araç menzili: ne kadar düşer, nasıl korunur (models.json verisiyle)
- [x] Elektrikli araç batarya ömrü ve garanti süreleri (marka marka, models.json verisiyle)
      <!-- 2026-11-10: tabloda yalnızca BYD ve Hyundai var (TR kaynağı okunabildi). Togg, Tesla, Kia, Renault, Mercedes, Volvo
           TR resmi sayfaları bu ortamdan açılamadı; doğrulandıkça tabloya ekle. -->
- [x] Şarj soketi tipleri: Type 2, CCS2, CHAdeMO (Türkiye'deki istasyon dağılımıyla)
- [x] Elektrikli araç MTV (motorlu taşıtlar vergisi) 2026
      <!-- 2026-11-12: elektrikli-arac-otv-mtv-2026 güçlendirildi. Yalnızca 1-3 yaş EV tablosu var; 2027 tebliği (Aralık sonu) çıkınca güncelle. -->
- [x] İkinci el elektrikli araç alırken dikkat edilecekler (batarya sağlığı kontrolü)
- [x] Elektrikli araçla uzun yol: şarj molası planlama (rota planlayıcıya bağlantı)
- [x] Hibrit, plug-in hibrit ve tam elektrikli farkı
      <!-- 2026-11-14: yeni sayfa açılmadı; var olan /haberler/hibrit/plug-in-hibrit-nedir güçlendirildi. -->

### Model sayfaları güçlendirme
- [x] Her model sayfasına "X şarj süresi", "X kaç km gider", "X şarj maliyeti" sorularını cevaplayan SSS
      (models.json verisiyle otomatik; şablon değişikliği, tek seferde)
- [ ] En çok aranan 10 model için karşılaştırma sayfalarını kontrol et; eksik popüler eşleşmeleri
      `POPULAR_PAIRS` listesine ekle

## Yapılanlar günlüğü
<!-- Görev her gün buraya tek satır ekler: - YYYY-MM-DD: yapılanlar (kısa) -->
- 2026-11-06: Teknik: 60 karakteri aşan 40 <title> kısaltıldı (fitTitle şablon yardımcısı, 6 habere seoTitle), rehberlerde SSS→FAQPage ve updated→dateModified; kırık link/JSON-LD/canonical sorunu yok. İçerik: 10 il eklendi (40/81), wallbox rehberi güçlendirildi (KMK, EPDK, şarj süresi, SSS). İç link: 5 habere model/rota bağlantısı. Rota maddesi atlandı (OSRM bu ortamdan erişilemiyor).
- 2026-11-07: Teknik: kırık link, title/description, canonical, noindex, JSON-LD, sitemap sorunu yok. İçerik: 10 il eklendi (50/81), ÖTV rehberi güçlendirildi (10115 sayılı Karar, asgari ÖTV, örnek hesap, PHEV dilimleri, 5 SSS, kaynaklar). İç link: 4 habere model/il bağlantısı. Rota maddesi atlandı (OSRM yine erişilemiyor).
- 2026-11-08: Teknik: kırık link, title/description, canonical, noindex, JSON-LD, sitemap sorunu yok. İçerik: 10 il eklendi (60/81), yeni rehber: elektrikli araç kasko ve trafik sigortası farkları (SEDDK 2026 limitleri, EV kasko teminatları, 5 SSS, kaynaklar). İç link: 1 habere 4 model bağlantısı. Rota maddesi atlandı (OSRM yine erişilemiyor).
- 2026-11-09: Teknik: kırık link, title/description, canonical, JSON-LD, sitemap sorunu yok (163 noindex sayfa 9 Kasım AdSense kararıyla bilinçli). İçerik: 10 il eklendi (70/81), kış menzili rehberi güçlendirildi (models.json ile doğrulanan tablo, 5 SSS, kaynaklar, updated). İç link: 1 habere model bağlantısı (BMW iX3). Rota maddesi atlandı (OSRM yine erişilemiyor).
- 2026-11-10: Teknik: kırık link, title/description, canonical, JSON-LD, sitemap sorunu yok (noindex sayfalar bilinçli: kısa haber, satışta olmayan model, il istasyon sayfaları). İçerik: 10 il eklendi (80/81), batarya ömrü rehberi güçlendirildi (BYD/Hyundai TR garanti tablosu, models.json ile garanti km/döngü tablosu, 5 SSS, kaynaklar, updated). İç link: Fiat habere 3 model + 1 rota bağlantısı. Rota maddesi atlandı (OSRM yine erişilemiyor).
- 2026-11-11: Teknik: kırık link, title/description, canonical, JSON-LD, sitemap sorunu yok (noindex sayfalar bilinçli). İçerik: Hakkari eklendi (81/81, il maddesi tamam), yeni rehber: şarj soketi tipleri (Type 2/CCS2/CHAdeMO, EPDK Nisan/Eylül 2026 AC/DC soket sayıları, models.json AC/DC güç dağılımı, 5 SSS, kaynaklar), şarj rehberinden yeni rehbere link. İç link: son 7 günün haberlerinde eksik model/il/operatör/rota bağlantısı yok. Rota maddesi atlandı (OSRM yine erişilemiyor).
- 2026-11-12: Teknik: 1 kırık iç link düzeltildi (şarj soketi rehberi /sarj-istasyonlari/ → /istasyonlar/); title/description, canonical, JSON-LD, sitemap sorunu yok (reklam-demo ve diğer noindex sayfalar bilinçli). İçerik: ÖTV/MTV rehberi MTV için güçlendirildi (Seri No: 58 Tebliği, %18,95 artış, kW × taşıt değeri 1-3 yaş MTV tablosu, model örnekleri, taksit tarihleri, 3 yeni SSS, kaynaklar, seoTitle/description). İç link: son 7 günün haberlerinde eksik bağlantı yok. Rota maddesi atlandı (OSRM yine erişilemiyor).
- 2026-11-13: Teknik: noindex'siz 2 reklam kreatif sayfası (/reklam-demo/cevahir/final/*, yinelenen başlık, canonical yok) için netlify.toml'a /reklam-demo/* X-Robots-Tag noindex eklendi; kırık link, title, JSON-LD, sitemap sorunu yok. İçerik: ikinci el EV rehberi güçlendirildi (dikkat edilecekler başlığı, garanti devri, hasar kaydı, Güvenli Ödeme Sistemi zorunluluğu, 5 SSS, kaynaklar, updated), uzun yol rehberine şarj molası planlama hesabı (models.json ile etap menzilleri), seoTitle, 5 SSS, kaynaklar. İç link: son 7 günün haberlerinde eksik bağlantı yok. Rota maddesi atlandı (OSRM yine erişilemiyor).
- 2026-11-14: Teknik: kırık link, title/description, canonical, noindex (bilinçli olanlar dışında), JSON-LD, sitemap sorunu yok. İçerik: hibrit/PHEV/elektrikli farkı için var olan plug-in-hibrit-nedir sayfası güçlendirildi (karşılaştırma tablosu, models.json BEV aralıkları, 10115 sayılı Karar ÖTV, MTV, ODMD satış payları, 5 SSS, kaynaklar, seoTitle, updated); model sayfalarına şarj süresi / kaç km gider / şarj maliyeti SSS'si ve FAQPage şeması (şablon, models.json ile otomatik). İç link: son 7 günün haberlerinde eksik bağlantı yok. Rota maddesi atlandı (OSRM yine erişilemiyor).
