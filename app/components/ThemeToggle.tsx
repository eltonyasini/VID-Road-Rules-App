import { useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === "dark");
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try { localStorage.setItem("learners-theme", next ? "dark" : "light"); } catch { /* Theme still works without storage. */ }
  }
  return <button className="theme-toggle" type="button" onClick={toggleTheme}
    aria-label={`Switch to ${dark ? "light" : "dark"} mode`} aria-pressed={dark}>
    <span aria-hidden="true">{dark ? "☾" : "☀"}</span><span>{dark ? "Dark" : "Light"}</span>
  </button>;
}
