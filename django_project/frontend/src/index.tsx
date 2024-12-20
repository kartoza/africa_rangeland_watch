import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import "./styles/font.css";

const container = document.getElementById("app") as HTMLElement;
const root = createRoot(container);

root.render(<App />);
