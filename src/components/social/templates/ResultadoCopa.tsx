import { ASSETS, formatDateEn, type Scorer, type TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

function ScorersList({ scorers, side, align }: { scorers: Scorer[]; side: "home" | "away"; align: "left" | "right" }) {
  const list = scorers.filter((s) => s.side === side);
  return (
    <div style={{ textAlign: align, fontSize: 28, lineHeight: 1.5, color: "#1a1a1a", fontStyle: "italic" }}>
      {list.map((s, i) => (
        <div key={i}>{s.minute}' {s.player}</div>
      ))}
    </div>
  );
}

// Copa — vintage navy + cream paper
export function ResultadoCopa({ data }: { data: TemplateData }) {
  return (
    <div style={{
      width: 1080, height: 1080, position: "relative",
      background: "#e8dcc0",
      backgroundImage: `url(${ASSETS.templates.copa})`,
      backgroundSize: "cover", backgroundPosition: "center",
      color: "#1c2942", fontFamily: "'Playfair Display', Georgia, serif", overflow: "hidden",
    }}>
      {/* Top header */}
      <div style={{ position: "absolute", top: 40, left: 60, right: 60, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <img src={ASSETS.tonoiLogo} crossOrigin="anonymous" style={{ width: 130, height: 130, objectFit: "contain" }} alt="" />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 84, fontWeight: 900, letterSpacing: 10, fontFamily: "'Cinzel', serif", color: "#1c2942" }}>RESULTADO</div>
          <div style={{ fontSize: 24, marginTop: 12, fontStyle: "italic" }}>{formatDateEn(data.date)}</div>
          {data.time && <div style={{ fontSize: 24, fontStyle: "italic" }}>{data.time}h</div>}
          <div style={{ fontSize: 24, fontStyle: "italic" }}>{data.stadium}</div>
        </div>
        <img src={ASSETS.tonoiLogo} crossOrigin="anonymous" style={{ width: 130, height: 130, objectFit: "contain" }} alt="" />
      </div>

      {/* Copa logo */}
      <div style={{ position: "absolute", top: 380, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <img src={ASSETS.competitions.copa} crossOrigin="anonymous" style={{ height: 130, objectFit: "contain" }} alt="" />
      </div>

      {/* Teams */}
      <div style={{ position: "absolute", top: 540, left: 0, right: 0, display: "flex", justifyContent: "space-around", alignItems: "center" }}>
        <TLogo team={data.homeTeam} size={230} />
        <div style={{ fontSize: 90, fontWeight: 900, fontFamily: "'Cinzel', serif", color: "#1c2942" }}>V</div>
        <TLogo team={data.awayTeam} size={230} />
      </div>

      {/* Cream result block */}
      <div style={{
        position: "absolute", bottom: 100, left: 60, right: 60,
        background: "#f5ecd9", border: "2px solid rgba(28,41,66,0.3)",
        padding: "25px 40px",
        display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 20,
      }}>
        <ScorersList scorers={data.scorers} side="home" align="left" />
        <div style={{ fontSize: 120, fontWeight: 900, textAlign: "center", color: "#1c2942" }}>
          {data.homeGoals}-{data.awayGoals}
        </div>
        <ScorersList scorers={data.scorers} side="away" align="right" />
      </div>

      <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center", fontSize: 22, letterSpacing: 4, color: "#1c2942", opacity: 0.7 }}>
        @ToNOI_oficial
      </div>
    </div>
  );
}
