# EV Türkiye — evturkiye.com.tr

Elektrikli araç rota & şarj planlayıcı, şarj fiyatları, haberler, kampanyalar ve EV modelleri.

- **Altyapı:** Astro (statik) + Netlify
- **Editör paneli:** `/admin` (Sveltia CMS, GitHub ile giriş)
- **Harita/rota:** Leaflet + CARTO zemin, OSRM (rota), Photon (adres), Overpass/OpenStreetMap (istasyonlar)

## İçerik nerede?
| İçerik | Konum | Panelde |
|---|---|---|
| Haberler & rehberler | `src/content/haberler/*.md` | Haberler & Rehber |
| Kampanyalar | `src/content/firsatlar/*.md` | Fırsatlar |
| Şarj fiyatları | `src/data/operators.json` | Veriler → Şarj fiyatları |
| EV modelleri | `src/data/models.json` | Veriler → EV modelleri |
| Popüler rota sayfaları | `src/data/routes.json` | (kod) |

## Geliştirme
```
npm install
npm run dev
npm run build
```

## Notlar
- Rota/istasyon/adres servisleri ücretsiz halka açık sunuculardır; trafik arttığında
  ücretli/anahtarlı servise (Mapbox, OpenRouteService veya kendi OSRM/Overpass sunucusu) geçilmelidir.
- Şarj fiyatlarının güncel tutulması güvenilirlik için kritiktir; her güncellemede `updated` tarihini değiştirin.
