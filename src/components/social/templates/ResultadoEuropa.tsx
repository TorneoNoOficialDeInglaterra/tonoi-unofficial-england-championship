import { formatDateEn, type Scorer, type TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

function ScorersList({ scorers, side, align }: { scorers: Scorer[]; side: "home" | "away"; align: "left" | "right" }) {
  const list = scorers.filter((s) => s.side === side);
  return (
    <div style={{ textAlign: align, fontSize: 32, lineHeight: 1.45, color: "#000000", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 1000 }}>
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
          left: 200,
          right: 200,
          display: "grid",
          gridTemplateColumns: "1fr 240px 1fr",
          alignItems: "center",
          gap: 20,
        }}
      >
        <ScorersList scorers={data.scorers} side="home" align="left" />
        <div style={{ fontSize: 120, fontWeight: 700, fontFamily: "'PT Serif', serif", textAlign: "center", color: "#1a1a1a", lineHeight: 1 }}>
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
