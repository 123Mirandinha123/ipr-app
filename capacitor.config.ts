import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ipr.app',
  appName: 'Ipr App',
  webDir: 'www',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_notification',
      iconColor: '#0284c7'
    },
    SplashScreen: {
      launchShowDuration: 4000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#000C2E',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
