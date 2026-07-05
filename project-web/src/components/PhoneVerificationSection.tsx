import { useState, useEffect } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { useTranslation } from "../../node_modules/react-i18next";
import type { User } from "app-types";

interface PhoneVerificationSectionProps {
  user: User | null;
  onResendOtp: () => Promise<{ otp?: { code?: string } }>;
  onVerify: (data: {
    identifier: string;
    code: string;
    purpose?: "register" | "login";
  }) => Promise<any>;
}

export function PhoneVerificationSection({
  user,
  onResendOtp,
  onVerify,
}: PhoneVerificationSectionProps) {
  const { t } = useTranslation();
  const [otpCode, setOtpCode] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);

  useEffect(() => {
    if (devOtpCode && !otpCode) {
      setOtpCode(devOtpCode);
    }
  }, [devOtpCode, otpCode]);

  if (user?.verified !== false) return null;

  return (
    <div className="flex flex-col gap-2">
      {!showOtpInput ? (
        <Button
          type="button"
          onClick={async () => {
            setResendingOtp(true);
            setOtpError(null);
            setDevOtpCode(null);
            try {
              const result = await onResendOtp();
              const otp = result.otp?.code;
              if (otp) setDevOtpCode(otp);
              setShowOtpInput(true);
            } catch {
              setOtpError(t("profile_send_failed"));
            } finally {
              setResendingOtp(false);
            }
          }}
          disabled={resendingOtp}
        >
          {resendingOtp
            ? t("profile_sending")
            : t("profile_verify_phone")}
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-xs">
            {t("profile_enter_otp_code")}
          </p>
          <Input
            type="text"
            maxLength={6}
            placeholder={t("profile_otp_placeholder")}
            value={otpCode}
            onChange={(e) =>
              setOtpCode(e.target.value.replace(/\D/g, ""))
            }
            className="text-center tracking-widest"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              className="flex-1"
              onClick={() => {
                setShowOtpInput(false);
                setOtpCode("");
                setOtpError(null);
                setDevOtpCode(null);
              }}
            >
              {t("profile_cancel")}
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={otpCode.length !== 6 || verifyingOtp}
              onClick={async () => {
                if (!user) return;
                setVerifyingOtp(true);
                setOtpError(null);
                try {
                  await onVerify({
                    identifier: user.phone,
                    code: otpCode,
                    purpose: "register",
                  });
                  setShowOtpInput(false);
                  setOtpCode("");
                  setDevOtpCode(null);
                } catch {
                  setOtpError(t("profile_invalid_otp"));
                } finally {
                  setVerifyingOtp(false);
                }
              }}
            >
              {verifyingOtp
                ? t("profile_verifying")
                : t("profile_verify")}
            </Button>
          </div>
        </div>
      )}
      {otpError && (
        <p className="text-red-400 text-sm" role="alert">
          {otpError}
        </p>
      )}
    </div>
  );
}
