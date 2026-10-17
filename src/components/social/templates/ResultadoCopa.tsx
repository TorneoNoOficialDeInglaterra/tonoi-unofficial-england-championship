import { competitionLogo, formatDateEn, groupScorers, splitIntoColumns, type Scorer, type TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

/** Máximo de filas de goleadores por columna. */
const MAX_ROWS = 4;

function ScorersList({ scorers, side, align }: { scorers: Scorer[]; side: "home" | "away"; align: "left" | "right" | "center" }) {
  const cols = splitIntoColumns(groupScorers(scorers, side), MAX_ROWS);
  const size = cols.length > 1 ? 20 : 28;
  const justify = align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start";
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: justify, width: "100%", minWidth: 0, maxWidth: "100%", overflow: "hidden", fontSize: size, lineHeight: 1.45, color: "#1a1a1a", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
      {cols.map((col, ci) => (
        <div key={ci} style={{ flex: "1 1 auto", minWidth: 0, textAlign: align }}>
          {col.map((line, i) => <div key={i} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{line}</div>)}
        </div>
      ))}
    </div>
  );
}

/**
 * Copa template — el fondo trae marco crema, "RESULTADO", escudos ToNOI y caja crema inferior con
 * "SHEFFIELD STEELWORKS" + "@ToNOI_oficial". Solo superponemos: fecha/hora/estadio arriba, logo Copa,
 * escudos equipos, "V", marcador y goleadores en la caja inferior.
 */
export function ResultadoCopa({ data }: { data: TemplateData }) {
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
        backgroundImage: `url(/social/templates/resultado-copa.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#1c2942",
        color: "#f5ebd5",
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        overflow: "hidden",
      }}
    >
      {/* Fecha + hora + estadio arriba (centro) */}
      <div style={{ position: "absolute", top: 650, left: 0, right: 0, textAlign: "center", color: "#ffffff", fontFamily: "'Cormorant Garamond', serif" }}>
        <div style={{ fontSize: 35, fontWeight: 700 }}>{formatDateEn(data.date)}</div>
        {data.time && <div style={{ fontSize: 35, marginTop: -18 }}>{data.time}h</div>}
        <div style={{ fontSize: 34, marginTop: -15, fontStyle: "italic" }}>{data.stadium}</div>
      </div>

      {/* Logo Copa */}
      <div style={{ position: "absolute", top: 250, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <img src={competitionLogo(data)} crossOrigin="anonymous" style={{ height: 150, objectFit: "contain" }} alt="" />
      </div>

      {/* Escudos */}
      <div style={{ position: "absolute", top: 350, left: 140, width: 280, display: "flex", justifyContent: "center" }}>
        <TLogo team={data.homeTeam} size={280} />
      </div>
      <div style={{ position: "absolute", top: 370, right: 130, width: 280, display: "flex", justifyContent: "center" }}>
        <TLogo team={data.awayTeam} size={280} />
      </div>

      {/* Marcador + goleadores en la caja crema inferior (grid simétrico: marcador centrado) */}
      <div
        style={{
          position: "absolute",
          bottom: 140,
          left: 45,
          right: 45,
          display: "grid",
          gridTemplateColumns: many ? "1fr 200px 1fr" : "1fr 220px 1fr",
          alignItems: "center",
          gap: 20,
        }}
      >
        <ScorersList scorers={data.scorers} side="home" align="center" />
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
        <ScorersList scorers={data.scorers} side="away" align="center" />
      </div>
    </div>
  );
}
