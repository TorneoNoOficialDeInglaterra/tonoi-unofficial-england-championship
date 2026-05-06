import type { Team } from "@/lib/tonoi";

export function TLogo({ team, size }: { team: Team | null; size: number }) {
  if (!team) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.6)",
          fontSize: size * 0.2,
        }}
      >
        ?
      </div>
    );
  }
  if (team.logo_url) {
    return (
      <img
        src={team.logo_url}
        alt={team.name}
        crossOrigin="anonymous"
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: "rgba(255,255,255,0.9)",
        color: "#222",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
        fontSize: size * 0.3,
      }}
    >
      {team.name.slice(0, 3).toUpperCase()}
    </div>
  );
}
