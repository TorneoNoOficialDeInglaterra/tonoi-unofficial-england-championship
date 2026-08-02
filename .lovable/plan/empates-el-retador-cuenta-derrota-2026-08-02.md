# Empates: el retador cuenta derrota

En la clasificación, un empate ya no suma "empate" a los dos equipos.

## Regla nueva

Cuando un partido acaba en empate y **uno de los dos equipos era el campeón** que entraba con el título:

- Campeón: +1 empate (E), +1 punto, mantiene el título.
- Retador (no campeón): +1 derrota (D), 0 puntos.

Cuando el empate **no involucra al campeón** (o aún no hay campeón, primer partido): se mantiene lo actual, +1 empate y +1 punto para cada uno.

Así los puntos siempre cuadran con `P = 2*V + 1*E`.

## Detalle técnico

- Único cambio en `computeStandings` (`src/lib/tonoi.ts`), en la rama `if (m.was_draw)`: en vez de incrementar `e` a los dos equipos, decidir por equipo si es el campeón (`e++`, `p += 1`) o el retador (`d++`, sin puntos).
- No cambian PJ, GF/GC, ni la lógica de título, intentos o destronamientos.
- La leyenda de la clasificación se actualiza para indicar que un empate del retador cuenta como derrota.
