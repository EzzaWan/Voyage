import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';

/**
 * Warm up the browser to improve OAuth performance
 * Call this hook at the top level of your component
 */
export function useWarmUpBrowser() {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}










