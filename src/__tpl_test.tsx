import { ResultadoLiga1 } from "./components/social/templates/ResultadoLaLiga1";
import { ResultadoLiga2 } from "./components/social/templates/ResultadoLaLiga2";
import { ResultadoCopa } from "./components/social/templates/ResultadoCopa";
import { ResultadoEuropa } from "./components/social/templates/ResultadoEuropa";
import type { Scorer, TemplateData } from "./components/social/templates/shared";

const scorersA: Scorer[] = [
  { side: "home", minute: "12", player: "Kane" },
  { side: "home", minute: "34", player: "Foden" },
  { side: "home", minute: "56", player: "Saka" },
  { side: "away", minute: "45", player: "Messi" },
  { side: "away", minute: "78", player: "Messi" },
  { side: "home", minute: "88", player: "Kane" },
];
const scorersB: Scorer[] = [
  ...scorersA,
  { side: "home", minute: "90+1", player: "Palmer" },
  { side: "home", minute: "90+4", player: "Gordon" },
  { side: "away", minute: "66", player: "Rashford" },
];

const base = {
  type: "resultado" as const,
  domesticLeague: "premier" as const,
  domesticCup: "fa-cup" as const,
  date: "2026-10-14",
  time: "21:00",
  stadium: "Estadio de Prueba de Nombre Verdaderamente Largo",
  homeGoals: 3,
  awayGoals: 2,
  homeTeam: null,
  awayTeam: null,
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div data-row={label}>
      <div style={{ font: "16px monospace", padding: 4, background: "#eee" }}>{label}</div>
      <div data-canvas style={{ transform: "scale(0.45)", transformOrigin: "top left", width: 1080, height: 1080, marginBottom: -594 }}>
        {children}
      </div>
    </div>
  );
}

export default function TplTest() {
  const liga1A: TemplateData = { ...base, competition: "liga", ligaVariant: 1, scorers: scorersA };
  const liga1B: TemplateData = { ...base, competition: "liga", ligaVariant: 1, scorers: scorersB };
  const liga2A: TemplateData = { ...base, competition: "liga", ligaVariant: 2, scorers: scorersA };
  const liga2B: TemplateData = { ...base, competition: "liga", ligaVariant: 2, scorers: scorersB };
  const copaA: TemplateData = { ...base, competition: "copa", scorers: scorersA };
  const copaB: TemplateData = { ...base, competition: "copa", scorers: scorersB };
  const europaA: TemplateData = { ...base, competition: "europa", scorers: scorersA };
  const europaB: TemplateData = { ...base, competition: "europa", scorers: scorersB };
  return (
    <div>
      <Row label="liga1 A (4/3)"><ResultadoLiga1 data={liga1A} /></Row>
      <Row label="liga1 B (6/3)"><ResultadoLiga1 data={liga1B} /></Row>
      <Row label="liga2 A (4/3)"><ResultadoLiga2 data={liga2A} /></Row>
      <Row label="liga2 B (6/3)"><ResultadoLiga2 data={liga2B} /></Row>
      <Row label="copa A (4/3)"><ResultadoCopa data={copaA} /></Row>
      <Row label="copa B (6/3)"><ResultadoCopa data={copaB} /></Row>
      <Row label="europa A (4/3)"><ResultadoEuropa data={europaA} /></Row>
      <Row label="europa B (6/3)"><ResultadoEuropa data={europaB} /></Row>
    </div>
  );
}
