import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-16 border-t border-border py-8">
      <div className="container flex flex-col items-center gap-2 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
        <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
        <p>{t("footer.tagline")}</p>
      </div>
    </footer>
  );
}
