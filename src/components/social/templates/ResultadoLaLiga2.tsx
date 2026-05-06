import { ASSETS, formatDateEs, type Scorer, type TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

function ScorersList({ scorers, side, align }: { scorers: Scorer[]; side: "home" | "away"; align: "left" | "right" }) {
  const list = scorers.filter((s) => s.side === side);
  return (
    <div style={{ textAlign: align, fontSize: 26, lineHeight: 1.5, color: "#2a2a2a", fontStyle: "italic" }}>
      {list.map((s, i) => (
        <div key={i}>{s.minute}' {s.player}</div>
      ))}
    </div>
  );
}

// LaLiga template 2 — Vintage paper / Chelsea-Arsenal style
export function ResultadoLaLiga2({ data }: { data: TemplateData }) {
  return (
    <div style={{
      width: 1080, height: 1080, position: "relative",
      background: "#1c2942",
      backgroundImage: `url(${ASSETS.templates["laliga-1"]})`,
      backgroundSize: "cover", backgroundPosition: "center",
      color: "#1a2540", fontFamily: "'Playfair Display', Georgia, serif", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(232,220,195,0.78)" }} />

      {/* Top header */}
      <div style={{ position: "absolute", top: 40, left: 60, right: 60, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <img src={ASSETS.tonoiLogo} crossOrigin="anonymous" style={{ width: 130, height: 130, objectFit: "contain" }} alt="" />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 86, fontWeight: 900, letterSpacing: 10, fontFamily: "'Cinzel', serif" }}>RESULTADO</div>
          <div style={{ fontSize: 24, marginTop: 8 }}>{formatDateEs(data.date)}</div>
          {data.time && <div style={{ fontSize: 24 }}>{data.time}h</div>}
          <div style={{ fontSize: 24, fontStyle: "italic" }}>{data.stadium}</div>
        </div>
        <img src={ASSETS.tonoiLogo} crossOrigin="anonymous" style={{ width: 130, height: 130, objectFit: "contain" }} alt="" />
      </div>

      {/* LaLiga logo */}
      <div style={{ position: "absolute", top: 360, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <img src={ASSETS.competitions.laliga} crossOrigin="anonymous" style={{ height: 100, objectFit: "contain" }} alt="" />
      </div>

      {/* Teams */}
      <div style={{ position: "absolute", top: 480, left: 0, right: 0, display: "flex", justifyContent: "space-around", alignItems: "center" }}>
        <TLogo team={data.homeTeam} size={220} />
        <div style={{ fontSize: 90, fontWeight: 900, fontFamily: "'Cinzel', serif" }}>V</div>
        <TLogo team={data.awayTeam} size={220} />
      </div>

      {/* Score block */}
      <div style={{
        position: "absolute", bottom: 130, left: 60, right: 60,
        background: "rgba(245,235,210,0.85)", border: "2px solid rgba(26,37,64,0.3)",
        borderRadius: 6, padding: "30px 40px",
        display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 20,
      }}>
        <ScorersList scorers={data.scorers} side="home" align="left" />
        <div style={{ fontSize: 120, fontWeight: 900, fontFamily: "'Playfair Display', serif", textAlign: "center" }}>
          {data.homeGoals}-{data.awayGoals}
        </div>
        <ScorersList scorers={data.scorers} side="away" align="right" />
      </div>

      <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center", fontSize: 22, letterSpacing: 4, opacity: 0.7 }}>
        @ToNOI_oficial
      </div>
    </div>
  );
}
