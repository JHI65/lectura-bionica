import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, type ReadingSettings } from '../lib/bionic/settings';
import { loadSettings, saveSettings } from '../lib/state/preferences';

export function useSettings() {
  const [settings, setSettings] = useState<ReadingSettings>(() => loadSettings());

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const update = useCallback(<K extends keyof ReadingSettings>(key: K, value: ReadingSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => setSettings({ ...DEFAULT_SETTINGS }), []);

  return { settings, update, reset };
}
