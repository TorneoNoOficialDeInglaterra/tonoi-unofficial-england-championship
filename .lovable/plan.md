# Plan de mejoras ToNOI

## 1. Página principal (Home)

**Hueco entre hero y tarjetas / hero "se come" la parte de abajo**
- Quitar el `-mt-10` que hace que las tarjetas de Campeón / Último partido se solapen con el hero.
- Añadir un `pb-10` extra al hero y un `mt-8` a la sección de tarjetas para tener separación clara.

**Último partido no aparece**
- Causa: en `useMatches` se ordena por `match_date asc, created_at asc`, pero los partidos antiguos (1879, etc.) que se han cargado más tarde quedan al final. El "último partido" se calcula como el último de la lista, no como el más reciente por fecha real.
- Arreglar `computeStandings` para que `lastMatch` sea el partido con la fecha **más reciente** real (`max(match_date)`), no el último del array.

## 2. Header

- Eliminar el botón de YouTube de la cabecera (mantener solo Twitter).
- **Esconder enlace a Admin**: quitar el link "Admin →" del menú lateral. El acceso será sólo escribiendo `croquetasdejamón` en el buscador de la página de Clasificación, que redirigirá a `/admin`.

## 3. Footer

- Cambiar el texto a algo como:
  > © {año} Torneo No Oficial de Inglaterra (ToNOI) — Web oficial del torneo. Creado y gestionado por sus fundadores.

## 4. Clasificación

- **Tabla con scroll propio**: envolver la tabla en un contenedor con `max-h-[70vh] overflow-y-auto` y `thead` con `sticky top-0` para que sólo la tabla baje, no la página entera.
- **Acceso oculto a admin**: si el usuario escribe exactamente `croquetasdejamón` en el buscador, hacer `navigate("/admin")` y limpiar el input.
- **Datos al día**: ya se calculan en cliente con `computeStandings` sobre todos los partidos. Confirmar que `useMatches` invalida cache al añadir partido nuevo (ya lo hace en Admin con `invalidateQueries({ queryKey: ["matches"] })`). Sin cambios estructurales necesarios — sólo verificar.

## 5. Estadísticas

- Aplicar el mismo patrón de **scroll interno** (`max-h-[70vh] overflow-y-auto` + `thead sticky`) a las tablas de jugadores y porteros.

## 6. Historial de partidos

- Quitar la etiqueta "Empate" debajo del marcador en partidos empatados (mantener sólo el resultado).

## 7. Admin — móvil

- En `Admin.tsx`, las pestañas (`TabsList`) se desbordan en móvil y arrastran toda la página.
- Solución: envolver `TabsList` en un contenedor con `overflow-x-auto` propio y `w-full max-w-full`, y poner `whitespace-nowrap` en los triggers. Así sólo la barra de pestañas se desplaza horizontalmente, no la página entera.

## 8. Admin — Añadir partido (simplificado)

Sustituir el formulario actual por uno minimalista:

- **Fecha** (date)
- **Equipo ganador** (Combobox con búsqueda)
- **Equipo perdedor** (Combobox con búsqueda)
- **Resultado completo**: un sólo input tipo texto con formato `X-Y` (ej. `2-1`, `0-0`). Se parsea para deducir `winner_goals` y `loser_goals`. La asignación local/visitante seguirá siendo aleatoria estable como ya lo es en el historial (no se almacena venue), pero el orden del resultado introducido `local-visitante` se podrá interpretar luego en el historial. **Nota**: como el modelo actual sólo guarda `winner_goals` y `loser_goals`, asumimos que el primer número es el del ganador y el segundo el del perdedor (en empates ambos iguales).
- **Empate** (switch) — sin texto de "decidido por penaltis"
- **Eliminar**: notas, switch de "cambio de campeón" (se deduce automáticamente: si el ganador NO era el campeón actual antes de este partido y no es empate, hay cambio).
- **Deducción automática de `title_changed`**: al insertar, calcular el campeón vigente justo antes de `match_date` desde los partidos existentes y comparar con el ganador. Si distinto y no empate ⇒ `title_changed = true`.
- **Combobox con búsqueda** para selección de equipos: usar el componente `Command` de shadcn dentro de un `Popover` (patrón estándar de shadcn Combobox), igual para ganador y perdedor.

## 9. Admin — Jugadores (incremental)

Reemplazar el formulario actual por uno tipo "registro de gol":

- Input **Goleador** (texto, obligatorio)
- Input **Asistente** (texto, opcional)
- Botón "Registrar gol"

