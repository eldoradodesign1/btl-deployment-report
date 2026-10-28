// Design philosophy: Halo Opaline — installation guidance should feel like a small field instrument, useful without interrupting reporting.
import { Download, MonitorDown, MoreVertical, Plus, Share2, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isMobileBrowser() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;
}

function isInstalled() {
  if (typeof window === "undefined") return false;
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || iosNavigator.standalone === true;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallAppGuide() {
  const [open, setOpen] = useState(false);
  const [available, setAvailable] = useState(false);
  const [installed, setInstalled] = useState(isInstalled);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const ios = typeof navigator !== "undefined" && isIOS();

  useEffect(() => {
    if (!isMobileBrowser() || isInstalled()) return;
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setAvailable(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const requestInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
    setAvailable(false);
    setOpen(false);
  };

  if (installed || !isMobileBrowser()) return null;

  return (
    <>
      <button className="install-guide-trigger" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <Download size={14} />
        <span>Installer l’app</span>
      </button>

      {open && (
        <div className="install-guide-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section className="install-guide-sheet" role="dialog" aria-modal="true" aria-labelledby="install-guide-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="install-guide-close" type="button" onClick={() => setOpen(false)} aria-label="Fermer le guide d’installation"><X size={16} /></button>
            <div className="install-guide-icon"><Smartphone size={23} /></div>
            <p>BTL · ACCÈS RAPIDE</p>
            <h2 id="install-guide-title">Installez votre<br />poste de pilotage.</h2>
            <span className="install-guide-copy">Un accès plein écran, sans onglet du navigateur, pour suivre le déploiement sur le terrain.</span>

            {ios ? (
              <div className="install-guide-steps">
                <div><b>1</b><span>Dans Safari, touchez <strong><Share2 size={13} /> Partager</strong>.</span></div>
                <div><b>2</b><span>Choisissez <strong><Plus size={13} /> Sur l’écran d’accueil</strong>.</span></div>
                <div><b>3</b><span>Validez <strong>Ajouter</strong> pour lancer BTL Report comme une app.</span></div>
              </div>
            ) : (
              <div className="install-guide-steps">
                <div><b>1</b><span>Ajoutez BTL Report à votre téléphone pour ouvrir le dashboard en plein écran.</span></div>
                <div><b>2</b><span>L’icône opaline apparaîtra ensuite sur votre écran d’accueil.</span></div>
              </div>
            )}

            {available ? (
              <button className="install-guide-primary" type="button" onClick={requestInstall}><Download size={15} /> Installer maintenant</button>
            ) : !ios ? (
              <div className="install-guide-browser-tip"><MoreVertical size={15} /><span>Ouvrez le menu du navigateur, puis choisissez <strong>Installer l’application</strong> ou <strong>Ajouter à l’écran d’accueil</strong>.</span></div>
            ) : null}

            <div className="install-guide-footer"><MonitorDown size={13} /><span>Le dashboard reste synchronisé avec vos données Supabase.</span></div>
          </section>
        </div>
      )}
    </>
  );
}
