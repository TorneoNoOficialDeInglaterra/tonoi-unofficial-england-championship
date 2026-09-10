# Historial más grande y descarga de partidos por equipo

## 1. Rediseño del historial de partidos

- La caja de partidos pasa a ocupar bastante más pantalla (de ~80% a ~92% de la altura de la ventana), así se ven más partidos de golpe.
- Desaparece la columna de fecha a la izquierda. Ahora cada partido se muestra centrado en el medio:
  - Arriba, en pequeño, la fecha.
  - Debajo, en una sola línea centrada: escudo y nombre del local, el resultado, y el nombre y escudo del visitante.
- Las filas se compactan un poco para aprovechar el espacio, y en móvil los nombres largos se recortan sin romper la línea.
- El icono de información (partidos con nota, como Bastia–Nantes) sigue junto al resultado y abre el mismo cuadro de diálogo.
- Los carteles de las guerras y del COVID se mantienen igual.

## 2. Descarga de imagen con los partidos de un equipo

Nueva pestaña "Partidos por equipo" en el panel de administración:

- Se elige un club con el buscador habitual.
- Se muestra una previsualización de la imagen y un botón para descargarla en PNG.
- La imagen contiene solo la lista de partidos (fecha, local, resultado, visitante), repartida en 2-3 columnas para que no salga desproporcionadamente alta. El número de columnas se ajusta según cuántos partidos tenga el equipo (algunos superan los 200).
- El nombre del archivo incluye el club, por ejemplo `partidos-ecija-balompie.png`.

## Detalle técnico

- `src/pages/MatchHistory.tsx`: la tabla de 4 columnas pasa a una única celda por partido con la fecha encima y la línea local–resultado–visitante centrada; cabecera de tabla simplificada; `max-h-[80vh]` → `max-h-[92vh]`; `BreakRow` con `colSpan={1}`.
- Claves de traducción de `history.table.*` que dejan de usarse se mantienen para no romper otros idiomas; se añade `history.table.match` si hace falta una cabecera única (7 idiomas: es, en, it y los ficheros ca/eu/pt/gl).
- Nuevo `src/components/admin/TeamMatchesImage.tsx`: lista de partidos del equipo obtenida de `useMatches`/`useTeams`, orden descendente por fecha, colocación local/visitante con `buildLocalByMatchMap` y marcador con `sideScore` (misma lógica que el historial). Render en un contenedor oculto y exportado con `toPng` de `html-to-image`, ya presente en el proyecto.
- Columnas: 2 si hay ≤ 60 partidos, 3 en caso contrario, con reparto equilibrado por columna.
- `src/pages/Admin.tsx`: nuevo `TabsTrigger`/`TabsContent` con valor `team-matches`.
- Sin cambios en la base de datos ni en la lógica de clasificación.
