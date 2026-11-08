"""İlk 14 Reels'in spesifikasyonlarını üretir (tek seferlik; günlük botlar JSON'u doğrudan yazar)."""
import json, os
D = os.path.dirname(os.path.abspath(__file__))
END = lambda link='Haberin tamamı: evturkiye.online', alt='Her gün elektrikli araç gündemi', buton='Takip et': {'tur': 'kapanis', 'sure': 3.2, 'link': link, 'alt': alt, 'buton': buton}

S = {}

S['02-en-ucuz-elektrikliler'] = {'haber': '/haberler/turkiye/en-ucuz-elektrikli-otomobiller-ekim-2026', 'sahneler': [
  {'tur': 'hero', 'sure': 4.4, 'kicker': 'EKİM 2026 · TÜRKİYE', 'h1': 'En ucuz elektrikli', 'h2': '1,52 milyon TL.', 'arac': 'hyundai-inster',
   'sayi': {'etiket': 'HYUNDAI INSTER · KAMPANYALI', 'deger': 1520000, 'son': ' TL'},
   'altyazi': ["Türkiye'nin en ucuz elektriklisi, kampanyalı fiyatıyla Hyundai INSTER."]},
  {'tur': 'liste', 'sure': 5.6, 'kicker': 'EN UCUZ 10 · 1–5', 'h1': '2 milyon TL altında', 'h2': '9 model var.', 'kaynak': 'Kaynak: marka fiyat listeleri · Ekim 2026',
   'satirlar': [
     {'sol': 'Hyundai INSTER', 'alt': '42 kWh · 327 km', 'sag': '1.520.000 TL', 'eski': '1.670.000 TL', 'vurgu': True},
     {'sol': 'Fiat Grande Panda Elektrikli', 'alt': '44 kWh · 320 km', 'sag': '1.584.900 TL'},
     {'sol': 'Citroën ë-C3', 'alt': '44 kWh · 320 km', 'sag': '1.605.000 TL', 'eski': '1.645.000 TL'},
     {'sol': 'Fiat 600e', 'alt': '54 kWh · 406 km', 'sag': '1.854.900 TL', 'eski': '1.989.900 TL'},
     {'sol': 'Citroën ë-C3 Aircross', 'alt': '44 / 54 kWh', 'sag': '1.875.000 TL'}],
   'altyazi': ["Ekim 2026'da 2 milyon TL'nin altında dokuz elektrikli model vardı.", "İlk üçte INSTER, Grande Panda ve ë-C3 var."]},
  {'tur': 'liste', 'sure': 5.0, 'kicker': 'EN UCUZ 10 · 6–10', 'h1': 'Togg da', 'h2': "ilk 10'da.", 'kaynak': 'Kaynak: marka fiyat listeleri · Ekim 2026',
   'satirlar': [
     {'sol': 'Togg T10F V1 RWD', 'alt': '52,4 kWh · 335 km', 'sag': "1.884.980 TL", 'vurgu': True},
     {'sol': 'Opel Corsa Elektrik', 'alt': '50 kWh · ~357 km', 'sag': '1.890.000 TL'},
     {'sol': 'Opel Frontera Elektrik', 'alt': '44 / 54 kWh', 'sag': '1.895.000 TL'},
     {'sol': 'Togg T10X V1 RWD', 'alt': '52,4 kWh · 314 km', 'sag': '1.909.048 TL', 'vurgu': True},
     {'sol': 'Peugeot e-208', 'alt': '50 kWh · ~363 km', 'sag': '2.080.000 TL'}],
   'altyazi': ["Togg T10F altıncı, T10X dokuzuncu sırada."]},
  {'tur': 'hero', 'sure': 4.8, 'kicker': 'LİSTEDE EN UZUN MENZİL', 'h1': 'Menzil arıyorsan', 'h2': 'T10F öne çıkıyor.', 'arac': 'togg-t10f',
   'sayi': {'etiket': 'TOGG T10F UZUN MENZİL · WLTP', 'deger': 623, 'son': ' km', 'renk': 'mavi'},
   'altyazi': ["Listede en uzun menzil 88,5 kWh bataryalı Togg T10F'de: 623 km.", "Uzun menzilli versiyon 2,19 milyon TL'den başlıyor."]},
  END('Tam liste: evturkiye.online')]}

