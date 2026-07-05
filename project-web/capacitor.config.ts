// Capacitor configuration. Run `npx cap add android` (or ios) once to
// generate the native projects; then `npm run build` + `npx cap sync`.
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.package.app",
  appName: "App",
  webDir: "dist",
};

export default config;