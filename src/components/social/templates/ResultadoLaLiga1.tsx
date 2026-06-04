import { competitionLogo, formatDateEs, type Scorer, type TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

function ScorersList({ scorers, side, align }: { scorers: Scorer[]; side: "home" | "away"; align: "left" | "right" }) {
  const list = scorers.filter((s) => s.side === side);
  return (
    <div style={{ textAlign: align, fontSize: 28, lineHeight: 1.45, color: "#1a2540", fontFamily: "'Playfair Display', Georgia, serif" }}>
      {list.map((s, i) => (
        <div key={i}>{s.minute}' {s.player}</div>
      ))}
    </div>
  );
}

/**
 * Liga template 1 (sepia / Sheffield Steelworks)
 * El fondo ya incluye: marco azul, "RESULTADO", escudos ToNOI, banner inferior y "@ToNOI_oficial".
 * Solo superponemos: logo de liga, escudos equipos, "V", marcador, goleadores, estadio, fecha.
 */
export function ResultadoLiga1({ data }: { data: TemplateData }) {
  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        position: "relative",
        backgroundImage: `url(/social/templates/resultado-liga-1.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#1c2942",
        color: "#1a2540",
        fontFamily: "'Playfair Display', Georgia, serif",
        overflow: "hidden",
      }}
    >
      {/* Logo liga centrado */}
      <div style={{ position: "absolute", top: 200, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <img src={competitionLogo(data)} crossOrigin="anonymous" style={{ height: 110, objectFit: "contain" }} alt="" />
      </div>

      {/* Escudos */}
      <div style={{ position: "absolute", top: 470, left: 110, width: 260, display: "flex", justifyContent: "center" }}>
        <TLogo team={data.homeTeam} size={260} />
      </div>
      <div style={{ position: "absolute", top: 470, right: 110, width: 260, display: "flex", justifyContent: "center" }}>
        <TLogo team={data.awayTeam} size={260} />
      </div>

      {/* "V" central */}
      <div
        style={{
          position: "absolute",
          top: 540,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 110,
          fontWeight: 900,
          fontFamily: "'Cinzel', serif",
          color: "#1a2540",
        }}
      >
        V
      </div>

      {/* Marcador + goleadores */}
      <div
        style={{
          position: "absolute",
          top: 800,
          left: 60,
          right: 60,
          display: "grid",
          gridTemplateColumns: "1fr 220px 1fr",
          alignItems: "center",
          gap: 20,
        }}
      >
        <ScorersList scorers={data.scorers} side="home" align="right" />
        <div style={{ fontSize: 130, fontWeight: 900, fontFamily: "'Playfair Display', serif", color: "#1a2540", textAlign: "center", lineHeight: 1 }}>
          {data.homeGoals}-{data.awayGoals}
        </div>
        <ScorersList scorers={data.scorers} side="away" align="left" />
      </div>

      {/* Estadio + fecha */}
      <div style={{ position: "absolute", bottom: 130, left: 0, right: 0, textAlign: "center", color: "#1a2540" }}>
        <div style={{ fontSize: 30, fontWeight: 600 }}>{data.stadium}</div>
        <div style={{ fontSize: 26, marginTop: 6 }}>{formatDateEs(data.date)}</div>
      </div>
    </div>
  );
}
