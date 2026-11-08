# Instagram Reels üretimi

Günlük Reels videoları `scripts/reels/render.py` ile, JSON spesifikasyonlarından üretilir. Görünüm: beyaz zemin, ortada çok soluk büyük EV Türkiye amblemi, sitenin renkleri ve yazı tipi.

```
python3 scripts/reels/render.py scripts/reels/specs/<ad>.json            # social/reels/<ad>.mp4 + <ad>-kapak.jpg
python3 scripts/reels/render.py scripts/reels/specs/<ad>.json --guvenli  # güvenli alan kılavuzlu kontrol kareleri
python3 scripts/reels/render.py scripts/reels/specs/<ad>.json --kare 2 3.5
```

Gereken paketler: `pillow numpy fonttools brotli cairosvg` ve ffmpeg. Yeni araç kesimi için ayrıca `rembg onnxruntime`.
Çıktılar `social/` altına yazılır; bu klasör depoya girmez.

## Güvenli alan (değiştirme)
- 1080x1920, 30 fps. Üst 250 px ve alt 670 px (y > 1250) Instagram arayüzüyle kaplanır; buralara yazı konmaz. Sağdaki ~120 px'te beğen/yorum butonları var.
- Sabit düzen: logo 258, kicker 316, başlık 352/446, içerik 586–1060, kaynak 1072, altyazı 1112–1246.
- Profil ızgarası Reels'i 3:4 kırpar (y 240–1680); başlık ve ana görsel bu alanda kalır. Kapak, ilk sahnenin son karesidir.

## Spesifikasyon
```json
{"haber": "/haberler/<kategori>/<slug>", "sahneler": [ {sahne}, ..., {"tur": "kapanis"} ]}
```
Her sahnede: `tur`, `sure` (sn, 4.4–6.4), `kicker` (BÜYÜK HARF, kısa), `h1` (siyah satır), `h2` (yeşil satır), isteğe bağlı `kaynak`, `altyazi` (1–2 cümle; her biri en fazla 2 satır olacak uzunlukta).

| tur | alanlar |
|---|---|
| hero | `arac` (cutouts/ anahtarı) veya `foto` (/public/images/...), isteğe bağlı `sayi` {etiket, deger, ondalik, on, son, renk} |
| sayi | `etiket`, `deger`, `ondalik`, `on`, `son`, `renk`, `alt`, isteğe bağlı `cubuk` {oran, sol, sag} |
| cubuklar | `satirlar` [{etiket, alt, deger, oran 0–1, renk}] (2–4) |
| siralama | `satirlar` [{arac?, ad, alt?, deger, oran, renk}] (3–5) |
| liste | `satirlar` [{sol, alt?, sag, eski?, renk?, vurgu?}] (2–5) |
| etiket | `arac`/`foto`, `etiket`, `gri`, `renk` |
| kiyas | `a`/`b` {arac, ad}, `satirlar` [{etiket, a, b, iyi: "a"/"b"}] (3) |
| rota | `nereden`, `nereye`, `duraklar` [0–1], `istatistik` [[etiket, değer]] (3) |
| adimlar | `satirlar` [{baslik, alt}] (3) |
| harita | `pinler` [{x, y, etiket, musait}], `not` |
| kapanis | `link`, `alt`, `buton` |

Renkler: `yesil`, `mavi`, `kirmizi`, `gri`, `turuncu`, `koyu`.

## İçerik kuralları
- Videodaki her rakam ilgili haberin metninde ya da `src/data/*.json`'da geçmeli. Yeni rakam uydurma, yuvarlarken `~` kullan.
- 3–5 sahne + kapanış, toplam 18–30 sn. İlk sahne merak uyandıran bir kanca: en çarpıcı rakam ve araç görseli.
- Araç görseli yalnızca `scripts/reels/cutouts/` (lisanslı model fotoğraflarından kesilmiş) ya da haberin kendi görseli (`/public/images/haberler/<slug>.jpg`). Eski kasa ya da başka versiyon fotoğrafı kullanma; uygun kesim yoksa haber görselini `foto` olarak kullan.
- Yeni kesim gerekiyorsa: `public/images/modeller/<marka>-<model>.jpg` → rembg (isnet-general-use) → `cutouts/<marka>-<model>.png`, en fazla 1000 px. Kenarda başka araç ya da direk kalmışsa kesimi kullanma.
- Temsili görünümlerde (harita gibi) gerçek istasyon adı yazma ve "TEMSİLİ GÖRÜNÜM" notunu koy.
- Satır içinde `→` gibi yazı tipinde olmayan işaretler kullanma (mono etiketler hariç).

## Günlük akış
1. Son 2 günün haberlerinden, daha önce Reels'i yapılmamış (bkz. `docs/reels-gunluk.md`) en ilgi çekici, rakamı bol, Türkiye'yi ilgilendiren haberi seç.
2. Günlükteki son 3 kayıt haber ise bugün site içeriği üret: rota planlayıcı (farklı şehir çifti), karşılaştırma (POPULAR_PAIRS'ten farklı çift), şarj fiyatları (güncel operators.json) ya da yakınımdaki şarj. Daha önce yapılan site videosunu birebir tekrarlama.
3. `scripts/reels/specs/<YYYY-MM-DD>-<kisa-ad>.json` yaz → `--guvenli` ile kareleri kontrol et → videoyu üret.
4. Paylaşım metnini hazırla: kanca cümle + 3–6 satır özet (rakamlar) + soru + "profildeki linkte: evturkiye.online/…" + kaynak + 5–8 hashtag (#evtürkiye her zaman).
5. `docs/reels-gunluk.md`'ye satır ekle, spec ile birlikte commit et (`[deploy]` ekleme).
