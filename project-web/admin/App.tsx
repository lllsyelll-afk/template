// Removed React import
// Removed wouter imports
import { useAdminAuth } from "./hooks/useAdminAuth";


import { AdminLogin } from "./components/AdminLogin";
import { AdminForce2fa } from "./components/AdminForce2fa";
import { ConfirmationProvider } from "@components/hooks/confirm";
import { LanguageProvider } from "@components/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";


export const App = () => {
  const {
    isAuthenticated,
    loading: authLoading,
    login,
    error: authError,
    requiresTotp,
    verifyTotp,
    cancelTotp,
    needs2faSetup,
    setup2fa,
    confirm2fa,
    setupData,
    setupLoading,
  } = useAdminAuth();

  // Show 2FA setup if admin doesn't have 2FA enabled
  if (needs2faSetup) {
    return (
      <ThemeProvider>
        <LanguageProvider>
          <AdminForce2fa
            setup2fa={setup2fa}
            confirm2fa={confirm2fa}
            setupData={setupData}
            loading={setupLoading}
            error={authError ?? null}
          />
        </LanguageProvider>
      </ThemeProvider>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <LanguageProvider>
          <ConfirmationProvider>
            <AdminLogin
              onLogin={login}
              loading={authLoading}
              error={authError ?? null}
              requiresTotp={requiresTotp}
              onVerifyTotp={verifyTotp}
              onCancelTotp={cancelTotp}
            />
          </ConfirmationProvider>
        </LanguageProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <ConfirmationProvider>
          <div className="min-h-screen bg-background"></div>
        </ConfirmationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};
