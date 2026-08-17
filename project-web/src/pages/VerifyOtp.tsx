import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Card } from "@components/ui/card";
import { useAuth, useVerifyOtp } from "@/hooks/auth";
import { useTranslation } from "../../node_modules/react-i18next";
interface FormValues {
  identifier: string;
  code: string;
}
function useQueryParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}
export default function VerifyOtpPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { status, error } = useAuth();
  const verifyOtp = useVerifyOtp();
  const identifier = useQueryParam("identifier") ?? "";
  const devCode = useQueryParam("code") ?? "";
  const { register, handleSubmit, setValue } = useForm<FormValues>({
    defaultValues: { identifier, code: devCode },
  });
  useEffect(() => {
    if (identifier) setValue("identifier", identifier);
    if (devCode) setValue("code", devCode);
  }, [identifier, devCode, setValue]);
  const onSubmit = handleSubmit(async (values) => {
    try {
      await verifyOtp.mutateAsync({
        identifier: values.identifier,
        code: values.code,
        purpose: "register",
      });
      navigate("/");
    } catch (error) {
      console.error("OTP verification failed:", error);
    }
  });
  return (
    <div className="flex flex-col justify-center items-center p-6 min-h-screen">
      <Card className="p-6 w-full max-w-sm">
        <h1 className="mb-1 font-bold text-2xl">{t("verify_otp_title")}</h1>
        <p className="mb-6 text-muted-foreground text-sm">
          {t("verify_otp_desc")}
          {devCode && (
            <span className="block mt-2 text-xs">
              <strong>{t("verify_otp_dev_mode")}:</strong>{" "}
              {t("verify_otp_code_is")}
              <code className="bg-muted px-1.5 py-0.5 rounded">{devCode}</code>
            </span>
          )}
        </p>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="identifier">{t("verify_otp_phone_or_email")}</Label>
            <Input
              id="identifier"
              placeholder={t("verify_otp_enter_phone_or_email")}
              {...register("identifier", { required: true })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="code">{t("verify_otp_otp_code")}</Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={t("verify_otp_enter_otp_code")}
              maxLength={6}
              {...register("code", {
                required: true,
                minLength: 6,
                maxLength: 6,
              })}
            />
          </div>
          {error && (
            <p className="text-red-600 text-sm" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={status === "loading"}>
            {status === "loading"
              ? t("verify_otp_verifying")
              : t("verify_otp_verify")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
