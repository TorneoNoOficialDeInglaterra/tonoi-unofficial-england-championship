import type { Team } from "@/lib/tonoi";

export function TeamBadge({ team, size = 24 }: { team?: Team | null; size?: number }) {
  if (!team) return <div className="inline-block rounded-full bg-muted" style={{ width: size, height: size }} />;
  if (team.logo_url) {
    return (
      <img
        src={team.logo_url}
        alt={team.name}
        className="inline-block rounded-sm object-contain"
        style={{ width: size, height: size }}
        loading="lazy"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      className="inline-flex items-center justify-center rounded-sm bg-primary/10 text-[10px] font-bold text-primary"
      style={{ width: size, height: size }}
    >
      {team.name.slice(0, 2).toUpperCase()}
    </div>
  );
}
