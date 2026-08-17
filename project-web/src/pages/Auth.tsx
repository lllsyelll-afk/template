import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "wouter";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  useLogin,
  useRegister,
  useAuth,
  useGoogleLogin,
  useGoogleRegisterInfo,
  useFacebookLogin,
  useFacebookRegisterInfo,
  useLoginVerifyTotp,
} from "@/hooks/auth";
import { api } from "@utils/client";
import { useTranslation } from "../../node_modules/react-i18next";
import { toast } from "@/hooks/use-toast";
import { NameStep } from "./auth/NameStep";
import { PasswordStep } from "./auth/PasswordStep";
import { PhoneStep } from "./auth/PhoneStep";
import { OtpStep } from "./auth/OtpStep";
import { useBaseUrlPopup } from "@/contexts/BaseUrlContext";
import { LanguageSwitcher } from "@components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FacebookAuthButton } from "@/components/FacebookAuthButton";
import { ForgotPasswordDialog } from "@/components/ForgotPasswordDialog";
import { Eye, EyeOff } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@components/ui/input-otp";
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useLanguage } from "@components/LanguageContext";

function DevConfigButton({ openBaseUrlPopup }: { openBaseUrlPopup: () => void }) {
  const { t } = useTranslation();
  if (!import.meta.env.DEV) return null;
  return (
    <Button onClick={openBaseUrlPopup} className="mt-4">
      {t("api_base_url_title", { defaultValue: "Configure API URL" })}
    </Button>
  );
}

function GoogleAuthButton({
  mode: _mode,
  onSuccess,
  onError,
}: {
  mode: "login" | "register";
  onSuccess: (response: CredentialResponse) => void;
  onError: () => void;
}) {
  const { i18n } = useTranslation();

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null;

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          useOneTap={false}
          theme="filled_blue"
          size="large"
          shape="circle"
          locale={i18n.language}
          type="icon"
        />
      </div>
    </GoogleOAuthProvider>
  );
}

type AuthMode = "login" | "register";
interface AuthPageProps {
  mode: AuthMode;
}
interface LoginFormValues {
  identifier: string;
  password: string;
}
interface RegisterData {
  name: string;
  phone: string;
  password: string;
  email?: string;
  photo?: string;
}

// Helper to get redirect param from URL
function useRedirectParam(): string | null {
  const [location] = useLocation();
  const search = location.split("?")[1];
  const params = new URLSearchParams(search || "");
  return params.get("redirect");
}

