import { useState, useEffect } from "react";
import { useTranslation } from "../../node_modules/react-i18next";
import { QRCodeSVG } from "qrcode.react";
import BottomSheet from "@components/BottomSheet";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@components/ui/input-otp";
import { useSetup2fa, useVerify2fa } from "@/hooks/auth";

interface TwoFactorSetupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnabled: () => void;
}

export function TwoFactorSetupSheet({ open, onOpenChange, onEnabled }: TwoFactorSetupSheetProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<"qr" | "verify">("qr");
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const setupMutation = useSetup2fa();
  const verifyMutation = useVerify2fa();

  useEffect(() => {
    if (open && !otpauthUrl) {
      setupMutation.mutate(undefined, {
        onSuccess: (data) => {
          setOtpauthUrl(data.otpauthUrl);
          setSecret(data.secret);
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : t("profile_2fa_setup_failed"));
        },
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setStep("qr");
      setOtpauthUrl(null);
      setSecret(null);
      setCode("");
      setError(null);
    }
  }, [open]);

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setError(null);
    try {
      await verifyMutation.mutateAsync({ code });
      onOpenChange(false);
      onEnabled();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profile_2fa_verify_failed"));
    }
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t("profile_2fa_title")}>
      <div className="p-4 flex flex-col gap-4">
        {step === "qr" && (
          <>
            <p className="text-sm text-muted-foreground">
              {t("profile_2fa_scan_qr_desc")}
            </p>
            {setupMutation.isPending && (
              <div className="flex justify-center py-8">
                <p className="text-muted-foreground text-sm">{t("loading")}</p>
              </div>
            )}
            {otpauthUrl && (
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white p-3 rounded-lg">
                  <QRCodeSVG value={otpauthUrl} size={200} />
                </div>
                {secret && (
                  <div className="w-full">
                    <Label className="text-xs text-muted-foreground">
                      {t("profile_2fa_enter_code_manually")}
                    </Label>
                    <p className="font-mono text-sm break-all bg-muted p-2 rounded mt-1">
                      {secret}
                    </p>
                  </div>
                )}
                <Button className="w-full" onClick={() => setStep("verify")}>
                  {t("profile_2fa_next")}
                </Button>
              </div>
            )}
          </>
        )}

        {step === "verify" && (
          <>
            <p className="text-sm text-muted-foreground">
              {t("profile_2fa_verify_desc")}
            </p>
            <div className="flex flex-col items-center gap-4">
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
              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
              <div className="flex gap-2 w-full">
                <Button
                  className="flex-1 bg-muted text-foreground border-border"
                  onClick={() => setStep("qr")}
                >
                  {t("back")}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleVerify}
                  disabled={code.length !== 6 || verifyMutation.isPending}
                >
                  {verifyMutation.isPending ? t("verifying") : t("profile_2fa_verify")}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
