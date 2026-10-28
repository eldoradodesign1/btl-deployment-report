import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./campaigns.css";
import "./orbit/orbit.css";
import "./orbit/orbit-screens.css";
import "./orbit/orbit-chrome.css";
import "./orbit/activite-terrain.css";
import "./orbit/donnees.css";
import { applyAppearance } from "./orbit/appearance";

applyAppearance();

createRoot(document.getElementById("root")!).render(<App />);
