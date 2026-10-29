"""Model sayfaları için gerçek araç fotoğrafı (GitHub Actions'ta çalışır, ücretsiz; yapay zekâ kullanılmaz).

src/data/models.json içinde `wiki` alanı olan her model (marka+model) için Wikipedia makalesinin ana
fotoğrafını Wikimedia Commons'tan indirir. Yalnızca serbest lisanslı (CC BY, CC BY-SA, CC0, kamu malı)
fotoğraflar kabul edilir. Çıktı:
  public/images/modeller/<brandSlug>-<modelSlug>.jpg
  src/data/model-images.json  ->  { "<brandSlug>/<modelSlug>": { "src": "/images/modeller/...", "credit": "..." } }
Zaten görseli olan modellere dokunulmaz.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from gemini_image import GeminiError, fetch, save_jpeg  # noqa: E402
from haber_gorselleri import wiki_photo  # noqa: E402

MODELS = 'src/data/models.json'
OUT = 'src/data/model-images.json'


def main():
    os.makedirs('public/images/modeller', exist_ok=True)
    open('public/images/modeller/.gitkeep', 'a').close()
    models = json.load(open(MODELS, encoding='utf-8'))['models']
    images = json.load(open(OUT, encoding='utf-8')) if os.path.exists(OUT) else {}
    done, failed = [], []
    seen = set()
    for m in models:
        key = f"{m['brandSlug']}/{m['modelSlug']}"
        if key in seen or not m.get('wiki'):
            continue
        seen.add(key)
        path = f"public/images/modeller/{m['brandSlug']}-{m['modelSlug']}.jpg"
        if key in images and os.path.exists(path):
            continue
        try:
            url, credit = wiki_photo(m['wiki'])
            _, data = fetch(url)
            save_jpeg(data, path, width=1200)
            images[key] = {'src': '/' + path.removeprefix('public/'),
                           'credit': credit.replace(' (arka plan yapay zekâ ile düzenlendi)', '')}
            done.append(key)
        except (GeminiError, Exception) as e:  # noqa: BLE001
            failed.append(f'{key}: {e}')
    json.dump(dict(sorted(images.items())), open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'Eklenen: {len(done)}')
    for k in done:
        print('  +', k)
    if failed:
        print(f'Başarısız: {len(failed)}')
        for f in failed:
            print('  -', f)


if __name__ == '__main__':
    main()
