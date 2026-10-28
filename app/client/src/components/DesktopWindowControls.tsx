// Design philosophy: Halo Opaline — desktop-installed sessions keep only three calm, familiar controls in a native-titlebar-free frame.
import { Maximize2, Minimize2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type WindowControlsOverlay = EventTarget & { visible: boolean };
type NavigatorWithOverlay = Navigator & { windowControlsOverlay?: WindowControlsOverlay };

function isDesktopInstalled() {
  if (typeof window === "undefined") return false;
  const installed = window.matchMedia("(display-mode: window-controls-overlay)").matches || window.matchMedia("(display-mode: standalone)").matches;
  return installed && window.innerWidth > 760;
}

export default function DesktopWindowControls() {
  const [enabled, setEnabled] = useState(false);
  const [fullScreen, setFullScreen] = useState(Boolean(document.fullscreenElement));

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  }, []);

  useEffect(() => {
    const overlay = (navigator as NavigatorWithOverlay).windowControlsOverlay;
    if (!overlay || !isDesktopInstalled()) return;
    const sync = () => setEnabled(overlay.visible);
    const syncFullscreen = () => setFullScreen(Boolean(document.fullscreenElement));
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.matches("input, textarea, select, [contenteditable='true']");
      if (!typing && (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        void toggleFullscreen();
      }
    };
    sync();
    document.documentElement.classList.add("desktop-window-controls-active");
    overlay.addEventListener("geometrychange", sync);
    document.addEventListener("fullscreenchange", syncFullscreen);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      overlay.removeEventListener("geometrychange", sync);
      document.removeEventListener("fullscreenchange", syncFullscreen);
      window.removeEventListener("keydown", onKeyDown);
      document.documentElement.classList.remove("desktop-window-controls-active");
    };
  }, [toggleFullscreen]);

  const closeWindow = () => window.close();

  if (!enabled) return null;

  return (
    <div className="desktop-window-controls" aria-label="Contrôles de fenêtre">
      <div className="desktop-window-drag-region">
        <img src={`${import.meta.env.BASE_URL}orbit-icon.svg`} alt="" />
      </div>
      <div className="desktop-window-actions">
        <button type="button" className="desktop-window-dot desktop-window-close" onClick={closeWindow} aria-label="Fermer l’application" data-window-tooltip="Fermer l’application"><X size={10} /></button>
        <button type="button" className="desktop-window-dot desktop-window-expand" onClick={toggleFullscreen} aria-label={fullScreen ? "Quitter le plein écran" : "Passer en plein écran"} data-window-tooltip={fullScreen ? "Quitter le plein écran" : "Passer en plein écran"}>{fullScreen ? <Minimize2 size={10} /> : <Maximize2 size={10} />}</button>
        <span className="desktop-window-dot desktop-window-status" role="img" aria-label="BTL – Deployment report" data-window-tooltip="BTL – Deployment report" tabIndex={0} />
      </div>
    </div>
  );
}
