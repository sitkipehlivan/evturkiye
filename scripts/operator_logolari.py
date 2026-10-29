"""Şarj operatörlerinin resmi uygulama simgelerini (App Store) indirir -> public/images/operatorler/<id>.png
GitHub Actions'ta çalışır (workflow_dispatch). Simgeler operatörlerin kendi yayımladığı markalardır; yalnızca
operatörü tanıtmak (şarj fiyatı karşılaştırması) için kullanılır."""
import io, os, urllib.request
from PIL import Image

B = 'https://is1-ssl.mzstatic.com/image/thumb/'
ICONS = {
    'trugo': 'Purple211/v4/e8/6c/b6/e86cb619-cf67-0091-d725-07c7ff4f1835/AppIcon-0-0-1x_U007ephone-0-1-85-220.png',
    'zes': 'Purple211/v4/bd/32/c9/bd32c9db-7ae5-2fb0-283c-5511f30b563a/AppIcon-zes-0-0-1x_U007epad-0-1-0-85-220.png',
    'esarj': 'Purple221/v4/d3/6b/17/d36b1741-546a-ae4e-23dc-987e017dbc2b/AppIcon-0-0-1x_U007emarketing-0-14-0-85-220.png',
    'tesla': 'Purple221/v4/4b/61/aa/4b61aab6-138e-3bef-f183-abc3549975ca/ProdAppIcon-0-0-1x_U007epad-0-1-0-0-85-220.png',
    'voltrun': 'Purple211/v4/ad/26/81/ad2681a9-654b-7898-63db-49a925cf1528/AppIcon-0-0-1x_U007emarketing-0-9-0-85-220.png',
    'astor': 'Purple221/v4/e3/ac/fc/e3acfc52-7020-8b41-582a-7cba919b332d/AppIcon-0-0-1x_U007emarketing-0-8-0-0-85-220.png',
    'beefull': 'Purple221/v4/fc/07/1b/fc071b75-d410-5120-f8f2-16486923ac80/AppIcon-0-0-1x_U007emarketing-0-11-0-85-220.png',
    'wat': 'Purple211/v4/22/93/11/2293119d-7075-4e72-155a-d7d4eda2f56b/AppIcon-0-0-1x_U007ephone-0-1-0-85-220.png',
    'aksa': 'Purple211/v4/fb/e4/5d/fbe45d78-81fa-e8dc-aea3-39243ff70906/AppIcon-aksa-0-0-1x_U007emarketing-0-1-85-220.png',
    'evbee': 'Purple211/v4/b9/5f/83/b95f832f-5db6-3616-68e4-482461434879/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png',
    'otopriz': 'Purple221/v4/22/82/71/22827180-078f-d421-8e4f-2ebb5c531183/AppIcon-0-0-1x_U007ephone-0-1-85-220.png',
    'sharz': 'Purple221/v4/93/8e/00/938e00ae-cd2b-9433-e01e-bc131cf24708/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png',
    'sarjon': 'Purple221/v4/b1/65/dc/b165dc6a-613b-f02f-d829-c4376cb845d1/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png',
    'oncharge': 'Purple211/v4/9b/b9/62/9bb9628c-d462-3413-41b8-c8bae0b442e2/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png',
    'lumicle': 'Purple211/v4/42/e5/43/42e5431c-a670-b53a-bca3-b54c054daec4/AppIcon-0-0-1x_U007ephone-0-1-85-220.png',
    'volti': 'Purple211/v4/8a/9a/ff/8a9affc3-bfaa-2f9f-2079-8aac364020fc/AppIcon-0-0-1x_U007ephone-0-1-85-220.png',
    '5sarj': 'Purple221/v4/a8/5d/b5/a85db5f5-baec-d1e8-9ce6-6da7472f480e/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png',
    'enyakit': 'Purple221/v4/6e/fa/a0/6efaa0f2-95a7-6fcf-e7b6-cb1312da9faf/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png',
}
LOOKUP = {'elaris': 6689516899}  # artwork adresi çalışma anında App Store'dan alınır

def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 EVTurkiyeBot'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()

def main():
    import json
    os.makedirs('public/images/operatorler', exist_ok=True)
    urls = {k: B + v + '/256x256bb.png' for k, v in ICONS.items()}
    for k, tid in LOOKUP.items():
        j = json.loads(get(f'https://itunes.apple.com/lookup?country=tr&id={tid}'))
        urls[k] = j['results'][0]['artworkUrl512'].replace('512x512bb.jpg', '256x256bb.png')
    for k, u in urls.items():
        try:
            im = Image.open(io.BytesIO(get(u))).convert('RGBA').resize((128, 128), Image.LANCZOS)
            im.save(f'public/images/operatorler/{k}.png', optimize=True)
            print('+', k)
        except Exception as e:  # noqa: BLE001
            print('!', k, e)

if __name__ == '__main__':
    main()