S['03-gercek-menzil-testi'] = {'haber': '/haberler/dunya/ecobest-2026-gercek-menzil-testi-kia-ev2', 'sahneler': [
  {'tur': 'hero', 'sure': 4.6, 'kicker': 'ECOBEST 2026 · GERÇEK MENZİL', 'h1': '15 elektrikli test edildi:', 'h2': "hiçbiri WLTP'yi tutmadı.",
   'foto': '/public/images/haberler/ecobest-2026-gercek-menzil-testi-kia-ev2.jpg',
   'sayi': {'etiket': 'KIA EV2 · RESMİ MENZİLE YAKINLIK', 'deger': 95, 'on': '%'},
   'altyazi': ["Bağımsız testte 15 elektrikli otomobilin hiçbiri resmi menziline ulaşamadı."]},
  {'tur': 'cubuklar', 'sure': 4.8, 'kicker': 'TEST BİRİNCİSİ', 'h1': 'Birinci:', 'h2': 'Kia EV2.', 'kaynak': 'Kaynak: AUTOBEST / ECOBEST Challenge 2026',
   'satirlar': [
     {'etiket': 'RESMİ (WLTP) MENZİL', 'alt': 'Kağıt üstünde', 'deger': '418 km', 'oran': 1.0, 'renk': 'gri'},
     {'etiket': 'GERÇEK TRAFİKTE ÖLÇÜLEN', 'alt': 'Yüzde 95', 'deger': '397 km', 'oran': 0.95, 'renk': 'yesil'}],
   'altyazi': ["418 km'lik resmi menzile karşı 397 km gitti.", "Oran yüzde 95: testin en iyisi."]},
  {'tur': 'siralama', 'sure': 6.2, 'kicker': 'ÖLÇÜLEN / WLTP', 'h1': 'Kim ne kadar', 'h2': 'gidebildi?', 'kaynak': 'Kaynak: AUTOBEST / ECOBEST Challenge 2026',
   'satirlar': [
     {'ad': 'Kia EV2', 'alt': 'WLTP 418 · 397 km', 'deger': '%95,0', 'oran': 95.0, 'renk': 'yesil'},
     {'ad': 'Audi Q4 e-tron', 'alt': '511 · 473 km', 'deger': '%92,6', 'oran': 92.6, 'renk': 'mavi'},
     {'ad': 'Tesla Model Y', 'alt': '525 · 466 km', 'deger': '%88,8', 'oran': 88.8, 'renk': 'mavi'},
     {'ad': 'BMW iX3', 'alt': '737 · 640 km', 'deger': '%86,8', 'oran': 86.8, 'renk': 'mavi'},
     {'ad': 'Mercedes-Benz CLA 250+', 'alt': '772 · 613 km', 'deger': '%79,4', 'oran': 79.4, 'renk': 'kirmizi'}],
   'altyazi': ["Çoğu model resmi değerin yüzde 80–90'ında kaldı.", "En uzun gerçek menzil BMW iX3'te: 640 km."]},
  {'tur': 'sayi', 'sure': 4.6, 'kicker': 'SATIN ALMADAN ÖNCE', 'h1': 'Kendi hesabın için', 'h2': 'WLTP\'den düş.', 'etiket': 'GERÇEK KULLANIMDA OLASI KAYIP',
   'deger': 20, 'on': '-%', 'renk': 'kirmizi', 'alt': 'Genelde %10–20, kışın daha fazla',
   'altyazi': ["Satın alırken WLTP menzilinin yüzde 10–20 düşük çıkabileceğini hesaba kat."]},
  END()]}

