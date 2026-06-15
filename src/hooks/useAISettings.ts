import { useState, useCallback } from 'react';

export interface AISettings {
  baseUrl: string;
  apiKey: string;
  model: string;
}

const STORAGE_KEY = 'geo_ai_settings';

export const AI_DEFAULTS: AISettings = {
  baseUrl: 'https://api.deepseek.com',
  apiKey: '',
  model: 'deepseek-chat',
};

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...AI_DEFAULTS, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return AI_DEFAULTS;
  });

  const save = useCallback((next: AISettings) => {
    setSettings(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  return { settings, save };
}
