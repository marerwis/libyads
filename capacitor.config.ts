import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.libyaads.app',
  appName: 'Libya Ads',
  webDir: 'public',
  server: {
    url: 'https://libyads.vercel.app', // Official project domain
    cleartext: true
  }
};

export default config;
