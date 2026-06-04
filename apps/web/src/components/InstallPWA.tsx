import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

/**
 * One-tap "Install app" button. Appears only when the browser fires
 * `beforeinstallprompt` (Chrome / Edge / Android) and the app isn't already
 * installed. On iOS Safari (which has no prompt event) it stays hidden — there
 * users install via Share → Add to Home Screen.
 */
export function InstallPWA({ className }: { className?: string }) {
  const [deferred, setDeferred] = useState<any>(null);

  useEffect(() => {
    // Already running as an installed app → nothing to offer.
    if (window.matchMedia?.('(display-mode: standalone)').matches) return;

    const onPrompt = (e: any) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => setDeferred(null);

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!deferred) return null;

  const install = async () => {
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <button
      onClick={install}
      className={
        className ||
        'inline-flex items-center justify-center gap-2 bg-primary text-brand-navy px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-yellow hover:bg-primary-dim transition-all'
      }
    >
      <Download size={16} /> Install App
    </button>
  );
}
