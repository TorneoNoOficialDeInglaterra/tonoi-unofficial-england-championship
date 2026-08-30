# Explicación de partidos con nota (caso Bastia–Nantes)

En el historial de partidos, los partidos con una anotación especial pasan a ser pulsables y muestran un cuadro de diálogo con la explicación.

## Qué se ve

- En la fila del partido, junto al resultado, aparece un pequeño icono de información (ℹ) cuando ese partido tiene una nota guardada.
- Al pulsar la fila (o el icono), se abre un diálogo con:
  - Fecha y equipos (Local – Visitante) con escudos.
  - Resultado.
  - Título "¿Por qué cambió de campeón?" y el texto de la nota, p. ej. "Victoria por denuncia por alineación indebida".
- Los partidos sin nota siguen exactamente igual que ahora (no pulsables).

## Estado actual comprobado

- El partido Bastia–Nantes del 10/08/2013 está en la base de datos como 0–0 con Bastia como ganador y ya tiene la nota "Victoria por denuncia por alineación indebida".
- Es el único partido con nota, así que el icono solo aparecerá ahí por ahora; cualquier nota futura que se añada desde el panel de admin funcionará igual sin más cambios.

## Detalle técnico

- `src/pages/MatchHistory.tsx`: añadir estado `selectedMatch`, un icono `Info` (lucide) en la celda del resultado si `m.notes`, `onClick` en la fila para abrir el diálogo, y un `Dialog` de shadcn al final del componente con los datos del partido y la nota.
- `src/lib/tonoi.ts` ya expone `notes` en el tipo `Match`; verificar que la consulta de `useMatches` (`src/hooks/useTonoiData.ts`) selecciona `notes` y añadirlo si no está.
- Nuevas claves de traducción en `history` (`noteDialog.title`, `noteDialog.close`, `noteDialog.reason`) en los 7 idiomas (es, en, it y los ficheros ca/eu/pt/gl).
- Sin cambios en la lógica de clasificación ni en el cálculo del campeón.
