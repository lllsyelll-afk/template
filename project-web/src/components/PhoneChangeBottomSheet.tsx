import { useEffect } from "react";
import { useTranslation } from "../../node_modules/react-i18next";
import BottomSheet from "@components/BottomSheet";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import type { User } from "app-types";

interface PhoneChangeBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  newPhone: string;
  onNewPhoneChange: (phone: string) => void;
  showOtpInput: boolean;
  onShowOtpInputChange: (show: boolean) => void;
  phoneOtpCode: string;
  onPhoneOtpCodeChange: (code: string) => void;
  sendingPhoneOtp: boolean;
  verifyingPhoneOtp: boolean;
  phoneOtpError: string | null;
  devPhoneOtpCode: string | null;
  onDevPhoneOtpCodeChange: (code: string | null) => void;
  phoneChangeError: string | null;
  requestPhoneChange: (data: { phone: string }) => Promise<any>;
  verifyPhoneChange: (data: { phone: string; code: string }) => Promise<void>;
}

export function PhoneChangeBottomSheet({
  open,
  onOpenChange,
  user,
  newPhone,
  onNewPhoneChange,
  showOtpInput,
  onShowOtpInputChange,
  phoneOtpCode,
  onPhoneOtpCodeChange,
  sendingPhoneOtp,
  verifyingPhoneOtp,
  phoneOtpError,
  devPhoneOtpCode,
  onDevPhoneOtpCodeChange,
  phoneChangeError,
  requestPhoneChange,
  verifyPhoneChange,
}: PhoneChangeBottomSheetProps) {
  const { t } = useTranslation();

  // Auto-fill phone OTP code from server response
  useEffect(() => {
    if (devPhoneOtpCode && !phoneOtpCode) {
      onPhoneOtpCodeChange(devPhoneOtpCode);
    }
  }, [devPhoneOtpCode, phoneOtpCode, onPhoneOtpCodeChange]);

  const handleSendOtp = async () => {
    const phoneToUse = newPhone;
    if (!phoneToUse || phoneToUse.length < 4) {
      return;
    }

    try {
      const result = await requestPhoneChange({ phone: phoneToUse });
      const otp = result.otp?.code;
      if (otp) onDevPhoneOtpCodeChange(otp);
      onNewPhoneChange(phoneToUse);
      onShowOtpInputChange(true);
    } catch (e) {
      // Error handling is done by parent component
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await verifyPhoneChange({
        phone: newPhone,
        code: phoneOtpCode,
      });
      onOpenChange(false);
      onShowOtpInputChange(false);
      onPhoneOtpCodeChange("");
      onDevPhoneOtpCodeChange(null);
    } catch (e) {
      // Error handling is done by parent component
    }
  };


  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("profile_phone_change_title")}
    >
      <div className="flex flex-col gap-4 p-4">
        {!showOtpInput ? (
          <>
            <p className="text-muted-foreground text-sm">
              {user?.phone
                ? t("profile_phone_change_desc", { phone: newPhone || user.phone })
                : t("profile_phone_set_desc")}
            </p>
            {user?.phone && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="newPhone">{t("profile_new_phone")}</Label>
                <Input
                  id="newPhone"
                  type="tel"
                  placeholder={t("profile_enter_phone")}
                  value={newPhone}
                  onChange={(e) => onNewPhoneChange(e.target.value)}
                />
              </div>
            )}
            {!user?.phone && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="setPhone">{t("profile_enter_phone")}</Label>
                <Input
                  id="setPhone"
                  type="tel"
                  placeholder={t("profile_enter_phone")}
                  value={newPhone}
                  onChange={(e) => onNewPhoneChange(e.target.value)}
                />
              </div>
            )}
            {phoneOtpError && (
              <p className="text-red-400 text-sm" role="alert">
                {phoneOtpError}
              </p>
            )}
            {phoneChangeError && !user?.phone && (
              <p className="text-red-400 text-sm" role="alert">
                {phoneChangeError}
              </p>
            )}
            <Button
              onClick={handleSendOtp}
              disabled={sendingPhoneOtp || !newPhone}
            >
              {sendingPhoneOtp
                ? t("profile_phone_sending")
                : t("profile_phone_send_code")}
            </Button>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xs">
              {t("profile_phone_code_sent", { phone: newPhone })}
            </p>
            <Input
              type="text"
              maxLength={6}
              placeholder={t("profile_otp_placeholder")}
              value={phoneOtpCode}
              onChange={(e) =>
                onPhoneOtpCodeChange(e.target.value.replace(/\D/g, ""))
              }
              className="text-center tracking-widest"
            />
            {phoneOtpError && (
              <p className="text-red-400 text-sm" role="alert">
                {phoneOtpError}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                className="flex-1"
                onClick={() => {
                  onShowOtpInputChange(false);
                  onPhoneOtpCodeChange("");
                  onDevPhoneOtpCodeChange(null);
                }}
              >
                {t("profile_cancel")}
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={phoneOtpCode.length !== 6 || verifyingPhoneOtp}
                onClick={handleVerifyOtp}
              >
                {verifyingPhoneOtp
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
