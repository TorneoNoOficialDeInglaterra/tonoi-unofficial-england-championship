import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export default function History() {
  const { t } = useTranslation("stats");
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-black sm:text-5xl">{t("history.title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("history.subtitle")}</p>

        <Card className="mt-10 border-2 border-dashed border-primary/30 bg-[image:var(--gradient-soft)] p-12">
          <Sparkles className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-3xl font-black">{t("history.comingSoon")}</h2>
          <p className="mt-2 text-muted-foreground">
            {t("history.body")}
          </p>
        </Card>
      </div>
    </div>
  );
}
