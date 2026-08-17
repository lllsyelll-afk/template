import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Shield,
  Server,
  Activity,
  Database,
  Radio,
  Bell,
  HardDrive,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Sparkles,
  Code2,
  Lock,
  Smartphone,
  Globe,
  Settings2,
} from "lucide-react";
import { useAuth, useLogout } from "@/hooks/auth";
import { useLanguage, type Language } from "@components/LanguageContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useBaseUrlPopup } from "@/contexts/BaseUrlContext";
import { useSupport } from "@/contexts/SupportContext";
import { wsService } from "@/services/websocket";
import { api } from "@utils/client";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import AppShell from "@/components/AppShell";

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const logout = useLogout();
  const { language, setLanguageTo } = useLanguage();
  const { openBaseUrlPopup } = useBaseUrlPopup();
  const { setShowSupportSheet } = useSupport();

  const [wsConnected, setWsConnected] = useState(false);
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Ping API function
  const checkApiHealth = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      await api.get<{ user: unknown }>("/auth/me");
      const elapsed = Math.round(performance.now() - start);
      setApiLatency(elapsed);
      toast({
        title: "API Status: Online",
        description: `Ping response received in ${elapsed}ms`,
      });
    } catch {
      setApiLatency(null);
      toast({
        title: "API Error",
        description: "Unable to communicate with API server on port 45231.",
      });
    } finally {
      setIsPinging(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    checkApiHealth();

    // Subscribe to WebSocket events
    const unsubscribe = wsService.subscribe((msg) => {
      if (msg.type === "connected") {
        setWsConnected(true);
      }
    });

    wsService.connect();
    // Default optimistic connected indicator once connected
    setWsConnected(true);

    return () => {
      unsubscribe();
    };
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const handleCycleLanguage = () => {
    const nextLang: Language = language === "en" ? "ar" : language === "ar" ? "fr" : "en";
    setLanguageTo(nextLang);
  };

  return (
    <AppShell
      rightHeaderContent={
        <div className="flex items-center gap-2">
          <ThemeToggle variant="icon" />
          <Button
            onClick={handleCycleLanguage}
            className="bg-background hover:bg-muted shadow-none px-2.5 border border-border rounded-xl h-9 font-semibold text-foreground text-xs"
            title="Switch Language"
          >
            <Globe className="inline mr-1 w-4 h-4 text-primary" />
            {language.toUpperCase()}
          </Button>
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="gap-1.5 bg-destructive hover:bg-destructive/90 shadow-none px-3 border-none rounded-xl h-9 text-destructive-foreground text-xs cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t("auth_logout", { defaultValue: "Logout" })}</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6 md:space-y-8 mx-auto p-4 sm:p-6 md:p-8 max-w-7xl animate-in duration-500 fade-in">

        {/* Welcome Hero Banner */}
        <div className="relative bg-linear-to-br from-primary/15 via-primary/5 to-background shadow-lg backdrop-blur-xl p-6 sm:p-8 border border-primary/20 rounded-3xl overflow-hidden">
          <div className="-top-24 -right-24 absolute bg-primary/10 blur-3xl rounded-full w-64 h-64 pointer-events-none" />
          <div className="-bottom-24 -left-24 absolute bg-primary/5 blur-3xl rounded-full w-64 h-64 pointer-events-none" />

          <div className="z-10 relative flex md:flex-row flex-col justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <Avatar className="shadow-md border-2 border-primary/30 ring-4 ring-primary/10 w-16 sm:w-20 h-16 sm:h-20">
                <AvatarImage src={user?.photo ?? undefined} alt={user?.name} />
                <AvatarFallback className="bg-primary/20 font-bold text-primary text-xl sm:text-2xl">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-extrabold text-foreground text-2xl sm:text-3xl tracking-tight">
                    {user?.name ? `Welcome back, ${user.name}!` : "Welcome to the App!"}
                  </h1>
                  <Badge className="bg-primary/15 px-2.5 py-0.5 border border-primary/25 rounded-full font-medium text-primary text-xs">
                    <Sparkles className="inline mr-1 w-3 h-3 text-primary" /> Fullstack Template
                  </Badge>
                </div>
                <p className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base">
                  <span>{user?.email || user?.phone || "Authenticated User"}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-500">
                    <span className="bg-emerald-500 rounded-full w-2 h-2 animate-pulse" /> Active Session
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <Button
                onClick={checkApiHealth}
                disabled={isPinging}
                className="gap-2 bg-card/70 hover:bg-card shadow-sm px-4 border border-border rounded-xl h-10 font-medium text-foreground text-xs sm:text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${isPinging ? "animate-spin text-primary" : ""}`} />
                <span>Test API Ping</span>
              </Button>
              <Button
                onClick={openBaseUrlPopup}
                className="gap-2 bg-primary hover:bg-primary/90 shadow-md px-4 border-none rounded-xl h-10 font-medium text-primary-foreground text-xs sm:text-sm"
              >
                <Settings2 className="w-4 h-4" />
                <span>API Settings</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 4 Glassmorphism Key Metrics */}
        <div className="gap-4 sm:gap-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* API Server Metric */}
          <Card className="bg-card/70 shadow-sm hover:shadow-md backdrop-blur-md border border-border/60 rounded-2xl transition-all">
            <CardContent className="flex justify-between items-center p-5">
              <div className="space-y-1">
                <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">API Backend</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-foreground text-2xl">
                    {apiLatency !== null ? `${apiLatency}ms` : "Port 45231"}
                  </span>
                  <span className="font-medium text-emerald-500 text-xs">Hono v4</span>
                </div>
                <p className="text-muted-foreground text-xs">HTTP REST & Middleware</p>
              </div>
              <div className="flex justify-center items-center bg-emerald-500/10 border border-emerald-500/20 rounded-2xl w-12 h-12 text-emerald-500">
                <Server className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          {/* WebSocket Metric */}
          <Card className="bg-card/70 shadow-sm hover:shadow-md backdrop-blur-md border border-border/60 rounded-2xl transition-all">
            <CardContent className="flex justify-between items-center p-5">
              <div className="space-y-1">
                <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Real-time WS</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-foreground text-2xl">
                    {wsConnected ? "Connected" : "Listening"}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">/api/ws event channel</p>
              </div>
              <div className="flex justify-center items-center bg-sky-500/10 border border-sky-500/20 rounded-2xl w-12 h-12 text-sky-500">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
            </CardContent>
          </Card>

          {/* Database Metric */}
          <Card className="bg-card/70 shadow-sm hover:shadow-md backdrop-blur-md border border-border/60 rounded-2xl transition-all">
            <CardContent className="flex justify-between items-center p-5">
              <div className="space-y-1">
                <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Database</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-foreground text-2xl">MongoDB</span>
                </div>
                <p className="text-muted-foreground text-xs">template_db ready</p>
              </div>
              <div className="flex justify-center items-center bg-amber-500/10 border border-amber-500/20 rounded-2xl w-12 h-12 text-amber-500">
                <Database className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          {/* Security & 2FA Metric */}
          <Card className="bg-card/70 shadow-sm hover:shadow-md backdrop-blur-md border border-border/60 rounded-2xl transition-all">
            <CardContent className="flex justify-between items-center p-5">
              <div className="space-y-1">
                <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Security Tier</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-foreground text-2xl">
                    {user?.twoFactorEnabled ? "2FA Active" : "JWT Secured"}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">Encrypted session cookies</p>
              </div>
              <div className="flex justify-center items-center bg-purple-500/10 border border-purple-500/20 rounded-2xl w-12 h-12 text-purple-500">
                <Shield className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Core Architecture Modules Grid */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-bold text-foreground text-xl">Template Architecture & Features</h2>
              <p className="text-muted-foreground text-sm">Explore the built-in modules ready for your application</p>
            </div>
            <Badge className="bg-muted border border-border font-semibold text-muted-foreground text-xs">
              Monorepo Ready
            </Badge>
          </div>

          <div className="gap-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

            {/* Feature 1: Authentication */}
            <Card className="group bg-card/60 hover:bg-card/90 border border-border/60 hover:border-primary/40 rounded-2xl transition-all">
              <CardHeader className="p-5 pb-3">
                <div className="flex justify-center items-center bg-primary/10 mb-2 rounded-xl w-10 h-10 text-primary group-hover:scale-110 transition-transform">
                  <Lock className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg">Auth & Multi-Factor</CardTitle>
                <CardDescription className="text-xs">
                  Cookie-based JWT, TOTP 2FA, OTP verification, Google & Facebook OAuth flows.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="bg-muted px-2 py-0.5 rounded-md font-mono text-[11px] text-muted-foreground">JWT Cookies</span>
                  <span className="bg-muted px-2 py-0.5 rounded-md font-mono text-[11px] text-muted-foreground">TOTP 2FA</span>
                  <span className="bg-muted px-2 py-0.5 rounded-md font-mono text-[11px] text-muted-foreground">OAuth2</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2: Shared Types */}
            <Card className="group bg-card/60 hover:bg-card/90 border border-border/60 hover:border-primary/40 rounded-2xl transition-all">
              <CardHeader className="p-5 pb-3">
                <div className="flex justify-center items-center bg-blue-500/10 mb-2 rounded-xl w-10 h-10 text-blue-500 group-hover:scale-110 transition-transform">
                  <Code2 className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg">Shared Zod Schemas</CardTitle>
                <CardDescription className="text-xs">
                  Unified types package (<code className="font-mono text-primary">project-types</code>) guaranteeing end-to-end type safety.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="bg-muted px-2 py-0.5 rounded-md font-mono text-[11px] text-muted-foreground">Zod Schemas</span>
                  <span className="bg-muted px-2 py-0.5 rounded-md font-mono text-[11px] text-muted-foreground">Type Inferred</span>
                  <span className="bg-muted px-2 py-0.5 rounded-md font-mono text-[11px] text-muted-foreground">app-types</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3: Notifications & WebPush */}
            <Card className="group bg-card/60 hover:bg-card/90 border border-border/60 hover:border-primary/40 rounded-2xl transition-all">
              <CardHeader className="p-5 pb-3">
                <div className="flex justify-center items-center bg-amber-500/10 mb-2 rounded-xl w-10 h-10 text-amber-500 group-hover:scale-110 transition-transform">
                  <Bell className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg">Push & In-App Alerts</CardTitle>
                <CardDescription className="text-xs">
                  Native WebPush with VAPID keys, in-app notification center, and WebSocket delivery.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="bg-muted px-2 py-0.5 rounded-md font-mono text-[11px] text-muted-foreground">WebPush</span>
                  <span className="bg-muted px-2 py-0.5 rounded-md font-mono text-[11px] text-muted-foreground">WebSocket</span>
                  <span className="bg-muted px-2 py-0.5 rounded-md font-mono text-[11px] text-muted-foreground">TanStack Query</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature 4: Cloud Storage */}
            <Card className="group bg-card/60 hover:bg-card/90 border border-border/60 hover:border-primary/40 rounded-2xl transition-all">
              <CardHeader className="p-5 pb-3">
                <div className="flex justify-center items-center bg-indigo-500/10 mb-2 rounded-xl w-10 h-10 text-indigo-500 group-hover:scale-110 transition-transform">
                  <HardDrive className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg">Storage Adapters</CardTitle>
                <CardDescription className="text-xs">
                  Pluggable storage backend supporting Local disk, AWS S3, Supabase, and Cloudinary.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="bg-muted px-2 py-0.5 rounded-md font-mono text-[11px] text-muted-foreground">AWS S3</span>
                  <span className="bg-muted px-2 py-0.5 rounded-md font-mono text-[11px] text-muted-foreground">Cloudinary</span>
                  <span className="bg-muted px-2 py-0.5 rounded-md font-mono text-[11px] text-muted-foreground">Supabase</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature 5: Multi-Platform Clients */}
            <Card className="group bg-card/60 hover:bg-card/90 border border-border/60 hover:border-primary/40 rounded-2xl transition-all">
              <CardHeader className="p-5 pb-3">
                <div className="flex justify-center items-center bg-pink-500/10 mb-2 rounded-xl w-10 h-10 text-pink-500 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg">Mobile & Desktop</CardTitle>
                <CardDescription className="text-xs">
                  Native Android/iOS with Capacitor and desktop packaging with Electron.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="bg-muted px-2 py-0.5 rounded-md font-mono text-[11px] text-muted-foreground">Capacitor v8</span>
                  <span className="bg-muted px-2 py-0.5 rounded-md font-mono text-[11px] text-muted-foreground">Electron v41</span>
                  <span className="bg-muted px-2 py-0.5 rounded-md font-mono text-[11px] text-muted-foreground">Vite v6</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature 6: CLI & Admin Toolkit */}
            <Card className="group bg-card/60 hover:bg-card/90 border border-border/60 hover:border-primary/40 rounded-2xl transition-all">
              <CardHeader className="p-5 pb-3">
                <div className="flex justify-center items-center bg-emerald-500/10 mb-2 rounded-xl w-10 h-10 text-emerald-500 group-hover:scale-110 transition-transform">
                  <Terminal className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg">Admin & CLI Toolkit</CardTitle>
                <CardDescription className="text-xs">
                  Interactive CLI commands, audit logging, admin mode routes, and rate-limiting.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="bg-muted px-2 py-0.5 rounded-md font-mono text-[11px] text-muted-foreground">CLI Runner</span>
                  <span className="bg-muted px-2 py-0.5 rounded-md font-mono text-[11px] text-muted-foreground">Audit Logs</span>
                  <span className="bg-muted px-2 py-0.5 rounded-md font-mono text-[11px] text-muted-foreground">Admin Mode</span>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Interactive Workspace / Inspect Tabs */}
        <Card className="bg-card/70 shadow-lg backdrop-blur-xl border border-border/60 rounded-3xl">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="font-bold text-lg">Template Inspector</CardTitle>
            <CardDescription className="text-xs">Live inspect session, tokens, and backend connection details</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <Tabs defaultValue="session" className="w-full">
              <TabsList className="grid grid-cols-3 bg-muted/60 mb-6 p-1 rounded-xl max-w-md">
                <TabsTrigger value="session" className="rounded-lg font-semibold text-xs">User Session</TabsTrigger>
                <TabsTrigger value="endpoints" className="rounded-lg font-semibold text-xs">API Details</TabsTrigger>
                <TabsTrigger value="actions" className="rounded-lg font-semibold text-xs">Quick Actions</TabsTrigger>
              </TabsList>

              {/* Tab 1: User Session */}
              <TabsContent value="session" className="space-y-4 animate-in duration-300 fade-in">
                <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1 bg-muted/40 p-4 border border-border/40 rounded-xl">
                    <p className="font-medium text-muted-foreground text-xs">User ID</p>
                    <p className="font-mono font-semibold text-foreground text-xs truncate">{user?._id || "N/A"}</p>
                  </div>
                  <div className="space-y-1 bg-muted/40 p-4 border border-border/40 rounded-xl">
                    <p className="font-medium text-muted-foreground text-xs">Phone Number</p>
                    <p className="font-mono font-semibold text-foreground text-xs">{user?.phone || "None"}</p>
                  </div>
                  <div className="space-y-1 bg-muted/40 p-4 border border-border/40 rounded-xl">
                    <p className="font-medium text-muted-foreground text-xs">Email Address</p>
                    <p className="font-mono font-semibold text-foreground text-xs">{user?.email || "None"}</p>
                  </div>
                  <div className="space-y-1 bg-muted/40 p-4 border border-border/40 rounded-xl">
                    <p className="font-medium text-muted-foreground text-xs">Two-Factor Authentication</p>
                    <p className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                      {user?.twoFactorEnabled ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-emerald-500">Enabled</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span className="text-amber-500">Disabled</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="space-y-1 bg-muted/40 p-4 border border-border/40 rounded-xl">
                    <p className="font-medium text-muted-foreground text-xs">Token Version</p>
                    <p className="font-mono font-semibold text-foreground text-xs">{user?.tokenVersion ?? 1}</p>
                  </div>
                  <div className="space-y-1 bg-muted/40 p-4 border border-border/40 rounded-xl">
                    <p className="font-medium text-muted-foreground text-xs">Member Since</p>
                    <p className="font-semibold text-foreground text-xs">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recent"}
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: API Endpoints */}
              <TabsContent value="endpoints" className="space-y-3 animate-in duration-300 fade-in">
                <div className="space-y-2 bg-muted/30 p-4 border border-border/50 rounded-xl font-mono text-xs">
                  <div className="flex justify-between items-center py-1 border-border/40 border-b">
                    <span className="font-bold text-emerald-500">GET</span>
                    <span className="text-muted-foreground">/api/auth/me</span>
                    <span className="bg-muted px-2 py-0.5 border border-border rounded text-[10px]">Session check</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-border/40 border-b">
                    <span className="font-bold text-blue-500">POST</span>
                    <span className="text-muted-foreground">/api/auth/login</span>
                    <span className="bg-muted px-2 py-0.5 border border-border rounded text-[10px]">Phone/Email password</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-border/40 border-b">
                    <span className="font-bold text-blue-500">POST</span>
                    <span className="text-muted-foreground">/api/auth/send-otp</span>
                    <span className="bg-muted px-2 py-0.5 border border-border rounded text-[10px]">SMS/Email OTP</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-border/40 border-b">
                    <span className="font-bold text-purple-500">WS</span>
                    <span className="text-muted-foreground">/api/ws</span>
                    <span className="bg-muted px-2 py-0.5 border border-border rounded text-[10px]">Real-time events</span>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: Quick Actions */}
              <TabsContent value="actions" className="space-y-4 animate-in duration-300 fade-in">
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => setShowSupportSheet(true)} className="gap-2 bg-muted hover:bg-muted/80 shadow-none px-4 border border-border rounded-xl h-10 text-foreground text-xs">
                    <Activity className="w-4 h-4 text-primary" />
                    <span>Open Support Dialog</span>
                  </Button>
                  <Button onClick={openBaseUrlPopup} className="gap-2 bg-muted hover:bg-muted/80 shadow-none px-4 border border-border rounded-xl h-10 text-foreground text-xs">
                    <Settings2 className="w-4 h-4 text-primary" />
                    <span>Configure Base URL</span>
                  </Button>
                  <Button onClick={() => toast({ title: "Template Action", description: "Trigger custom workflow or modal" })} className="gap-2 bg-muted hover:bg-muted/80 shadow-none px-4 border border-border rounded-xl h-10 text-foreground text-xs">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>Sample Toast Notification</span>
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      </div>
    </AppShell>
  );
}
