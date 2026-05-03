## Problema

El formulario actual tiene campos "Equipo ganador" / "Equipo perdedor" y un resultado tipo `2-1` donde el primer número se asigna al ganador y el segundo al perdedor. Esto es contraintuitivo: cuando metiste Athletic vs Alavés con resultado `2-4` (gana el visitante), el sistema interpretó 2 goles para el "ganador" (Athletic) y 4 para el "perdedor" (Alavés), generando el error.

## Solución

Reestructurar el formulario para usar **Equipo local / Equipo visitante** con un resultado en formato `local-visitante`, y deducir automáticamente quién es ganador y perdedor a partir del marcador.

### Cambios en `src/pages/Admin.tsx` (componente `MatchesAdmin`)

1. Renombrar los selectores: `Equipo ganador` → **Equipo local**, `Equipo perdedor` → **Equipo visitante**. Cambiar estados `winner`/`loser` por `home`/`away`.
2. Cambiar la etiqueta del resultado para dejar claro el orden: **"Resultado (local - visitante)"**, placeholder `Ej: 2-4`.
3. En la función `add()`:
   - Parsear el marcador como `homeGoals - awayGoals`.
   - Si `homeGoals === awayGoals` → tratar como empate automáticamente (sin necesitar el switch). Quitar el switch de "Empate" o dejarlo como solo lectura informativo. Propongo **eliminarlo** ya que el empate se deduce del marcador.
   - Si `homeGoals > awayGoals` → `winner = home`, `loser = away`, `winner_goals = homeGoals`, `loser_goals = awayGoals`.
   - Si `homeGoals < awayGoals` → `winner = away`, `loser = home`, `winner_goals = awayGoals`, `loser_goals = homeGoals`.
   - En empate, mantener `winner_team_id = home`, `loser_team_id = away` (la BBDD requiere ambos NOT NULL) con `was_draw = true` y los goles correspondientes.
4. Recalcular `championAt` y `computedTitleChanged` con los valores derivados (la lógica sigue igual usando winner/loser ya deducidos).
5. Actualizar mensajes de error: validar que ambos equipos sean distintos y que el formato del marcador sea válido. Eliminar las validaciones obsoletas sobre "goles del ganador deben ser mayores".

### Texto auxiliar

Actualizar la nota inferior para reflejar el nuevo flujo: "El ganador y el empate se deducen automáticamente del marcador."

No hay cambios de base de datos: las columnas `winner_team_id`, `loser_team_id`, `winner_goals`, `loser_goals`, `was_draw` se siguen rellenando como hasta ahora, solo cambia la UI y la deducción.