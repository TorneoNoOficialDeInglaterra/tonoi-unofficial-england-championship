import type { TemplateData } from "./shared";
import { TLogo } from "./TeamLogo";

/**
 * Plantilla "A NEW KING IS CROWNED" (1080×1608).
 * El fondo ya trae el marco vintage, el título TONOI, las cintas y el recuadro del nombre.
 * Solo superponemos el escudo del nuevo campeón dentro del círculo y su nombre en el recuadro.
 */
export function CampeonNuevo({ data }: { data: TemplateData }) {
  const team = data.homeTeam;
  return (
    <div
      style={{
        width: 1080,
        height: 1608,
        position: "relative",
        backgroundImage: `url(/social/templates/campeon-bg.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#12354f",
        color: "#1a1208",
        fontFamily: "'PT Serif', 'Playfair Display', Georgia, serif",
        overflow: "hidden",
      }}
    >
      {/* Escudo del nuevo campeón (círculo central) */}
      <div
        style={{
          position: "absolute",
          left: 542 - 140,
          top: 820 - 140,
          width: 280,
          height: 280,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TLogo team={team} size={250} />
      </div>

      {/* Nombre del campeón */}
      <div
        style={{
          position: "absolute",
          left: 261,
          top: 1203,
          width: 559,
          height: 134,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 20px",
          fontSize: 50,
          fontWeight: 400,
          letterSpacing: 1,
          textAlign: "center",
          lineHeight: 1.1,
          color: "#1a1208",
        }}
      >
        {(team?.name ?? "").toUpperCase()}
      </div>
    </div>
  );
}
