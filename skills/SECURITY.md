# 🛡️ Security Recommendations & Best Practices Guide

This document provides a comprehensive security standard and hardening guide for the fullstack application template (`project-api`, `project-web`, and `project-types`).

---

## 📑 Table of Contents
1. [Authentication & Access Control](#1-authentication--access-control)
2. [API & Network Hardening](#2-api--network-hardening)
3. [Data Protection & Encryption](#3-data-protection--encryption)
4. [Input Validation & Injection Defense](#4-input-validation--injection-defense)
5. [File Uploads & Storage Security](#5-file-uploads--storage-security)
6. [Payment & Webhook Security](#6-payment--webhook-security)
7. [Frontend & Mobile App Security](#7-frontend--mobile-app-security)
8. [Environment & Secrets Management](#8-environment--secrets-management)
9. [Pre-Production Security Checklist](#9-pre-production-security-checklist)

---

## 1. Authentication & Access Control

### 🔑 JWT (JSON Web Token) Security
- **Strong Signing Keys**: Always generate a cryptographically strong secret (minimum 32 bytes / 256 bits) in production.
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Token Lifetimes**:
  - Keep access token validity short (e.g., 15–60 minutes).
  - Use refresh tokens with strict rotation policies for long-lived sessions.
- **Session Revocation via `tokenVersion`**:
  - Maintain a `tokenVersion` counter on the user model.
  - Increment `tokenVersion` on password change, account lockout, or manual logout from all devices to immediately invalidate all outstanding JWTs.

### 🔒 Password & Account Security
- **Bcrypt Hashing**: Hash passwords using Bcrypt with a salt work factor of at least 10–12 rounds.
- **Account Lockout Protection**:
  - Track `failedLoginAttempts` and `lockedUntil`.
  - Automatically lock accounts for 15–30 minutes after 5 consecutive failed login attempts to mitigate brute-force attacks.
- **TOTP Two-Factor Authentication (2FA)**:
  - Encrypt `totpSecret` in the database using the application `ENCRYPTION_KEY`.
  - Enforce OTP code validation with a strict time-step window (no wider than ±1 step).

### 📲 One-Time Passwords (OTP)
- **Single-Use Enforcement**: Immediately mark OTP records as `used: true` upon successful verification.
- **Short Time-To-Live (TTL)**: Restrict OTP validity to 3–5 minutes max.
- **Attempt Limiting**: Invalidate the OTP after 3 incorrect verification attempts.

---

## 2. API & Network Hardening

### 🚦 Rate Limiting
Apply tiered rate limiting using `hono-rate-limiter`:
| Endpoint Category | Window | Max Requests | Purpose |
| :--- | :--- | :--- | :--- |
| **Auth** (`/auth/login`, `/auth/register`) | 15 mins | 5–10 | Prevent credential stuffing |
| **SMS / OTP** (`/auth/send-otp`) | 15 mins | 3 | Prevent SMS toll fraud |
| **File Uploads** (`/files/upload`) | 15 mins | 20 | Prevent storage exhaustion & DoS |
| **General API** | 15 mins | 100–300 | Protect server resources |

### 🌐 Cross-Origin Resource Sharing (CORS)
- **No Wildcards in Production**: Never use `origin: "*"` with `credentials: true`.
- **Explicit Whitelisting**: Restrict allowed origins to your production domains, web portals, and local dev environments.

### 🛡️ Reverse Proxy & IP Spoofing Prevention
- Only trust `X-Forwarded-For` or `X-Real-IP` headers when requests originate from verified trusted proxies (`TRUSTED_PROXIES` configuration).
- Do not let clients spoof their client IP to bypass rate limits or audit logs.

### 📱 Native App API Key
- Enforce `NATIVE_APP_KEY` verification middleware on sensitive mobile-specific endpoints to prevent direct automated scraping.

---

## 3. Data Protection & Encryption

### 🔐 At-Rest Encryption
- Sensitive database fields (e.g., TOTP secrets, OAuth refresh tokens, third-party API credentials) must be encrypted using AES-256-GCM before saving to MongoDB.
- Ensure the `ENCRYPTION_KEY` is securely injected via environment variables and never checked into source control.

### 📜 Audit Logging & Sensitive Data Redaction
- Record administrative actions using `AuditLog` middleware (tracking admin ID, action, resource, timestamp, and IP).
- **Redact Sensitive Fields**: Strip or mask passwords, OTP codes, credit card details, and JWT tokens before writing request payloads to audit logs or console streams.

---

## 4. Input Validation & Injection Defense

### 🧩 Schema Validation with Zod
- Enforce strict Zod schemas on every incoming request payload (`body`, `query`, `params`).
- Strip unrecognized fields (`.strict()` or default Zod object stripping) to prevent mass assignment vulnerabilities.

### 🍃 MongoDB Injection Defense
- Never concatenate raw user input into MongoDB queries.
- Sanitize object keys (disallow `$` prefix and `.` path traversal in input keys).
- Rely on strongly typed repository abstraction methods with explicit property assignments.

---

## 5. File Uploads & Storage Security

- **MIME Type & Extension Whitelisting**:
  - Only allow permitted MIME types (e.g., `image/jpeg`, `image/png`, `image/webp`, `application/pdf`).
  - Verify file magic numbers / headers, not just client-supplied `Content-Type`.
- **Prevent Path Traversal**:
  - Generate randomized UUID filenames on the server (e.g., `${uuidv4()}.${ext}`).
  - Never allow user-supplied filenames directly in filesystem storage paths.
- **Upload Size Limits**:
  - Enforce hard payload size limits (e.g., 5MB–10MB) at both reverse proxy (Nginx/Cloudflare) and application middleware levels.
- **Storage Isolation**:
  - For S3 / Supabase / Cloudinary, use private buckets and serve files through CDN or signed URLs where privacy is required.

---

## 6. Payment & Webhook Security

### 🪝 HMAC Webhook Signature Verification
- Always verify webhook signatures (Chargily / Stripe) using raw request bodies before processing payment events.
- Reject requests with invalid signatures with `400 Bad Request` or `401 Unauthorized`.

### ⏱️ Replay Attack Prevention
- Validate webhook timestamp headers (reject requests older than 5 minutes).
- Store processed webhook event IDs to ensure idempotent processing and prevent double credit/fulfillment.

---

## 7. Frontend & Mobile App Security

### 🛡️ Cross-Site Scripting (XSS) Prevention
- Avoid `dangerouslySetInnerHTML` unless input is thoroughly sanitized with DOMPurify.
- Enforce strict Content Security Policy (CSP) meta tags on HTML entry points (`index.html`, `admin.html`, `web.html`).

### 🤖 Bot & Abuse Protection (Turnstile)
- Embed Cloudflare Turnstile verification on public forms (Registration, Password Reset, Contact Forms).
- Validate Turnstile tokens server-side before executing high-cost actions.

### 📱 Capacitor & Electron Security
- **Electron**:
  - Enable `contextIsolation: true`.
  - Disable `nodeIntegration: false`.
  - Validate all navigation and external URL requests.
- **Capacitor Mobile**:
  - Store auth tokens in Secure Storage / Biometric Keychain rather than unencrypted `localStorage` where sensitive data persistence is critical.

---

## 8. Environment & Secrets Management

- **`.gitignore` Hygiene**: Ensure all `.env`, `.env.local`, `uploads/`, `dist/`, and build artifacts are present in `.gitignore`.
- **Secret Rotation**:
  - Regularly rotate `JWT_SECRET`, `ENCRYPTION_KEY`, and API provider keys.
  - Implement zero-downtime key rotation where applicable (e.g., multi-key verification).
- **Principle of Least Privilege**:
  - Database users should have read/write access only to the designated database `MONGODB_DB`.
  - S3 / Storage IAM credentials should only have `PutObject` and `GetObject` permissions within the specific bucket folder.

---

## 9. Pre-Production Security Checklist

- [ ] All default secrets replaced with 32+ byte cryptographic random strings.
- [ ] CORS origin whitelist configured with actual production URLs.
- [ ] Rate limits tuned and enabled across all public routes.
- [ ] Cloudflare Turnstile keys configured on frontend and backend.
- [ ] VAPID keys generated and stored in environment variables.
- [ ] Webhook secrets configured for active payment gateway (Chargily/Stripe).
- [ ] Trusted proxy headers enabled behind Nginx / Cloudflare.
- [ ] MongoDB connection string secured with TLS/SSL enabled.
- [ ] Server headers secured (CSP, X-Content-Type-Options, HSTS).
- [ ] Console logs sanitized to ensure no credentials or tokens are printed.
