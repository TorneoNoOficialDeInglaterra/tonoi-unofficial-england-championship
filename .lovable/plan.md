# Bandera pegada al nombre recortado en móvil

## Cambios
- En cada fila del historial, agrupar bandera y nombre en un mismo bloque para que la bandera quede siempre justo al lado del texto, aunque el nombre se recorte con puntos suspensivos.
- La bandera nunca se encoge ni desaparece; solo se recorta el nombre.
- Local: bandera, nombre recortado y escudo, todo pegado al marcador. Visitante: lo mismo en espejo.
- Comprobar en tamaño móvil con nombres largos.

## Detalle técnico
- Solo `src/pages/MatchHistory.tsx`.
- Envolver bandera + nombre en un `div` `flex min-w-0 items-center gap-1` con el nombre `truncate min-w-0` y la bandera `shrink-0`, para que el bloque mida lo que mide el texto y no ocupe todo el ancho disponible.
