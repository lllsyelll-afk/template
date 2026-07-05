import { useLocation } from "wouter";
import { Button } from "@components/ui/button";
import { Card } from "@components/ui/card";
import { useTranslation } from "../../node_modules/react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  const handleGoHome = () => {
    navigate("/", { replace: true });
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="flex justify-center items-center bg-background p-4 min-h-screen">
      <Card className="p-8 border-border w-full max-w-md text-center">
        {/* 404 Illustration */}
        <div className="mb-6">
          <div className="mb-2 font-bold text-primary text-6xl">404</div>
          <div className="mb-2 font-semibold text-foreground text-2xl">
            {t("notfound_title")}
          </div>
          <p className="text-muted-foreground">{t("notfound_description")}</p>
        </div>

        {/* Navigation Options */}
        <div className="space-y-3">
          <Button onClick={handleGoHome} className="w-full">
            {t("notfound_go_home")}
          </Button>

          <Button onClick={handleGoBack} className="w-full">
            {t("notfound_go_back")}
          </Button>
        </div>

        {/* Additional Help */}
        <div className="mt-6 pt-6">
          <p className="text-muted-foreground text-sm">{t("notfound_help")}</p>
        </div>
      </Card>
    </div>
  );
}
