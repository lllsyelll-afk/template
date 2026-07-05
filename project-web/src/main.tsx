import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { NavigationBar } from "@capgo/capacitor-navigation-bar";
import App from "./App";
import "@components/index.css";
import { BaseUrlProvider } from "@/contexts/BaseUrlContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NativeThemeProvider } from "@/components/NativeThemeProvider";
import { api } from "@utils/client";

const APP_BAR_COLOR = "#0077ff";
const DARK_APP_BAR_COLOR = "#0f172a";

async function setupNativeBars(theme: "light" | "dark" = "light") {
  if (!Capacitor.isNativePlatform()) return;
  if (theme === "dark") {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: DARK_APP_BAR_COLOR });
    await NavigationBar.setNavigationBarColor({ color: DARK_APP_BAR_COLOR });
  } else {
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: APP_BAR_COLOR });
    await NavigationBar.setNavigationBarColor({ color: APP_BAR_COLOR });
  }
}

// VAPID public key for push notifications
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

// Register service worker for web push notifications (PWA)
async function registerServiceWorker() {
  // Only register on web platforms (not native)
  if (Capacitor.isNativePlatform()) return;
  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register("/service-worker.js");
    console.log("Service Worker registered:", registration.scope);

    // Request notification permission if not already determined
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("Notification permission denied");
        return;
      }
    }

    // Subscribe to push notifications if permission granted and VAPID key available
    if ("Notification" in window && Notification.permission === "granted" && VAPID_PUBLIC_KEY) {
      await subscribeToPushNotifications(registration);
    }
  } catch (error) {
    console.error("Service Worker registration failed:", error);
  }
}

// Subscribe to push notifications and send subscription to backend
async function subscribeToPushNotifications(registration: ServiceWorkerRegistration) {
  try {
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Subscribe to push notifications
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
      });
      console.log("Push notification subscription created");
    } else {
      console.log("Push notification subscription already exists");
    }

    // Send subscription to backend
    await sendSubscriptionToBackend(subscription);
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
  }
}

// Send push subscription to backend
async function sendSubscriptionToBackend(subscription: PushSubscription) {
  try {
    const response = await api.post("/push-subscriptions", {
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys,
    });
    console.log("Push subscription saved to backend:", response);
  } catch (error) {
    console.error("Error saving push subscription to backend:", error);
  }
}

// Convert base64 to Uint8Array for applicationServerKey
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

setupNativeBars();
registerServiceWorker();

const root = document.createElement("div");
root.id = "root";
document.body.appendChild(root);
createRoot(root).render(
  <BaseUrlProvider>
    <ThemeProvider>
      <NativeThemeProvider />
      <App />
    </ThemeProvider>
  </BaseUrlProvider>,
);
