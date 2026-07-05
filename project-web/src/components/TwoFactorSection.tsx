import { useState } from "react";
import { useTranslation } from "../../node_modules/react-i18next";
import { Card } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { ShieldCheck, ShieldPlus } from "lucide-react";
import { TwoFactorSetupSheet } from "./TwoFactorSetupSheet";
import { TwoFactorDisableSheet } from "./TwoFactorDisableSheet";
import type { User } from "app-types";

interface TwoFactorSectionProps {
  user: User | null;
}

export function TwoFactorSection({ user }: TwoFactorSectionProps) {
  const { t } = useTranslation();
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [enabled, setEnabled] = useState(!!(user as Record<string, unknown>)?.twoFactorEnabled);

  const isEnabled = enabled || !!(user as Record<string, unknown>)?.twoFactorEnabled;

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {isEnabled ? (
            <ShieldCheck className="text-green-500" size={24} />
          ) : (
            <ShieldPlus className="text-muted-foreground" size={24} />
          )}
          <div>
            <p className="font-semibold">
              {t("profile_2fa_title")}
            </p>
            <p className="text-sm text-muted-foreground">
              {isEnabled
                ? t("profile_2fa_enabled_badge")
                : t("profile_2fa_disabled_desc")}
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            if (isEnabled) {
              setShowDisable(true);
            } else {
              setShowSetup(true);
            }
          }}
          className={isEnabled ? "bg-muted text-foreground border-border" : ""}
        >
          {isEnabled ? t("profile_2fa_disable") : t("profile_2fa_enable")}
        </Button>
      </div>
      <TwoFactorSetupSheet
        open={showSetup}
        onOpenChange={setShowSetup}
        onEnabled={() => setEnabled(true)}
      />
      <TwoFactorDisableSheet
        open={showDisable}
        onOpenChange={setShowDisable}
        onDisabled={() => setEnabled(false)}
      />
    </Card>
  );
}
