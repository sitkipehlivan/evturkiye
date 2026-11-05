// Build sonrası: HTML'deki site içi linkleri sonu "/" ile yazar (Netlify'ın /x → /x/ yönlendirmesine gerek kalmasın).
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const KOK = 'dist';
let dosya = 0, link = 0;
function gez(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) gez(p);
    else if (f.endsWith('.html')) {
      const h = readFileSync(p, 'utf8');
      // href="/yol" | href="/yol?q" | href="/yol#x" — uzantısız, /api ve /_astro dışındakiler
      const y = h.replace(/href="(\/(?!\/|api\/|_astro\/|_|images\/|data\/)[^"?#]*?[^/"?#])([?#][^"]*)?"/g, (m, yol, ek) => {
        if (/\.[a-z0-9]+$/i.test(yol.split("/").pop())) return m;
        link++; return `href="${yol}/${ek || ''}"`;
      });
      if (y !== h) { writeFileSync(p, y); dosya++; }
    }
  }
}
gez(KOK);
console.log(`slash: ${dosya} dosyada ${link} link düzeltildi`);
