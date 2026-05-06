import { ASSETS, formatDateEs, type Scorer, type TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

function ScorersList({ scorers, side, align }: { scorers: Scorer[]; side: "home" | "away"; align: "left" | "right" }) {
  const list = scorers.filter((s) => s.side === side);
  return (
    <div style={{ textAlign: align, fontSize: 28, lineHeight: 1.5, color: "#1a2540", fontStyle: "italic" }}>
      {list.map((s, i) => (
        <div key={i}>{s.minute}' {s.player}</div>
      ))}
    </div>
  );
}

// LaLiga template 1 — "Sheffield Steelworks" navy + sepia
export function ResultadoLaLiga1({ data }: { data: TemplateData }) {
  return (
    <div style={{ width: 1080, height: 1080, position: "relative", background: "#1c2942", color: "#1a2540", fontFamily: "'Playfair Display', Georgia, serif", overflow: "hidden" }}>
      {/* Title */}
      <div style={{ position: "absolute", top: 40, left: 0, right: 0, textAlign: "center", color: "#e8d9b8", fontSize: 96, fontWeight: 900, letterSpacing: 12, fontFamily: "'Cinzel', serif", textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
        RESULTADO
      </div>

      {/* Sepia card */}
      <div style={{
        position: "absolute", top: 180, left: 60, right: 60, bottom: 120,
        backgroundImage: `url(${ASSETS.templates["laliga-2"]})`,
        backgroundSize: "cover", backgroundPosition: "center",
        backgroundColor: "#c9b48a",
        borderRadius: 8,
        boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(220,200,160,0.45)" }} />

        {/* ToNOI shields top */}
        <div style={{ position: "absolute", top: 30, left: 60 }}>
          <img src={ASSETS.tonoiLogo} crossOrigin="anonymous" style={{ width: 140, height: 140, objectFit: "contain", opacity: 0.95 }} alt="" />
        </div>
        <div style={{ position: "absolute", top: 30, right: 60 }}>
          <img src={ASSETS.tonoiLogo} crossOrigin="anonymous" style={{ width: 140, height: 140, objectFit: "contain", opacity: 0.95 }} alt="" />
        </div>

        {/* LaLiga logo */}
        <div style={{ position: "absolute", top: 50, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <img src={ASSETS.competitions.laliga} crossOrigin="anonymous" style={{ height: 110, objectFit: "contain" }} alt="" />
        </div>

        {/* Teams */}
        <div style={{ position: "absolute", top: 260, left: 0, right: 0, display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          <TLogo team={data.homeTeam} size={240} />
          <div style={{ fontSize: 100, fontWeight: 900, fontFamily: "'Cinzel', serif", color: "#1a2540" }}>V</div>
          <TLogo team={data.awayTeam} size={240} />
        </div>

        {/* Score + scorers */}
        <div style={{ position: "absolute", top: 540, left: 60, right: 60, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 30 }}>
          <ScorersList scorers={data.scorers} side="home" align="right" />
          <div style={{ fontSize: 130, fontWeight: 900, fontFamily: "'Playfair Display', serif", color: "#1a2540" }}>
            {data.homeGoals}-{data.awayGoals}
          </div>
          <ScorersList scorers={data.scorers} side="away" align="left" />
        </div>

        {/* Footer */}
        <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, textAlign: "center", color: "#1a2540" }}>
          <div style={{ fontSize: 30, fontWeight: 600 }}>{data.stadium}</div>
          <div style={{ fontSize: 26, marginTop: 6 }}>{formatDateEs(data.date)}</div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center", color: "#e8d9b8", fontSize: 22, letterSpacing: 4 }}>
        @ToNOI_oficial
      </div>
    </div>
  );
}
