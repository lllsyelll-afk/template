import { useEffect } from "react";
import { useTranslation } from "../../node_modules/react-i18next";
import BottomSheet from "@components/BottomSheet";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import type { User } from "app-types";

interface EmailChangeBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  newEmail: string;
  onNewEmailChange: (email: string) => void;
  showOtpInput: boolean;
  onShowOtpInputChange: (show: boolean) => void;
  emailOtpCode: string;
  onEmailOtpCodeChange: (code: string) => void;
  sendingEmailOtp: boolean;
  verifyingEmailOtp: boolean;
  emailOtpError: string | null;
  devEmailOtpCode: string | null;
  onDevEmailOtpCodeChange: (code: string | null) => void;
  emailChangeError: string | null;
  requestEmailChange: (data: { email: string }) => Promise<any>;
  verifyEmailChange: (data: { email: string; code: string }) => Promise<void>;
  reset: (values: any) => void;
  watch: (field: string) => any;
}

export function EmailChangeBottomSheet({
  open,
  onOpenChange,
  user,
  newEmail,
  onNewEmailChange,
  showOtpInput,
  onShowOtpInputChange,
  emailOtpCode,
  onEmailOtpCodeChange,
  sendingEmailOtp,
  verifyingEmailOtp,
  emailOtpError,
  devEmailOtpCode,
  onDevEmailOtpCodeChange,
  emailChangeError,
  requestEmailChange,
  verifyEmailChange,
  reset,
  watch,
}: EmailChangeBottomSheetProps) {
  const { t } = useTranslation();

  // Auto-fill email OTP code from server response
  useEffect(() => {
    if (devEmailOtpCode && !emailOtpCode) {
      onEmailOtpCodeChange(devEmailOtpCode);
    }
  }, [devEmailOtpCode, emailOtpCode, onEmailOtpCodeChange]);

  const handleSendOtp = async () => {
    const emailToUse = user?.email ? newEmail : watch("email");
    if (!emailToUse || !emailToUse.includes("@")) {
      return;
    }

    try {
      const result = await requestEmailChange({ email: emailToUse });
      const otp = result.otp?.code;
      if (otp) onDevEmailOtpCodeChange(otp);
      onNewEmailChange(emailToUse);
      onShowOtpInputChange(true);
    } catch (e) {
      // Error handling is done by parent component
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await verifyEmailChange({
        email: newEmail,
        code: emailOtpCode,
      });
      onOpenChange(false);
      onShowOtpInputChange(false);
      onEmailOtpCodeChange("");
      onDevEmailOtpCodeChange(null);
      reset({
        name: user?.name || "",
        photo: user?.photo || "",
        email: newEmail,
      });
    } catch (e) {
      // Error handling is done by parent component
    }
  };


  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("profile_email_change_title")}
    >
      <div className="flex flex-col gap-4 p-4">
        {!showOtpInput ? (
          <>
            <p className="text-muted-foreground text-sm">
              {user?.email
                ? t("profile_email_change_desc", { email: newEmail || user.email })
                : t("profile_email_set_desc")}
            </p>
            {user?.email && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="newEmail">{t("profile_new_email")}</Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder={t("profile_enter_email")}
                  value={newEmail}
                  onChange={(e) => onNewEmailChange(e.target.value)}
                />
              </div>
            )}
            {!user?.email && (
              <p className="text-sm">
                {t("profile_email_will_send_code", { email: newEmail })}
              </p>
            )}
            {emailOtpError && (
              <p className="text-red-400 text-sm" role="alert">
                {emailOtpError}
              </p>
            )}
            {emailChangeError && !user?.email && (
              <p className="text-red-400 text-sm" role="alert">
                {emailChangeError}
              </p>
            )}
            <Button
              onClick={handleSendOtp}
              disabled={sendingEmailOtp || (!user?.email && !watch("email"))}
            >
              {sendingEmailOtp
                ? t("profile_email_sending")
                : t("profile_email_send_code")}
            </Button>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xs">
              {t("profile_email_code_sent", { email: newEmail })}
            </p>
            <Input
              type="text"
              maxLength={6}
              placeholder={t("profile_otp_placeholder")}
              value={emailOtpCode}
              onChange={(e) =>
                onEmailOtpCodeChange(e.target.value.replace(/\D/g, ""))
              }
              className="text-center tracking-widest"
            />
            {emailOtpError && (
              <p className="text-red-400 text-sm" role="alert">
                {emailOtpError}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                className="flex-1"
                onClick={() => {
                  onShowOtpInputChange(false);
                  onEmailOtpCodeChange("");
                  onDevEmailOtpCodeChange(null);
                }}
              >
                {t("profile_cancel")}
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={emailOtpCode.length !== 6 || verifyingEmailOtp}
                onClick={handleVerifyOtp}
              >
                {verifyingEmailOtp
                  ? t("profile_verifying")
                  : t("profile_verify")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