export default function AuthPage({ mode }: AuthPageProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const { status, error, isAuthenticated } = useAuth();
  const redirectTo = useRedirectParam();
  const { openBaseUrlPopup } = useBaseUrlPopup();
  const login = useLogin();
  const googleLogin = useGoogleLogin();
  const googleRegisterInfo = useGoogleRegisterInfo();
  const facebookLogin = useFacebookLogin();
  const facebookRegisterInfo = useFacebookRegisterInfo();
  const register = useRegister();
  const [registerStep, setRegisterStep] = useState(0);
  const [registerData, setRegisterData] = useState<RegisterData>({
    name: "",
    phone: "",
    password: "",
  });
  const [googleRegisterData, setGoogleRegisterData] = useState<{
    googleId: string;
    email: string;
    name?: string;
    picture?: string;
  } | null>(null);
  const [facebookRegisterData, setFacebookRegisterData] = useState<{
    facebookId: string;
    email?: string;
    name?: string;
    picture?: string;
  } | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [totpChallengeToken, setTotpChallengeToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpError, setTotpError] = useState<string | null>(null);
  const loginVerifyTotp = useLoginVerifyTotp();
  const loginForm = useForm<LoginFormValues>();
  const {
    register: loginRegister,
    handleSubmit: loginSubmit,
    formState: loginFormState,
  } = loginForm;
  const onLoginSubmit = loginSubmit(async (values) => {
    try {
      const result = await login.mutateAsync(values);
      if (result && "requiresTotp" in result && result.requiresTotp) {
        setTotpChallengeToken(result.challengeToken);
      }
      // Navigation handled by useEffect with redirectTo
    } catch (error) {
      console.error("Login failed:", error);
    }
  });

  const handleTotpVerify = async () => {
    if (!totpChallengeToken || totpCode.length !== 6) return;
    setTotpError(null);
    try {
      await loginVerifyTotp.mutateAsync({
        challengeToken: totpChallengeToken,
        code: totpCode,
      });
      setTotpChallengeToken(null);
      setTotpCode("");
      // Navigation handled by useEffect with redirectTo
    } catch (err) {
      setTotpError(err instanceof Error ? err.message : t("profile_2fa_verify_failed"));
    }
  };

  const handleTotpCancel = () => {
    setTotpChallengeToken(null);
    setTotpCode("");
    setTotpError(null);
  };

  const isLoading = login.isPending || status === "loading";

  // Redirect authenticated users to redirect param or /
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo || "/");
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const shownErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (error && shownErrorRef.current !== error) {
      shownErrorRef.current = error;
      toast({
        title: t("auth_error"),
        description: error,
      });
    }
  }, [error]);
  const handleNameSubmit = (name: string) => {
    setRegisterData((prev) => ({
      ...prev,
      name,
      email: googleRegisterData?.email ?? prev.email,
      photo: googleRegisterData?.picture ?? prev.photo,
    }));
    setRegisterStep(1);
  };

  const handlePasswordSubmit = (password: string) => {
    setRegisterData((prev) => ({ ...prev, password }));
    setRegisterStep(2);
  };
  const handlePhoneSubmit = async (phone: string) => {
    const updatedData = { ...registerData, phone };
    setRegisterData(updatedData);
    try {
      const result = await register.mutateAsync({
        name: updatedData.name,
        phone: updatedData.phone,
        password: updatedData.password,
        email: updatedData.email,
        photo: updatedData.photo,
        googleId: googleRegisterData?.googleId,
        facebookId: facebookRegisterData?.facebookId,
      });
      const otp = result.otp?.code;
      if (otp) setDevOtpCode(otp);
      setRegisterStep(3);
    } catch (err) {
      toast({
        title: t("auth_error"),
        description: err instanceof Error ? err.message : t("auth_register_failed", { defaultValue: "Registration failed" }),
      });
    }
  };
  const handleOtpSubmit = async () => {
    setIsVerifyingOtp(true);
    try {
      await api.post("/auth/verify-otp", {
        identifier: registerData.phone,
        code: otpCode,
        purpose: "register",
      });
      await login.mutateAsync({
        identifier: registerData.phone,
        password: registerData.password,
      });
      // Navigation handled by useEffect with redirectTo
    } catch {
      toast({
        title: t("auth_otp_error_title"),
        description: t("auth_otp_error_desc"),
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast({
        title: t("auth_error"),
        description: t("auth_google_error"),
      });
      return;
    }

    if (mode === "login") {
      try {
        const result = await googleLogin.mutateAsync(credentialResponse.credential);
        if (result && "requiresTotp" in result && result.requiresTotp) {
          setTotpChallengeToken(result.challengeToken);
        }
        // Navigation handled by useEffect with redirectTo
      } catch {
        // Error is already handled by the mutation
      }
    } else {
      // Register mode
      try {
        const info = await googleRegisterInfo.mutateAsync(
          credentialResponse.credential,
        );
        setGoogleRegisterData(info);
        setRegisterData((prev) => ({
          ...prev,
          name: info.name ?? prev.name,
          email: info.email,
        }));
        // User stays on the name step to overwrite the Google display name
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "google_register_failed";
        if (errorMessage === "email_already_used") {
          toast({
            title: t("auth_error"),
            description: t("auth_google_email_used", {
              defaultValue: "This email is already registered. Please log in.",
            }),
          });
        }
        // Other errors are handled by the default error display
      }
    }
  };

  const handleGoogleError = () => {
    toast({
      title: t("auth_error"),
      description: t("auth_google_error"),
    });
  };

  const handleFacebookSuccess = async (accessToken: string) => {
    if (mode === "login") {
      try {
        const result = await facebookLogin.mutateAsync(accessToken);
        if (result && "requiresTotp" in result && result.requiresTotp) {
          setTotpChallengeToken(result.challengeToken);
        }
        // Navigation handled by useEffect with redirectTo
      } catch {
        // Handled by mutation
      }
    } else {
      // Register mode
      try {
        const info = await facebookRegisterInfo.mutateAsync(accessToken);
        setFacebookRegisterData(info);
        setRegisterData((prev) => ({
          ...prev,
          name: info.name ?? prev.name,
          email: info.email ?? prev.email,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "facebook_register_failed";
        if (errorMessage === "email_already_used") {
          toast({
            title: t("auth_error"),
            description: t("auth_facebook_email_used", {
              defaultValue: "This Facebook email is already registered. Please log in.",
            }),
          });
        }
      }
    }
  };

  const handleFacebookError = () => {
    toast({
      title: t("auth_error"),
      description: t("auth_facebook_error", {
        defaultValue: "Failed to authenticate with Facebook. Please try again.",
      }),
    });
  };

  if (mode === "register") {
    const stepContent = {
      0: (
        <>
          <h1 className="mb-1 font-bold text-2xl">{t("auth_register")}</h1>
          <p className="mb-6 text-muted-foreground text-sm">
            {t("auth_create_account_desc", { defaultValue: "Create your account to get started" })}
          </p>
          <div className="flex flex-col gap-4 w-full max-w-md">
            <NameStep
              onSubmit={handleNameSubmit}
              defaultName={googleRegisterData?.name || facebookRegisterData?.name}
            />
            {(import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_FACEBOOK_APP_ID) && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      {t("auth_or")}
                    </span>
                  </div>
                </div>
                <div className="flex justify-center items-center gap-3">
                  <GoogleAuthButton
                    mode="register"
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                  />
                  <FacebookAuthButton
                    mode="register"
                    onSuccess={handleFacebookSuccess}
                    onError={handleFacebookError}
                  />
                </div>
              </>
            )}
          </div>
        </>
      ),
      1: (
        <PasswordStep
          onSubmit={handlePasswordSubmit}
          onBack={() => setRegisterStep(0)}
        />
      ),
      2: (
        <PhoneStep
          onSubmit={handlePhoneSubmit}
          onBack={() => setRegisterStep(1)}
          isLoading={register.isPending}
        />
      ),
      3: (
        <OtpStep
          phone={registerData.phone}
          otpCode={otpCode}
          setOtpCode={setOtpCode}
          onSubmit={handleOtpSubmit}
          onBack={() => setRegisterStep(2)}
          isLoading={isVerifyingOtp}
          devOtpCode={devOtpCode}
        />
      ),
    };

    return (
      <div className="absolute inset-0 flex flex-col justify-center items-center px-6">
        <div className="top-4 right-4 z-50 absolute flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle variant="icon" />
        </div>
        {stepContent[registerStep as keyof typeof stepContent]}
        <DevConfigButton openBaseUrlPopup={openBaseUrlPopup} />
      </div>
    );
  }
  return (
    <>
      <div className="absolute inset-0 flex flex-col justify-center items-center px-6">
        <div className="top-4 right-4 z-50 absolute flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle variant="icon" />
        </div>
        {totpChallengeToken ? (
          <div className="flex flex-col gap-4 w-full max-w-md items-center">
            <h1 className="mb-1 font-bold text-2xl">{t("login_totp_title")}</h1>
            <p className="mb-6 text-muted-foreground text-sm text-center">
              {t("login_totp_desc")}
            </p>
            <InputOTP
              maxLength={6}
              value={totpCode}
              onChange={(val) => setTotpCode(val)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            {totpError && (
              <p className="text-red-400 text-sm text-center">{totpError}</p>
            )}
            <div className="flex gap-2 w-full">
              <Button
                className="flex-1 bg-muted text-foreground border-border"
                onClick={handleTotpCancel}
              >
                {t("back")}
              </Button>
              <Button
                className="flex-1"
                onClick={handleTotpVerify}
                disabled={totpCode.length !== 6 || loginVerifyTotp.isPending}
              >
                {loginVerifyTotp.isPending ? t("verifying") : t("login_totp_verify")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="mb-1 font-bold text-2xl">{t("auth_welcome_back")}</h1>
            <p className="mb-6 text-muted-foreground text-sm">
              {t("auth_sign_in_desc")}
            </p>
            <div className="flex flex-col gap-4 w-full max-w-md">
              <form onSubmit={onLoginSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="identifier">{t("auth_phone_or_email")}</Label>
                  <Input
                    id="identifier"
                    placeholder={t("auth_enter_phone_or_email")}
                    autoComplete="username"
                    {...loginRegister("identifier", { required: true })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">{t("auth_password")}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder={t("auth_enter_password")}
                      autoComplete="current-password"
                      {...loginRegister("password", { required: true })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className={`absolute ${language === "ar" ? "left-3" : "right-3"} top-1/2 transform -translate-y-1/2 text-muted-foreground`}
                    >
                      {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-primary text-sm text-right hover:underline"
                  >
                    {t("auth_forgot_password", { defaultValue: "Forgot password?" })}
                  </button>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || loginFormState.isSubmitting}
                >
                  {isLoading ? t("auth_signing_in") : t("auth_sign_in")}
                </Button>
              </form>

              {/* Social Logins */}
              {(import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_FACEBOOK_APP_ID) && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        {t("auth_or_continue_with", { defaultValue: "Or continue with" })}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-center items-center gap-3">
                    <GoogleAuthButton
                      mode="login"
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                    />
                    <FacebookAuthButton
                      mode="login"
                      onSuccess={handleFacebookSuccess}
                      onError={handleFacebookError}
                    />
                  </div>
                </>
              )}

              <p className="text-muted-foreground text-sm text-center">
                {t("auth_no_account")}
                <Link href="/register" className="mx-2 font-semibold underline">
                  {t("auth_register")}
                </Link>
              </p>
            </div>
            <DevConfigButton openBaseUrlPopup={openBaseUrlPopup} />
          </>
        )}
      </div>
      <ForgotPasswordDialog
        open={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </>
  );
}
