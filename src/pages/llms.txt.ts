import type { APIRoute } from 'astro';
import { getNews, CATS } from '../lib/util';
import { GUIDES } from '../lib/ev';
import routes from '../data/routes.json';
import company from '../data/company.json';

// llms.txt: yapay zekâ arama motorları (ChatGPT, Gemini, Perplexity vb.) için sitenin özeti ve en önemli sayfaları.
export const GET: APIRoute = async ({ site }) => {
  const u = (p: string) => new URL(p, site).toString();
  const news = (await getNews()).slice(0, 25);
  const lines = [
    '# EV Türkiye',
    '',
    "> Türkiye'nin elektrikli araç rehberi: elektrikli ve plug-in hibrit araç haberleri, Türkiye fiyat listeleri, şarj operatörlerinin güncel kWh fiyatları, rota ve şarj maliyeti planlayıcı, yakındaki şarj istasyonları ve model karşılaştırma.",
    '',
    `Yayın sahibi: ${company.legalName || company.name} Genel yayın yönetmeni: ${company.editor}. Fiyatlar ve maliyetler bilgilendirme amaçlıdır; tahmini hesaplamalar sayfalarda belirtilir.`,
    '',
    '## Araçlar',
    `- [Rota ve şarj maliyeti planlayıcı](${u('/rota-planlayici/')}): Araç ve güzergaha göre şarj durakları ve toplam yol maliyeti.`,
    `- [Yakınımdaki şarj istasyonları](${u('/yakindaki-sarj-istasyonlari/')}): Konuma göre en yakın şarj istasyonları, güç, soket ve fiyat.`,
    `- [Şarj fiyatları](${u('/sarj-fiyatlari/')}): Türkiye'deki şarj operatörlerinin güncel AC ve DC kWh fiyatları.`,
    `- [Elektrikli araç karşılaştırma](${u('/karsilastir/')}): Türkiye'de satılan elektrikli araçların fiyat, menzil, şarj süresi ve maliyet karşılaştırması.`,
    `- [Elektrikli araç modelleri](${u('/modeller/')}): Türkiye'de satılan elektrikli modeller ve teknik veriler.`,
    `- [Kampanyalar](${u('/firsatlar/')}): Güncel elektrikli araç ve şarj kampanyaları.`,
    '',
    '## Rehberler',
    ...GUIDES.map((g) => `- [${g.label}](${u(g.href + '/')}): ${g.desc}`),
    '',
    '## Popüler rotalar (elektrikli araçla maliyet ve şarj durakları)',
    ...routes.map((r: any) => `- [${r.from} – ${r.to}](${u(`/rota/${r.slug}/`)})`),
    '',
    '## Son haberler ve rehber yazıları',
    ...news.map((p) => `- [${p.data.title}](${u(`/haberler/${p.data.category}/${p.id}/`)}): ${p.data.description}`),
    '',
    '## Kategoriler',
    ...Object.entries(CATS).map(([k, v]) => `- [${v.label}](${u(`/haberler/${k}/`)}): ${v.desc}`),
    '',
    '## Hakkında',
    `- [Hakkımızda](${u('/hakkimizda/')})`,
    `- [Künye](${u('/kunye/')})`,
    `- [Yayın ilkeleri](${u('/yayin-ilkeleri/')})`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
