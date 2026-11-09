// Arama motoru dizinleme kuralları (AdSense "düşük değerli içerik" temizliği).
// Aynı kurallar astro.config.mjs içindeki site haritası filtresinde de uygulanır; birini değiştirirsen ötekini de değiştir.
export const MIN_HABER_KELIME = 200;
export function kelimeSay(md: string): number {
  return md.replace(/<[^>]+>/g, ' ').replace(/[#*_>|`\[\]()-]/g, ' ').split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length;
}
