import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";   // works on static hosts
import App from "./App.jsx";
import "./styles.css";
import { ThemeProvider } from "./theme/ThemeProvider.jsx";



ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>
);
