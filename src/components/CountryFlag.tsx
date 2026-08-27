import { useTranslation } from "react-i18next";
import { countryName, flagUrl } from "@/lib/countries";
import { cn } from "@/lib/utils";

export function CountryFlag({
  code,
  width = 20,
  className,
  showTitle = true,
}: {
  code?: string | null;
  width?: number;
  className?: string;
  showTitle?: boolean;
}) {
  const { i18n } = useTranslation();
  if (!code) return null;
  const name = countryName(code, i18n.language);
  return (
    <img
      src={flagUrl(code, width <= 20 ? 20 : width <= 40 ? 40 : 80)}
      alt={name}
      title={showTitle ? name : undefined}
      width={width}
      height={Math.round((width * 3) / 4)}
      loading="lazy"
      className={cn("inline-block shrink-0 rounded-[2px] object-cover shadow-sm", className)}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

export default CountryFlag;
