import { useTranslation } from "../../node_modules/react-i18next";
import { Logo } from "@/Home";

export function LoadingView() {
  const { t } = useTranslation();

  return (
    <div className="flex justify-center items-center min-h-screen animate-in duration-300 fade-in">
      <div className="flex flex-col items-center gap-6">
        <Logo />
        <span className="animate-pulse text-foreground text-lg font-medium">
          {t("loading")}
        </span>
      </div>
    </div>
  );
}
