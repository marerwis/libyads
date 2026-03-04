import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.libyaads.app',
  appName: 'Libya Ads',
  webDir: 'public',
  server: {
    url: 'https://libyads.vercel.app', // Official project domain
    cleartext: true,
    allowNavigation: [
      "accounts.google.com",
      "*.google.com",
      "*.facebook.com",
      "facebook.com"
    ]
  },
  android: {
    // Override the user agent so Google doesn't block the WebView login attempt
    overrideUserAgent: "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
  }
};

export default config;
