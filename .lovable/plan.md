# Generador de imágenes para redes sociales

Nueva pestaña en la pantalla de **Administrador** que genera automáticamente las imágenes de "Próximo partido" y "Resultado" usando las plantillas que enviaste, renderizando HTML/CSS a PNG.

## Plantillas soportadas

- **Anuncio de partido** (1 plantilla)
- **Resultado**:
  - LaLiga: 2 plantillas (alternancia automática)
  - Champions League: 1 plantilla
  - Europa League: 1 plantilla
  - Copa (Carabao/Copa del Rey): 1 plantilla
  - Conference League: pendiente — se deja un hueco preparado para añadirla más tarde

Cada plantilla = un componente React a tamaño fijo **1080×1080** con su fondo, marco, tipografías y posiciones tal como aparecen en los diseños adjuntos.

## Flujo en /admin

Nueva pestaña **"Generar imagen"** con un formulario:

1. **Tipo**: Anuncio del partido / Resultado
2. **Competición**: LaLiga, Champions, Europa League, Copa, Conference *(deshabilitada hasta que subas el diseño)*
3. **Equipo local** (selector con los equipos ya existentes en la BD)
4. **Equipo visitante** (selector)
5. **Fecha y hora** (datetime)
6. **Estadio** (texto libre)
7. Si es resultado:
   - **Goles local** y **goles visitante** (números)
   - **Goleadores**: lista dinámica con botón "+ Añadir goleador" → cada fila tiene: equipo (local/visitante), minuto (texto, p.ej. "90'+3"), nombre del jugador. Botón eliminar por fila.

A la derecha del formulario, **vista previa en vivo** del diseño escalado, y dos botones: **Descargar PNG** y **Copiar al portapapeles**.

## Assets que necesito que subas

Crearé una carpeta `src/assets/social/` con esta estructura. Sube los archivos con esos nombres exactos:

```
src/assets/social/
  logo-tonoi.png                  (escudo ToNOI 1863)
  competitions/
    laliga.png
    champions.png
    europa-league.png
    copa.png                      (Carabao Cup / Copa del Rey)
    conference.png                (opcional, cuando lo tengas)
  templates/
    anuncio-bg.jpg                (fondo del diseño de anuncio)
    resultado-laliga-1.jpg        (fondo plantilla LaLiga estilo "estadio antiguo")
    resultado-laliga-2.jpg        (fondo plantilla LaLiga estilo "Sheffield Steelworks")
    resultado-champions.jpg       (fondo plantilla CL color verde-azulado)
    resultado-europa.jpg          (fondo plantilla EL color naranja/rojo)
    resultado-copa.jpg            (fondo plantilla Copa estilo Stamford Bridge)
```

Los logos de los equipos los toma directamente de `teams.logo_url` en la base de datos (ya están).

## Detalles técnicos

- Librería: **`html-to-image`** (`toPng`) — convierte el componente React a PNG a 1080×1080 sin servidor.
- Componente `<TemplateRenderer />` que recibe `{ type, competition, homeTeam, awayTeam, date, stadium, homeGoals, awayGoals, scorers }` y elige la plantilla correcta.
- Para LaLiga: alternancia entre las 2 plantillas usando un hash determinista (fecha + equipos) para que sea reproducible pero variado.
- Cada plantilla es un componente con su layout propio (no un sistema único parametrizado) para respetar fielmente cada diseño.
- Tipografías: cargar las que mejor encajen con cada plantilla desde Google Fonts (p.ej. Cinzel/serif para Champions, Playfair Display para LaLiga vintage, etc.).
- Resultado se descarga como `tonoi-[tipo]-[fecha]-[local]-vs-[visitante].png`.

## Archivos a crear/editar

- `src/pages/Admin.tsx` — añadir nueva pestaña "Generar imagen"
- `src/components/social/ImageGenerator.tsx` — formulario + preview + descarga
- `src/components/social/templates/AnuncioPartido.tsx`
- `src/components/social/templates/ResultadoLaLiga1.tsx`
- `src/components/social/templates/ResultadoLaLiga2.tsx`
- `src/components/social/templates/ResultadoChampions.tsx`
- `src/components/social/templates/ResultadoEuropa.tsx`
- `src/components/social/templates/ResultadoCopa.tsx`
- `src/components/social/TemplateRenderer.tsx` — selector de plantilla
- Instalar `html-to-image`

## Lo que necesito de ti antes de implementar

Sube los assets listados arriba (logos de competiciones + fondos de cada plantilla + logo del ToNOI en alta resolución). Sin ellos las plantillas saldrán con placeholders.
