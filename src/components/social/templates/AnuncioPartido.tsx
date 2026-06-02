import { competitionLogo, COMPETITION_LABELS, formatDateEs, type TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

// Generic announcement template — used for all "Anuncio del partido"
export function AnuncioPartido({ data }: { data: TemplateData }) {
  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        position: "relative",
        backgroundImage: `url(/social/templates/anuncio-bg.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#0a1628",
        color: "#fff",
        fontFamily: "'Playfair Display', Georgia, serif",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,22,40,0.55) 0%, rgba(10,22,40,0.35) 50%, rgba(10,22,40,0.75) 100%)" }} />

      {/* Title */}
      <div style={{ position: "absolute", top: 60, left: 0, right: 0, textAlign: "center", fontSize: 78, fontWeight: 900, letterSpacing: 8, fontFamily: "'Cinzel', serif" }}>
        PRÓXIMO PARTIDO
      </div>

      {/* Competition logo */}
      <div style={{ position: "absolute", top: 200, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <img src={competitionLogo(data)} crossOrigin="anonymous" style={{ height: 130, objectFit: "contain" }} alt="" />
      </div>

      {/* Teams */}
      <div style={{ position: "absolute", top: 380, left: 0, right: 0, display: "flex", justifyContent: "space-around", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: 380 }}>
          <TLogo team={data.homeTeam} size={280} />
          <div style={{ fontSize: 38, fontWeight: 700, textAlign: "center" }}>{data.homeTeam?.name ?? ""}</div>
        </div>
        <div style={{ fontSize: 110, fontWeight: 900, fontFamily: "'Cinzel', serif" }}>V</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: 380 }}>
          <TLogo team={data.awayTeam} size={280} />
          <div style={{ fontSize: 38, fontWeight: 700, textAlign: "center" }}>{data.awayTeam?.name ?? ""}</div>
        </div>
      </div>

      {/* Footer info */}
      <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 42, fontWeight: 700, marginBottom: 12 }}>{formatDateEs(data.date)}{data.time ? ` · ${data.time}h` : ""}</div>
        <div style={{ fontSize: 36, opacity: 0.9 }}>{data.stadium}</div>
        <div style={{ fontSize: 22, opacity: 0.7, marginTop: 24, letterSpacing: 4 }}>@ToNOI_oficial · {COMPETITION_LABELS[data.competition]}</div>
      </div>
    </div>
  );
}