S['04-rota-planlayici'] = {'haber': '/rota-planlayici', 'site': True, 'sahneler': [
  {'tur': 'rota', 'sure': 5.4, 'kicker': 'ROTA PLANLAYICI · ÜCRETSİZ', 'h1': 'İstanbul–Ankara:', 'h2': 'kaç şarj, kaç TL?', 'kaynak': 'Togg T10X RWD Uzun Menzil · tahmini',
   'nereden': 'İstanbul', 'nereye': 'Ankara', 'duraklar': [0.62],
   'istatistik': [['MESAFE', '434 km'], ['SÜRÜŞ', '~4 sa 25 dk'], ['ŞARJ MOLASI', '1']],
   'altyazi': ["Togg T10X ile İstanbul'dan Ankara'ya gidiyorsun.", "Yolda tek bir şarj molası yetiyor."]},
  {'tur': 'adimlar', 'sure': 5.2, 'kicker': 'NASIL ÇALIŞIR?', 'h1': '3 adımda', 'h2': 'rotanı planla.',
   'satirlar': [
     {'baslik': 'Nereden, nereye?', 'alt': 'Adresi yaz, öneriler anında gelsin'},
     {'baslik': 'Aracını seç', 'alt': 'Gerçek otoyol tüketimiyle hesaplanır'},
     {'baslik': 'Durakları ve maliyeti gör', 'alt': 'Şarj durakları, süre ve yol maliyeti'}],
   'altyazi': ["Başlangıç ve varış noktanı yaz, aracını seç.", "Şarj duraklarını, süreyi ve maliyeti anında gör."]},
  {'tur': 'cubuklar', 'sure': 5.2, 'kicker': 'İSTANBUL–ANKARA · ENERJİ', 'h1': 'Yol maliyeti', 'h2': '~1.360 TL.', 'kaynak': 'Ekim 2026 operatör fiyatları · tahmini',
   'satirlar': [
     {'etiket': 'ORTALAMA HIZLI ŞARJ FİYATIYLA', 'alt': '13,69 TL/kWh', 'deger': '~1.360 TL', 'oran': 1.0, 'renk': 'mavi'},
     {'etiket': 'EN UCUZ OPERATÖRLE', 'alt': '9,73 TL/kWh', 'deger': '~970 TL', 'oran': 0.71, 'renk': 'yesil'}],
   'altyazi': ["Yolun tüm enerjisini hızlı şarjdan alsan bile maliyet ~1.360 TL.", "En ucuz operatörü seçersen ~970 TL'ye iniyor."]},
  END('evturkiye.online/rota-planlayici', 'Rotanı ücretsiz planla', 'Hemen dene')]}

S['05-kasim-kampanyalari'] = {'haber': '/haberler/turkiye/kasim-2026-elektrikli-arac-kampanyalari', 'sahneler': [
  {'tur': 'hero', 'sure': 4.6, 'kicker': 'KASIM 2026 · KAMPANYALAR', 'h1': "Kasım'ın en büyük", 'h2': 'indirimi: 305 bin TL.', 'arac': 'byd-seal',
   'sayi': {'etiket': 'BYD SEAL AWD EXCELLENCE · İNDİRİM', 'deger': 305000, 'son': ' TL'},
   'altyazi': ["Kasım'da elektrikli otomobil alanlara sıfır faiz, indirim ve takas desteği var."]},
  {'tur': 'liste', 'sure': 5.8, 'kicker': 'NAKİT İNDİRİM · SIFIR FAİZ', 'h1': 'Hangi modelde', 'h2': 'ne kampanya var?', 'kaynak': 'Kaynak: marka kampanyaları · çoğu 30 Kasım\'a kadar',
   'satirlar': [
     {'sol': 'BYD Seal AWD', 'alt': 'Nakit indirim', 'sag': '305.000 TL', 'vurgu': True},
     {'sol': 'Kia EV9', 'alt': 'Prestige / GT-Line', 'sag': '150.000 TL'},
     {'sol': 'Kia EV2', 'alt': 'Versiyona göre', 'sag': '70–100 bin TL'},
     {'sol': 'Fiat Grande Panda', 'alt': '200.000 TL, 12 ay', 'sag': '%0 faiz', 'renk': 'mavi'},
     {'sol': 'Togg T10X / T10F V2', 'alt': 'Sınırlı sayıda araç', 'sag': '%0 faiz', 'renk': 'mavi'}],
   'altyazi': ["BYD Seal'de 305 bin, Kia EV9'da 150 bin TL indirim var.", "Grande Panda ve Togg'da sıfır faiz seçeneği var."]},
  {'tur': 'hero', 'sure': 4.6, 'kicker': 'TAKAS DESTEĞİ', 'h1': 'Takas desteğinde', 'h2': 'zirve BMW i5.', 'arac': 'bmw-i5',
   'sayi': {'etiket': 'BMW i5 eDRIVE40 · TAKAS DESTEĞİ', 'deger': 1800000, 'son': ' TL', 'renk': 'mavi'},
   'altyazi': ["BMW i5'te 1,8 milyon TL takas desteği var.", "iX'te 1,2 milyon, i4'te 800 bin TL."]},
  {'tur': 'adimlar', 'sure': 5.0, 'kicker': 'DİKKAT', 'h1': 'Almadan önce', 'h2': 'bunları sor.',
   'satirlar': [
     {'baslik': 'Kampanyalar birleşiyor mu?', 'alt': "BMW'de takas desteği krediyle birleşmiyor"},
     {'baslik': 'Son tarih ne zaman?', 'alt': "Çoğu kampanya 30 Kasım'da bitiyor"},
     {'baslik': 'Ek masraf var mı?', 'alt': 'Tahsis ücreti ve kasko şartını sor'}],
   'altyazi': ["Koşullar bayiye göre değişebilir, almadan önce mutlaka teyit al."]},
  END('Tüm kampanyalar: evturkiye.online/firsatlar')]}

