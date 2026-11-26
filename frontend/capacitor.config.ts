import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dreamphysic.ai',
  appName: 'DreamPhysic AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
