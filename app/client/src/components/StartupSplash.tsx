// Design philosophy: Halo Opaline — an installed mobile session begins with a calm luminous instrument, never a generic loader.
import { useEffect, useState } from "react";

function shouldShowStartupSplash() {
  if (typeof window === "undefined") return false;
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || iosNavigator.standalone === true;
  return standalone && window.innerWidth <= 760;
}

export default function StartupSplash() {
  const [visible, setVisible] = useState(shouldShowStartupSplash);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const leaveTimer = window.setTimeout(() => setLeaving(true), 1050);
    const closeTimer = window.setTimeout(() => setVisible(false), 1280);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(closeTimer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={`startup-splash${leaving ? " is-leaving" : ""}`} role="status" aria-label="Préparation de BTL Deployment report">
      <div className="startup-splash-orbit startup-splash-orbit-a" />
      <div className="startup-splash-orbit startup-splash-orbit-b" />
      <div className="startup-splash-content">
        <div className="startup-splash-mark" aria-hidden="true">
          <img src={`${import.meta.env.BASE_URL}pwa-192.png`} alt="" />
        </div>
        <p>BTL · TERRAIN SIGNAL</p>
        <h1>Deployment<br />report</h1>
        <span>Préparation du pilotage terrain</span>
        <i aria-hidden="true"><b /></i>
      </div>
    </div>
  );
}