S['06-kuzey-marmara-sarj'] = {'haber': '/haberler/turkiye/kuzey-marmara-otoyolu-sarj-rekabet-kurulu', 'sahneler': [
  {'tur': 'hero', 'sure': 4.4, 'kicker': 'REKABET KURULU · 4 KASIM 2026', 'h1': 'Kuzey Marmara Otoyolu', 'h2': 'tüm şarj markalarına açılıyor.',
   'foto': '/public/images/haberler/kuzey-marmara-otoyolu-sarj-rekabet-kurulu.jpg',
   'altyazi': ["Kuzey Marmara Otoyolu'ndaki şarj hizmetleri rakip operatörlere açılıyor."]},
  {'tur': 'adimlar', 'sure': 5.6, 'kicker': 'KABUL EDİLEN TAAHHÜTLER', 'h1': 'Ne değişiyor?', 'h2': '3 madde.',
   'satirlar': [
     {'baslik': 'Münhasırlık yok', 'alt': 'Hiçbir operatörle tekel sözleşmesi yapılmayacak'},
     {'baslik': 'Eşit koşullar', 'alt': 'Tüm operatörlere aynı ticari şartlar'},
     {'baslik': 'Takvim', 'alt': 'Başvurular 2 ayda açılacak, 4 ayda bitecek'}],
   'altyazi': ["Otoyoldaki şarj hizmeti işletmeciyle aynı gruptaki iki markayla sınırlıydı.", "Artık her operatör eşit şartlarla başvurabilecek."]},
  {'tur': 'cubuklar', 'sure': 5.4, 'kicker': 'İSTANBUL–İZMİR OTOYOLU', 'h1': 'Örnek ortada:', 'h2': 'soket 8 kat arttı.', 'kaynak': 'Kaynak: Rekabet Kurumu',
   'satirlar': [
     {'etiket': 'HAZİRAN 2024 · SOKET SAYISI', 'alt': '6 marka', 'deger': '90', 'oran': 0.12, 'renk': 'gri'},
     {'etiket': 'EKİM 2026 · SOKET SAYISI', 'alt': '16 marka', 'deger': '750', 'oran': 1.0, 'renk': 'yesil'}],
   'altyazi': ["Aynı süreçten sonra İstanbul–İzmir Otoyolu'nda soket sayısı 90'dan 750'ye çıktı.", "Marka sayısı 6'dan 16'ya yükseldi."]},
  END()]}

S['07-10-dakikada-menzil'] = {'haber': '/haberler/rehber/10-dakikada-en-cok-menzil-kazandiran-elektrikliler', 'sahneler': [
  {'tur': 'hero', 'sure': 4.6, 'kicker': 'REHBER · HIZLI ŞARJ', 'h1': '10 dakika şarj,', 'h2': '255 km yol.', 'arac': 'bmw-ix3', 'kaynak': 'EV Türkiye hesabı · ortalama DC gücüyle',
   'sayi': {'etiket': 'BMW iX3 · 10 DK DC ŞARJDA KAZANILAN', 'deger': 255, 'on': '~', 'son': ' km'},
   'altyazi': ["Uzun yolda önemli olan şarj gücü değil, mola başına kazandığın menzil."]},
  {'tur': 'siralama', 'sure': 5.8, 'kicker': '10 DAKİKADA KAZANILAN MENZİL', 'h1': 'Kahve molasında', 'h2': '200 km+.', 'kaynak': 'EV Türkiye hesabı · otoyol tüketimiyle',
   'satirlar': [
     {'ad': 'BMW iX3 50 xDrive', 'deger': '~255 km', 'oran': 255, 'renk': 'yesil'},
     {'ad': 'Mercedes-Benz CLA 200+', 'deger': '~237 km', 'oran': 237, 'renk': 'yesil'},
     {'ad': 'Mercedes-Benz C 400 4MATIC', 'deger': '~229 km', 'oran': 229, 'renk': 'mavi'},
     {'ad': 'Porsche Cayenne Electric', 'deger': '~216 km', 'oran': 216, 'renk': 'mavi'},
     {'ad': 'Mercedes-Benz GLC 400 4MATIC', 'deger': '~215 km', 'oran': 215, 'renk': 'mavi'}],
   'altyazi': ["Listenin başındaki modeller 10 dakikada 200 km'nin üzerinde menzil kazanıyor."]},
  {'tur': 'siralama', 'sure': 5.4, 'kicker': '2,5 MİLYON TL ALTI', 'h1': 'Bütçe dostu', 'h2': 'en hızlılar.', 'kaynak': 'EV Türkiye hesabı · Ekim 2026 liste fiyatları',
   'satirlar': [
     {'arac': 'tesla-model-y', 'ad': 'Tesla Model Y RWD', 'alt': '2.474.985 TL', 'deger': '~126 km', 'oran': 126, 'renk': 'yesil'},
     {'arac': 'togg-t10f', 'ad': 'Togg T10F Uzun Menzil', 'alt': '2.195.600 TL', 'deger': '~110 km', 'oran': 110, 'renk': 'mavi'},
     {'arac': 'togg-t10f', 'ad': 'Togg T10F Standart Menzil', 'alt': '1.884.980 TL', 'deger': '~104 km', 'oran': 104, 'renk': 'mavi'}],
   'altyazi': ["2,5 milyon TL altında Tesla Model Y RWD öne çıkıyor: ~126 km.", "Togg T10F 104–110 km ile onu izliyor."]},
  END()]}

