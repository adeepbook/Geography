import type { AILocationCard } from '../types';

const KEY = 'geo_ai_cards_v1';

type Cache = Record<string, AILocationCard>;

function load(): Cache {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Cache; }
  catch { return {}; }
}

export function getCachedCard(key: string): AILocationCard | null {
  return load()[key] ?? null;
}

export function setCachedCard(key: string, card: AILocationCard): void {
  const cache = load();
  cache[key] = card;
  localStorage.setItem(KEY, JSON.stringify(cache));
}

/** ~1 km precision cache key from [lng, lat] */
export function aiCardCacheKey(lngLat: [number, number]): string {
  return `${lngLat[0].toFixed(2)}_${lngLat[1].toFixed(2)}`;
}
