import { useEffect, useState } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export default function OfflineSupport() {
  const [status, setStatus] = useState("Preparing offline practice…");
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(() => matchMedia("(display-mode: standalone)").matches);
  useEffect(() => {
    let mounted = true;
    const capture = (event: Event) => { event.preventDefault(); setInstall(event as InstallPrompt); };
    const complete = () => { setInstalled(true); setInstall(null); };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", complete);
    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
        .then(() => navigator.serviceWorker.ready)
        .then(() => { if (mounted) setStatus("Ready offline · All 400 questions and diagrams saved on this device."); })
        .catch(() => { if (mounted) setStatus("Offline setup could not finish. Reopen while online to try again."); });
    } else setStatus("Offline installation is available on the published app.");
    return () => {
      mounted = false;
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", complete);
    };
  }, []);
  async function installApp() {
    if (!install) return;
    try { await install.prompt(); await install.userChoice; } finally { setInstall(null); }
  }
  return <aside className="offline-support">
    <p role="status">{status}</p>
    {!installed && (install
      ? <button type="button" className="secondary-button" onClick={installApp}>Install app</button>
      : <details><summary>Install on your device</summary><p>On iPhone or iPad, open in Safari and choose Share → Add to Home Screen. On Android or desktop, look for Install app or Add to Home Screen in your browser menu.</p></details>)}
    <small>Progress and preferences stay in this browser on this device. Clearing site data removes them.</small>
  </aside>;
}
