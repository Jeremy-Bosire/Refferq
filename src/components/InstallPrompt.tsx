'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useI18n } from '@/i18n/provider';

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function InstallPrompt() {
  const { t } = useI18n();
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  if (!installEvent) return null;

  const install = async () => {
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  return (
    <button type="button" onClick={install} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 text-sm font-semibold text-blue-800 hover:bg-blue-50">
      <Download size={16} />{t('installApp')}
    </button>
  );
}
