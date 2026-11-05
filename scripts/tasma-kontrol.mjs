// Taşma kontrolü: derlenmiş sitenin (dist/) her sayfasını masaüstü ve mobil genişlikte açar,
// yerleşim bozukluğu varsa hata verir. GitHub Actions'ta her push'ta çalışır (.github/workflows/tasma-kontrol.yml).
//
// Yakalanan durumlar:
//  1. Sayfa yatay taşıyor (mobilde ekran yana kayıyor).
//  2. Haber/rehber metnindeki bir öğe (tablo, görsel, kod, iframe...) yazı sütunundan dışarı taşıyor
//     ve yan sütunun üstüne biniyor. Kendi içinde kaydırılabilen kutular (overflow: auto) sorun sayılmaz.
//
// Kullanım: npm run build:fast && node scripts/tasma-kontrol.mjs [--limit 50]
import { createServer } from 'node:http';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const DIST = 'dist';
const VIEWPORTS = [['masaüstü', 1366, 900], ['mobil', 390, 844]];
const SKIP = [/^\/admin\//, /^\/offline\//, /^\/404/];
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > 0 ? Number(process.argv[limitArg + 1]) : Infinity;

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

async function pages(dir = DIST, base = '') {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...await pages(join(dir, e.name), `${base}/${e.name}`));
    else if (e.name === 'index.html') out.push(`${base}/`);
  }
  return out;
}

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = join(DIST, p);
  try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); } catch { f = join(DIST, '404.html'); }
  try { res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); res.end(await readFile(f)); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const origin = `http://localhost:${server.address().port}`;

// Sayfada çalışır: taşan öğeleri listeler.
function check() {
  const issues = [];
  const vw = window.innerWidth;
  const sw = document.documentElement.scrollWidth;
  if (sw > vw + 1) {
    // En geniş taşan öğeyi bul (hatayı okumayı kolaylaştırır)
    let worst = null;
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width && r.right > vw + 1 && getComputedStyle(el).position !== 'fixed' && (!worst || r.right > worst.r)) worst = { el, r: r.right };
    }
    issues.push(`sayfa yatay taşıyor (${sw}px > ${vw}px)${worst ? ` — en geniş öğe: ${desc(worst.el)}` : ''}`);
  }
  const clipped = (el, root) => {
    for (let a = el.parentElement; a && a !== root; a = a.parentElement) {
      if (getComputedStyle(a).overflowX !== 'visible') return true;
    }
    return false;
  };
  for (const col of document.querySelectorAll('.prose')) {
    const cr = col.getBoundingClientRect();
    if (!cr.width) continue;
    for (const el of col.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (!r.width || r.right <= cr.right + 2) continue;
      if (clipped(el, col)) continue;
      issues.push(`yazı sütunundan ${Math.round(r.right - cr.right)}px taşan öğe: ${desc(el)}`);
      break;
    }
  }
  return issues;
  function desc(el) {
    const t = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `<${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? ` class="${el.className.split(' ')[0]}"` : ''}>${t ? ` "${t}"` : ''}`;
  }
}

const list = (await pages()).filter((p) => !SKIP.some((r) => r.test(p))).sort().slice(0, LIMIT);
const browser = await chromium.launch();
const failures = [];
for (const [name, width, height] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  // Dış istekleri (reklam, analitik, harita) engelle: hem hızlı hem deterministik.
  await ctx.route('**/*', (r) => (r.request().url().startsWith(origin) ? r.continue() : r.abort()));
  await ctx.addInitScript(() => { try { localStorage.setItem('evt-cerez', 'red'); } catch {} });
  const page = await ctx.newPage();
  for (const p of list) {
    try {
      await page.goto(origin + p, { waitUntil: 'load', timeout: 20000 });
      await page.waitForTimeout(50);
      for (const i of await page.evaluate(check)) failures.push(`[${name}] ${p}  →  ${i}`);
    } catch (e) {
      failures.push(`[${name}] ${p}  →  açılamadı: ${e.message.split('\n')[0]}`);
    }
  }
  await ctx.close();
}
await browser.close();
server.close();

console.log(`${list.length} sayfa × ${VIEWPORTS.length} ekran genişliği kontrol edildi.`);
if (failures.length) {
  console.log(`\n${failures.length} yerleşim sorunu bulundu:\n`);
  for (const f of failures) console.log('  ✗ ' + f);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFile } = await import('node:fs/promises');
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `## Taşma kontrolü: ${failures.length} sorun\n\n${failures.map((f) => `- ${f}`).join('\n')}\n`);
  }
  process.exit(1);
}
console.log('Sorun yok ✓');
