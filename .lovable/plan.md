# Widget "Próximo partido / En directo" en la página principal

Sí, es viable. Se hará con API-Football (api-sports.io) leída desde el backend, nunca desde el navegador, para no exponer la clave.

## Qué verá el usuario

Una nueva tarjeta en la home, junto a "Campeón actual" y "Último partido", con tres estados:

1. **Próximo partido**: campeón actual vs rival, competición, fecha y hora local, y cuenta atrás.
2. **En directo**: marcador en vivo, minuto de juego (o DESCANSO), lista de eventos (goles con goleador y minuto, tarjetas, cambios) y un aviso destacado del tipo "Con este resultado el título cambia de manos" / "El campeón retiene el título".
3. **Finalizado / sin datos**: resultado final durante unas horas, y si no hay partido localizado, un mensaje neutro ("Sin próximo partido confirmado").

Traducido a los 7 idiomas ya soportados.

## Cómo se determina el próximo partido

Automático: se pide a la API el calendario del **campeón actual del ToNOI** (el que ya calcula `computeStandings`) y se toma su siguiente partido oficial. Para eso cada club necesita su identificador en la API.

- Se añade una columna `api_football_team_id` a `teams`.
- Solo hace falta rellenarla para los clubes que puedan ser campeón (en la práctica, el campeón actual y sus próximos rivales). En el panel de admin habrá un buscador que consulta la API por nombre y guarda el id con un clic.
- Si el campeón actual no tiene id asignado, el widget muestra el estado "sin próximo partido" y el admin ve un aviso para vincularlo.

## Detalle técnico

- **Secreto**: se pedirá tu `API_FOOTBALL_KEY` (plan gratuito de api-sports: 100 peticiones/día, suficiente con caché).
- **Tabla `live_fixtures`** (lectura pública, escritura solo service role): fixture_id, fecha/hora, competición, ids y nombres de local/visitante, escudos, marcador, estado, minuto, `events jsonb`, `updated_at`. Con GRANTs explícitos y RLS.
- **Edge function `sync-live-fixture`**: resuelve el campeón actual, pide a la API su próximo partido y, si está en juego, marcador/minuto/eventos; guarda todo en `live_fixtures`. Cachea: se refresca como máximo 1 vez/minuto en directo y cada ~30 min fuera de partido, respetando el límite diario.
- **Frontend**: hook `useLiveFixture` que lee `live_fixtures` con React Query, se suscribe por Realtime a los cambios de la fila y llama a la edge function cuando el dato está caducado. Nada de llamadas directas a la API desde el cliente.
- **Componente** `src/components/NextMatchWidget.tsx`, insertado en la rejilla de tarjetas de `src/pages/Home.tsx` (la rejilla pasa a 3 columnas en escritorio y sigue apilada en móvil).
- El aviso de cambio de título usa el campeón actual del ToNOI comparado con el marcador en vivo y las reglas ya implementadas en `src/lib/tonoi.ts` (empate = el campeón retiene; penaltis = gana quien pase).
- **Admin**: pequeña sección para vincular el id de API por equipo y un botón "Sincronizar ahora".

## Limitaciones honestas

- La cobertura de ligas del plan gratuito es limitada; si el partido del campeón no está cubierto, el widget cae al estado neutro.
- Los eventos llegan con el retardo de la API (segundos a un par de minutos), no es instantáneo.
