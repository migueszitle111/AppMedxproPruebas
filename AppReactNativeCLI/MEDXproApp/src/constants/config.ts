// src/constants/config.ts
import { Platform, NativeModules } from 'react-native';

function getMetroHost(): string {
  const scriptURL: string = (NativeModules as any)?.SourceCode?.scriptURL ?? '';
  const m = scriptURL.match(/https?:\/\/([^:/]+)(?::\d+)?/);
  return m?.[1] || 'localhost';
}
function getDevHostForPlatform(): string {
  const host = getMetroHost();
  if (Platform.OS === 'android') {
    return (host === 'localhost' || host === '127.0.0.1') ? '10.0.2.2' : host;
  }
  return host;
}

//backend 
export const BASE_URL = __DEV__
  ? 'https://backendmedxpro-tef2.onrender.com'
  : 'https://backendmedxpro-tef2.onrender.com';

// Web pública (share) 
export const SHARE_API_BASE_URL = 'https://www.medxproapp.com';

//Supabase 
export const SUPABASE_URL = 'https://awkrlvbmwfqzqlfyuiby.supabase.co'; // <-- pon tu URL real
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3a3JsdmJtd2ZxenFsZnl1aWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODMxMzUsImV4cCI6MjA3NDM1OTEzNX0.LNQ_a3uC8zukBTI_T-sONqXOx1_xXF8F5Olmjf3t1uw';
//const BASE_URL = 'https://backendmedxpro.onrender.com'; // Cambia a tu IP local en desarrollo si lo necesitas
// const BASE_URL = 'https://backendmedxpro-tef2.onrender.com';

export default BASE_URL;
