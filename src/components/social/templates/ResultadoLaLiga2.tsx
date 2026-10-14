import { competitionLogo, formatDateEs, groupScorers, splitIntoColumns, type Scorer, type TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

/** Máximo de filas de goleadores por columna. */
const MAX_ROWS = 4;

function ScorersList({ scorers, side, align }: { scorers: Scorer[]; side: "home" | "away"; align: "left" | "right" | "center" }) {
  const cols = splitIntoColumns(groupScorers(scorers, side), MAX_ROWS);
  const size = cols.length > 1 ? 18 : 26;
  const justify = align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start";
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: justify, width: "100%", minWidth: 0, maxWidth: "100%", overflow: "hidden", fontSize: size, lineHeight: 1.45, color: "#1a253a", fontFamily: "'Lora', Georgia, serif", fontWeight: 600 }}>
      {cols.map((col, ci) => (
        <div key={ci} style={{ flex: "1 1 auto", minWidth: 0, textAlign: align }}>
          {col.map((line, i) => <div key={i} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{line}</div>)}
        </div>
      ))}
    </div>
  );
}

/**
 * Liga template 2 (papel crema / Bilbao vs Valencia)
 * El fondo ya incluye: marco, "RESULTADO", "V", cajas de nombres + caja de marcador, banda azul inferior con escudos ToNOI.
 * Solo superponemos: logo de liga, escudos equipos, nombres en las cajas, marcador, goleadores, fecha y estadio en la banda azul.
 */
export function ResultadoLiga2({ data }: { data: TemplateData }) {
  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        position: "relative",
        backgroundImage: `url(/social/templates/resultado-liga-2.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#e8dcc3",
        color: "#1a2540",
        fontFamily: "'Cinzel', 'Playfair Display', serif",
        overflow: "hidden",
      }}
    >
      {/* Logo liga */}
      <div style={{ position: "absolute", top: 170, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <img src={competitionLogo(data)} crossOrigin="anonymous" style={{ height: 120, objectFit: "contain" }} alt="" />
      </div>

      {/* "V" central */}
      <div
        style={{
          position: "absolute",
          top: 520,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 110,
          fontWeight: 900,
          fontFamily: "'PT Serif', serif",
          color: "#1a2540",
        }}
      >
        V
      </div>

      {/* Escudos */}
      <div style={{ position: "absolute", top: 450, left: 110, width: 280, display: "flex", justifyContent: "center" }}>
        <TLogo team={data.homeTeam} size={280} />
      </div>
      <div style={{ position: "absolute", top: 450, right: 100, width: 280, display: "flex", justifyContent: "center" }}>
        <TLogo team={data.awayTeam} size={280} />
      </div>

      {/* Marcador + goleadores (grid simétrico: marcador centrado) */}
      <div
        style={{
          position: "absolute",
          top: 720,
          left: 110,
          right: 110,
          height: 180,
          display: "grid",
          gridTemplateColumns: many ? "1fr 190px 1fr" : "1fr 230px 1fr",
          alignItems: "center",
          gap: 16,
        }}
      >
        <ScorersList scorers={data.scorers} side="home" align="left" />
        <div
          style={{
            fontSize: many ? 110 : 140,
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

      {/* Estadio y fecha inferior */}
      <div style={{ position: "absolute", bottom: 135, left: 200, right: 200, textAlign: "center", color: "#1a253a", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div style={{ fontSize: 32, fontWeight: 700 }}>{data.stadium}</div>
        <div style={{ fontSize: 32, fontWeight: 700, marginTop: -2}}>{formatDateEs(data.date)}</div>
      </div>
    </div>
  );
}
