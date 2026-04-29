## Plan

### 1. Histórico de estadísticas en tiempo real

**Problema**: el "Histórico" solo lee `player_stats_history` y `goalkeeper_stats_history`, que se rellenan al cerrar temporada. Hasta entonces el histórico aparece vacío.

**Solución**: crear dos tablas nuevas que se actualicen en vivo cada vez que se registra un gol/asistencia/portería en el panel admin.

- Migración: nuevas tablas
  - `player_stats_alltime` (player_name unique, goals, assists)
  - `goalkeeper_stats_alltime` (goalkeeper_name unique, clean_sheets)
  - RLS: lectura pública, escritura solo admin (igual que el resto).
- Modificar `bumpField` (Players) y `registerCleanSheet` (Keepers) en `src/pages/Admin.tsx` para hacer un `upsert` adicional sobre la tabla all-time (sumando 1 al valor existente, o creando la fila).
- Backfill: la migración rellenará las nuevas tablas sumando lo que ya existe en `player_stats` + `player_stats_history` (y equivalente porteros) para no perder los datos actuales.
- En `src/pages/Stats.tsx`, cuando el usuario elige "Histórico", leer de las nuevas tablas all-time (más rápido y siempre al día).
- Al cerrar temporada, dejar el flujo actual intacto pero NO sumar de nuevo al all-time (ya estaba contado en cada gol).

### 2. Header opaco (no transparente)

En `src/components/Header.tsx`, cambiar:
- `bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80` → `bg-background` (sólido, sin transparencia ni blur).

### 3. Hero principal: carrusel + logo grande

En `src/pages/Home.tsx` reemplazar el bloque rojo del hero por:
- Fondo: carrusel automático con fotos icónicas del fútbol de distintas épocas (blanco y negro antiguas, mid-century, modernas). Usaremos el componente `Carousel` ya disponible (`src/components/ui/carousel.tsx`) con autoplay simple via `setInterval`.
  - Imágenes: descargaremos 5–7 fotos libres de derechos (Wikimedia Commons / Unsplash) y las guardaremos en `src/assets/hero/`.
  - Overlay oscuro semitransparente para que el texto se siga leyendo.
- Layout: en escritorio, dos columnas — texto y CTAs a la izquierda; logo del torneo grande (~280px) a la derecha. En móvil se apila (logo arriba o debajo, más pequeño).

### 4. Layout de la página principal a dos columnas

En `src/pages/Home.tsx`, después de la sección "Campeón actual + Último partido", la zona "¿Qué es el ToNOI?" + Reglamento se alineará a la izquierda en una rejilla de 2 columnas (≥`lg`):

```text
┌────────────────────────┬──────────────────┐
│ ¿Qué es el ToNOI?      │  Top 10          │
│ (texto + Reglamento)   │  clasificación   │
│                        │                  │
│                        │  Últimos 5       │
│                        │  partidos        │
└────────────────────────┴──────────────────┘
```

- Columna derecha (`sticky top-20`): dos `Card`s.
  - **Top 10**: usa `computeStandings(...)` (ya disponible en `useMatches`/`useTeams`) y muestra las primeras 10 filas con escudo + nombre + puntos. Botón "Ver completa" → `/clasificacion`.
  - **Últimos 5 partidos**: ordenar `matches` por `match_date` desc y mostrar 5 con escudos pequeños y resultado. Botón "Ver historial" → `/historial`.
- En móvil/tablet (<`lg`), las tarjetas se muestran apiladas debajo del texto.
- El vídeo de YouTube se queda como está (sección aparte, ancho completo centrado).

### 5. Local/visitante alternado para empates

Regla nueva (sustituye al hash aleatorio): para cada empate, si el partido **anterior** (cronológicamente, sea empate o no) lo jugó como local, ahora le toca de visitante; y viceversa. Independiente del partido siguiente.

- En `src/pages/MatchHistory.tsx` ya no usaremos `hashHome`. Calcularemos un mapa `matchId → localTeamId` recorriendo todos los partidos en orden ascendente:
  - Mantener `lastVenue: Map<teamId, "home" | "away">`.
  - En partidos no empate: el resultado se sigue registrando con winner/loser; pero también determinamos quién es local con la misma regla de alternancia (para mantener coherencia visual).
  - En empates: el equipo que jugó de visitante en su partido anterior es ahora local; si es el primer partido del equipo, se asigna por orden alfabético (estable).
  - Tras decidir, actualizar `lastVenue` para ambos equipos.
- El cálculo se hace una sola vez con `useMemo` en `MatchHistory.tsx`.

### 6. Buscador de partidos por equipo

En `src/pages/MatchHistory.tsx`, añadir encima del selector de década:
- Un `Input` con icono de búsqueda y autocompletado básico (o un `Combobox` similar al `TeamCombobox` del admin) para elegir un equipo.
- Si hay equipo seleccionado: ocultar la navegación por décadas y mostrar **todos** los partidos de ese equipo (winner_team_id == teamId OR loser_team_id == teamId), ordenados por fecha desc, en la misma tabla.
- Botón "Limpiar" para volver a la vista por décadas.

### Detalles técnicos / archivos tocados

- Migración SQL nueva: tablas `player_stats_alltime`, `goalkeeper_stats_alltime`, RLS, índice único por nombre, backfill desde tablas existentes.
- `src/pages/Admin.tsx`: upsert al all-time en `bumpField` y `registerCleanSheet`.
- `src/pages/Stats.tsx`: rama "Histórico" lee de las tablas all-time.
- `src/components/Header.tsx`: fondo sólido.
- `src/assets/hero/*.jpg`: 5–7 imágenes históricas de fútbol.
- `src/pages/Home.tsx`: hero rediseñado (carrusel + logo grande), layout 2 columnas con widgets de Top 10 y últimos 5 partidos.
- `src/pages/MatchHistory.tsx`: regla alternancia local/visitante, buscador por equipo.

### Pregunta abierta

Cuando un equipo aparece en su **primer** partido y es empate, no hay "partido anterior" para alternar. Lo resolveré asignando local al equipo cuyo nombre va antes alfabéticamente (criterio estable y sin aleatoriedad). Si prefieres otra regla (p.ej. siempre el winner_team_id como local en el primer empate), avísame.
