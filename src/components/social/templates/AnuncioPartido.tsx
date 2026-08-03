import { formatDateEs, type TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

// Plantilla "ToNOI DAY" (periódico vintage). El fondo ya contiene el titular,
// el "VS", los logos del ToNOI y los recuadros de fecha/estadio.
export function AnuncioPartido({ data }: { data: TemplateData }) {
  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        position: "relative",
        backgroundImage: `url(/social/templates/anuncio-bg.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#e8dcc0",
        color: "#1a1208",
        fontFamily: "'PT Serif', 'Playfair Display', Georgia, serif",
        overflow: "hidden",
      }}
    >
      {/* Escudo local */}
      <div
        style={{
          position: "absolute",
          left: 243,
          top: 443,
          width: 210,
          height: 210,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TLogo team={data.homeTeam} size={200} />
      </div>

      {/* Escudo visitante */}
      <div
        style={{
          position: "absolute",
          left: 647,
          top: 443,
          width: 210,
          height: 210,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TLogo team={data.awayTeam} size={200} />
      </div>

      {/* Fecha */}
      <div
        style={{
          position: "absolute",
          left: 215,
          top: 806,
          width: 660,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: 0.5,
          whiteSpace: "nowrap",
        }}
      >
        {formatDateEs(data.date)}
      </div>

      {/* Estadio */}
      <div
        style={{
          position: "absolute",
          left: 215,
          top: 872,
          width: 660,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: 0.5,
          whiteSpace: "nowrap",
        }}
      >
        {data.stadium}
      </div>
    </div>
  );
}
