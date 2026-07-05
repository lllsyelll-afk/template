/**
 * WebSocket message validation schemas
 * Prevents malformed data, injection attacks, and resource exhaustion
 */

import { z } from "zod";



// Auth message (first message only, must be sent before any other messages)
export const authMessageSchema = z.object({
  type: z.literal("auth"),
  token: z.string().min(1, "Token is required"),
  appKey: z.string().optional(),
});



// Ping for keepalive
export const pingSchema = z.object({
  type: z.literal("ping"),
});

export const authenticatedMessageSchema = pingSchema;

// Export types for TypeScript
export type AuthMessage = z.infer<typeof authMessageSchema>;
export type AuthenticatedMessage = z.infer<typeof authenticatedMessageSchema>;
export type PingMessage = z.infer<typeof pingSchema>;
