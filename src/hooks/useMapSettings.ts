import { useState, useCallback } from 'react';

export interface MapSettings {
  styleId: string;
  mapTilerKey: string;
}

const STORAGE_KEY = 'geo_map_settings';

export const MAP_DEFAULTS: MapSettings = {
  styleId: 'ofm-liberty',
  mapTilerKey: '',
};

export function useMapSettings() {
  const [settings, setSettings] = useState<MapSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...MAP_DEFAULTS, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return MAP_DEFAULTS;
  });

  const save = useCallback((next: MapSettings) => {
    setSettings(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  return { settings, save };
}
