const viteEnv = import.meta.env || {};

const isDev = viteEnv.MODE === 'development' || viteEnv.DEV === true;
const prodApiUrl = 'https://web-production-04667.up.railway.app';
const localApiUrl = 'http://localhost:5000';
const defaultApiUrl = isDev ? localApiUrl : prodApiUrl;

export const API_URL =
  viteEnv.VITE_API_URL ||
  viteEnv.REACT_APP_API_URL ||
  defaultApiUrl;

export const LOCAL_API_URL =
  viteEnv.VITE_API_URL ||
  viteEnv.REACT_APP_API_URL ||
  localApiUrl;

const prodWsUrl = 'wss://web-production-04667.up.railway.app';
const localWsUrl = 'ws://localhost:5000';
const defaultWsUrl = isDev ? localWsUrl : prodWsUrl;

export const WS_URL =
  viteEnv.VITE_WS_URL ||
  viteEnv.REACT_APP_WS_URL ||
  defaultWsUrl;

export const CHAT_WS_URL =
  viteEnv.VITE_CHAT_WS_URL ||
  viteEnv.REACT_APP_CHAT_WS_URL ||
  `${defaultWsUrl}/chat`;

export const AUCTION_WS_URL =
  viteEnv.VITE_AUCTION_WS_URL ||
  viteEnv.REACT_APP_AUCTION_WS_URL ||
  `${defaultWsUrl}/auction`;

export const ANALYTICS_KEY =
  viteEnv.VITE_ANALYTICS_KEY ||
  viteEnv.REACT_APP_ANALYTICS_KEY;

export const VAPID_PUBLIC_KEY = viteEnv.VITE_VAPID_PUBLIC_KEY;

export const IS_DEVELOPMENT = viteEnv.MODE === 'development';
