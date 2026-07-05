import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { useTranslation } from "../../node_modules/react-i18next";
import {
  useRequestForgotPasswordOtp,
  useResetPassword,
  useLogoutOthers,
} from "@/hooks/auth";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { Checkbox } from "@components/ui/checkbox";
import { useLanguage } from "@components/LanguageContext";
import {
  validatePassword,
  checkPasswordRequirements,
  getPasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from "@/utils/password";
interface ForgotPasswordDialogProps {
  open: boolean;
  onClose: () => void;
}
type Step = "phone" | "otp" | "choice" | "password";
export function ForgotPasswordDialog({
  open,
  onClose,
}: ForgotPasswordDialogProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logoutAllDevices, setLogoutAllDevices] = useState(false);
  const requestOtp = useRequestForgotPasswordOtp();
  const resetPassword = useResetPassword();

  useEffect(() => {
    if (devOtpCode && !otpCode) {
      setOtpCode(devOtpCode);
    }
  }, [devOtpCode, otpCode]);
  const logoutOthers = useLogoutOthers();
  const handleClose = () => {
    onClose();
    // Reset state after animation
    setTimeout(() => {
      setStep("phone");
      setPhone("");
      setOtpCode("");
      setDevOtpCode(null);
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setIsLoading(false);
      setLogoutAllDevices(false);
    }, 300);
  };
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setIsLoading(true);
    try {
      const result = await requestOtp.mutateAsync({ phone: phone.trim() });
      if (result.otp?.code) {
        setDevOtpCode(result.otp.code);
      }
      toast({
        title: t("auth_forgot_code_sent_title", { defaultValue: "Code Sent" }),
        description: t("auth_forgot_code_sent", { phone: phone.trim() }),
      });
      setStep("otp");
    } catch {
      toast({
        title: t("auth_error", { defaultValue: "Error" }),
        description: t("auth_forgot_phone_not_found", {
          defaultValue: "Unable to send code. Please check your phone number.",
        }),
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return;
    setIsLoading(true);
    // Verify OTP by attempting reset without password ("Not Now" path)
    // This validates the OTP - we'll use it in the next step
    setIsLoading(false);
    setStep("choice");
  };
  const handleNotNow = async () => {
    setIsLoading(true);
    try {
      await resetPassword.mutateAsync({
        identifier: phone,
        code: otpCode,
      });
      toast({
        title: t("auth_success", { defaultValue: "Success" }),
        description: t("auth_login_success", {
          defaultValue: "Logged in successfully",
        }),
      });
      handleClose();
      navigate("/");
    } catch {
      toast({
        title: t("auth_error", { defaultValue: "Error" }),
        description: t("auth_otp_error_desc", {
          defaultValue: "Invalid verification code. Please try again.",
        }),
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleChangePassword = () => {
    setStep("password");
  };
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return;
    if (newPassword !== confirmPassword) {
      toast({
        title: t("auth_error", { defaultValue: "Error" }),
        description: t("auth_passwords_match_error", {
          defaultValue: "Passwords do not match",
        }),
      });
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword.mutateAsync({
        identifier: phone,
        code: otpCode,
        newPassword,
      });
      if (logoutAllDevices) {
        await logoutOthers.mutateAsync();
      }
      toast({
        title: t("auth_success", { defaultValue: "Success" }),
        description: t("auth_password_reset_success", {
          defaultValue: "Password reset successfully",
        }),
      });
      handleClose();
    } catch {
      toast({
        title: t("auth_error", { defaultValue: "Error" }),
        description: t("auth_password_reset_failed", {
          defaultValue: "Failed to reset password",
        }),
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0 w-5/6 sm:max-w-md">
        <DialogHeader hideX={isLoading}>
          <DialogTitle>
            {step === "phone" &&
              t("auth_forgot_password_title", {
                defaultValue: "Reset Password",
              })}
            {step === "otp" &&
              t("auth_enter_code", { defaultValue: "Enter Code" })}
            {step === "choice" &&
              t("auth_forgot_choice_title", {
                defaultValue: "Reset Your Password",
              })}
            {step === "password" &&
              t("auth_new_password", { defaultValue: "New Password" })}
          </DialogTitle>
          <DialogDescription>
            {step === "phone" &&
              t("auth_forgot_phone_desc", {
                defaultValue:
                  "Enter your phone number to receive a verification code",
              })}
            {step === "otp" &&
              t("auth_enter_code_desc", {
                phone,
                defaultValue: `Please enter the verification code sent to ${phone}`,
              })}
            {step === "choice" &&
              t("auth_forgot_verified_desc", {
                defaultValue:
                  "Your phone has been verified. What would you like to do?",
              })}
            {step === "password" &&
              t("auth_create_password_desc", {
                defaultValue: "Create a new password for your account",
              })}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {step === "phone" && (
            <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">
                  {t("auth_phone", { defaultValue: "Phone" })}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t("auth_enter_phone_number", {
                    defaultValue: "Enter your phone number",
                  })}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={handleClose} className="flex-1">
                  {t("cancel", { defaultValue: "Cancel" })}
                </Button>
                <Button
                  type="submit"
                  disabled={!phone.trim() || isLoading}
                  className="flex-1"
                >
                  {isLoading
                    ? t("auth_sending_code", { defaultValue: "Sending..." })
                    : t("auth_continue", { defaultValue: "Continue" })}
                </Button>
              </div>
            </form>
          )}
          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="otp">
                  {t("auth_verification_code", {
                    defaultValue: "Verification Code",
                  })}
                </Label>
                <Input
                  id="otp"
                  placeholder={t("auth_otp_placeholder", {
                    defaultValue: "Enter 6-digit code",
                  })}
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  autoFocus
                  maxLength={6}
                />
                {devOtpCode && (
                  <p className="text-muted-foreground text-xs">
                    Code: {devOtpCode}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="flex-1"
                >
                  {t("auth_back", { defaultValue: "Back" })}
                </Button>
                <Button
                  type="submit"
                  disabled={otpCode.length !== 6 || isLoading}
                  className="flex-1"
                >
                  {isLoading
                    ? t("auth_verifying", { defaultValue: "Verifying..." })
                    : t("auth_verify", { defaultValue: "Verify" })}
                </Button>
              </div>
            </form>
          )}
          {step === "choice" && (
            <div className="flex flex-col gap-4">
              <Button onClick={handleChangePassword} className="h-14">
                {t("auth_forgot_change_password", {
                  defaultValue: "Change Password",
                })}
              </Button>
              <Button onClick={handleNotNow}>
                {t("auth_forgot_not_now", { defaultValue: "Not Now" })}
              </Button>
            </div>
          )}
          {step === "password" && (
            <form
              onSubmit={handlePasswordSubmit}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="newPassword">
                  {t("auth_new_password", { defaultValue: "New Password" })}
                </Label>

                <div className="relative">
                  {/* Password Validation Dropdown */}
                  {newPassword.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 z-10 border rounded-md shadow-lg bg-background overflow-hidden">
                      {/* Strength Bar */}
                      <div className="px-3 py-2 border-b bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex gap-1">
                            {[0, 1, 2, 3].map((level) => {
                              const strength = getPasswordStrength(newPassword);
                              const strengthColor = getPasswordStrengthColor(strength);
                              return (
                                <div
                                  key={level}
                                  className={`h-1.5 flex-1 rounded-full ${level < strength ? strengthColor : "bg-gray-200"
                                    }`}
                                />
                              );
                            })}
                          </div>
                          <span className="text-xs font-medium">
                            {getPasswordStrengthLabel(getPasswordStrength(newPassword))}
                          </span>
                        </div>
                      </div>
                      {/* Requirements List */}
                      <div className="px-3 py-2 space-y-1.5">
                        {checkPasswordRequirements(newPassword).map((req, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            {req.met ? (
                              <Check size={14} className="text-green-500 shrink-0" />
                            ) : (
                              <X size={14} className="text-red-500 shrink-0" />
                            )}
                            <span className={req.met ? "text-green-600" : "text-red-500"}>
                              {req.requirement}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder={t("auth_create_password", {
                      defaultValue: "Create Password",
                    })}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={`absolute ${language === "ar" ? "left-3" : "right-3"} top-1/2 transform -translate-y-1/2 text-muted-foreground`}
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">
                  {t("auth_confirm_password", {
                    defaultValue: "Confirm Password",
                  })}
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("auth_confirm_password", {
                      defaultValue: "Confirm Password",
                    })}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute ${language === "ar" ? "left-3" : "right-3"} top-1/2 transform -translate-y-1/2 text-muted-foreground`}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-red-500 text-xs">
                    {t("auth_passwords_match_error", {
                      defaultValue: "Passwords do not match",
                    })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="logout-others"
                  checked={logoutAllDevices}
                  onCheckedChange={(checked) => setLogoutAllDevices(checked === true)}
                />
                <label
                  htmlFor="logout-others"
                  className="text-sm cursor-pointer select-none"
                >
                  {t("logout_others", { defaultValue: "Log out from all other devices" })}
                </label>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setStep("choice")}
                  className="flex-1"
                >
                  {t("auth_back", { defaultValue: "Back" })}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !validatePassword(newPassword).valid ||
                    newPassword !== confirmPassword ||
                    isLoading
                  }
                  className="flex-1"
                >
                  {isLoading
                    ? t("auth_resetting", { defaultValue: "Resetting..." })
                    : t("auth_reset_password", {
                      defaultValue: "Reset Password",
                    })}
                </Button>
              </div>
            </form>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
