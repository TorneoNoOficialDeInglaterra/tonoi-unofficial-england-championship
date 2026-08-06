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

const FlagCatalonia = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 18" className={className} aria-hidden="true">
    <rect width="24" height="18" fill="#FCDD09" />
    {[2, 6, 10, 14].map((y) => (
      <rect key={y} y={y} width="24" height="2" fill="#DA121A" />
    ))}
  </svg>
);

const FlagBasque = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 18" className={className} aria-hidden="true">
    <rect width="24" height="18" fill="#D52B1E" />
    <path d="M0 0 L24 18 M24 0 L0 18" stroke="#009B48" strokeWidth="3.2" />
    <path d="M12 0 V18 M0 9 H24" stroke="#FFFFFF" strokeWidth="3.2" />
  </svg>
);

const FlagPortugal = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 18" className={className} aria-hidden="true">
    <rect width="24" height="18" fill="#FF0000" />
    <rect width="9.6" height="18" fill="#006600" />
    <circle cx="9.6" cy="9" r="3.4" fill="#FFFF00" stroke="#FFFFFF" strokeWidth="0.6" />
    <circle cx="9.6" cy="9" r="1.8" fill="#FF0000" />
  </svg>
);

const FLAG_BY_LANG: Record<string, React.FC<{ className?: string }>> = {
  es: FlagSpain,
  en: FlagEn,
  it: FlagItaly,
  ca: FlagCatalonia,
  eu: FlagBasque,
  pt: FlagPortugal,
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


