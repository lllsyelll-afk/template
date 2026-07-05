import { useState } from "react";
import { EmailChangeBottomSheet } from "@/components/EmailChangeBottomSheet";
import { ApiError } from "@utils/client";
import { useTranslation } from "../../node_modules/react-i18next";
import type { User } from "app-types";

interface EmailChangeWrapperProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestEmailChange: (data: { email: string }) => Promise<any>;
  verifyEmailChange: (data: { email: string; code: string }) => Promise<any>;
  reset: (values: any) => void;
  watch: (field: string) => any;
}

export function EmailChangeWrapper({
  user,
  open,
  onOpenChange,
  requestEmailChange,
  verifyEmailChange,
  reset,
  watch,
}: EmailChangeWrapperProps) {
  const { t } = useTranslation();
  const [newEmail, setNewEmail] = useState("");
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [showEmailOtpInput, setShowEmailOtpInput] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState<string | null>(null);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [devEmailOtpCode, setDevEmailOtpCode] = useState<string | null>(null);
  const [emailChangeError, setEmailChangeError] = useState<string | null>(null);

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      setNewEmail("");
      setEmailOtpCode("");
      setShowEmailOtpInput(false);
      setEmailOtpError(null);
      setDevEmailOtpCode(null);
      setEmailChangeError(null);
    }
  };

  return (
    <EmailChangeBottomSheet
      open={open}
      onOpenChange={handleOpenChange}
      user={user}
      newEmail={newEmail}
      onNewEmailChange={setNewEmail}
      showOtpInput={showEmailOtpInput}
      onShowOtpInputChange={setShowEmailOtpInput}
      emailOtpCode={emailOtpCode}
      onEmailOtpCodeChange={setEmailOtpCode}
      sendingEmailOtp={sendingEmailOtp}
      verifyingEmailOtp={verifyingEmailOtp}
      emailOtpError={emailOtpError}
      devEmailOtpCode={devEmailOtpCode}
      onDevEmailOtpCodeChange={setDevEmailOtpCode}
      emailChangeError={emailChangeError}
      requestEmailChange={async (data) => {
        setSendingEmailOtp(true);
        setEmailOtpError(null);
        setDevEmailOtpCode(null);
        try {
          return await requestEmailChange(data);
        } catch (e) {
          const errorMsg =
            e instanceof ApiError
              ? e.message === "email_already_used"
                ? t("profile_email_already_used")
                : e.message
              : t("email_send_failed", { defaultValue: "Failed to send email" });
          setEmailOtpError(errorMsg);
          throw e;
        } finally {
          setSendingEmailOtp(false);
        }
      }}
      verifyEmailChange={async (data) => {
        setVerifyingEmailOtp(true);
        setEmailOtpError(null);
        try {
          await verifyEmailChange(data);
        } catch (e) {
          const errorMsg =
            e instanceof ApiError
              ? e.message === "invalid_or_expired_code"
                ? t("profile_email_invalid")
                : e.message
              : t("email_verify_failed", { defaultValue: "Email verification failed" });
          setEmailOtpError(errorMsg);
          throw e;
        } finally {
          setVerifyingEmailOtp(false);
        }
      }}
      reset={reset}
      watch={watch}
    />
  );
}
