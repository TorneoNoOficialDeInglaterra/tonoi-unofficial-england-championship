import { competitionLogo, formatDateEs, groupScorers, splitIntoColumns, type Scorer, type TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

/** Máximo de filas de goleadores por columna. */
const MAX_ROWS = 4;

function ScorersList({ scorers, side, align }: { scorers: Scorer[]; side: "home" | "away"; align: "left" | "right" }) {
  const cols = splitIntoColumns(groupScorers(scorers, side), MAX_ROWS);
  const size = cols.length > 1 ? 20 : 28;
  return (
    <div style={{ display: "flex", gap: 12, justifyContent: align === "right" ? "flex-end" : "flex-start", width: "100%", minWidth: 0, maxWidth: "100%", overflow: "hidden", fontSize: size, lineHeight: 1.47, color: "#1a2540", fontFamily: "'Playfair Display', Georgia, serif" }}>
      {cols.map((col, ci) => (
        <div key={ci} style={{ flex: "1 1 auto", minWidth: 0, textAlign: align }}>
          {col.map((line, i) => <div key={i} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{line}</div>)}
        </div>
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
  // Con más de MAX_ROWS goleadores a un lado hacen falta 2 columnas: el marcador
  // cede algo de anchura y de tamaño para que los nombres no se recorten.
  const many =
    groupScorers(data.scorers, "home").length > MAX_ROWS ||
    groupScorers(data.scorers, "away").length > MAX_ROWS;
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

      {/* Marcador + goleadores (grid simétrico: marcador centrado) */}
      <div
        style={{
          position: "absolute",
          top: 690,
          left: 110,
          right: 110,
          display: "grid",
          gridTemplateColumns: many ? "1fr 170px 1fr" : "1fr 190px 1fr",
          alignItems: "center",
          gap: 20,
        }}
      >
        <ScorersList scorers={data.scorers} side="home" align="left" />
        <div
          style={{
            fontSize: many ? 120 : 140,
            fontWeight: 900,
            fontFamily: "'PT Serif', serif",
            textAlign: "center",
            color: "#1a253a",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
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
