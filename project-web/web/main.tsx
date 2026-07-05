import { createRoot } from "react-dom/client";
import { App } from "./App";
import "@components/index.css";
import "@utils/i18n";
const root = document.createElement("div");
root.id = "root";
document.body.appendChild(root);
createRoot(root).render(<App />);
