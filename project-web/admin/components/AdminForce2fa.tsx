import React, { useState, useEffect } from "react";
import { useTranslation } from "../../node_modules/react-i18next";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@components/ui/button";
import { Card, CardTitle, CardContent } from "@components/ui/card";
import { Alert, AlertDescription } from "@components/ui/alert";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@components/ui/input-otp";
import { Shield, ArrowRight } from "lucide-react";

interface AdminForce2faProps {
  setup2fa: () => Promise<void>;
  confirm2fa: (code: string) => Promise<void>;
  setupData: { otpauthUrl: string; secret: string } | null;
  loading: boolean;
  error?: string | null;
}

export const AdminForce2fa: React.FC<AdminForce2faProps> = ({
  setup2fa,
  confirm2fa,
  setupData,
  loading,
  error,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<"qr" | "verify">("qr");
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!setupData) {
      setup2fa();
    }
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    await confirm2fa(code);
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
              {t("admin_2fa_required_title")}
            </CardTitle>
            <p className="text-primary-foreground/80 text-sm">
              {t("admin_2fa_required_desc")}
            </p>
          </div>
          <CardContent className="p-6">
            {step === "qr" && (
              <div className="space-y-5">
                <p className="text-muted-foreground text-sm text-center">
                  {t("admin_2fa_scan_qr")}
                </p>
                {loading && !setupData && (
                  <div className="flex justify-center py-8">
                    <div className="border-2 border-primary border-t-transparent rounded-full w-8 h-8 animate-spin" />
                  </div>
                )}
                {setupData && (
                  <>
                    <div className="flex justify-center">
                      <div className="bg-white p-3 rounded-lg">
                        <QRCodeSVG value={setupData.otpauthUrl} size={200} />
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">
                        {t("admin_2fa_enter_code_manually")}
                      </p>
                      <p className="font-mono text-sm break-all bg-muted p-2 rounded">
                        {setupData.secret}
                      </p>
                    </div>
                    <Button
                      className="w-full h-11 font-medium"
                      onClick={() => setStep("verify")}
                    >
                      {t("admin_2fa_next")}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            )}

            {step === "verify" && (
              <form onSubmit={handleVerify} className="space-y-5">
                <p className="text-muted-foreground text-sm text-center">
                  {t("admin_2fa_verify_desc")}
                </p>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={(val) => setCode(val)}
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
                    onClick={() => setStep("qr")}
                    disabled={loading}
                  >
                    {t("back")}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 font-medium"
                    disabled={code.length !== 6 || loading}
                  >
                    {loading ? (
                      <div className="mr-2 border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin" />
                    ) : (
                      <Shield className="mr-2 w-4 h-4" />
                    )}
                    {t("admin_2fa_verify")}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
