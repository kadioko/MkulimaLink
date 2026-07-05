const viteEnv = import.meta.env || {};

export const API_URL =
  viteEnv.VITE_API_URL ||
  viteEnv.REACT_APP_API_URL ||
  'https://web-production-04667.up.railway.app';

export const LOCAL_API_URL =
  viteEnv.VITE_API_URL ||
  viteEnv.REACT_APP_API_URL ||
  'https://web-production-04667.up.railway.app';

export const WS_URL =
  viteEnv.VITE_WS_URL ||
  viteEnv.REACT_APP_WS_URL ||
  'wss://web-production-04667.up.railway.app';

export const CHAT_WS_URL =
  viteEnv.VITE_CHAT_WS_URL ||
  viteEnv.REACT_APP_CHAT_WS_URL ||
  'wss://web-production-04667.up.railway.app/chat';

export const AUCTION_WS_URL =
  viteEnv.VITE_AUCTION_WS_URL ||
  viteEnv.REACT_APP_AUCTION_WS_URL ||
  'wss://web-production-04667.up.railway.app/auction';

export const ANALYTICS_KEY =
  viteEnv.VITE_ANALYTICS_KEY ||
  viteEnv.REACT_APP_ANALYTICS_KEY;

export const VAPID_PUBLIC_KEY = viteEnv.VITE_VAPID_PUBLIC_KEY;

export const IS_DEVELOPMENT = viteEnv.MODE === 'development';
