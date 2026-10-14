import { formatDateEn, groupScorers, splitIntoColumns, type Scorer, type TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

/** Máximo de filas de goleadores por columna. */
const MAX_ROWS = 4;

function ScorersList({ scorers, side, align }: { scorers: Scorer[]; side: "home" | "away"; align: "left" | "right" }) {
  const cols = splitIntoColumns(groupScorers(scorers, side), MAX_ROWS);
  const size = cols.length > 1 ? 22 : 32;
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: align === "right" ? "flex-end" : "flex-start", width: "100%", minWidth: 0, maxWidth: "100%", overflow: "hidden", fontSize: size, lineHeight: 1.45, color: "#000000", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 1000 }}>
      {cols.map((col, ci) => (
        <div key={ci} style={{ flex: "1 1 auto", minWidth: 0, textAlign: align }}>
          {col.map((line, i) => <div key={i} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{line}</div>)}
        </div>
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
        backgroundImage: `url(/social/templates/resultado-europaleague.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#2a1a10",
        color: "#1a1a1a",
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        overflow: "hidden",
      }}
    >
      {/* Escudos (logo Europa y "V" ya van en el fondo) */}
      <div style={{ position: "absolute", top: 360, left: 140, width: 280, display: "flex", justifyContent: "center" }}>
        <TLogo team={data.homeTeam} size={280} />
      </div>
      <div style={{ position: "absolute", top: 370, right: 130, width: 280, display: "flex", justifyContent: "center" }}>
        <TLogo team={data.awayTeam} size={280} />
      </div>

      {/* "V" central */}
      <div
        style={{
          position: "absolute",
          top: 450,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 130,
          fontWeight: 1000,
          fontFamily: "'Lora', serif",
          color: "#000000"
        }}
      >
        V
      </div>

      {/* Tablón inferior */}
      <div style={{ position: "absolute", top: 735, left: 0, right: 0, textAlign: "center", color: "#000000" }}>
        <div style={{ fontSize: 40, fontWeight: 1000, fontFamily: "'Pirata One', serif" }}>{data.stadium}</div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 800,
          left: 165,
          right: 165,
          display: "grid",
          gridTemplateColumns: many ? "1fr 200px 1fr" : "1fr 220px 1fr",
          alignItems: "center",
          gap: 20,
        }}
      >
        <ScorersList scorers={data.scorers} side="home" align="left" />
        <div
          style={{
            fontSize: many ? 100 : 120,
            fontWeight: 700,
            fontFamily: "'PT Serif', serif",
            textAlign: "center",
            color: "#1a1a1a",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {data.homeGoals}-{data.awayGoals}
        </div>
        <ScorersList scorers={data.scorers} side="away" align="right" />
      </div>

      <div style={{ position: "absolute", bottom: 95, left: 0, right: 0, textAlign: "center", color: "#1a1a1a", fontSize: 35, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif" }}>
        {formatDateEn(data.date)}{data.time ? `,   ${data.time}h` : ""}
      </div>
    </div>
  );
}
