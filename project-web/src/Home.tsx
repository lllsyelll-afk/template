import { Button } from "@components/ui/button";
import { useTranslation } from "../node_modules/react-i18next";
import { useAuth } from "@/hooks/auth";
import { Link } from "wouter";

export function Logo() {
  return (
    <div className="inline-flex items-center bg-primary shadow-lg px-4 py-3 rounded-2xl">
      <div className="flex items-center w-15 h-15 font-bold text-primary-foreground text-3xl tracking-tight">
        <span className="relative flex items-center">App</span>
      </div>
    </div>
  );
}

export function Home() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col justify-center items-center p-6 min-h-screen text-center">
        <div className="mb-8">
          <Logo />
        </div>
        <h1 className="mb-4 max-w-2xl font-bold text-foreground text-4xl">
          {t("home_title")}
        </h1>
        <p className="mb-8 max-w-2xl text-muted-foreground text-lg">
          {t("home_subtitle")}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {isAuthenticated ? (
            <Link to="/">
              <Button>{t("home_get_started")}</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button>{t("home_login")}</Button>
              </Link>
              <Link to="/register">
                <Button>{t("home_register")}</Button>
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
