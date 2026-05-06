import { ASSETS, formatDateEn, type Scorer, type TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

function ScorersList({ scorers, side, align }: { scorers: Scorer[]; side: "home" | "away"; align: "left" | "right" }) {
  const list = scorers.filter((s) => s.side === side);
  return (
    <div style={{ textAlign: align, fontSize: 26, lineHeight: 1.5, color: "#fff", fontStyle: "italic" }}>
      {list.map((s, i) => (
        <div key={i}>{s.minute}' {s.player}</div>
      ))}
    </div>
  );
}

// Champions League — teal/dark green stadium look
export function ResultadoChampions({ data }: { data: TemplateData }) {
  return (
    <div style={{
      width: 1080, height: 1080, position: "relative",
      background: "#1f4a4f",
      backgroundImage: `url(${ASSETS.templates.champions})`,
      backgroundSize: "cover", backgroundPosition: "center",
      color: "#fff", fontFamily: "'Inter', sans-serif", overflow: "hidden",
      border: "10px solid #c9a44c",
    }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(31,74,79,0.4) 0%, rgba(31,74,79,0.7) 100%)" }} />

      {/* Top header */}
      <div style={{ position: "absolute", top: 40, left: 60, right: 60, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <img src={ASSETS.tonoiLogo} crossOrigin="anonymous" style={{ width: 130, height: 130, objectFit: "contain" }} alt="" />
        <div style={{ fontSize: 82, fontWeight: 800, letterSpacing: 14, fontFamily: "'Inter', sans-serif" }}>RESULTADO</div>
        <img src={ASSETS.tonoiLogo} crossOrigin="anonymous" style={{ width: 130, height: 130, objectFit: "contain" }} alt="" />
      </div>

      {/* Champions logo */}
      <div style={{ position: "absolute", top: 240, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <img src={ASSETS.competitions.champions} crossOrigin="anonymous" style={{ height: 200, objectFit: "contain" }} alt="" />
      </div>

      {/* Teams */}
      <div style={{ position: "absolute", top: 480, left: 0, right: 0, display: "flex", justifyContent: "space-around", alignItems: "center" }}>
        <TLogo team={data.homeTeam} size={230} />
        <div style={{ fontSize: 90, fontWeight: 900 }}>V</div>
        <TLogo team={data.awayTeam} size={230} />
      </div>

      {/* Score */}
      <div style={{
        position: "absolute", bottom: 180, left: 60, right: 60,
        background: "rgba(40,90,95,0.85)", borderTop: "3px solid #c9a44c", borderBottom: "3px solid #c9a44c",
        padding: "30px 40px",
        display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 20,
      }}>
        <ScorersList scorers={data.scorers} side="home" align="left" />
        <div style={{ fontSize: 130, fontWeight: 900, textAlign: "center", color: "#fff" }}>
          {data.homeGoals}-{data.awayGoals}
        </div>
        <ScorersList scorers={data.scorers} side="away" align="right" />
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 70, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 30, fontWeight: 600 }}>{formatDateEn(data.date)}{data.time ? `, ${data.time}h` : ""}</div>
        <div style={{ fontSize: 28, marginTop: 6, opacity: 0.9 }}>{data.stadium}</div>
      </div>

      <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontSize: 20, letterSpacing: 4, opacity: 0.8 }}>
        @ToNOI_oficial
      </div>
    </div>
  );
}
