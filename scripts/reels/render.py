"""EV Türkiye Instagram Reels üretici (1080x1920, 30 fps, beyaz tema).

Kullanım:
  python3 scripts/reels/render.py scripts/reels/specs/<ad>.json            # video + kapak
  python3 scripts/reels/render.py scripts/reels/specs/<ad>.json --kare 2 3.5   # tek kare (kontrol)
  python3 scripts/reels/render.py scripts/reels/specs/<ad>.json --guvenli      # güvenli alan kılavuzuyla kareler

Çıktı: social/reels/<ad>.mp4 ve social/reels/<ad>-kapak.jpg (depoya girmez, .gitignore).
Spesifikasyon biçimi ve sahne türleri: docs/reels.md
"""
import json, math, os, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np

W, H, FPS = 1080, 1920, 30
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
CACHE = os.path.join(HERE, '.cache'); os.makedirs(CACHE, exist_ok=True)

# Renkler (sitenin paleti, açık tema)
BG = (250, 251, 253)
INK = (13, 20, 36)
GREEN = (8, 158, 84)
BLUE = (10, 108, 235)
PINK = (222, 28, 88)
AMBER = (214, 130, 0)
MUTED = (108, 120, 140)
TRACK = (232, 236, 242)
COLORS = {'yesil': GREEN, 'mavi': BLUE, 'kirmizi': PINK, 'gri': (150, 166, 188), 'turuncu': AMBER, 'koyu': INK}

# Instagram Reels güvenli alanı: üst %14 ve alt %35 arayüzle kaplanır, yanlarda ~%6 pay.
SAFE_TOP, SAFE_BOTTOM = 250, 1250
X0, X1 = 70, 960
Y_LOGO, Y_KICK, Y_H1, Y_H2, Y_LINE = 254, 308, 340, 430, 560
Y_C0, Y_C1 = 600, 1060          # içerik alanı
Y_SRC, Y_CAP = 1072, 1112       # kaynak satırı, altyazı (en fazla 2 satır → 1246)


# ---------- yazı tipleri ----------
def _font_file(w):
    p = os.path.join(CACHE, f'pjs{w}.ttf')
    if not os.path.exists(p):
        from fontTools.ttLib import TTFont
        from fontTools.varLib.instancer import instantiateVariableFont
        from fontTools.merge import Merger
        parts = []
        for part in ('latin', 'latin-ext'):
            f = TTFont(os.path.join(ROOT, f'public/fonts/plus-jakarta-sans-{part}-wght-normal.woff2')); f.flavor = None
            instantiateVariableFont(f, {'wght': w}, inplace=True)
            q = os.path.join(CACHE, f'pjs{w}-{part}.ttf'); f.save(q); parts.append(q)
        Merger().merge(parts).save(p)
    return p
_FC = {}
def F(w, s):
    k = (w, s)
    if k not in _FC: _FC[k] = ImageFont.truetype(_font_file(w), s)
    return _FC[k]
def MONO(s):
    k = ('m', s)
    if k not in _FC: _FC[k] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', s)
    return _FC[k]


# ---------- yardımcılar ----------
def ease(x): x = max(0., min(1., x)); return 1 - (1 - x) ** 3
def ramp(t, a, b): return ease((t - a) / (b - a)) if b > a else float(t >= a)
def trnum(n, dec=0): return f'{n:,.{dec}f}'.replace(',', 'X').replace('.', ',').replace('X', '.')

def svg_png(path, width):
    out = os.path.join(CACHE, os.path.basename(path) + f'.{width}.png')
    if not os.path.exists(out):
        import cairosvg; cairosvg.svg2png(url=path, write_to=out, output_width=width)
    return Image.open(out).convert('RGBA')

