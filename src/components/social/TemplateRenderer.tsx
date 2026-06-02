import { ResultadoLiga1 } from "./templates/ResultadoLaLiga1";
import { ResultadoLiga2 } from "./templates/ResultadoLaLiga2";
import { ResultadoChampions } from "./templates/ResultadoChampions";
import { ResultadoEuropa } from "./templates/ResultadoEuropa";
import { ResultadoCopa } from "./templates/ResultadoCopa";
import { AnuncioPartido } from "./templates/AnuncioPartido";
import { pickLaLigaVariant, type TemplateData } from "./templates/shared";

export function TemplateRenderer({ data }: { data: TemplateData }) {
  if (data.type === "anuncio") return <AnuncioPartido data={data} />;
  switch (data.competition) {
    case "liga":
      return pickLaLigaVariant(data) === 1 ? <ResultadoLiga1 data={data} /> : <ResultadoLiga2 data={data} />;
    case "champions":
      return <ResultadoChampions data={data} />;
    case "europa":
      return <ResultadoEuropa data={data} />;
    case "copa":
      return <ResultadoCopa data={data} />;
    case "conference":
      return <ResultadoChampions data={data} />;
  }
}
