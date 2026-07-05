// WebSocket server for real-time notifications
import { WebSocketServer, WebSocket } from "ws";
import { verifyToken } from "./utils/jwt";
import type { User } from "./types";
import {
  authMessageSchema,
  authenticatedMessageSchema,
} from "./websocket/schemas";
import { IncomingMessage, Server } from "http";

const AUTH_TIMEOUT_MS = 10_000;
const MAX_MESSAGE_SIZE_BYTES = 10 * 1024; // 10KB max message size
const MAX_MESSAGES_PER_MINUTE = 30; // Rate limit: 30 messages per minute per client
const NATIVE_ORIGINS = ["http://localhost", "capacitor://localhost"];
const isDev = process.env.ENV === "development";
const NATIVE_APP_KEY = process.env.NATIVE_APP_KEY || "";

function isNativeOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  return NATIVE_ORIGINS.includes(origin);
}

interface Client {
  ws: WebSocket;
  userId: string;
  authenticated: boolean;
  messageCount: number;
  lastMessageTime: number;
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    }),
  );
}

function tryCookieAuth(request: import("http").IncomingMessage): { sub: string } | null {
  const cookies = parseCookies(request.headers.cookie);
  const token = cookies["auth_token"];
  if (!token) return null;
  return verifyToken(token);
}

function getAppKeyFromUrl(request: import("http").IncomingMessage): string | null {
  const url = new URL(request.url || "", "http://localhost");
  return url.searchParams.get("appKey");
}

