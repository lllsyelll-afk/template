import { useState } from "react";
import { PhoneChangeBottomSheet } from "@/components/PhoneChangeBottomSheet";
import { ApiError } from "@utils/client";
import { useTranslation } from "../../node_modules/react-i18next";
import type { User } from "app-types";

interface PhoneChangeWrapperProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestPhoneChange: (data: { phone: string }) => Promise<any>;
  verifyPhoneChange: (data: { phone: string; code: string }) => Promise<any>;
}

export function PhoneChangeWrapper({
  user,
  open,
  onOpenChange,
  requestPhoneChange,
  verifyPhoneChange,
}: PhoneChangeWrapperProps) {
  const { t } = useTranslation();
  const [newPhone, setNewPhone] = useState("");
  const [phoneOtpCode, setPhoneOtpCode] = useState("");
  const [showPhoneOtpInput, setShowPhoneOtpInput] = useState(false);
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [phoneOtpError, setPhoneOtpError] = useState<string | null>(null);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);
  const [devPhoneOtpCode, setDevPhoneOtpCode] = useState<string | null>(null);
  const [phoneChangeError, setPhoneChangeError] = useState<string | null>(null);

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      setNewPhone("");
      setPhoneOtpCode("");
      setShowPhoneOtpInput(false);
      setPhoneOtpError(null);
      setDevPhoneOtpCode(null);
      setPhoneChangeError(null);
    }
  };

  return (
    <PhoneChangeBottomSheet
      open={open}
      onOpenChange={handleOpenChange}
      user={user}
      newPhone={newPhone}
      onNewPhoneChange={setNewPhone}
      showOtpInput={showPhoneOtpInput}
      onShowOtpInputChange={setShowPhoneOtpInput}
      phoneOtpCode={phoneOtpCode}
      onPhoneOtpCodeChange={setPhoneOtpCode}
      sendingPhoneOtp={sendingPhoneOtp}
      verifyingPhoneOtp={verifyingPhoneOtp}
      phoneOtpError={phoneOtpError}
      devPhoneOtpCode={devPhoneOtpCode}
      onDevPhoneOtpCodeChange={setDevPhoneOtpCode}
      phoneChangeError={phoneChangeError}
      requestPhoneChange={async (data) => {
        setSendingPhoneOtp(true);
        setPhoneOtpError(null);
        setDevPhoneOtpCode(null);
        try {
          return await requestPhoneChange(data);
        } catch (e) {
          const errorMsg =
            e instanceof ApiError
              ? e.message === "phone_already_used"
                ? t("profile_phone_already_used")
                : e.message
              : t("phone_send_failed", { defaultValue: "Failed to send OTP" });
          setPhoneOtpError(errorMsg);
          throw e;
        } finally {
          setSendingPhoneOtp(false);
        }
      }}
      verifyPhoneChange={async (data) => {
        setVerifyingPhoneOtp(true);
        setPhoneOtpError(null);
        try {
          await verifyPhoneChange(data);
        } catch (e) {
          const errorMsg =
            e instanceof ApiError
              ? e.message === "invalid_or_expired_code"
                ? t("profile_phone_invalid")
                : e.message
              : t("phone_verify_failed", { defaultValue: "Phone verification failed" });
          setPhoneOtpError(errorMsg);
          throw e;
        } finally {
          setVerifyingPhoneOtp(false);
        }
      }}
    />
  );
}