S['08-sarj-fiyatlari'] = {'haber': '/sarj-fiyatlari', 'site': True, 'sahneler': [
  {'tur': 'cubuklar', 'sure': 5.2, 'kicker': 'HIZLI ŞARJ (DC) · TL/kWh', 'h1': 'Aynı şarj,', 'h2': '%69 fiyat farkı.', 'kaynak': '19 operatör · Ekim 2026 fiyatları',
   'satirlar': [
     {'etiket': 'EN UCUZ · OTOPRİZ', 'deger': '9,73 TL', 'oran': 0.59, 'renk': 'yesil'},
     {'etiket': '19 OPERATÖR ORTALAMASI', 'deger': '13,69 TL', 'oran': 0.83, 'renk': 'mavi'},
     {'etiket': 'EN PAHALI · ZES', 'deger': '16,49 TL', 'oran': 1.0, 'renk': 'kirmizi'}],
   'altyazi': ["Hızlı şarjda en ucuz operatörle en pahalısı arasında yüzde 69 fark var."]},
  {'tur': 'sayi', 'sure': 4.8, 'kicker': '60 kWh HIZLI ŞARJ', 'h1': 'Tek şarjda', 'h2': '406 TL fark.', 'kaynak': 'Ekim 2026 fiyatları',
   'etiket': 'EN UCUZ İLE EN PAHALI ARASINDAKİ FARK', 'deger': 406, 'son': ' TL', 'alt': '~584 TL yerine ~989 TL',
   'altyazi': ["60 kWh'lik bir hızlı şarj en ucuz operatörde ~584 TL, en pahalıda ~989 TL."]},
  {'tur': 'liste', 'sure': 5.2, 'kicker': 'EN UCUZ HIZLI ŞARJ', 'h1': 'İlk 5', 'h2': 'operatör.', 'kaynak': 'DC fiyatları · Ekim 2026',
   'satirlar': [
     {'sol': 'Otopriz', 'sag': '9,73 TL/kWh', 'vurgu': True},
     {'sol': 'Elaris', 'sag': '10,00 TL/kWh'},
     {'sol': 'Sharz', 'sag': '11,99 TL/kWh'},
     {'sol': 'Voltrun', 'sag': '12,90 TL/kWh'},
     {'sol': 'Volti', 'sag': '12,99 TL/kWh'}],
   'altyazi': ["19 operatörün güncel fiyatlarını tek sayfada karşılaştır."]},
  END('evturkiye.online/sarj-fiyatlari', 'Şarj etmeden önce karşılaştır', 'Fiyatları gör')]}

