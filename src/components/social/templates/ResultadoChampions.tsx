import { formatDateEn, groupScorers, splitIntoColumns, type Scorer, type TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

function ScorersList({ scorers, side, align }: { scorers: Scorer[]; side: "home" | "away"; align: "left" | "right" }) {
  const cols = splitIntoColumns(groupScorers(scorers, side), 3);
  return (
    <div style={{ display: "flex", gap: 12, justifyContent: align === "right" ? "flex-end" : "flex-start", width: "100%", minWidth: 0, maxWidth: "100%", overflow: "hidden", fontSize: 24, lineHeight: 1.45, color: "#ffffff", fontFamily: "'Montserrat', sans-serif" }}>
      {cols.map((col, ci) => (
        <div key={ci} style={{ textAlign: align, minWidth: 0 }}>
          {col.map((line, i) => <div key={i} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{line}</div>)}
        </div>
      ))}
    </div>
  );
}

/**
 * Champions template — el fondo ya incluye marco dorado, escudos ToNOI, "RESULTADO", caja/barra del marcador.
 * Solo superponemos: logo Champions, escudos equipos, "V", marcador, goleadores, fecha+hora, estadio.
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

      {/* Barra de marcador (ya pintada en el fondo) */}
      <div
        style={{
          position: "absolute",
          top: 780,
          left: 200,
          right: 200,
          display: "grid",
          gridTemplateColumns: "1fr 220px 1fr",
          alignItems: "center",
          gap: 20,
        }}
      >
        <ScorersList scorers={data.scorers} side="home" align="left" />
        <div style={{ position: "relative", top: 0, left: 10 , fontSize: 130, fontWeight: 700, textAlign: "center", color: "#fff", lineHeight: 1, fontFamily: "'Montserrat', sans-serif" }}>
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
