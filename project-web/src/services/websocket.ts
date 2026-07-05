import { getDevApiBaseUrl } from "@utils/devConfig";
import { Capacitor } from "@capacitor/core";
import type { Notification, User } from "app-types"
const API_URL = getDevApiBaseUrl();
const WS_URL = API_URL.replace("http://", "ws://").replace(
  "https://",
  "wss://",
);
export type WebSocketMessage =
  | { type: "connected" }
  | { type: "notification"; data: Notification }
  | { type: "user_profile_updated"; user: User }
  | { type: "user_blocked_status_updated"; blocked: boolean };

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<(msg: WebSocketMessage) => void> = new Set();
  private isConnecting = false;
  private isAuthenticated = false;
  private shouldReconnect = false;
  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;
    this.isConnecting = true;
    this.isAuthenticated = false;
    this.shouldReconnect = true;
    try {
      let wsUrl = `${WS_URL}/ws`;
      if (Capacitor.isNativePlatform() && import.meta.env.VITE_NATIVE_APP_KEY) {
        wsUrl += `?appKey=${encodeURIComponent(import.meta.env.VITE_NATIVE_APP_KEY)}`;
      }
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        // Server auto-authenticates from the httpOnly cookie on the HTTP upgrade request.
      };
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          this.handleMessage(message);
          this.listeners.forEach((cb) => cb(message));
        } catch {
          // ignore invalid JSON
        }
      };
      this.ws.onclose = () => {
        this.isConnecting = false;
        this.scheduleReconnect();
      };
      this.ws.onerror = () => {
        this.isConnecting = false;
        this.ws?.close();
      };
    } catch {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }
  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.ws?.close();
    this.ws = null;
    this.isConnecting = false;
    this.isAuthenticated = false;
  }
  subscribe(callback: (msg: WebSocketMessage) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  send(data: unknown) {
    if (this.isAuthenticated && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case "connected":
        this.isAuthenticated = true;
        break;
      case "notification":
        // Notification messages are handled by listeners
        break;
    }
  }
  private scheduleReconnect() {
    if (this.reconnectTimeout || !this.shouldReconnect) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.shouldReconnect) {
        this.connect();
      }
    }, 3000);
  }
}
export const wsService = new WebSocketService();
