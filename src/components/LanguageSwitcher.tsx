import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import enFlagAsset from "@/assets/flag-en.png.asset.json";

const FlagSpain = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 18" className={className} aria-hidden="true">
    <rect width="24" height="18" fill="#AA151B" />
    <rect y="5" width="24" height="8" fill="#F1BF00" />
    <rect y="13" width="24" height="5" fill="#AA151B" />
  </svg>
);

const FlagItaly = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 18" className={className} aria-hidden="true">
    <rect width="8" height="18" fill="#009246" />
    <rect x="8" width="8" height="18" fill="#FFFFFF" />
    <rect x="16" width="8" height="18" fill="#CE2B37" />
  </svg>
);

const FlagEn = ({ className }: { className?: string }) => (
  <img
    src={enFlagAsset.url}
    alt=""
    className={className}
    aria-hidden="true"
  />
);

const FLAG_BY_LANG: Record<string, React.FC<{ className?: string }>> = {
  es: FlagSpain,
  en: FlagEn,
  it: FlagItaly,
};

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const current = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) ?? SUPPORTED_LANGUAGES[0];
  const CurrentFlag = FLAG_BY_LANG[current.code] ?? FlagSpain;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={className} aria-label={t("header.language")}>
          <Globe className="h-5 w-5" />
          <CurrentFlag className="ml-1.5 h-3.5 w-[1.45rem] rounded-sm border border-border/40 shadow-sm object-cover" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[9rem]">
        {SUPPORTED_LANGUAGES.map((l) => {
          const Flag = FLAG_BY_LANG[l.code] ?? FlagSpain;
          return (
            <DropdownMenuItem
              key={l.code}
              onClick={() => i18n.changeLanguage(l.code)}
              className={l.code === current.code ? "font-semibold" : undefined}
            >
              <Flag className="mr-2 h-3.5 w-[1.45rem] rounded-sm border border-border/40 shadow-sm object-cover" />
              {l.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


