# Clasificaciones nacionales

## Qué se construye

1. **Menú lateral**: "Clasificación" pasa a ser un desplegable con dos entradas:
   - Clasificación histórica (la actual)
   - Clasificaciones nacionales (nueva)

2. **Clasificación histórica**: se mantiene igual y se le añade a la leyenda un bloque con el sistema de puntuación (victoria 2 puntos, empate del campeón 1 punto, empate del retador 0 puntos y cuenta como derrota, derrota 0 puntos, penaltis 2/0).

3. **Clasificaciones nacionales**: pantalla con una rejilla de recuadros, uno por país (bandera + nombre del país + nº de equipos). Al pulsar uno se muestra la misma tabla de clasificación pero filtrada solo a los equipos de ese país, con las posiciones renumeradas 1..N. Botón para volver a la rejilla de países.

4. **Nacionalidad de cada equipo**: nuevo campo de país en la base de datos, rellenado en una primera pasada automática para los 904 equipos. En el panel de admin, en la fila de cada equipo, un selector de país (buscable, con bandera) para corregir errores; los equipos sin país asignado se marcan visualmente para que sean fáciles de localizar.

5. **Banderas junto al nombre**: en la clasificación histórica, en las nacionales y en el selector de equipos aparecerá la bandera del país al lado del nombre del equipo.

## Detalles técnicos

- **Base de datos**: migración que añade `teams.country_code text` (ISO 3166-1 alpha-2, minúsculas, p. ej. `es`, `gb-eng`, `it`) con índice. Para Reino Unido se usan códigos de nación futbolística (`gb-eng`, `gb-sct`, `gb-wls`, `gb-nir`) porque el torneo tiene muchos clubes ingleses/escoceses.
- **Asignación inicial**: script de una sola ejecución que clasifica los 904 nombres de equipo por diccionario de patrones (sufijos y palabras clave: FC/CF, SC, AFC, SpVgg, Olympique, Real/CD/UD, US/AC/SS, Sporting/SC portugués, etc.) más una pasada por Lovable AI en lotes para los nombres que el diccionario no resuelva, y aplica los `UPDATE` en la base de datos. Los residuales quedan sin país y se editan a mano en admin.
- **Catálogo de países** en `src/lib/countries.ts`: código, nombre (clave i18n), y bandera vía `flagcdn.com/w40/<code>.png` con fallback a emoji.
- **Componente** `TeamFlag` (bandera + tooltip con el país) reutilizado en tablas y comboboxes; `Team` en `src/lib/tonoi.ts` gana `country_code?: string | null`.
- **Rutas**: `/clasificacion` (histórica, sin cambios de URL) y `/clasificaciones-nacionales` con `?pais=<code>` para poder compartir enlace directo a un país.
- **Reutilización**: se extrae la tabla actual de `Standings.tsx` a un componente `StandingsTable` (props: filas, campeón, orden) usado por las dos pantallas. El cálculo sigue siendo global: las clasificaciones nacionales filtran las filas ya calculadas, así los puntos y el PcT se mantienen coherentes con el histórico.
- **Admin**: columna "País" en la tabla de equipos con un combobox buscable que guarda `country_code`; refresco de la caché de equipos al guardar.
- **i18n**: nuevas claves en los 7 idiomas para el submenú, títulos de las nacionales, sistema de puntuación de la leyenda y nombres de países usados.
