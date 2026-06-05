import { formatDateEn, type Scorer, type TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

function ScorersList({ scorers, side, align }: { scorers: Scorer[]; side: "home" | "away"; align: "left" | "right" }) {
  const list = scorers.filter((s) => s.side === side);
  return (
    <div style={{ textAlign: align, fontSize: 24, lineHeight: 1.45, color: "#ffffff", fontFamily: "'Montserrat', sans-serif" }}>
      {list.map((s, i) => (
        <div key={i}>{s.minute}' {s.player}</div>
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
      <div style={{ position: "absolute", top: 470, left: 110, width: 260, display: "flex", justifyContent: "center" }}>
        <TLogo team={data.homeTeam} size={260} />
      </div>
      <div style={{ position: "absolute", top: 470, right: 110, width: 260, display: "flex", justifyContent: "center" }}>
        <TLogo team={data.awayTeam} size={260} />
      </div>


      {/* Barra de marcador (ya pintada en el fondo) */}
      <div
        style={{
          position: "absolute",
          top: 770,
          left: 60,
          right: 60,
          display: "grid",
          gridTemplateColumns: "1fr 220px 1fr",
          alignItems: "center",
          gap: 20,
        }}
      >
        <ScorersList scorers={data.scorers} side="home" align="right" />
        <div style={{ fontSize: 130, fontWeight: 700, textAlign: "center", color: "#fff", lineHeight: 1, fontFamily: "'Montserrat', sans-serif" }}>
          {data.homeGoals}-{data.awayGoals}
        </div>
        <ScorersList scorers={data.scorers} side="away" align="left" />
      </div>

      {/* Fecha + estadio */}
      <div style={{ position: "absolute", bottom: 110, left: 0, right: 0, textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 28, fontWeight: 600 }}>
          {formatDateEn(data.date)}{data.time ? `, ${data.time}h` : ""}
        </div>
        <div style={{ fontSize: 26, marginTop: 6, opacity: 0.95 }}>{data.stadium}</div>
      </div>
    </div>
  );
}
