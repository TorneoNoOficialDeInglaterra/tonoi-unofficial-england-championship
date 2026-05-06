import { ASSETS, formatDateEn, type Scorer, type TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

function ScorersList({ scorers, side, align }: { scorers: Scorer[]; side: "home" | "away"; align: "left" | "right" }) {
  const list = scorers.filter((s) => s.side === side);
  return (
    <div style={{ textAlign: align, fontSize: 26, lineHeight: 1.5, color: "#1a1a1a", fontWeight: 600 }}>
      {list.map((s, i) => (
        <div key={i}>{s.minute}' {s.player}</div>
      ))}
    </div>
  );
}

// Europa League — orange/red medieval style
export function ResultadoEuropa({ data }: { data: TemplateData }) {
  return (
    <div style={{
      width: 1080, height: 1080, position: "relative",
      background: "#7a2818",
      backgroundImage: `url(${ASSETS.templates.europa})`,
      backgroundSize: "cover", backgroundPosition: "center",
      color: "#fff", fontFamily: "'Playfair Display', Georgia, serif", overflow: "hidden",
      border: "8px solid #4a0e08",
    }}>
      {/* Wood banner */}
      <div style={{
        position: "absolute", top: 40, left: 80, right: 80, height: 130,
        background: "linear-gradient(180deg, #6b4423 0%, #4a2d15 100%)",
        border: "3px solid #2d1810", borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
      }}>
        <img src={ASSETS.tonoiLogo} crossOrigin="anonymous" style={{ width: 90, height: 90, objectFit: "contain" }} alt="" />
        <div style={{ fontSize: 64, fontWeight: 900, color: "#e89028", letterSpacing: 8, fontFamily: "'Cinzel', serif" }}>RESULTADO</div>
        <img src={ASSETS.tonoiLogo} crossOrigin="anonymous" style={{ width: 90, height: 90, objectFit: "contain" }} alt="" />
      </div>

      {/* Europa logo */}
      <div style={{ position: "absolute", top: 220, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <img src={ASSETS.competitions.europa} crossOrigin="anonymous" style={{ height: 150, objectFit: "contain" }} alt="" />
      </div>

      {/* Teams */}
      <div style={{ position: "absolute", top: 410, left: 0, right: 0, display: "flex", justifyContent: "space-around", alignItems: "center" }}>
        <TLogo team={data.homeTeam} size={250} />
        <div style={{ fontSize: 110, fontWeight: 900, color: "#fff", textShadow: "3px 3px 0 #4a0e08" }}>V</div>
        <TLogo team={data.awayTeam} size={250} />
      </div>

      {/* Wood result panel */}
      <div style={{
        position: "absolute", bottom: 70, left: 80, right: 80,
        background: "linear-gradient(180deg, #d4a574 0%, #b8895a 100%)",
        border: "3px solid #2d1810", borderRadius: 8,
        padding: "25px 40px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
      }}>
        <div style={{ textAlign: "center", fontSize: 30, fontWeight: 700, color: "#1a1a1a", marginBottom: 12 }}>
          {data.stadium}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 20 }}>
          <ScorersList scorers={data.scorers} side="home" align="left" />
          <div style={{ fontSize: 110, fontWeight: 900, textAlign: "center", color: "#1a1a1a" }}>
            {data.homeGoals}-{data.awayGoals}
          </div>
          <ScorersList scorers={data.scorers} side="away" align="right" />
        </div>
        <div style={{ textAlign: "center", fontSize: 26, fontWeight: 700, color: "#1a1a1a", marginTop: 12 }}>
          {formatDateEn(data.date)}{data.time ? `,  ${data.time}h` : ""}
        </div>
      </div>
    </div>
  );
}