S['09-togg-126-bin'] = {'haber': '/haberler/turkiye/togg-4-yil-126-bin-satis', 'sahneler': [
  {'tur': 'hero', 'sure': 4.6, 'kicker': 'ODMD · 2023–EYLÜL 2026', 'h1': 'Togg 4 yılda', 'h2': '126 bini aştı.',
   'foto': '/public/images/haberler/togg-4-yil-126-bin-satis.jpg',
   'sayi': {'etiket': 'KULLANICIYA ULAŞAN TOGG', 'deger': 126122},
   'altyazi': ["Seri üretimin başladığı 2023'ten bu yana 126.122 Togg satıldı."]},
  {'tur': 'cubuklar', 'sure': 5.6, 'kicker': 'YILLARA GÖRE SATIŞ', 'h1': 'Her yıl', 'h2': 'daha fazla.', 'kaynak': 'Kaynak: ODMD verileri (AA)',
   'satirlar': [
     {'etiket': '2023', 'deger': '19.583', 'oran': 0.502, 'renk': 'gri'},
     {'etiket': '2024', 'deger': '30.093', 'oran': 0.771, 'renk': 'mavi'},
     {'etiket': '2025', 'deger': '39.020', 'oran': 1.0, 'renk': 'mavi'},
     {'etiket': '2026 · OCAK–EYLÜL', 'deger': '37.426', 'oran': 0.959, 'renk': 'yesil'}],
   'altyazi': ["2026'nın ilk 9 ayı, 2025'in tamamına şimdiden yaklaştı.", "Aradaki fark yalnızca 1.594 adet."]},
  {'tur': 'sayi', 'sure': 4.6, 'kicker': '2026 · İLK 9 AY', 'h1': 'Her 3 elektrikliden', 'h2': 'biri Togg.', 'kaynak': 'Kaynak: ODMD',
   'etiket': 'ELEKTRİKLİ PAZARDAKİ PAYI', 'deger': 31, 'on': '%',
   'altyazi': ["2026'nın ilk 9 ayında Türkiye'deki elektrikli satışlarının yüzde 31'i Togg'un."]},
  {'tur': 'liste', 'sure': 5.0, 'kicker': 'ÜÇÜNCÜ MODEL', 'h1': 'Sırada', 'h2': 'T6X var.', 'kaynak': 'Fuat Tosyalı, AA Finans',
   'satirlar': [
     {'sol': 'Satış tarihi', 'sag': 'Haziran 2027 (plan)', 'renk': 'mavi'},
     {'sol': 'Fiyat', 'alt': '"Çok çok daha hesaplı"', 'sag': 'Açıklanmadı', 'renk': 'gri'},
     {'sol': 'Batarya ve menzil', 'sag': 'Açıklanmadı', 'renk': 'gri'}],
   'altyazi': ["Üçüncü model T6X'in Haziran 2027'de satışa çıkması planlanıyor.", "Fiyat, batarya ve menzil henüz açıklanmadı."]},
  END()]}

S['10-hyundai-kasim'] = {'haber': '/haberler/turkiye/hyundai-elektrikli-fiyat-listesi-kasim-2026', 'sahneler': [
  {'tur': 'hero', 'sure': 4.6, 'kicker': 'HYUNDAI · KASIM 2026', 'h1': "Inster'da", 'h2': '150 bin TL indirim.', 'arac': 'hyundai-inster',
   'sayi': {'etiket': 'TÜM INSTER VERSİYONLARINDA', 'deger': 150000, 'son': ' TL'},
   'altyazi': ["Hyundai'nin Kasım listesinde Inster'ın tüm versiyonlarında 150 bin TL indirim var."]},
  {'tur': 'liste', 'sure': 5.6, 'kicker': 'KAMPANYALI FİYATLAR', 'h1': 'Inster', 'h2': "1,52 milyon TL'den.", 'kaynak': 'Kaynak: Hyundai Türkiye · Kasım 2026',
   'satirlar': [
     {'sol': 'Inster Dynamic', 'alt': '71,1 kW', 'sag': '1.520.000 TL', 'eski': '1.670.000 TL', 'vurgu': True},
     {'sol': 'Inster Advance', 'alt': '84,5 kW', 'sag': '1.770.000 TL', 'eski': '1.920.000 TL'},
     {'sol': 'Inster Cross Advance', 'alt': '84,5 kW', 'sag': '1.820.000 TL', 'eski': '1.970.000 TL'},
     {'sol': 'Kona Elektrik Advance', 'alt': '99 kW', 'sag': '2.349.000 TL', 'eski': '2.479.000 TL'}],
   'altyazi': ["Inster kampanyalı fiyatla 1.520.000 TL'den başlıyor.", "Kona Elektrik'te de 130 bin TL indirim var."]},
  {'tur': 'hero', 'sure': 4.8, 'kicker': 'YENİ · İZMİT ÜRETİMİ', 'h1': 'IONIQ 3', 'h2': 'listeye girdi.', 'arac': 'hyundai-ioniq-3',
   'sayi': {'etiket': 'IONIQ 3 SELECT · BAŞLANGIÇ', 'deger': 1799000, 'son': ' TL', 'renk': 'mavi'},
   'altyazi': ["Ekim'de satışa çıkan IONIQ 3, 1.799.000 TL'den başlıyor.", "Bu ay IONIQ 3'te kampanya yok."]},
  END()]}

