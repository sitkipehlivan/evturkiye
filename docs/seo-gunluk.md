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

### İl sayfaları (81 ile tamamla; şu an 30 il var)
- [ ] `src/lib/iller.ts` listesine kalan illeri ekle, her gün en fazla 10 il. Öncelik nüfus ve otoyol
      güzergâhı: Şanlıurfa, Kahramanmaraş, Malatya, Van, Elazığ, Sivas, Kütahya, Uşak, Isparta, Zonguldak,
      Ordu, Tokat, Çorum, Kırıkkale, Aksaray, Karaman, Osmaniye, Batman, Mardin, Adıyaman, sonra diğerleri.
      Var olanlar: İstanbul, Kocaeli, Bursa, Sakarya, Tekirdağ, Balıkesir, Çanakkale, Edirne, İzmir, Muğla, Aydın,
      Denizli, Manisa, Afyonkarahisar, Antalya, Adana, Mersin, Hatay, Ankara, Konya, Eskişehir, Kayseri, Nevşehir,
      Bolu, Samsun, Trabzon, Düzce, Gaziantep, Diyarbakır, Erzurum.

### Rota sayfaları (41 → 100)
- [ ] `src/data/routes.json` listesine popüler şehirlerarası rotalar ekle (her gün en fazla 5).
      km ve süre değerlerini OSRM ya da güvenilir kaynaktan al; tahmin yazma.

### Rehber sayfaları (her biri ayrı gün)
- [ ] Evde şarj istasyonu (wallbox) kurulumu: maliyet, başvuru, apartmanda kurulum (KMK izni)
- [ ] Elektrikli araç ÖTV oranları (güncel, resmi kaynaklı)
- [ ] Elektrikli araç kasko ve trafik sigortası farkları
- [ ] Kışın elektrikli araç menzili: ne kadar düşer, nasıl korunur (models.json verisiyle)
- [ ] Elektrikli araç batarya ömrü ve garanti süreleri (marka marka, models.json verisiyle)
- [ ] Şarj soketi tipleri: Type 2, CCS2, CHAdeMO (Türkiye'deki istasyon dağılımıyla)
- [ ] Elektrikli araç MTV (motorlu taşıtlar vergisi) 2026
- [ ] İkinci el elektrikli araç alırken dikkat edilecekler (batarya sağlığı kontrolü)
- [ ] Elektrikli araçla uzun yol: şarj molası planlama (rota planlayıcıya bağlantı)
- [ ] Hibrit, plug-in hibrit ve tam elektrikli farkı

### Model sayfaları güçlendirme
- [ ] Her model sayfasına "X şarj süresi", "X kaç km gider", "X şarj maliyeti" sorularını cevaplayan SSS
      (models.json verisiyle otomatik; şablon değişikliği, tek seferde)
- [ ] En çok aranan 10 model için karşılaştırma sayfalarını kontrol et; eksik popüler eşleşmeleri
      `POPULAR_PAIRS` listesine ekle

## Yapılanlar günlüğü
<!-- Görev her gün buraya tek satır ekler: - YYYY-MM-DD: yapılanlar (kısa) -->
