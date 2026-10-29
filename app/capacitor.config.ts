import type { CapacitorConfig } from '@capacitor/cli';

// Uygulama canlı siteyi açar (içerik her zaman güncel); konum, bildirim, paylaşım gibi
// özellikler yerel (native) eklentilerle çalışır. İnternet yoksa www/index.html gösterilir.
const SITE = process.env.EVT_SITE || 'https://evturkiye.online';

const config: CapacitorConfig = {
  appId: 'com.evturkiye.app',
  appName: 'EV Türkiye',
  webDir: 'www',
  server: {
    url: SITE,
    errorPath: 'index.html',
    allowNavigation: ['evturkiye.online', '*.evturkiye.online', 'evturkiye.com.tr', '*.evturkiye.com.tr', 'evturkiye-uyelik.firebaseapp.com'],
  },
  ios: { contentInset: 'automatic', scheme: 'EV Türkiye' },
  android: { allowMixedContent: false },
  plugins: {
    SplashScreen: { launchShowDuration: 1200, backgroundColor: '#ffffff', showSpinner: false },
    PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
  },
};

export default config;
