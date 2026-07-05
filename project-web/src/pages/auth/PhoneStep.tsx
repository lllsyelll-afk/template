import { useState } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { useTranslation } from "../../../node_modules/react-i18next";

interface PhoneStepProps {
  onSubmit: (phone: string) => void;
  onBack: () => void;
  isLoading: boolean;
}

export function PhoneStep({ onSubmit, onBack, isLoading }: PhoneStepProps) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  return (
    <>
      <h1 className="mb-1 font-bold text-2xl">{t("auth_phone_number")}</h1>
      <p className="mb-6 text-muted-foreground text-sm">
        {t("auth_phone_verify_desc")}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (phone.trim()) onSubmit(phone.trim());
        }}
        className="flex flex-col gap-4 w-full max-w-md"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">{t("auth_phone")}</Label>
          <Input
            id="phone"
            placeholder={t("auth_enter_phone_number")}
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoFocus
          />
        </div>
        <Button type="submit" disabled={!phone.trim() || isLoading}>
          {isLoading ? t("auth_sending_code") : t("auth_continue")}
        </Button>
        <Button type="button" onClick={onBack}>
          {t("auth_back")}
        </Button>
      </form>
    </>
  );
}
