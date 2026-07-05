import { Suspense, useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { useTranslation } from "../node_modules/react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@components/ui/toaster";
import { TooltipProvider } from "@components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogBody,
  DialogTitle,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { LanguageProvider } from "@components/LanguageContext";
import { ConfirmationProvider } from "@components/hooks/confirm";
import { SupportProvider } from "@/contexts/SupportContext";
import RequireAuth from "@/components/RequireAuth";
import RequireGuest from "@/components/RequireGuest";
import { useBaseUrlPopup } from "@/contexts/BaseUrlContext";
import {
  getDevApiBaseUrl,
  setDevApiBaseUrl,
  getDefaultApiBaseUrl,
} from "@utils/devConfig";
import AuthPage from "@/pages/Auth";
import VerifyOtpPage from "@/pages/VerifyOtp";
import { SplashScreen } from "@/components/SplashScreen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
function Router() {
  return (
    <Switch>
      <Route path="/login">
        <RequireGuest>
          <AuthPage mode="login" />
        </RequireGuest>
      </Route>
      <Route path="/register">
        <RequireGuest>
          <AuthPage mode="register" />
        </RequireGuest>
      </Route>
      <Route path="/verify-otp" component={VerifyOtpPage} />
      <Route path="*">
        <RequireAuth>
          <div className="min-h-screen bg-background"></div>
        </RequireAuth>
      </Route>
    </Switch>
  );
}
function SessionBootstrap({ children }: { children: React.ReactNode }) {
  // Auth state is now managed automatically by useAuth hook
  return <>{children}</>;
}
function LoadingSkeleton() {
  return (
    <div className="flex justify-center items-center min-h-screen animate-in duration-300 fade-in">
      <div className="flex flex-col items-center gap-4">
        <div className="bg-primary/20 rounded-2xl w-16 h-16 animate-pulse" />
        <div className="bg-muted rounded-lg w-48 h-8 animate-pulse" />
        <div className="bg-muted/50 rounded w-64 h-4 animate-pulse" />
      </div>
    </div>
  );
}
function BaseUrlDialog() {
  const { t } = useTranslation();
  const { showBaseUrlPopup, closeBaseUrlPopup } = useBaseUrlPopup();
  const [devApiUrl, setDevApiUrl] = useState(getDevApiBaseUrl());
  return (
    <Dialog open={showBaseUrlPopup} onOpenChange={closeBaseUrlPopup}>
      <DialogContent className="shadow-xl border border-muted max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold text-xl">
            {t("api_base_url_title")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {t("api_base_url_description")}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="api-url" className="font-medium">
                {t("api_base_url_label")}
              </Label>
              <Input
                id="api-url"
                value={devApiUrl}
                onChange={(e) => setDevApiUrl(e.target.value)}
                placeholder={t("profile_dev_api_url_example")}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              {t("api_base_url_changes_note")}
            </p>
          </div>
        </DialogBody>
        <div className="flex gap-3 p-6 pt-0">
          <Button
            onClick={() => {
              setDevApiBaseUrl(devApiUrl);
              closeBaseUrlPopup();
            }}
          >
            {t("save")}
          </Button>
          <Button
            onClick={() => {
              const defaultUrl = getDefaultApiBaseUrl();
              setDevApiUrl(defaultUrl);
              setDevApiBaseUrl(null);
            }}
          >
            {t("reset_to_default")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function AppContent() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Suspense fallback={<LoadingSkeleton />}>
        <SessionBootstrap>
          <Router />
        </SessionBootstrap>
      </Suspense>
    </WouterRouter>
  );
}
function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LanguageProvider>
            <ConfirmationProvider>
              <SupportProvider>
                {!showSplash && <AppContent />}
                <Toaster />
                {import.meta.env.DEV && <BaseUrlDialog />}
              </SupportProvider>
            </ConfirmationProvider>
          </LanguageProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </>
  );
}
export default App;
