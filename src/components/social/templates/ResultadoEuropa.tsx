import { competitionLogo, formatDateEn, type Scorer, type TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

function ScorersList({ scorers, side, align }: { scorers: Scorer[]; side: "home" | "away"; align: "left" | "right" }) {
  const list = scorers.filter((s) => s.side === side);
  return (
    <div style={{ textAlign: align, fontSize: 28, lineHeight: 1.45, color: "#1a1a1a", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
      {list.map((s, i) => (
        <div key={i}>{s.minute}' {s.player}</div>
      ))}
    </div>
  );
}

/**
 * Europa template — el fondo trae tablón superior con "RESULTADO" + escudos ToNOI, fondo medieval naranja
 * y tablón dorado inferior. Solo superponemos: logo Europa, escudos equipos, "V", marcador, goleadores,
 * estadio y fecha+hora dentro del tablón inferior.
 */
export function ResultadoEuropa({ data }: { data: TemplateData }) {
  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        position: "relative",
        backgroundImage: `url(/social/templates/resultado-europaleague.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#2a1a10",
        color: "#1a1a1a",
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        overflow: "hidden",
      }}
    >
      {/* Logo Europa */}
      <div style={{ position: "absolute", top: 470, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <img src={competitionLogo(data)} crossOrigin="anonymous" style={{ height: 150, objectFit: "contain" }} alt="" />
      </div>

      {/* Escudos */}
      <div style={{ position: "absolute", top: 600, left: 80, width: 280, display: "flex", justifyContent: "center" }}>
        <TLogo team={data.homeTeam} size={280} />
      </div>
      <div style={{ position: "absolute", top: 600, right: 80, width: 280, display: "flex", justifyContent: "center" }}>
        <TLogo team={data.awayTeam} size={280} />
      </div>

      {/* "V" central */}
      <div
        style={{
          position: "absolute",
          top: 690,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 100,
          fontWeight: 900,
          color: "#1a1a1a",
          fontFamily: "'Cinzel', serif",
        }}
      >
        V
      </div>

      {/* Tablón inferior */}
      <div style={{ position: "absolute", top: 950, left: 0, right: 0, textAlign: "center", color: "#1a1a1a" }}>
        <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif" }}>{data.stadium}</div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 1020,
          left: 60,
          right: 60,
          display: "grid",
          gridTemplateColumns: "1fr 240px 1fr",
          alignItems: "center",
          gap: 20,
        }}
      >
        <ScorersList scorers={data.scorers} side="home" align="left" />
        <div style={{ fontSize: 120, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", textAlign: "center", color: "#1a1a1a", lineHeight: 1 }}>
          {data.homeGoals}-{data.awayGoals}
        </div>
        <ScorersList scorers={data.scorers} side="away" align="right" />
      </div>

      <div style={{ position: "absolute", bottom: 70, left: 0, right: 0, textAlign: "center", color: "#1a1a1a", fontSize: 28, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif" }}>
        {formatDateEn(data.date)}{data.time ? `,   ${data.time}h` : ""}
      </div>
    </div>
  );
}
