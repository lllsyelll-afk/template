import { useState, useEffect } from "react";
import { useTranslation } from "../../node_modules/react-i18next";
import BottomSheet from "@components/BottomSheet";
import { Button } from "@components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@components/ui/input-otp";
import { useDisable2fa } from "@/hooks/auth";

interface TwoFactorDisableSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDisabled: () => void;
}

export function TwoFactorDisableSheet({ open, onOpenChange, onDisabled }: TwoFactorDisableSheetProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const disableMutation = useDisable2fa();

  useEffect(() => {
    if (!open) {
      setCode("");
      setError(null);
    }
  }, [open]);

  const handleDisable = async () => {
    if (code.length !== 6) return;
    setError(null);
    try {
      await disableMutation.mutateAsync({ code });
      onOpenChange(false);
      onDisabled();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profile_2fa_disable_failed"));
    }
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t("profile_2fa_disable_title")}>
      <div className="p-4 flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {t("profile_2fa_disable_desc")}
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
          <Button
            className="w-full bg-destructive"
            onClick={handleDisable}
            disabled={code.length !== 6 || disableMutation.isPending}
          >
            {disableMutation.isPending ? t("verifying") : t("profile_2fa_disable")}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
