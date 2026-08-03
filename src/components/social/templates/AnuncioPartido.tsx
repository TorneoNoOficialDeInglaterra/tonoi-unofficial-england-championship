import { competitionLogo, formatDateEs, type TemplateData } from "./shared";
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
      {/* Parche que tapa el tramo de línea vertical sobre el "VS" */}
      <div
        style={{
          position: "absolute",
          left: 524,
          top: 288,
          width: 34,
          height: 180,
          backgroundImage: `url(/social/templates/anuncio-bg.jpg)`,
          backgroundSize: "1080px 1080px",
          backgroundPosition: "-420px -288px",
        }}
      />

      {/* Logo de la competición */}
      <div
        style={{
          position: "absolute",
          left: 440,
          top: 300,
          width: 200,
          height: 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={competitionLogo(data)}
          crossOrigin="anonymous"
          alt=""
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
        />
      </div>

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
