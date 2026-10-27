# EV Türkiye SEO notları

## Yapılanlar
- Her sayfada başlık, açıklama, canonical, Open Graph, `robots: max-image-preview:large` (Google Discover için büyük görsel).
- `sitemap-index.xml` (otomatik), `robots.txt` (/admin kapalı).
- Yapılandırılmış veri: WebSite + SearchAction (ana sayfa), NewsArticle/Article (haberler), Car (model), FAQPage (rota sayfaları ve konu sayfaları), ItemList (menzil, marka), BreadcrumbList (rehber).
- Konu (pillar) sayfaları: `/elektrikli-arac`, `/elektrikli-arac-sarj`, `/elektrikli-arac-menzil`, `/elektrikli-arac-sarj-maliyeti`. Rakamlar `models.json` ve `operators.json`'dan otomatik hesaplanır; veriler güncellenince sayfalar da güncellenir.
- Marka sayfaları: `/modeller/<marka>` (modeller, kampanyalar, o markayı anan haberler otomatik).
- İç linkler: üst menüde "EV Rehberi", alt bilgide "Rehberler" sütunu, her haber ve model sayfasının altında rehber kutusu, haberlerde geçen markalara otomatik link.
- Haber botu SEO kuralları: `docs/haber-botu.md` bölüm 5a.

## Google Search Console
1. https://search.google.com/search-console → Mülk ekle.
2. **Tercih: Alan (Domain) mülkü** `evturkiye.online` → Google'ın verdiği TXT kaydı DNS'e eklenir (Netlify DNS → evturkiye.online → Add record → TXT, host `@`).
   Alternatif: **URL ön eki** `https://evturkiye.online/` → "HTML etiketi" → `content="..."` içindeki kodu Netlify'da `GSC_VERIFICATION` ortam değişkenine yaz ve yeniden derle.
3. Doğrulandıktan sonra Dizin oluşturma → Site haritaları → `sitemap-index.xml` gönder.
4. URL denetimi ile önce şu sayfaların dizine eklenmesini iste: `/`, `/elektrikli-arac`, `/elektrikli-arac-sarj-maliyeti`, `/sarj-fiyatlari`, `/rota-planlayici`.

## .com.tr'ye geçiş (TRABİS onayından sonra)
1. Netlify'da evturkiye.com.tr'yi birincil alan adı yap; `SITE_URL=https://evturkiye.com.tr` olarak güncelle (canonical ve sitemap buna göre değişir).
2. `netlify.toml`'a ekle:
   ```
   [[redirects]]
     from = "https://evturkiye.online/*"
     to = "https://evturkiye.com.tr/:splat"
     status = 301
     force = true
   ```
3. Search Console'da evturkiye.com.tr mülkünü ekle ve eski mülkte **Ayarlar → Adres değişikliği** aracıyla taşımayı bildir.
4. .online alan adını en az 1 yıl yenilemeye devam et (yönlendirme çalışsın).