Lógica al guardar (en la temporada activa seleccionada):
- Buscar `player_stats` por `season_id` + `player_name` (case-insensitive trim).
  - Si existe ⇒ `update goals = goals + 1`.
  - Si no existe ⇒ `insert { season_id, player_name, goals: 1, assists: 0 }`.
- Si hay asistente, mismo proceso para `assists + 1` en su fila.
- Mantener la tabla resumen debajo (con opción de borrar, sin edición manual de números).

## 10. Admin — Porteros (incremental)

- Input **Portero** + botón "Registrar portería a 0".
- Misma lógica: si existe ⇒ `clean_sheets + 1`; si no ⇒ insert con `clean_sheets: 1`.

## 11. Temporadas — explicación

Las temporadas sirven para agrupar las estadísticas individuales (goleadores, asistentes, porteros) por año futbolístico. La tabla de **clasificación histórica** y los partidos NO dependen de temporadas — son acumulados desde 1879 hasta hoy. Las temporadas sólo afectan a la pestaña **Estadísticas**, donde puedes ver:
- Goleadores/asistentes de la temporada activa.
- Porteros con porterías a 0 de la temporada activa.
- O el "Histórico" que suma todas las temporadas pasadas archivadas.

Cuando termina una temporada, sus datos pueden archivarse a las tablas `_history` para empezar limpia en la siguiente. **Si no quieres usar temporadas**, podemos crear sólo una "Temporada general" permanentemente activa y todo se acumula ahí — dímelo si lo prefieres.

## 12. Página de Contacto

- Nueva ruta `/contacto` con un formulario: nombre, email, mensaje (validado con zod).
- Al enviar, llama a una **edge function** `send-contact-email` que usa el sistema de emails de Lovable (Lovable Cloud Email) para enviar el mensaje a `torneonooficialdeinglaterra@gmail.com`.
- **Pre-requisito**: configurar dominio de email en Lovable Cloud (te aparecerá un diálogo de configuración de dominio la primera vez). Mientras se verifica el DNS, el formulario seguirá guardando los envíos en una tabla `contact_messages` para no perder mensajes.
- Añadir enlace "Contacto" en el menú lateral del header.

## 13. Escudos de equipos

- Recopilar URLs de escudos para todos los equipos existentes en la base de datos.
- Hacer un script de migración tipo `INSERT/UPDATE` que asigne `logo_url` a cada equipo por nombre.
- **Necesito que me confirmes**: ¿quieres que use Wikipedia/Wikimedia Commons como fuente (URLs públicas estables tipo `upload.wikimedia.org/.../escudo.svg`)? Si tienes una fuente preferida o un set ya recopilado, dímelo. Si no, los recopilo yo de Wikipedia para los equipos que ya estén en la base de datos.

---

## Detalles técnicos (resumen)

| Archivo | Cambio principal |
|---|---|
| `src/pages/Home.tsx` | Quitar `-mt-10`, añadir `pb-10`/`mt-8` para separación |
| `src/lib/tonoi.ts` | `lastMatch` = max por `match_date` real (tie-break `created_at`) |
| `src/components/Header.tsx` | Quitar YouTube y enlace Admin |
| `src/components/Footer.tsx` | Nuevo texto "Web oficial / Creado por fundadores" |
| `src/pages/Standings.tsx` | Tabla con `max-h + overflow-y-auto + thead sticky`; trigger oculto admin (`croquetasdejamón`) |
| `src/pages/Stats.tsx` | Mismo patrón sticky en tablas |
| `src/pages/MatchHistory.tsx` | Quitar etiqueta "Empate" |
| `src/pages/Admin.tsx` | TabsList con scroll horizontal aislado; rehacer MatchesAdmin (combobox+resultado), PlayersAdmin (incremental), KeepersAdmin (incremental) |
| `src/components/ui/combobox` (nuevo) | Combobox de shadcn (Command + Popover) reutilizable para selección de equipo |
| `src/pages/Contact.tsx` (nuevo) | Formulario con zod |
| `src/App.tsx` | Ruta `/contacto` |
| `supabase/functions/send-contact-email` (nueva) | Edge function que envía email a la cuenta admin |
| Migración SQL | Crear tabla `contact_messages` (RLS: admin lee, anyone insert) y actualizar `logo_url` de los equipos |

## Preguntas para ti antes de implementar

1. **Escudos**: ¿uso Wikipedia como fuente de URLs o me das tu propio listado?
2. **Resultado del partido**: ¿confirmas que el formato `X-Y` se interpretará como `goles del ganador - goles del perdedor`? (Es lo más simple dado el modelo actual). Si prefieres `local-visitante`, habría que añadir un selector "el ganador era local/visitante".
3. **Temporadas**: ¿quieres mantener temporadas por año o prefieres una sola temporada permanente?
