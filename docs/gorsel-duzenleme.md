# Haber görselleri: gerçek araç + yapay zekâ ile uyarlanmış çevre

**İlke:** Görseldeki araç (ve şarj ünitesi gibi ürünler) gerçek bir fotoğraftan gelir ve değiştirilmez. Yalnızca arka plan, ışık ve renk düzenlemesi yapay zekâ ile yapılır.

**Telif notu:** Arka planı değiştirmek, kaynak fotoğrafın telifini ortadan kaldırmaz. Bu yüzden kaynak fotoğraf her zaman kullanım izni olan yerden alınır:
- Üreticinin basın/medya sitesi (haber amaçlı kullanım; altına "Görsel: <marka>" yazılır)
- Unsplash, Pexels (serbest lisans)
- Wikimedia Commons (fotoğrafçı adı ve lisans belirtilerek)
- Kendi çekimlerimiz

## Ana prompt (fotoğrafı yükleyip yapıştır, en alttaki SCENE satırını doldur)

```
You are editing a REAL photograph for the cover image of a Turkish electric-vehicle news website. Treat the uploaded photo as the source of truth.

STRICT RULES - DO NOT CHANGE:
- Keep every vehicle, charger and product in the photo exactly as it is: same shape, design, color, wheels, lights, badges, proportions and camera angle.
- Do not redraw, restyle, "improve" or replace the vehicle. Do not add or remove vehicles.
- Do not add any text, letters, numbers, logos, watermarks or UI elements.
- Blur or remove license plate characters only.
- Do not add people. If people are in the photo, keep them small and unrecognizable or remove them.

WHAT TO EDIT:
- Replace or clean up the background according to the SCENE line below.
- Match lighting, shadows and reflections on the vehicle to the new background so it looks like one real photograph, not a collage.
- Color grade: clean, bright, natural, premium magazine look. Whites stay pure white, no heavy filters, no HDR look, no oversaturation.
- Add only a very subtle accent of eco green (#12A150) and electric blue (#0A7CFF), e.g. soft light reflections, a charger LED glow or a faint rim light. Accents must be small, never dominant.

COMPOSITION AND OUTPUT:
- 16:9 landscape, 1600 x 900 pixels.
- Main subject slightly off-center, fully inside the frame, with clean negative space on one side.
- Sharp focus on the subject, gentle depth of field on the background.
- Photorealistic. It must look like an unedited professional press photo.

SCENE: [paste the scene line here]
```

## Teslim
Görseli `docs/gorsel-bekleyenler.md` listesindeki dosya adıyla (`<slug>.jpg` ya da `.png`) masaüstündeki **evturkiye görseller** klasörüne koy. Günlük görsel görevi klasörü kontrol eder, eşleşen görseli siteye ekler ve otomatik kapağı devreden çıkarır.
