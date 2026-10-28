import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./campaigns.css";
import "./orbit/orbit.css";
import { applyAppearance } from "./orbit/appearance";

applyAppearance();

createRoot(document.getElementById("root")!).render(<App />);