export class AppWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Client> = new Map();
  private pendingAuths: Map<WebSocket, ReturnType<typeof setTimeout>> = new Map();

  initialize(server: unknown) {
    this.wss = new WebSocketServer({
      server: server as Server,
      path: "/api/ws",
    });

    this.wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
      const clientId = `pending-${Date.now()}`;

      const client: Client = {
        ws,
        userId: "",
        authenticated: false,
        messageCount: 0,
        lastMessageTime: Date.now(),
      };

      this.clients.set(clientId, client);

      // Try to auto-authenticate from cookie on the HTTP upgrade request
      const payload = tryCookieAuth(request);
      if (payload) {
        // For native origins, verify app key before auto-authenticating
        if (!isDev && isNativeOrigin(request.headers.origin)) {
          const appKey = getAppKeyFromUrl(request);
          if (!appKey || appKey !== NATIVE_APP_KEY) {
            console.log(`[WebSocket] Native app key verification failed for cookie auth`);
            ws.close(1008, "Invalid app key");
            return;
          }
        }
        client.authenticated = true;
        client.userId = payload.sub;
        this.clients.delete(clientId);
        const newClientId = `${payload.sub}-${Date.now()}`;
        this.clients.set(newClientId, client);
        console.log(`[WebSocket] Client auto-authenticated from cookie: clientId=${newClientId}, userId=${payload.sub}`);
        ws.send(JSON.stringify({ type: "connected" }));
      } else {
        // Set auth timeout — close if no auth message received
        const authTimeout = setTimeout(() => {
          if (!client.authenticated) {
            console.log(`[WebSocket] Auth timeout for clientId=${clientId}`);
            ws.close(1008, "Auth timeout");
          }
        }, AUTH_TIMEOUT_MS);
        this.pendingAuths.set(ws, authTimeout);
      }

      ws.on("message", (data) => {
        try {
          const dataString = data.toString();

          // Check message size limit (prevent DoS with huge messages)
          if (dataString.length > MAX_MESSAGE_SIZE_BYTES) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Message too large",
              maxSize: MAX_MESSAGE_SIZE_BYTES,
            }));
            return;
          }

          // Rate limiting: max 30 messages per minute per client
          const now = Date.now();
          if (now - client.lastMessageTime > 60000) {
            // Reset counter after 1 minute
            client.messageCount = 0;
            client.lastMessageTime = now;
          }
          if (client.messageCount++ > MAX_MESSAGES_PER_MINUTE) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Rate limit exceeded. Max 30 messages per minute.",
            }));
            ws.close(1008, "Rate limit exceeded");
            return;
          }

          const rawMessage = JSON.parse(dataString);

          // Handle auth as first message
          if (!client.authenticated) {
            const result = authMessageSchema.safeParse(rawMessage);
            if (!result.success) {
              ws.send(JSON.stringify({
                type: "error",
                message: "Invalid auth message format",
                details: result.error.issues.map((i) => i.message),
              }));
              ws.close(1008, "Invalid auth message format");
              return;
            }

            const { token, appKey } = result.data;

            if (!isDev && isNativeOrigin(request.headers.origin)) {
              if (!appKey || appKey !== NATIVE_APP_KEY) {
                ws.send(JSON.stringify({ type: "error", message: "Invalid app key" }));
                ws.close(1008, "Invalid app key");
                return;
              }
            }

            const payload = verifyToken(token);
            if (!payload) {
              ws.send(JSON.stringify({ type: "error", message: "Invalid token" }));
              ws.close(1008, "Invalid token");
              return;
            }

            client.authenticated = true;
            client.userId = payload.sub;

            // Update clientId to use real userId
            this.clients.delete(clientId);
            const newClientId = `${payload.sub}-${Date.now()}`;
            this.clients.set(newClientId, client);

            // Clear auth timeout
            const timeout = this.pendingAuths.get(ws);
            if (timeout) {
              clearTimeout(timeout);
              this.pendingAuths.delete(ws);
            }

            console.log(`[WebSocket] Client authenticated: clientId=${newClientId}, userId=${payload.sub}, total clients=${this.clients.size}`);

            // Send connection confirmation
            ws.send(JSON.stringify({ type: "connected" }));
            return;
          }

          // Authenticated messages - validate with schema
          const result = authenticatedMessageSchema.safeParse(rawMessage);
          if (!result.success) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Invalid message format",
              details: result.error.issues.map((i) => i.message),
            }));
            return;
          }

          // Handle validated message
          const message = result.data;
          switch (message.type) {


            case "ping":
              ws.send(JSON.stringify({ type: "pong" }));
              break;
          }
        } catch (error) {
          // Handle JSON parse errors
          if (error instanceof SyntaxError) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
          } else {
            console.error("[WebSocket] Message handling error:", error);
            ws.send(JSON.stringify({ type: "error", message: "Internal error" }));
          }
        }
      });

      ws.on("close", () => {
        const timeout = this.pendingAuths.get(ws);
        if (timeout) {
          clearTimeout(timeout);
          this.pendingAuths.delete(ws);
        }
        // Find and remove the client entry
        for (const [id, c] of this.clients.entries()) {
          if (c.ws === ws) {
            console.log(`[WebSocket] Client disconnected: clientId=${id}, userId=${c.userId}`);
            this.clients.delete(id);
            break;
          }
        }
      });

      ws.on("error", (err) => {
        console.log(`[WebSocket] Client error: error=${err.message}`);
        const timeout = this.pendingAuths.get(ws);
        if (timeout) {
          clearTimeout(timeout);
          this.pendingAuths.delete(ws);
        }
        for (const [id, c] of this.clients.entries()) {
          if (c.ws === ws) {
            this.clients.delete(id);
            break;
          }
        }
      });
    });
  }

  sendToUser(userId: string, message: unknown) {
    const messageStr = JSON.stringify(message);
    console.log(`[WebSocket] sendToUser: targeting userId=${userId}, message type=${(message as { type?: string }).type}`);
    console.log(`[WebSocket] Total clients: ${this.clients.size}`);

    let sent = false;
    for (const [clientId, client] of this.clients.entries()) {
      console.log(`[WebSocket] Checking client ${clientId}: userId=${client.userId}, readyState=${client.ws.readyState}`);
      if (client.userId === userId) {
        if (client.ws.readyState === WebSocket.OPEN) {
          console.log(`[WebSocket] Sending message to client ${clientId}`);
          client.ws.send(messageStr);
          sent = true;
        } else {
          console.log(`[WebSocket] Client ${clientId} found but not OPEN (readyState=${client.ws.readyState})`);
        }
      }
    }
    if (!sent) {
      console.log(`[WebSocket] WARNING: No open client found for userId=${userId}`);
    }
  }

  notifyUserProfileUpdate(userId: string, user: Omit<User, 'passwordHash'>) {
    this.sendToUser(userId, {
      type: "user_profile_updated",
      user,
    });
  }

  notifyUserBlocked(userId: string, blocked: boolean) {
    this.sendToUser(userId, {
      type: "user_blocked_status_updated",
      blocked,
    });
  }
}

export const wsServer = new AppWebSocketServer();
