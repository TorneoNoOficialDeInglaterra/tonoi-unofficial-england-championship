import { AnuncioPartido } from "./templates/AnuncioPartido";
import { ResultadoLaLiga1 } from "./templates/ResultadoLaLiga1";
import { ResultadoLaLiga2 } from "./templates/ResultadoLaLiga2";
import { ResultadoChampions } from "./templates/ResultadoChampions";
import { ResultadoEuropa } from "./templates/ResultadoEuropa";
import { ResultadoCopa } from "./templates/ResultadoCopa";
import { pickLaLigaVariant, type TemplateData } from "./templates/shared";

export function TemplateRenderer({ data }: { data: TemplateData }) {
  if (data.type === "anuncio") return <AnuncioPartido data={data} />;
  switch (data.competition) {
    case "laliga":
      return pickLaLigaVariant(data) === 1 ? <ResultadoLaLiga1 data={data} /> : <ResultadoLaLiga2 data={data} />;
    case "champions":
      return <ResultadoChampions data={data} />;
    case "europa":
      return <ResultadoEuropa data={data} />;
    case "copa":
      return <ResultadoCopa data={data} />;
    case "conference":
      // Fallback while design is pending
      return <ResultadoChampions data={data} />;
  }
}
