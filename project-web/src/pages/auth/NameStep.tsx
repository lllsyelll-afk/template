import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Checkbox } from "@components/ui/checkbox";
import { useTranslation } from "../../../node_modules/react-i18next";

interface NameStepProps {
  onSubmit: (name: string) => void;
  defaultName?: string;
}

export function NameStep({ onSubmit, defaultName }: NameStepProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(defaultName ?? "");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Update name when defaultName changes (e.g., after Google login)
  useEffect(() => {
    if (defaultName && name === "") {
      setName(defaultName);
    }
  }, [defaultName, name]);
  return (
    <>
      <h1 className="mb-1 font-bold text-2xl">{t("auth_your_name")}</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim() && acceptedTerms) onSubmit(name.trim());
        }}
        className="flex flex-col gap-4 w-full max-w-md"
      >
        <div className="flex flex-col gap-1.5">
          <Input
            id="name"
            placeholder={t("auth_enter_full_name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
            className="mt-0.5"
          />
          <label htmlFor="terms" className="text-muted-foreground text-sm leading-5 cursor-pointer">
            {t("auth_agree_terms", { defaultValue: "I agree to the" })}{" "}
            <a
              href={import.meta.env.VITE_TERMS_URL || `${window.location.origin}/terms`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {t("auth_terms_conditions", { defaultValue: "Terms & Conditions" })}
            </a>{" "}
            {t("auth_and", { defaultValue: "and" })}{" "}
            <a
              href={import.meta.env.VITE_PRIVACY_URL || `${window.location.origin}/privacy`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {t("auth_privacy_policy", { defaultValue: "Privacy Policy" })}
            </a>
          </label>
        </div>
        <Button type="submit" disabled={!name.trim() || !acceptedTerms}>
          {t("auth_continue")}
        </Button>
        <p className="text-muted-foreground text-sm text-center">
          {t("auth_have_account")}
          <Link href="/login" className="mx-2 font-semibold underline">
            {t("auth_sign_in")}
          </Link>
        </p>
      </form>
    </>
  );
}
