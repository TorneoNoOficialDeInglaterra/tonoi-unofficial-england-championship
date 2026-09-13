# Alinear marcadores en las imágenes por equipo

## Cambios
- Mantener un ancho fijo para las zonas de local, resultado y visitante en cada fila.
- Recortar los nombres largos con puntos suspensivos sin aumentar la anchura de la columna.
- Conservar todos los resultados centrados y alineados verticalmente entre columnas.
- Verificar la previsualización con equipos de nombres largos y comprobar que la descarga sigue funcionando.

## Detalle técnico
- Ajustar únicamente `src/components/admin/TeamMatchesImage.tsx`.
- Aplicar `minWidth: 0`, `overflow: hidden`, `textOverflow: ellipsis` y un ancho disponible fijo a ambos nombres.
- Mantener la columna central del marcador con anchura estable.
