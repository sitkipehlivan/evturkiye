// Google Maps JavaScript API yardımcıları (harita + Places (New) otomatik tamamlama).
// Anahtar: PUBLIC_GOOGLE_MAPS_KEY (siteye gömülür; Google Cloud'da evturkiye alan adlarıyla kısıtlıdır).
declare const google: any;

export interface GPlace { label: string; lat: number; lon: number; }

let loading: Promise<void> | null = null;

export function loadGoogle(key: string): Promise<void> {
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    if ((window as any).google?.maps?.importLibrary) return resolve();
    (window as any).__evtGmInit = () => resolve();
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&language=tr&region=TR&loading=async&callback=__evtGmInit`;
    s.async = true;
    s.onerror = () => { loading = null; reject(new Error('Google Haritalar yüklenemedi.')); };
    document.head.appendChild(s);
  });
  return loading;
}

/** Places API (New) ile adres önerileri; seçilen öneri koordinata çevrilir. */
export class GoogleAutocomplete {
  private token: any = null;
  private lib: any = null;

  async init() {
    this.lib = await google.maps.importLibrary('places');
    this.token = new this.lib.AutocompleteSessionToken();
  }

  async suggest(input: string): Promise<{ label: string; resolve: () => Promise<GPlace> }[]> {
    if (!this.lib) await this.init();
    const { suggestions } = await this.lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input, sessionToken: this.token, includedRegionCodes: ['tr'], language: 'tr', region: 'tr',
    });
    return (suggestions || []).filter((s: any) => s.placePrediction).slice(0, 6).map((s: any) => {
      const p = s.placePrediction;
      const label = p.text?.toString() || '';
      return {
        label,
        resolve: async () => {
          const place = p.toPlace();
          await place.fetchFields({ fields: ['location', 'formattedAddress', 'displayName'] });
          this.token = new this.lib.AutocompleteSessionToken(); // oturum seçimle biter
          return { label, lat: place.location.lat(), lon: place.location.lng() };
        },
      };
    });
  }

  /** Listeden seçim yapılmadıysa ilk öneriyi kullan. */
  async first(input: string): Promise<GPlace | null> {
    const list = await this.suggest(input);
    return list.length ? list[0].resolve() : null;
  }
}

export function decodePolyline(str: string): [number, number][] {
  const out: [number, number][] = [];
  let i = 0, lat = 0, lng = 0;
  while (i < str.length) {
    for (const k of [0, 1]) {
      let shift = 0, result = 0, b: number;
      do { b = str.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const d = result & 1 ? ~(result >> 1) : result >> 1;
      if (k === 0) lat += d; else lng += d;
    }
    out.push([lat / 1e5, lng / 1e5]);
  }
  return out;
}

export interface Pin { lat: number; lon: number; kind: 'start' | 'end' | 'stop' | 'station' | 'me' | 'near'; label?: string; html: string; }

/** Google haritası: rota çizgisi, A/B, duraklar ve diğer istasyonlar. */
export class GoogleMapView {
  private map: any;
  private overlays: any[] = [];
  private info: any;
  private Adv: any;

  static async create(el: HTMLElement, mapId: string) {
    const v = new GoogleMapView();
    const { Map, InfoWindow } = await google.maps.importLibrary('maps');
    const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');
    v.Adv = AdvancedMarkerElement;
    v.map = new Map(el, {
      center: { lat: 39.2, lng: 33.5 }, zoom: 6, mapId,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: true, gestureHandling: 'cooperative',
    });
    v.info = new InfoWindow();
    return v;
  }

  clear() { this.overlays.forEach((o) => (o.setMap ? o.setMap(null) : (o.map = null))); this.overlays = []; }

  /** Yalnızca işaretler (yakındaki istasyonlar): tüm işaretleri kapsayacak şekilde yakınlaştırır. */
  pins(pins: Pin[], onClick?: (i: number) => void) {
    this.clear();
    const bounds = new google.maps.LatLngBounds();
    pins.forEach((p, i) => {
      const el = document.createElement('div');
      el.className = `pl-pin ${p.kind}`;
      if (p.label) el.textContent = p.label;
      const m = new this.Adv({ map: this.map, position: { lat: p.lat, lng: p.lon }, content: el, zIndex: p.kind === 'start' ? 30 : 20 - i / 100 });
      m.addListener('gmp-click', () => { this.info.setContent(p.html); this.info.open({ map: this.map, anchor: m }); onClick?.(i); });
      this.overlays.push(m);
      bounds.extend({ lat: p.lat, lng: p.lon });
    });
    if (pins.length > 1) this.map.fitBounds(bounds, 50); else if (pins.length) { this.map.setCenter({ lat: pins[0].lat, lng: pins[0].lon }); this.map.setZoom(14); }
  }

  draw(coords: [number, number][], pins: Pin[]) {
    this.clear();
    const path = coords.map(([lat, lng]) => ({ lat, lng }));
    this.overlays.push(new google.maps.Polyline({ path, map: this.map, strokeColor: '#ffffff', strokeWeight: 9, strokeOpacity: 1, zIndex: 1 }));
    this.overlays.push(new google.maps.Polyline({ path, map: this.map, strokeColor: '#0a7cff', strokeWeight: 5, strokeOpacity: .95, zIndex: 2 }));
    for (const p of pins) {
      const el = document.createElement('div');
      el.className = `pl-pin ${p.kind}`;
      if (p.label) el.textContent = p.label;
      const m = new this.Adv({ map: this.map, position: { lat: p.lat, lng: p.lon }, content: el, zIndex: p.kind === 'station' ? 5 : 20 });
      m.addListener('gmp-click', () => { this.info.setContent(p.html); this.info.open({ map: this.map, anchor: m }); });
      this.overlays.push(m);
    }
    const bounds = new google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    this.map.fitBounds(bounds, 40);
  }
}
