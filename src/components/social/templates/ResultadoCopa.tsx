import { competitionLogo, formatDateEn, groupScorers, splitIntoColumns, type Scorer, type TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

function ScorersList({ scorers, side, align }: { scorers: Scorer[]; side: "home" | "away"; align: "left" | "right" | "center" }) {
  const cols = splitIntoColumns(groupScorers(scorers, side), 3);
  const justify = align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start";
  return (
    <div style={{ display: "flex", gap: 12, justifyContent: justify, width: "100%", minWidth: 0, maxWidth: "100%", overflow: "hidden", fontSize: 28, lineHeight: 1.45, color: "#1a1a1a", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600 }}>
      {cols.map((col, ci) => (
        <div key={ci} style={{ textAlign: align, minWidth: 0 }}>
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

      {/* Marcador + goleadores en la caja crema inferior */}
      <div
        style={{
          position: "absolute",
          bottom: 140,
          left: 60,
          right: 60,
          display: "grid",
          gridTemplateColumns: "1fr 240px 1fr",
          alignItems: "center",
          gap: 20,
        }}
      >
        <ScorersList scorers={data.scorers} side="home" align="center" />
        <div style={{ position: "relative", top: -5, fontSize: 120, fontWeight: 700, fontFamily: "'PT Serif', serif", textAlign: "center", color: "#1a1a1a", lineHeight: 1 }}>
          {data.homeGoals}-{data.awayGoals}
        </div>
        <ScorersList scorers={data.scorers} side="away" align="center" />
      </div>
    </div>
  );
}
