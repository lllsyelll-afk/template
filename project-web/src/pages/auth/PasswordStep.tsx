import { useState, useMemo } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { useTranslation } from "../../../node_modules/react-i18next";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { useLanguage } from "@components/LanguageContext";
import {
  validatePassword,
  checkPasswordRequirements,
  getPasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from "@/utils/password";

interface PasswordStepProps {
  onSubmit: (password: string) => void;
  onBack: () => void;
}

export function PasswordStep({ onSubmit, onBack }: PasswordStepProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validation = useMemo(() => validatePassword(password), [password]);
  const requirements = useMemo(() => checkPasswordRequirements(password), [password]);
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const strengthLabel = getPasswordStrengthLabel(strength);
  const strengthColor = getPasswordStrengthColor(strength);

  const isValid = validation.valid && password.length > 0;

  return (
    <>
      <h1 className="mb-1 font-bold text-2xl">{t("auth_set_password")}</h1>
      <p className="mb-6 text-muted-foreground text-sm">
        {t("auth_create_password_desc")}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isValid) onSubmit(password);
        }}
        className="flex flex-col gap-4 w-full max-w-md"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t("auth_password")}</Label>

          <div className="relative">
            {/* Password Validation Dropdown */}
            {password.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-2 z-10 border rounded-md shadow-lg bg-background overflow-hidden">
                {/* Strength Bar */}
                <div className="px-3 py-2 border-b bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex gap-1">
                      {[0, 1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full ${level < strength ? strengthColor : "bg-gray-200"
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium">{strengthLabel}</span>
                  </div>
                </div>
                {/* Requirements List */}
                <div className="px-3 py-2 space-y-1.5">
                  {requirements.map((req, index) => (
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
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("auth_create_password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute ${language === "ar" ? "left-3" : "right-3"} top-1/2 transform -translate-y-1/2 text-muted-foreground`}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        <Button type="submit" disabled={!isValid}>
          {t("auth_continue")}
        </Button>
        <Button type="button" onClick={onBack}>
          {t("auth_back")}
        </Button>
      </form>
    </>
  );
}
