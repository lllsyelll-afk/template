import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./admin.html",
    "./web.html",
    "./src/**/*.{js,ts,jsx,tsx,css}",
    "./components/**/*.{js,ts,jsx,tsx,css}",
    "./web/**/*.{js,ts,jsx,tsx,css}",
    "./admin/**/*.{js,ts,jsx,tsx,css}",
  ],
  // Theme configuration is now in CSS @theme directive
  plugins: [],
};

export default config;
