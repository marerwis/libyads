import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.libyaads.app',
  appName: 'Libya Ads',
  webDir: 'public',
  server: {
    url: 'https://intag-six.vercel.app', // Update this if your Vercel URL is different
    cleartext: true
  }
};

export default config;
