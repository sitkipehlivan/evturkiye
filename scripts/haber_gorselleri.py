"""Görseli eksik haberler için Gemini ile kapak görseli hazırlar (GitHub Actions'ta çalışır).

Haber dosyasındaki alanlar:
  imageMode:   edit      -> imageSource'taki GERÇEK fotoğraf korunur, sadece çevre/ışık düzenlenir (araç içeren görseller)
               generate  -> imageScene tarifinden sıfırdan üretilir (ARAÇ İÇERMEYEN sahneler: fiş, masa, priz, batarya vb.)
  imageSource: lisansı uygun gerçek fotoğrafın doğrudan görsel adresi (edit modu için)
  imageScene:  İngilizce sahne tarifi
  imageCredit: görsel altına yazılacak kaynak (ör. "Togg Basın", "Wikimedia Commons / Ad Soyad, CC BY-SA 4.0")

Çıktı: public/images/haberler/<slug>.jpg  (zaten varsa dokunulmaz)
"""
import glob
import os
import sys

import yaml

sys.path.insert(0, os.path.dirname(__file__))
from gemini_image import GeminiError, fetch, generate, save_jpeg  # noqa: E402

MAX = int(os.environ.get('MAX_IMAGES', '6'))

EDIT_PROMPT = """You are editing a REAL photograph for the cover image of a Turkish electric-vehicle news website. Treat the attached photo as the source of truth.

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
- 16:9 landscape.
- Main subject slightly off-center, fully inside the frame, with clean negative space on one side.
- Sharp focus on the subject, gentle depth of field on the background.
- Photorealistic. It must look like an unedited professional press photo.

SCENE: {scene}"""

GENERATE_PROMPT = """Create a photorealistic editorial cover photo for a Turkish electric-vehicle news website.

SCENE: {scene}

RULES:
- Absolutely NO cars or other vehicles anywhere in the image (not even partially or in the background).
- No text, letters, numbers, logos, brand names, watermarks or UI elements. No people's faces.
- Clean, bright, natural, premium magazine look; soft daylight; white or light grey tones; no heavy filters, no HDR, no oversaturation.
- Only a very subtle accent of eco green (#12A150) and electric blue (#0A7CFF), e.g. a small LED glow or soft reflection.
- 16:9 landscape, subject slightly off-center with clean negative space on one side, gentle depth of field.
- It must look like a real professional photograph, not an illustration or 3D render."""


def main():
    done, failed, skipped = [], [], []
    for path in sorted(glob.glob('src/content/haberler/*.md')):
        if len(done) >= MAX:
            break
        slug = os.path.basename(path)[:-3]
        out = f'public/images/haberler/{slug}.jpg'
        if os.path.exists(out):
            continue
        fm = yaml.safe_load(open(path, encoding='utf-8').read().split('---')[1]) or {}
        mode = (fm.get('imageMode') or '').strip()
        scene = (fm.get('imageScene') or '').strip()
        if mode not in ('edit', 'generate') or not scene:
            skipped.append(slug)
            continue
        print(f'-> {slug} ({mode})')
        try:
            if mode == 'edit':
                src = (fm.get('imageSource') or '').strip()
                if not src:
                    raise GeminiError('edit modu için imageSource yok')
                mime, data = fetch(src)
                img = generate(EDIT_PROMPT.format(scene=scene), [(mime, data)])
            else:
                img = generate(GENERATE_PROMPT.format(scene=scene))
            save_jpeg(img, out)
            done.append(slug)
        except Exception as e:  # tek haberdeki hata diğerlerini durdurmasın
            print(f'   HATA: {e}')
            failed.append(f'{slug}: {str(e)[:200]}')
    print(f'\nÜretilen: {len(done)} | Hata: {len(failed)} | Bilgi eksik (otomatik kapakta kalır): {len(skipped)}')
    for d in done:
        print('  +', d)
    for f in failed:
        print('  !', f)
    with open(os.environ.get('GITHUB_STEP_SUMMARY', os.devnull), 'a') as s:
        s.write(f'### Haber görselleri\n- Üretilen: {len(done)}\n- Hata: {len(failed)}\n')
        for f in failed:
            s.write(f'  - {f}\n')


if __name__ == '__main__':
    main()
