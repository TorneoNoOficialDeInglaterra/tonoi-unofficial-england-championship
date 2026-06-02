import { competitionLogo, formatDateEn, type Scorer, type TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

function ScorersList({ scorers, side, align }: { scorers: Scorer[]; side: "home" | "away"; align: "left" | "right" }) {
  const list = scorers.filter((s) => s.side === side);
  return (
    <div style={{ textAlign: align, fontSize: 28, lineHeight: 1.45, color: "#1a1a1a", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
      {list.map((s, i) => (
        <div key={i}>{s.minute}' {s.player}</div>
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
  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        position: "relative",
        backgroundImage: `url(/social/templates/resultado-copa.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#1c2942",
        color: "#f5ebd5",
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        overflow: "hidden",
      }}
    >
      {/* Fecha + hora + estadio arriba (centro) */}
      <div style={{ position: "absolute", top: 180, left: 0, right: 0, textAlign: "center", color: "#f5ebd5", fontFamily: "'Cormorant Garamond', serif" }}>
        <div style={{ fontSize: 30, fontWeight: 600 }}>{formatDateEn(data.date)}</div>
        {data.time && <div style={{ fontSize: 28, marginTop: 4 }}>{data.time}h</div>}
        <div style={{ fontSize: 26, marginTop: 4, fontStyle: "italic" }}>{data.stadium}</div>
      </div>

      {/* Logo Copa */}
      <div style={{ position: "absolute", top: 360, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <img src={competitionLogo(data)} crossOrigin="anonymous" style={{ height: 170, objectFit: "contain" }} alt="" />
      </div>

      {/* Escudos */}
      <div style={{ position: "absolute", top: 540, left: 90, width: 280, display: "flex", justifyContent: "center" }}>
        <TLogo team={data.homeTeam} size={280} />
      </div>
      <div style={{ position: "absolute", top: 540, right: 90, width: 280, display: "flex", justifyContent: "center" }}>
        <TLogo team={data.awayTeam} size={280} />
      </div>

      {/* "V" central */}
      <div
        style={{
          position: "absolute",
          top: 620,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 100,
          fontWeight: 900,
          color: "#f5ebd5",
          fontFamily: "'Cinzel', serif",
        }}
      >
        V
      </div>

      {/* Marcador + goleadores en la caja crema inferior */}
      <div
        style={{
          position: "absolute",
          bottom: 150,
          left: 60,
          right: 60,
          display: "grid",
          gridTemplateColumns: "1fr 240px 1fr",
          alignItems: "center",
          gap: 20,
        }}
      >
        <ScorersList scorers={data.scorers} side="home" align="center" />
        <div style={{ fontSize: 120, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", textAlign: "center", color: "#1a1a1a", lineHeight: 1 }}>
          {data.homeGoals}-{data.awayGoals}
        </div>
        <ScorersList scorers={data.scorers} side="away" align="center" />
      </div>
    </div>
  );
}
