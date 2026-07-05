import { useEffect } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { useTranslation } from "../../../node_modules/react-i18next";

interface OtpStepProps {
  phone: string;
  otpCode: string;
  setOtpCode: (code: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
  devOtpCode: string | null;
}

export function OtpStep({
  phone,
  otpCode,
  setOtpCode,
  onSubmit,
  onBack,
  isLoading,
  devOtpCode,
}: OtpStepProps) {
  const { t } = useTranslation();
  useEffect(() => {
    if (devOtpCode && !otpCode) {
      setOtpCode(devOtpCode);
    }
  }, [devOtpCode, otpCode, setOtpCode]);
  return (
    <>
      <h1 className="mb-1 font-bold text-2xl">{t("auth_enter_code")}</h1>
      <p className="mb-6 text-muted-foreground text-sm">
        {t("auth_enter_code_desc", { phone })}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (otpCode.length === 6) onSubmit();
        }}
        className="flex flex-col gap-4 w-full max-w-md"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="otp">{t("auth_verification_code")}</Label>
          <Input
            id="otp"
            placeholder={t("auth_otp_placeholder")}
            value={otpCode}
            onChange={(e) =>
              setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            autoFocus
            maxLength={6}
          />
        </div>
        <Button type="submit" disabled={otpCode.length !== 6 || isLoading}>
          {isLoading ? t("auth_verifying") : t("auth_verify")}
        </Button>
        <Button type="button" onClick={onBack}>
          {t("auth_back")}
        </Button>
      </form>
    </>
  );
}
