# 🚀 Fullstack Application Template

This is a clean, multi-package boilerplate/template designed for building fast, secure, and modern web & mobile applications. It uses a monorepo-like layout with an API server, a Web client, a CLI tool, and a shared Types package.

## 📦 What's Included

The project structure is organized as follows:

```
├── [project-name]-api/       # Backend API built with Hono
├── [project-name]-web/       # Frontend Web & Mobile client built with React + Vite + Capacitor
├── [project-name]-types/     # Shared data models & TypeScript schemas using Zod
├── init.js                   # Interactive configuration and setup script
└── package.json              # Root project configuration
```

### 1. ⚙️ Core Setup & CLI Init (`init.js`)
An interactive project setup script to bootstrap the codebase:
- Configures `.env` files for both the API and Web applications.
- Dynamically configures credentials, DB names, ports, payment providers, and SMS settings.
- Automatically renames folder scopes matching the configured project name.
- Supports adding custom logo files directly.

### 2. ⚡ Backend API (`*-api`)
A lightweight backend utilizing [Hono](https://hono.dev/):
- **Database Integration**: Monodb native driver implementation (`db/mongo.ts`).
- **Authentication**: Includes JWT authentication, Google OAuth login flow, TOTP 2FA support, and OTP (One-Time Password) generation/verification.
- **Push Notification & Web Push**: Setup for managing push subscriptions and dispatching notifications.
- **Audit Logging**: Includes middleware to record and audit admin actions (`middleware/auditLog.ts`).
- **File Upload Handler**: Extensible storage system supporting Local files, Supabase, Cloudinary, and AWS S3.
- **Rate Limiting**: Built-in protection middleware for endpoints.

### 3. 🖥️ Web Client (`*-web`)
A progressive web and mobile application utilizing [Vite](https://vite.dev/) and React:
- **Mobile Integration**: Uses [Capacitor](https://capacitorjs.com/) to build/sync iOS and Android wrappers.
- **UI Architecture**: Structured with glassmorphism, responsive navigation bar, customized auth flows, and bottom sheets.
- **Internationalization**: Full RTL direction and translation support using `i18next`.
- **Query & WebSocket**: Data fetching with `@tanstack/react-query` and WebSocket connections for real-time profile updates or notification triggers.

### 4. 🗃️ Shared Types (`*-types`)
A shared library (`app-types` package) defining core schemas and types:
- **Validation**: Enforced via [Zod](https://zod.dev/) schemas.
- **Data Models Included**:
  - `User` & `AdminUser` (User profiles, permissions, security fields).
  - `Notification` & `NotificationsResponse` (In-app notifications).
  - `PushSubscription` (Web Push notification subscription tokens).
  - `Invoice` & `InvoiceWithCreator` (Transactions and invoice tracking).

### 5. 🛠️ CLI Management Tool (`scripts/`)
A node-based Command Line Interface tool inside the API directory:
- Includes interactive flows to register, login, and verify administrative operations.
- State management (`CliState`) for managing active sessions locally.
- Secure command registry to build and register administrative commands.

---

## 🛠️ Getting Started

### 1. Initialize Project
Run the setup script from the root directory to customize the environment:
```bash
node init.js
```
Follow the interactive prompts to define project scopes, configuration values, and ports.

### 2. Install Dependencies
Run in individual directories or write a script to install them:
```bash
# Example for Web app
cd [project-name]-web
npm install
```

### 3. Running Locally
Launch the development environments:
- For API: `npm run dev` in `*-api`
- For Web: `npm run dev` in `*-web` (which runs local web, admin, and app modes)
