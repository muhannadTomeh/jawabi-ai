import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

document.documentElement.lang = "ar";
document.documentElement.dir = "rtl";

// Apply persisted theme preference before rendering to avoid a flash.
try {
  const stored = localStorage.getItem("jawabi_theme") as "light" | "dark" | "system" | null;
  const pref = stored ?? "system";
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = pref === "dark" || (pref === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
} catch {}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(<App />);
