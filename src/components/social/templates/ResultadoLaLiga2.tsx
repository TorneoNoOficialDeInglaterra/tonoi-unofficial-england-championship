import { competitionLogo, formatDateEs, type Scorer, type TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

function ScorersList({ scorers, side, align }: { scorers: Scorer[]; side: "home" | "away"; align: "left" | "right" | "center" }) {
  const list = scorers.filter((s) => s.side === side);
  return (
    <div style={{ textAlign: align, fontSize: 26, lineHeight: 1.45, color: "#2a2a2a", fontFamily: "'Lora', Georgia, serif" }}>
      {list.map((s, i) => (
        <div key={i}>{s.minute}' {s.player}</div>
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
      <div style={{ position: "absolute", top: 200, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <img src={competitionLogo(data)} crossOrigin="anonymous" style={{ height: 90, objectFit: "contain" }} alt="" />
      </div>

      {/* Escudos */}
      <div style={{ position: "absolute", top: 350, left: 100, width: 280, display: "flex", justifyContent: "center" }}>
        <TLogo team={data.homeTeam} size={280} />
      </div>
      <div style={{ position: "absolute", top: 350, right: 100, width: 280, display: "flex", justifyContent: "center" }}>
        <TLogo team={data.awayTeam} size={280} />
      </div>

      {/* Nombres dentro de las cajas pintadas */}
      <div style={{ position: "absolute", top: 700, left: 80, width: 340, textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 40, color: "#2a2a2a" }}>
        {data.homeTeam?.name ?? ""}
      </div>
      <div style={{ position: "absolute", top: 700, right: 80, width: 340, textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 40, color: "#2a2a2a" }}>
        {data.awayTeam?.name ?? ""}
      </div>

      {/* Marcador + goleadores */}
      <div
        style={{
          position: "absolute",
          top: 830,
          left: 80,
          right: 80,
          display: "grid",
          gridTemplateColumns: "1fr 240px 1fr",
          alignItems: "center",
          gap: 20,
        }}
      >
        <ScorersList scorers={data.scorers} side="home" align="center" />
        <div style={{ fontSize: 120, fontWeight: 900, fontFamily: "'Playfair Display', serif", textAlign: "center", color: "#1a1a1a", lineHeight: 1 }}>
          {data.homeGoals}-{data.awayGoals}
        </div>
        <ScorersList scorers={data.scorers} side="away" align="center" />
      </div>

      {/* Banda azul inferior — fecha + estadio entre escudos ToNOI ya pintados */}
      <div style={{ position: "absolute", bottom: 50, left: 200, right: 200, textAlign: "center", color: "#f4ead2", fontFamily: "'Cormorant Garamond', serif" }}>
        <div style={{ fontSize: 32, fontWeight: 700 }}>{formatDateEs(data.date)}</div>
        <div style={{ fontSize: 28, marginTop: 4 }}>{data.stadium}</div>
      </div>
    </div>
  );
}
