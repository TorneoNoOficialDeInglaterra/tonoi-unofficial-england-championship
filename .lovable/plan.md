# Logo de ToNOI en los resultados de Google

## Objetivo
Hacer que Google pueda mostrar el escudo oficial de ToNOI junto al resultado de la web, sustituyendo el icono antiguo de Lovable señalado en la captura.

## Cambios
- Preparar el escudo de ToNOI como favicon cuadrado y compatible con Google, incluyendo los tamaños habituales y el formato `.ico` de respaldo.
- Actualizar la cabecera de la web para declarar explícitamente el icono principal y sus variantes.
- Mantener el logo actual de ToNOI como identidad visual, sin modificar el diseño de la página.
- Verificar que todos los iconos se sirven correctamente y que la página compilada referencia el logo de ToNOI.

## Resultado esperado
Los navegadores y los próximos rastreos de Google encontrarán el logo correcto. El cambio en los resultados de búsqueda no es inmediato ni se puede garantizar su fecha: Google mantiene su propia caché y decide cuándo volver a rastrear y mostrar el favicon, normalmente tras varios días o semanas.

## Detalles técnicos
- El proyecto ya tiene un PNG cuadrado de 500 × 500 y un favicon ICO de 256 × 256.
- La referencia actual apunta a `/logo.png`; se reforzará con declaraciones `icon` compatibles y coherentes para evitar que Google reutilice el icono histórico.
