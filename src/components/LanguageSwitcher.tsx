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

const FlagUk = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 18" className={className} aria-hidden="true">
    <rect width="24" height="18" fill="#012169" />
    <path d="M0 0 L24 18 M24 0 L0 18" stroke="#FFFFFF" strokeWidth="3" />
    <path d="M0 0 L24 18 M24 0 L0 18" stroke="#C8102E" strokeWidth="1.8" />
    <path d="M12 0 V18 M0 9 H24" stroke="#FFFFFF" strokeWidth="5" />
    <path d="M12 0 V18 M0 9 H24" stroke="#C8102E" strokeWidth="3" />
  </svg>
);

const FlagUs = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 18" className={className} aria-hidden="true">
    <rect width="24" height="18" fill="#FFFFFF" />
    {[0, 2, 4, 6, 8, 10, 12, 14, 16].map((y) => (
      <rect key={y} y={y} width="24" height="1" fill="#B22234" />
    ))}
    <rect width="10" height="9" fill="#3C3B6E" />
    {Array.from({ length: 18 }).map((_, i) => {
      const row = Math.floor(i / 6);
      const col = i % 6;
      return (
        <circle
          key={i}
          cx={1.2 + col * 1.6}
          cy={1.2 + row * 1.6}
          r="0.5"
          fill="#FFFFFF"
        />
      );
    })}
  </svg>
);

const FlagEn = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 18" className={className} aria-hidden="true">
    <defs>
      <clipPath id="uk-half">
        <rect width="12" height="18" />
      </clipPath>
      <clipPath id="us-half">
        <rect x="12" width="12" height="18" />
      </clipPath>
    </defs>
    <g clipPath="url(#uk-half)">
      <rect width="12" height="18" fill="#012169" />
      <path d="M0 0 L12 18 M12 0 L0 18" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M0 0 L12 18 M12 0 L0 18" stroke="#C8102E" strokeWidth="1.2" />
      <path d="M6 0 V18 M0 9 H12" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M6 0 V18 M0 9 H12" stroke="#C8102E" strokeWidth="1.8" />
    </g>
    <g clipPath="url(#us-half)">
      <rect x="12" width="12" height="18" fill="#FFFFFF" />
      {[0, 2, 4, 6, 8, 10, 12, 14, 16].map((y) => (
        <rect key={y} x="12" y={y} width="12" height="1" fill="#B22234" />
      ))}
      <rect x="12" width="5" height="5" fill="#3C3B6E" />
      {Array.from({ length: 9 }).map((_, i) => (
        <circle
          key={i}
          cx={13 + (i % 3) * 1.4}
          cy={1 + Math.floor(i / 3) * 1.5}
          r="0.42"
          fill="#FFFFFF"
        />
      ))}
    </g>
  </svg>
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
          <CurrentFlag className="ml-1.5 h-3.5 w-[1.15rem] rounded-sm border border-border/40 shadow-sm" />
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
              <Flag className="mr-2 h-3.5 w-[1.15rem] rounded-sm border border-border/40 shadow-sm" />
              {l.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

