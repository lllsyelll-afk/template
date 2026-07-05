import React, { useState } from "react";
import { useTranslation } from "../../node_modules/react-i18next";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Card, CardTitle, CardContent } from "@components/ui/card";
import { Alert, AlertDescription } from "@components/ui/alert";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@components/ui/input-otp";
import { Shield, LogIn, ArrowLeft } from "lucide-react";

interface AdminLoginProps {
  onLogin: (identifier: string, password: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  requiresTotp?: boolean;
  onVerifyTotp?: (code: string) => Promise<void>;
  onCancelTotp?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLogin,
  loading,
  error,
  requiresTotp,
  onVerifyTotp,
  onCancelTotp,
}) => {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    await onLogin(identifier, password);
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6 || !onVerifyTotp) return;
    await onVerifyTotp(totpCode);
  };

  return (
    <div className="flex justify-center items-center bg-background p-4 min-h-screen">
      <div className="w-full max-w-md">
        <Card className="overflow-hidden">
          <div className="bg-primary p-6 text-center">
            <div className="flex justify-center items-center bg-primary-foreground/20 mx-auto mb-4 rounded-full w-20 h-20">
              <Shield className="w-10 h-10 text-primary-foreground" />
            </div>
            <CardTitle className="mb-2 font-bold text-primary-foreground text-2xl">
              {requiresTotp ? t("admin_login_totp_title") : t("admin_login_title")}
            </CardTitle>
            <p className="text-primary-foreground/80 text-sm">
              {requiresTotp ? t("admin_login_totp_desc") : t("admin_login_subtitle")}
            </p>
          </div>
          <CardContent className="p-6">
            {requiresTotp ? (
              <form onSubmit={handleTotpSubmit} className="space-y-5">
                <div className="flex justify-center">
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
                </div>
                {error && (
                  <Alert className="bg-destructive/10 border-destructive/20">
                    <AlertDescription className="text-destructive">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="flex-1 bg-muted text-foreground border-border"
                    onClick={onCancelTotp}
                    disabled={loading}
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    {t("back")}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 font-medium"
                    disabled={totpCode.length !== 6 || loading}
                  >
                    {loading ? (
                      <div className="mr-2 border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin" />
                    ) : (
                      <Shield className="mr-2 w-4 h-4" />
                    )}
                    {t("admin_login_totp_verify")}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="identifier" className="font-semibold text-sm">
                    {t("admin_login_email")}
                  </label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder={t("admin_login_email")}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={loading}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="font-semibold text-sm">
                    {t("admin_login_password")}
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("admin_login_password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="h-11"
                  />
                </div>
                {error && (
                  <Alert className="bg-destructive/10 border-destructive/20">
                    <AlertDescription className="text-destructive">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                <Button
                  type="submit"
                  className="w-full h-11 font-medium"
                  disabled={loading || !identifier || !password}
                >
                  {loading ? (
                    <>
                      <div className="mr-2 border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin" />
                      {t("admin_dashboard_loading")}...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 w-4 h-4" />
                      {t("admin_login_button")}
                    </>
                  )}
                </Button>
              </form>
            )}
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-2 text-center">
                <div className="bg-muted rounded-full w-2 h-2 animate-pulse" />
                <p className="text-muted-foreground text-xs">
                  {t("admin_login_authorized_only")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="mt-4 text-center">
          <p className="text-muted-foreground text-xs">
            {t("admin_login_secure_auth")}
          </p>
        </div>
      </div>
    </div>
  );
};