def make_bg():
    im = Image.new('RGB', (W, H), BG)
    wash = Image.new('RGB', (W, H), (0, 0, 0)); g = ImageDraw.Draw(wash)
    g.ellipse([-420, -300, 620, 700], fill=(14, 0, 14)); g.ellipse([520, 1200, 1500, 2200], fill=(14, 6, 0))
    wash = wash.filter(ImageFilter.GaussianBlur(200))
    im = Image.fromarray(np.clip(np.asarray(im, 'int16') - np.asarray(wash, 'int16'), 0, 255).astype('uint8')).convert('RGBA')
    big = svg_png(os.path.join(ROOT, 'public/favicon.svg'), 1000)
    big.putalpha(big.split()[3].point(lambda v: v * 14 // 255))
    im.alpha_composite(big, ((W - big.width) // 2, 760 - big.height // 2 + 260))
    return im.convert('RGB')

def alpha_paste(base, im, xy, a=1.0):
    if a <= 0: return
    if a < 1:
        im = im.copy(); im.putalpha(im.split()[3].point(lambda v: int(v * a)))
    base.alpha_composite(im, (int(xy[0]), int(xy[1])))

def text(d, xy, s, font, fill, a=1.0, anchor='la'):
    if a <= 0: return
    c = tuple(int(BG[i] + (fill[i] - BG[i]) * a) for i in range(3))
    d.text(xy, s, font=font, fill=c, anchor=anchor)

def tracked_w(s, font, track): return sum(font.getlength(c) + track for c in s) - track
def tracked(d, xy, s, font, fill, track=3, a=1.0, center=False):
    x, y = xy
    if center: x -= tracked_w(s, font, track) / 2
    for ch in s:
        text(d, (x, y), ch, font, fill, a); x += font.getlength(ch) + track

def wrap(s, font, maxw):
    words, lines, cur = s.split(), [], ''
    for w_ in words:
        t = (cur + ' ' + w_).strip()
        if font.getlength(t) <= maxw or not cur: cur = t
        else: lines.append(cur); cur = w_
    if cur: lines.append(cur)
    return lines

def fit(s, w, size, maxw, minsize=40):
    while size > minsize and F(w, size).getlength(s) > maxw: size -= 2
    return F(w, size)

def pad(im, p):
    o = Image.new('RGBA', (im.width + 2 * p, im.height + 2 * p), (0, 0, 0, 0)); o.paste(im, (p, p)); return o

def shadow_of(im, r=34, a=70):
    m = im.split()[3].filter(ImageFilter.GaussianBlur(r)).point(lambda v: v * a // 255)
    g = Image.new('RGBA', im.size, (15, 23, 42, 0)); g.putalpha(m); return g

_CAR = {}
def car(key, w, maxh=None):
    k = (key, w, maxh)
    if k not in _CAR:
        p = os.path.join(HERE, 'cutouts', f'{key}.png')
        im = Image.open(p).convert('RGBA'); r = w / im.width
        if maxh and im.height * r > maxh: r = maxh / im.height
        im = pad(im.resize((int(im.width * r), int(im.height * r)), Image.LANCZOS), 60)
        _CAR[k] = (im, shadow_of(im))
    return _CAR[k]

_PH = {}
def photo(path, w, h, radius=36):
    k = (path, w, h)
    if k not in _PH:
        src = Image.open(path if os.path.exists(path) else os.path.join(ROOT, path.lstrip('/'))).convert('RGB')
        r = max(w * 1.12 / src.width, h * 1.12 / src.height)
        src = src.resize((int(src.width * r), int(src.height * r)), Image.LANCZOS)
        _PH[k] = src
    return _PH[k]

def photo_card(base, path, box, t, a=1.0):
    x0, y0, x1, y1 = box; w, h = x1 - x0, y1 - y0
    src = photo(path, w, h)
    z = 1.0 + 0.06 * min(1, t / 6)   # yavaş yakınlaşma
    cw, ch = int(w * src.width / (w * 1.12) / z * 1.12 / 1.12), int(h * src.height / (h * 1.12) / z * 1.12 / 1.12)
    cx, cy = src.width // 2, src.height // 2
    crop = src.crop((cx - cw // 2, cy - ch // 2, cx + cw // 2, cy + ch // 2)).resize((w, h), Image.LANCZOS)
    mask = Image.new('L', (w, h), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], 34, fill=255)
    card = crop.convert('RGBA'); card.putalpha(mask)
    sh = shadow_of(pad(card, 50), 30, 60)
    alpha_paste(base, sh, (x0 - 50, y0 - 40), a); alpha_paste(base, card, (x0, y0), a)


# ---------- ortak çerçeve ----------
class Ctx:
    def __init__(self, im, t, dur):
        self.im, self.t, self.dur, self.d = im, t, dur, ImageDraw.Draw(im)
    @property
    def out(self): return 1 - ramp(self.t, self.dur - .28, self.dur)
    def r(self, a, b): return ramp(self.t, a, b) * self.out

LOGO = None
def chrome(c, sc):
    global LOGO
    if LOGO is None: LOGO = svg_png(os.path.join(ROOT, 'public/brand/ev-turkiye-logo.svg'), 240)
    alpha_paste(c.im, LOGO, (X0, Y_LOGO - 6))
    d = c.d
    if sc.get('kicker'): tracked(d, (X0, Y_KICK), sc['kicker'], MONO(25), BLUE, 3, c.r(0, .35))
    for i, (s, col) in enumerate([(sc.get('h1', ''), INK), (sc.get('h2', ''), GREEN)]):
        if not s: continue
        k = c.r(.05 + i * .1, .5 + i * .1)
        f = fit(s, 800, 84, X1 - X0 + 10)
        text(d, (X0 - 3, (Y_H1, Y_H2)[i] + (1 - k) * 26), s, f, col, k)
    k = c.r(.3, .8)
    d.rounded_rectangle([X0, Y_LINE, X0 + int(110 * k), Y_LINE + 8], 4, fill=BLUE)
    if sc.get('kaynak'):
        tracked(d, (X0, Y_SRC), sc['kaynak'].upper(), MONO(20), MUTED, 2, c.r(.6, 1))

def caption(c, caps):
    if not caps: return
    t, dur = c.t, c.dur
    start, n = .45, len(caps)
    seg = (dur - start) / n
    for i, s in enumerate(caps):
        f = F(700, 46)
        for size in (46, 42, 38, 35):
            f = F(700, size)
            if len(wrap(s, f, 840)) <= 2: break
        a0, a1 = start + i * seg, start + (i + 1) * seg
        if not (a0 <= t < a1) and not (i == n - 1 and t >= a1): continue
        lines = wrap(s, f, 840)[:2]
        shown = int(min(99, (t - a0) / .11 + 1))
        fade = (1 - ramp(t, a1 - .14, a1)) if i < n - 1 else c.out
        y, cnt = Y_CAP, 0
        for ln in lines:
            ws = ln.split(); vis = ws[:max(0, shown - cnt)]; cnt += len(ws)
            x = W / 2 - f.getlength(ln) / 2
            for w_ in vis:
                text(c.d, (x, y), w_, f, INK, fade); x += f.getlength(w_ + ' ')
            y += int(f.size * 1.3)

def bignum(c, x, y, val, dec=0, pre='', suf='', size=200, col=GREEN, t0=.2, t1=1.4, anchor='la', maxw=None):
    k = ramp(c.t, t0, t1)
    s = pre + trnum(val * k, dec) + suf
    full = pre + trnum(val, dec) + suf
    f = fit(full, 800, size, maxw or (X1 - X0), 60)
    text(c.d, (x, y), s, f, col, c.r(t0, t0 + .2), anchor)
    return f


# ---------- sahne türleri ----------
def s_hero(c, sc):
    """Büyük görsel (kesik araç ya da fotoğraf) + altında büyük rakam."""
    k = c.r(.1, .9)
    big = sc.get('sayi')
    area_bottom = 870 if big else Y_C1 - 20
    if sc.get('arac'):
        im, sh = car(sc['arac'], 820, area_bottom - Y_C0 - 6)
        x = (W - im.width) / 2 + (1 - k) * 420
        y = area_bottom - (im.height - 60)
        alpha_paste(c.im, sh, (x, y + 22), k); alpha_paste(c.im, im, (x, y), k)
    elif sc.get('foto'):
        photo_card(c.im, sc['foto'], (X0, Y_C0 + 4, X1, area_bottom - 6 if big else Y_C1 - 10), c.t, k)
    if big:
        if big.get('etiket'): tracked(c.d, (X0, 890), big['etiket'], MONO(24), MUTED, 3, c.r(.8, 1.1))
        bignum(c, X0 - 6, 922, big['deger'], big.get('ondalik', 0), big.get('on', ''), big.get('son', ''), 140,
               COLORS.get(big.get('renk', 'yesil')), .9, 2.0)

def s_sayi(c, sc):
    """Ortada dev rakam, isteğe bağlı ilerleme çubuğu."""
    if sc.get('etiket'): tracked(c.d, (W / 2, 630), sc['etiket'], MONO(24), MUTED, 3, c.r(.2, .5), center=True)
    bignum(c, W / 2, 676, sc['deger'], sc.get('ondalik', 0), sc.get('on', ''), sc.get('son', ''), 210,
           COLORS.get(sc.get('renk', 'yesil')), .2, 1.6, 'ma')
    if sc.get('alt'): text(c.d, (W / 2, 900), sc['alt'], F(600, 38), INK, c.r(1.0, 1.4), 'ma')
    cb = sc.get('cubuk')
    if cb:
        k = c.r(1.2, 2.4); y = 980
        c.d.rounded_rectangle([X0, y, X1, y + 22], 11, fill=TRACK)
        c.d.rounded_rectangle([X0, y, X0 + max(22, int((X1 - X0) * cb['oran'] * k)), y + 22], 11, fill=BLUE)
        tracked(c.d, (X0, y + 36), cb['sol'], MONO(21), MUTED, 2, k)
        text(c.d, (X1, y + 30), cb['sag'], F(800, 38), INK, k, 'ra')

def s_cubuklar(c, sc):
    """2–4 yatay çubuk: etiket, alt metin, değer."""
    rows = sc['satirlar']; n = len(rows); hgt = (Y_C1 - Y_C0) / n
    for i, r in enumerate(rows):
        y = Y_C0 + 10 + i * hgt; t0 = .2 + i * .45
        k = c.r(t0, t0 + 1.0); col = COLORS.get(r.get('renk', 'yesil'))
        tracked(c.d, (X0, y), r['etiket'], MONO(24), MUTED, 3, c.r(t0 - .2, t0 + .1))
        c.d.rounded_rectangle([X0, y + 36, X1, y + 76], 12, fill=TRACK)
        if k > 0: c.d.rounded_rectangle([X0, y + 36, X0 + max(24, int((X1 - X0) * r['oran'] * k)), y + 76], 12, fill=col)
        text(c.d, (X1, y + 86), r['deger'], F(800, 46), col, k, 'ra')
        if r.get('alt'): text(c.d, (X0, y + 92), r['alt'], F(600, 30), INK, k * .85)

def s_siralama(c, sc):
    """Araç küçük görselleriyle sıralama (en fazla 5)."""
    rows = sc['satirlar']; n = len(rows); hgt = (Y_C1 - Y_C0) / n
    thumb = 200 if n <= 4 else 170
    mx = max(r['oran'] for r in rows)
    for i, r in enumerate(rows):
        y = Y_C0 + i * hgt; t0 = .2 + i * .3
        k = c.r(t0, t0 + .9)
        if k <= 0: continue
        col = COLORS.get(r.get('renk', 'yesil'))
        bx = X0
        if r.get('arac'):
            im, _ = car(r['arac'], thumb, int(hgt * .9) + 40)
            alpha_paste(c.im, im, (X0 - 60 - (1 - k) * 40, y + hgt / 2 - im.height / 2), k)
            bx = X0 + thumb + 24
        else:
            text(c.d, (X0, y + 8), str(r.get('no', i + 1)), F(800, 52), MUTED, k); bx = X0 + 70
        f = fit(r['ad'], 700, 38 if n <= 4 else 34, X1 - bx - 230, 24)
        text(c.d, (bx, y + 6), r['ad'], f, INK, k)
        if r.get('alt'):
            if r.get('arac'): text(c.d, (bx, y + 50), r['alt'], F(600, 26), MUTED, k)
            else: text(c.d, (bx + f.getlength(r['ad']) + 14, y + 12), r['alt'], F(600, 26), MUTED, k)
        by = y + (84 if r.get('alt') and r.get('arac') else 56)
        bar_end = X1 - 200
        c.d.rounded_rectangle([bx, by, bx + max(20, int((bar_end - bx) * r['oran'] / mx * k)), by + 26], 10, fill=col)
        text(c.d, (X1, by - 10), r['deger'], F(800, 42), col, k, 'ra')

def s_etiket(c, sc):
    """Araç ya da fotoğraf + damga etiketi (ör. "İLK 10 DIŞI")."""
    k = c.r(.1, .8)
    if sc.get('arac'):
        im, sh = car(sc['arac'], 760, 940 - Y_C0 - 24)
        if sc.get('gri'):
            g = im.convert('LA').convert('RGBA'); g.putalpha(im.split()[3]); im = Image.blend(im, g, ramp(c.t, 1.0, 1.8))
        x, y = (W - im.width) / 2, 940 - (im.height - 60) + (1 - k) * 30
        alpha_paste(c.im, sh, (x, y + 22), k); alpha_paste(c.im, im, (x, y), k)
    elif sc.get('foto'):
        photo_card(c.im, sc['foto'], (X0, Y_C0 + 4, X1, 920), c.t, k)
    s = c.r(1.5, 1.9)
    if s > 0:
        col = COLORS.get(sc.get('renk', 'kirmizi')); tag = sc['etiket']; f = MONO(40); w_ = f.getlength(tag) + 60
        x, y = W / 2 - w_ / 2, 960
        fill = tuple(int(255 - (255 - v) * .1) for v in col)
        c.d.rounded_rectangle([x, y, x + w_, y + 76], 14, outline=col, width=4, fill=fill)
        text(c.d, (W / 2, y + 16), tag, f, col, s, 'ma')

def s_liste(c, sc):
    """Fiyat/kampanya tablosu: sol metin, sağ değer, isteğe bağlı eski değer (üstü çizili)."""
    rows = sc['satirlar']; n = len(rows); hgt = min(118, (Y_C1 - Y_C0) / n)
    for i, r in enumerate(rows):
        y = Y_C0 + 6 + i * hgt; k = c.r(.2 + i * .25, .9 + i * .25)
        if k <= 0: continue
        vurgu = r.get('vurgu')
        if vurgu:
            c.d.rounded_rectangle([X0 - 14, y - 10, X1 + 14, y + hgt - 18], 18, fill=(232, 247, 238))
        f = fit(r['sol'], 700, 38, 560, 26)
        text(c.d, (X0, y + 4), r['sol'], f, INK, k)
        if r.get('alt'): text(c.d, (X0, y + 50), r['alt'], F(600, 26), MUTED, k)
        col = COLORS.get(r.get('renk', 'yesil'))
        text(c.d, (X1, y), r['sag'], fit(r['sag'], 800, 42, 380, 28), col, k, 'ra')
        if r.get('eski'):
            fo = F(600, 28); tx = r['eski']; wv = fo.getlength(tx)
            text(c.d, (X1, y + 52), tx, fo, MUTED, k, 'ra')
            c.d.line([(X1 - wv, y + 68), (X1, y + 68)], fill=MUTED, width=3)
        if i < n - 1 and not vurgu and not rows[i + 1].get('vurgu'):
            c.d.line([(X0, y + hgt - 12), (X1, y + hgt - 12)], fill=TRACK, width=2)

def s_kiyas(c, sc):
    """İki araç yan yana + özellik satırları; kazanan yeşil."""
    a, b = sc['a'], sc['b']
    k = c.r(.1, .8)
    for j, side in enumerate((a, b)):
        im, sh = car(side['arac'], 380, 160)
        cx = (X0 + X1) / 2 + (-1 if j == 0 else 1) * (X1 - X0) / 4
        x = cx - im.width / 2 + (1 - k) * (-80 if j == 0 else 80)
        y = Y_C0 + 170 - (im.height - 60)
        alpha_paste(c.im, sh, (x, y + 16), k); alpha_paste(c.im, im, (x, y), k)
        text(c.d, (cx, Y_C0 + 186), side['ad'], fit(side['ad'], 700, 32, 420, 22), INK, k, 'ma')
    rows = sc['satirlar']; y0 = Y_C0 + 248; hgt = (Y_C1 - y0) / len(rows)
    for i, r in enumerate(rows):
        y = y0 + i * hgt; kk = c.r(.6 + i * .3, 1.2 + i * .3)
        if kk <= 0: continue
        tracked(c.d, (W / 2, y), r['etiket'], MONO(21), MUTED, 2, kk, center=True)
        for j, v in enumerate((r['a'], r['b'])):
            win = r.get('iyi') == 'ab'[j]
            col = GREEN if win else INK
            cx = (X0 + X1) / 2 + (-1 if j == 0 else 1) * (X1 - X0) / 4
            text(c.d, (cx, y + 28), v, F(800 if win else 600, 38), col, kk, 'ma')

def s_rota(c, sc):
    """Rota çizgisi: başlangıç, şarj durakları, varış + alt istatistikler."""
    d = c.d; y = 690; xa, xb = X0 + 40, X1 - 40
    k = c.r(.2, 1.6)
    d.line([(xa, y), (xb, y)], fill=TRACK, width=14)
    if k > 0: d.line([(xa, y), (xa + (xb - xa) * k, y)], fill=BLUE, width=14)
    for (lbl, xx, col) in [(sc['nereden'], xa, INK), (sc['nereye'], xb, INK)]:
        d.ellipse([xx - 22, y - 22, xx + 22, y + 22], fill=col)
        text(d, (xx, y + 44), lbl, F(800, 40), INK, c.r(.2, .5), 'ma')
    for i, frac in enumerate(sc.get('duraklar', [])):
        xx = xa + (xb - xa) * frac; kk = c.r(.4 + 1.2 * frac, .7 + 1.2 * frac)
        if kk <= 0: continue
        rr = 34 * kk
        d.ellipse([xx - rr, y - rr, xx + rr, y + rr], fill=GREEN)
        text(d, (xx, y - 26), '⚡', F(800, 38), (255, 255, 255), kk, 'ma') if False else None
        d.polygon([(xx + 4, y - 20), (xx - 12, y + 4), (xx + 0, y + 4), (xx - 4, y + 20), (xx + 12, y - 4), (xx + 0, y - 4)], fill=(255, 255, 255))
        text(d, (xx, y - 92), 'Şarj', F(700, 30), GREEN, kk, 'ma')
    stats = sc.get('istatistik', [])
    cw = (X1 - X0) / max(1, len(stats))
    for i, (lbl, val) in enumerate(stats):
        kk = c.r(1.4 + i * .3, 1.9 + i * .3)
        x = X0 + i * cw
        c.d.rounded_rectangle([x + 6, 850, x + cw - 6, 1040], 22, fill=(255, 255, 255), outline=TRACK, width=3)
        tracked(d, (x + cw / 2, 878), lbl, MONO(20), MUTED, 2, kk, center=True)
        text(d, (x + cw / 2, 924), val, fit(val, 800, 50, cw - 30, 28), BLUE if i < len(stats) - 1 else GREEN, kk, 'ma')

def s_adimlar(c, sc):
    """Özellik adımları: numaralı kartlar."""
    rows = sc['satirlar']; n = len(rows); hgt = (Y_C1 - Y_C0) / n
    for i, r in enumerate(rows):
        y = Y_C0 + i * hgt; k = c.r(.2 + i * .5, .8 + i * .5)
        if k <= 0: continue
        x = X0 + (1 - k) * 60
        c.d.rounded_rectangle([x, y + 6, X1, y + hgt - 14], 24, fill=(255, 255, 255), outline=TRACK, width=3)
        c.d.ellipse([x + 26, y + hgt / 2 - 40, x + 106, y + hgt / 2 + 32], fill=GREEN if i % 2 == 0 else BLUE)
        text(c.d, (x + 66, y + hgt / 2 - 24), str(i + 1), F(800, 44), (255, 255, 255), k, 'ma')
        text(c.d, (x + 134, y + hgt / 2 - 46), r['baslik'], fit(r['baslik'], 800, 40, X1 - x - 160, 26), INK, k)
        if r.get('alt'): text(c.d, (x + 134, y + hgt / 2 + 4), r['alt'], fit(r['alt'], 600, 30, X1 - x - 160, 20), MUTED, k)

def s_kapanis(c, sc):
    d = c.d
    k = ramp(c.t, .1, .7)
    L = svg_png(os.path.join(ROOT, 'public/brand/ev-turkiye-logo.svg'), 620)
    alpha_paste(c.im, L, (W // 2 - L.width // 2, 640 + (1 - k) * 30), k)
    text(d, (W // 2, 800), sc.get('alt', 'Her gün elektrikli araç gündemi'), F(600, 42), INK, ramp(c.t, .5, 1), 'ma')
    lk = sc.get('link', 'evturkiye.online')
    text(d, (W // 2, 866), lk, fit(lk, 800, 44, 860, 28), GREEN, ramp(c.t, .7, 1.2), 'ma')
    s = ramp(c.t, 1.0, 1.4)
    if s > 0:
        f = F(800, 44); tag = sc.get('buton', 'Takip et'); w_ = f.getlength(tag) + 100
        d.rounded_rectangle([W / 2 - w_ / 2, 970, W / 2 + w_ / 2, 1062], 46, fill=GREEN)
        d.text((W / 2, 990), tag, font=f, fill=(255, 255, 255), anchor='ma')

def s_harita(c, sc):
    """Temsili harita: konum noktası ve beliren istasyon iğneleri."""
    d = c.d; x0, y0, x1, y1 = X0, Y_C0 + 6, X1, Y_C1 - 10
    k = c.r(.05, .5)
    m = Image.new('RGBA', (x1 - x0, y1 - y0), (238, 243, 248, 255)); md = ImageDraw.Draw(m)
    for i, (a, b, wdt) in enumerate([((0, 120), (900, 60), 26), ((0, 330), (900, 380), 18), ((240, 0), (300, 480), 22), ((610, 0), (560, 480), 16), ((0, 230), (900, 210), 10)]):
        md.line([a, b], fill=(255, 255, 255, 255), width=wdt)
    md.rounded_rectangle([660, 260, 860, 440], 20, fill=(220, 238, 226, 255))
    mask = Image.new('L', m.size, 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, m.width - 1, m.height - 1], 30, fill=255); m.putalpha(mask)
    alpha_paste(c.im, m, (x0, y0), k)
    ux, uy = x0 + 300, y0 + 250
    pr = 30 + 26 * ((c.t * 1.2) % 1); pa = 1 - ((c.t * 1.2) % 1)
    d.ellipse([ux - pr, uy - pr, ux + pr, uy + pr], outline=tuple(int(BG[i] + (BLUE[i] - BG[i]) * pa * k) for i in range(3)), width=4)
    d.ellipse([ux - 18, uy - 18, ux + 18, uy + 18], fill=BLUE, outline=(255, 255, 255), width=5)
    pins = sc.get('pinler', [])
    for i, pn in enumerate(pins):
        kk = c.r(.7 + i * .45, 1.0 + i * .45)
        if kk <= 0: continue
        px, py = x0 + pn['x'], y0 + pn['y'] - (1 - kk) * 30
        col = GREEN if pn.get('musait', True) else PINK
        d.ellipse([px - 26, py - 62, px + 26, py - 10], fill=col)
        d.polygon([(px - 18, py - 24), (px + 18, py - 24), (px, py + 4)], fill=col)
        d.polygon([(px + 3, py - 54), (px - 9, py - 34), (px, py - 34), (px - 3, py - 18), (px + 9, py - 38), (px, py - 38)], fill=(255, 255, 255))
        lbl = pn['etiket']; f = F(700, 26); wl = f.getlength(lbl) + 28
        bx = min(max(px - wl / 2, x0 + 8), x1 - wl - 8)
        d.rounded_rectangle([bx, py - 110, bx + wl, py - 72], 12, fill=(255, 255, 255), outline=TRACK, width=2)
        text(d, (bx + 14, py - 104), lbl, f, col, kk)
    if sc.get('not'): tracked(d, (x1 - 12 - tracked_w(sc['not'], MONO(18), 2), y1 - 34), sc['not'], MONO(18), MUTED, 2, k)

TYPES = {'harita': s_harita, 'hero': s_hero, 'sayi': s_sayi, 'cubuklar': s_cubuklar, 'siralama': s_siralama, 'etiket': s_etiket,
         'liste': s_liste, 'kiyas': s_kiyas, 'rota': s_rota, 'adimlar': s_adimlar, 'kapanis': s_kapanis}


# ---------- çizim ----------
BGIM = None
def frame(spec, i, t):
    global BGIM
    if BGIM is None: BGIM = make_bg()
    sc = spec['sahneler'][i]; dur = sc.get('sure', 4.6)
    im = BGIM.convert('RGBA'); c = Ctx(im, t, dur)
    if sc['tur'] != 'kapanis': chrome(c, sc)
    TYPES[sc['tur']](c, sc)
    caption(c, sc.get('altyazi', []))
    return im.convert('RGB')

def guides(im):
    d = ImageDraw.Draw(im, 'RGBA')
    d.rectangle([0, 0, W, SAFE_TOP], fill=(255, 0, 0, 50)); d.rectangle([0, SAFE_BOTTOM, W, H], fill=(255, 0, 0, 50))
    d.rectangle([W - 130, 1000, W, H], fill=(255, 120, 0, 60)); d.rectangle([0, 240, W, 1680], outline=(0, 120, 255), width=4)
    return im

def render(spec, out):
    tmpdir = tempfile.mkdtemp(prefix='reel-'); parts = []
    for i, sc in enumerate(spec['sahneler']):
        dur = sc.get('sure', 4.6); p = os.path.join(tmpdir, f's{i}.mp4'); tmp = p + '.tmp.mp4'
        pr = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                               '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', tmp], stdin=subprocess.PIPE)
        for n in range(round(dur * FPS)): pr.stdin.write(frame(spec, i, n / FPS).tobytes())
        pr.stdin.close()
        if pr.wait() != 0: raise SystemExit(f'sahne {i} kodlanamadı')
        os.replace(tmp, p); parts.append(p)
    lst = os.path.join(tmpdir, 'list.txt'); open(lst, 'w').write(''.join(f"file '{p}'\n" for p in parts))
    tmp = out + '.tmp.mp4'
    # Sessiz ses izi: Instagram'da müzik eklemeyi kolaylaştırır, bazı yükleyiciler sessiz videoyu sorunsuz alır.
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
                    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '96k', '-shortest', '-movflags', '+faststart', tmp], check=True)
    os.replace(tmp, out)

def cover(spec, out):
    sc0 = spec['sahneler'][0]; t = sc0.get('kapak_t', sc0.get('sure', 4.6) - .6)
    im = frame(spec, 0, t); im.save(out, quality=90)

if __name__ == '__main__':
    args = sys.argv[1:]
    spec = json.load(open(args[0], encoding='utf-8')); name = os.path.splitext(os.path.basename(args[0]))[0]
    outdir = os.path.join(ROOT, 'social', 'reels'); os.makedirs(outdir, exist_ok=True)
    if '--kare' in args:
        i = args.index('--kare'); fi, t = int(args[i + 1]), float(args[i + 2])
        im = frame(spec, fi, t)
        if '--guvenli' in args: im = guides(im)
        p = os.path.join(outdir, f'{name}-kare{fi}-{t}.png'); im.save(p); print(p)
    elif '--guvenli' in args:
        for fi, sc in enumerate(spec['sahneler']):
            p = os.path.join(outdir, f'{name}-guvenli{fi}.png'); guides(frame(spec, fi, sc.get('sure', 4.6) - .5)).save(p); print(p)
    else:
        render(spec, os.path.join(outdir, f'{name}.mp4')); cover(spec, os.path.join(outdir, f'{name}-kapak.jpg'))
        print(os.path.join(outdir, f'{name}.mp4'))