S['11-catl-tuzla'] = {'haber': '/haberler/turkiye/catl-ning-service-turkiye-tuzla', 'sahneler': [
  {'tur': 'hero', 'sure': 4.6, 'kicker': 'CATL · NING SERVICE · 19 KASIM', 'h1': 'Batarya servisi', 'h2': "Tuzla'da açılıyor.",
   'foto': '/public/images/haberler/catl-ning-service-turkiye-tuzla.jpg',
   'altyazi': ["Dünyanın en büyük batarya üreticisi CATL, Türkiye servis merkezini 19 Kasım'da Tuzla'da açıyor."]},
  {'tur': 'adimlar', 'sure': 5.4, 'kicker': 'HİZMETLER', 'h1': 'Merkezde', 'h2': 'neler yapılacak?',
   'satirlar': [
     {'baslik': 'Arıza tespiti ve onarım', 'alt': 'CATL bataryalı araçlar ve enerji depolama'},
     {'baslik': 'Garanti ve izleme', 'alt': 'Bataryanın dijital olarak izlenmesi'},
     {'baslik': 'Hücre düzeyinde onarım', 'alt': 'İlerleyen dönemde eklenecek'}],
   'altyazi': ["Arıza tespiti, bakım, garanti yönetimi ve batarya izleme hizmeti verilecek."]},
  {'tur': 'liste', 'sure': 5.4, 'kicker': 'ARAÇ SAHİPLERİ İÇİN', 'h1': 'Senin için', 'h2': 'ne değişir?', 'kaynak': 'Kaynak: Ascendum Türkiye',
   'satirlar': [
     {'sol': "Aracı Tuzla'ya götürmek", 'sag': 'Gerekmiyor', 'renk': 'mavi'},
     {'sol': 'Garanti ve servis', 'sag': 'Marka serviste', 'renk': 'mavi'},
     {'sol': 'Zor batarya arızaları', 'alt': 'Yurt dışına gitmeden', 'sag': 'Tuzla\'da çözülebilir', 'vurgu': True}],
   'altyazi': ["Garanti ve servis süreçleri marka servislerinde kalıyor.", "Servisin çözemediği batarya işleri bu merkeze yönlendirilebilecek."]},
  END()]}

S['12-karsilastirma'] = {'haber': '/karsilastir', 'site': True, 'sahneler': [
  {'tur': 'kiyas', 'sure': 5.6, 'kicker': 'KARŞILAŞTIRMA ARACI', 'h1': 'Togg T10X mı,', 'h2': 'Tesla Model Y mi?', 'kaynak': 'Ekim 2026 liste fiyatları',
   'a': {'arac': 'togg-t10x', 'ad': 'T10X Uzun Menzil'}, 'b': {'arac': 'tesla-model-y', 'ad': 'Model Y RWD'},
   'satirlar': [
     {'etiket': 'LİSTE FİYATI', 'a': '2.219.668 TL', 'b': '2.474.985 TL', 'iyi': 'a'},
     {'etiket': 'WLTP MENZİL', 'a': '523 km', 'b': '500 km', 'iyi': 'a'},
     {'etiket': 'OTOYOL MENZİLİ (TAHMİNİ)', 'a': '~399 km', 'b': '~380 km', 'iyi': 'a'}],
   'altyazi': ["İki popüler SUV'u yan yana koyduk.", "Togg daha ucuz, menzili de daha uzun."]},
  {'tur': 'kiyas', 'sure': 5.6, 'kicker': 'ŞARJ VE MALİYET', 'h1': 'Şarjda ve maliyette', 'h2': 'Model Y önde.', 'kaynak': 'Ortalama DC fiyatı 13,69 TL/kWh',
   'a': {'arac': 'togg-t10x', 'ad': 'T10X Uzun Menzil'}, 'b': {'arac': 'tesla-model-y', 'ad': 'Model Y RWD'},
   'satirlar': [
     {'etiket': '%10 → %80 HIZLI ŞARJ', 'a': '~29 dk', 'b': '~21 dk', 'iyi': 'b'},
     {'etiket': '10 DAKİKADA KAZANILAN MENZİL', 'a': '~96 km', 'b': '~126 km', 'iyi': 'b'},
     {'etiket': '100 KM (HIZLI ŞARJ)', 'a': '~314 TL', 'b': '~233 TL', 'iyi': 'b'}],
   'altyazi': ["Model Y daha verimli: daha hızlı şarj oluyor, 100 km'de daha az tutuyor."]},
  {'tur': 'adimlar', 'sure': 5.0, 'kicker': 'KENDİN DENE', 'h1': 'İstediğin 3 aracı', 'h2': 'yan yana koy.',
   'satirlar': [
     {'baslik': 'Fiyat ve menzil', 'alt': 'WLTP, otoyol ve kış menzili'},
     {'baslik': 'Şarj süresi ve maliyet', 'alt': '100 km ve yıllık şarj masrafı'},
     {'baslik': 'Artı ve eksiler', 'alt': 'Seçtiğin araçlara göre otomatik'}],
   'altyazi': ["Karşılaştırma aracında 3 aracı seç, farkları anında gör."]},
  END('evturkiye.online/karsilastir', 'Elektrikli araçları karşılaştır', 'Karşılaştır')]}

