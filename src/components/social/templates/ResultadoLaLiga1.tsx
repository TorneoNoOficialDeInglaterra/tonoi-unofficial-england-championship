import { competitionLogo, formatDateEs, type Scorer, type TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

function ScorersList({ scorers, side, align }: { scorers: Scorer[]; side: "home" | "away"; align: "left" | "right" }) {
  const list = scorers.filter((s) => s.side === side);
  return (
    <div style={{ textAlign: align, fontSize: 28, lineHeight: 1.47, color: "#1a2540", fontFamily: "'Playfair Display', Georgia, serif" }}>
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
      <div style={{ position: "absolute", top: 170, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <img src={competitionLogo(data)} crossOrigin="anonymous" style={{ height: 130, objectFit: "contain" }} alt="" />
      </div>


      {/* Escudos */}
      <div style={{ position: "absolute", top: 270, left: 110, width: 260, display: "flex", justifyContent: "center" }}>
        <TLogo team={data.homeTeam} size={260} />
      </div>
      <div style={{ position: "absolute", top: 290, right: 110, width: 260, display: "flex", justifyContent: "center" }}>
        <TLogo team={data.awayTeam} size={260} />
      </div>

      {/* Nombres dentro de las cajas pintadas */}
      <div style={{ position: "absolute", top: 610, left: 80, width: 340, textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 40, color: "#2a2a2a" }}>
        {data.homeTeam?.name ?? ""}
      </div>
      <div style={{ position: "absolute", top: 610, right: 80, width: 340, textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 40, color: "#2a2a2a" }}>
        {data.awayTeam?.name ?? ""}
      </div>

      {/* Marcador + goleadores */}
      <div
        style={{
          position: "absolute",
          top: 700,
          left: 160,
          right: 150,
          display: "grid",
          gridTemplateColumns: "1fr 220px 1fr",
          alignItems: "center",
          gap: 20,
        }}
      >
        <ScorersList scorers={data.scorers} side="home" align="left" />
        <div style={{ position: "relative", top: 10, fontSize: 140, fontWeight: 900, fontFamily: "'PT Serif', serif", textAlign: "center", color: "#1a253a", lineHeight: 1 }}>
          {data.homeGoals}-{data.awayGoals}
        </div>
        <ScorersList scorers={data.scorers} side="away" align="right" />
      </div>

      {/* Estadio + fecha */}
      <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, fontFamily: "'PT Serif', serif", textAlign: "center", color: "#000000" }}>
        <div style={{ fontSize: 40, fontWeight: 600 }}>{data.stadium}</div>
        <div style={{ fontSize: 36, fontWeight: 620,marginTop: -7 }}>{formatDateEs(data.date)}</div>
      </div>
    </div>
  );
}
