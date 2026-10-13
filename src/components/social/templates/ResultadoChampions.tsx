import { formatDateEn, groupScorers, splitIntoColumns, type Scorer, type TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

/** Máximo de filas de goleadores por columna. */
const MAX_ROWS = 4;

function ScorersList({ scorers, side, align }: { scorers: Scorer[]; side: "home" | "away"; align: "left" | "right" }) {
  const cols = splitIntoColumns(groupScorers(scorers, side), MAX_ROWS);
  const size = cols.length > 1 ? 20 : 24;
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        justifyContent: align === "right" ? "flex-end" : "flex-start",
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        overflow: "hidden",
        fontSize: size,
        lineHeight: 1.25,
        color: "#ffffff",
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 600,
      }}
    >
      {cols.map((col, ci) => (
        <div key={ci} style={{ flex: "1 1 0", minWidth: 0, textAlign: align }}>
          {col.map((line, i) => (
            <div key={i} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {line}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Champions template — el fondo ya incluye marco dorado, escudos ToNOI, "RESULTADO", caja/barra del marcador.
 * La caja pintada ocupa x 152→928 e y 776→919: la capa de goleadores y marcador se sitúa
 * simétricamente (left/right 170) para que el marcador quede centrado y los goleadores no
 * se salgan del recuadro.
 * Solo superponemos: escudos equipos, "V", marcador, goleadores, fecha+hora, estadio.
 */
export function ResultadoChampions({ data }: { data: TemplateData }) {
  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        position: "relative",
        backgroundImage: `url(/social/templates/resultado-champions.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#1f4a4f",
        color: "#fff",
        fontFamily: "'Montserrat', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Escudos (logo Champions y "V" ya van en el fondo) */}
      <div style={{ position: "absolute", top: 440, left: 160, width: 260, display: "flex", justifyContent: "center" }}>
        <TLogo team={data.homeTeam} size={260} />
      </div>
      <div style={{ position: "absolute", top: 450, right: 150, width: 260, display: "flex", justifyContent: "center" }}>
        <TLogo team={data.awayTeam} size={260} />
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
          color: "#ffffff",
        }}
      >
        V
      </div>

      {/* Caja de marcador (pintada en el fondo): 170→910 horizontal, 786→906 vertical */}
      <div
        style={{
          position: "absolute",
          top: 786,
          left: 170,
          right: 170,
          height: 120,
          display: "grid",
          gridTemplateColumns: "1fr 230px 1fr",
          alignItems: "center",
          gap: 16,
        }}
      >
        <ScorersList scorers={data.scorers} side="home" align="left" />
        <div
          style={{
            fontSize: 128,
            fontWeight: 700,
            textAlign: "center",
            color: "#fff",
            lineHeight: 1,
            fontFamily: "'Montserrat', sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          {data.homeGoals}-{data.awayGoals}
        </div>
        <ScorersList scorers={data.scorers} side="away" align="right" />
      </div>

      {/* Fecha + estadio */}
      <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 28, fontWeight: 600 }}>
          {formatDateEn(data.date)}{data.time ? `, ${data.time}h` : ""}
        </div>
        <div style={{ fontSize: 28, fontWeight: 500, marginTop: 3 }}>{data.stadium}</div>
      </div>
    </div>
  );
}