S['13-byd-kasim'] = {'haber': '/haberler/turkiye/byd-fiyat-listesi-kasim-2026', 'sahneler': [
  {'tur': 'hero', 'sure': 4.6, 'kicker': 'BYD · KASIM 2026', 'h1': "BYD'nin listesinde", 'h2': 'sadece 2 model kaldı.', 'arac': 'byd-seal',
   'sayi': {'etiket': 'SEAL AWD · KAMPANYA FARKI', 'deger': 305000, 'son': ' TL'},
   'altyazi': ["BYD Türkiye'nin Kasım fiyat listesinde yalnızca Seal ve Tang var."]},
  {'tur': 'liste', 'sure': 5.2, 'kicker': 'KASIM FİYATLARI', 'h1': 'Seal ve Tang', 'h2': 'ne kadar?', 'kaynak': 'Kaynak: BYD Türkiye · 5 Kasım 2026',
   'satirlar': [
     {'sol': 'BYD Seal AWD Excellence', 'alt': '390 kW · 520 km', 'sag': '3.772.000 TL', 'eski': '4.077.000 TL', 'vurgu': True},
     {'sol': 'BYD Tang Flagship', 'alt': '7 koltuk · 530 km', 'sag': '5.418.000 TL', 'renk': 'mavi'}],
   'altyazi': ["Seal 4.077.000 TL yerine kampanyalı 3.772.000 TL.", "Yedi koltuklu Tang 5.418.000 TL."]},
  {'tur': 'liste', 'sure': 5.0, 'kicker': 'LİSTEDEN ÇIKANLAR', 'h1': 'Gam', 'h2': 'daraldı.', 'kaynak': 'Kaynak: BYD Türkiye',
   'satirlar': [
     {'sol': 'Sealion 7', 'alt': "Eylül'de listedeydi", 'sag': 'Fiyat yok', 'renk': 'kirmizi'},
     {'sol': 'Atto 2, Dolphin, Atto 3', 'sag': 'Fiyat yok', 'renk': 'kirmizi'},
     {'sol': 'Kalan iki model', 'sag': '%75 ÖTV', 'renk': 'turuncu'}],
   'altyazi': ["Eylül'de listede olan Sealion 7'ye artık fiyat verilmiyor.", "Kalan iki model de yüzde 75 ÖTV diliminde."]},
  END()]}

S['14-yakinimdaki-sarj'] = {'haber': '/yakindaki-sarj-istasyonlari', 'site': True, 'sahneler': [
  {'tur': 'harita', 'sure': 5.2, 'kicker': 'YAKINIMDAKİ ŞARJ · CANLI', 'h1': 'Şarjın azaldı,', 'h2': 'en yakın istasyon?', 'not': 'TEMSİLİ GÖRÜNÜM',
   'pinler': [{'x': 520, 'y': 170, 'etiket': 'DC 180 kW · Müsait'}, {'x': 150, 'y': 400, 'etiket': 'AC 22 kW · Müsait'}, {'x': 760, 'y': 330, 'etiket': 'DC 120 kW · Dolu', 'musait': False}],
   'altyazi': ["Konumunu ver, en yakın şarj istasyonları anında gelsin."]},
  {'tur': 'adimlar', 'sure': 5.6, 'kicker': 'TEK EKRANDA', 'h1': 'Gitmeden önce', 'h2': 'her şeyi gör.',
   'satirlar': [
     {'baslik': 'Anlık müsait soket', 'alt': 'Hangi soket boş, hemen gör'},
     {'baslik': 'Güç, soket ve fiyat', 'alt': 'kW, soket tipi ve kWh fiyatı'},
     {'baslik': 'Yol tarifi', 'alt': 'Google ya da Apple Haritalar ile'}],
   'altyazi': ["Müsait soket, güç, soket tipi ve fiyat tek ekranda.", "Yol tarifini Google ya da Apple Haritalar'la başlat."]},
  END('evturkiye.online/yakindaki-sarj-istasyonlari', 'Yakınındaki şarjı bul', 'Hemen bak')]}

for k, v in S.items():
    json.dump(v, open(os.path.join(D, k + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(S), 'spesifikasyon yazıldı')
