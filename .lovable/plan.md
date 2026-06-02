## Objetivo

Ajustar el generador de imágenes del panel de administrador para que:

1. Las plantillas dejen de pintar elementos que **ya vienen en el fondo** (escudos ToNOI, palabra "RESULTADO", recuadros del marcador, marcos, "@ToNOI_oficial", "SHEFFIELD STEELWORKS"…). Solo se superponen los datos dinámicos.
2. Las posiciones de escudos de equipos, logo de competición, marcador, goleadores, fecha, hora y estadio respeten las referencias subidas en `public/social/examples/`.
3. Aparezca un **selector de liga doméstica** (Premier, LaLiga, Bundesliga, Serie A, Ligue 1, Eredivisie, Primeira Liga) solo cuando la plantilla elegida sea "liga". El logo que se pinta encima del fondo será el de esa liga.
4. La tipografía se aproxime a la de IbisPaint con Google Fonts.

No se toca lógica de negocio (puntuación, clasificación, BD); solo el generador.

---

## Cambios

### 1. Logos de ligas domésticas

- Añadir nuevo tipo `DomesticLeague` con: `premier`, `laliga`, `bundesliga`, `serie-a`, `ligue-1`, `eredivisie`, `primeira-liga`.
- Esperar los PNGs en `public/social/competitions/leagues/{premier,laliga,bundesliga,serie-a,ligue-1,eredivisie,primeira-liga}.png`. El usuario los subirá.
- Etiquetas y mapping en `shared.ts` (`LEAGUE_LABELS`, `LEAGUE_ASSETS`).

### 2. UI del generador (`ImageGenerator.tsx`)

- El selector "Competición" sigue: LaLiga (renombrado a "Liga doméstica"), Champions, Europa, Copa, Conference.
- Cuando `competition === "liga"` aparece un **segundo selector** "Liga" con las 7 opciones de arriba.
- Variante (LaLiga 1 vs 2) se sigue eligiendo automáticamente alternando/aleatorio igual que ahora.

### 3. Plantillas — reescritura limpia

Quitar de todas las plantillas: logos ToNOI superpuestos, título "RESULTADO", caja/recuadro de marcador, footer "@ToNOI_oficial", "SHEFFIELD STEELWORKS" y marcos. Todo eso ya está en el JPG de fondo.

Mantener: imagen de fondo `templates/*.jpg` a 1080×1080 cubriendo todo + capa con los datos posicionados según el ejemplo correspondiente.

Coordenadas inspiradas en cada ejemplo (medidas aprox sobre 1080×1080):

**`ResultadoLiga1`** (sobre `resultado-laliga-1.jpg`, fondo sepia con escudos ToNOI ya impresos)
- Logo de liga centrado arriba (~y 150, h 130) — usa `LEAGUE_ASSETS[league]`.
- Escudo local: izquierda (x 180, y 480, size 240).
- Escudo visitante: derecha (x 660, y 480, size 240).
- "V" centrada (~y 540, Cinzel/Playfair 100, navy).
- Marcador "h-a" centrado (~y 800, 120pt, navy).
- Goleadores local alineados derecha sobre marcador (col izquierda, y 800).
- Goleadores visitante alineados izquierda (col derecha, y 800).
- Estadio + fecha centrados (~y 980).

**`ResultadoLiga2`** (sobre `resultado-laliga-2.jpg`, fondo crema con dos cajas y banda azul inferior)
- Logo de liga centrado (~y 180, h 90).
- Escudos en posiciones de los huecos pintados (local x 140 y 360 size 280; visitante x 660 y 360 size 280).
- "V" centrada (~y 470).
- Nombres de equipos dentro de las cajas pintadas (~y 740, centrados, serif).
- Marcador grande centrado (~y 900, 110pt).
- Goleadores local izquierda / visitante derecha a la misma altura.
- Fecha + estadio centrados en la banda azul (~y 1000, blanco).

**`ResultadoChampions`** (sobre `resultado-champions.jpg`, ya tiene "RESULTADO" y ToNOI y barra de marcador)
- Logo Champions centrado arriba (~y 260, h 200).
- Escudos: local (x 110 y 470 size 260), visitante (x 710 y 470 size 260).
- "V" centrada (~y 560, blanco, serif).
- Marcador grande centrado en la barra azul (~y 780, blanco, 110pt).
- Goleadores a izquierda y derecha del marcador (blanco).
- Fecha/hora + estadio centrados abajo (~y 920, blanco).

**`ResultadoEuropa`** (sobre `resultado-europa.jpg`, tablón inferior y superior, naranja)
- Logo Europa centrado (~y 530, h 140).
- Escudos: local (x 100 y 680 size 260), visitante (x 720 y 680 size 260).
- "V" centrada (~y 770, oscuro).
- En el tablón inferior: estadio arriba (~y 1130, negro), marcador centro (~y 1260, 110pt), goleadores izq/der, fecha+hora abajo (~y 1430).

**`ResultadoCopa`** (sobre `resultado-copa.jpg`)
- Fecha/hora/estadio centrados arriba (~y 200, navy).
- Logo Copa centrado (~y 360, h 160).
- Escudos: local (x 110 y 510 size 280), visitante (x 690 y 510 size 280).
- "V" centrada (~y 600).
- Caja inferior crema: marcador grande centro (~y 950, 110pt), goleadores local izq y visitante der.

**`AnuncioPartido`** — pendiente del diseño definitivo, mantener layout actual pero limpiar también logos ToNOI duplicados; añadir uso del logo de liga cuando la competición sea "liga".

### 4. Fuentes

Cargar en `index.html` (ya hay Playfair Display y Cinzel; añadir):
- `Cormorant Garamond` (serif elegante para Copa).
- `UnifrakturCook` (gótico para Europa "RESULTADO" — pero ya está pintado, solo lo usamos en goleadores serif si encaja).
- `Montserrat` (sans Champions).
- `Lora` (serif crema Liga2).

Asignación por plantilla:
- Liga 1: `Playfair Display` + `Cinzel` (V).
- Liga 2: `Cinzel` títulos + `Lora` body.
- Champions: `Montserrat` (sans-serif blanco).
- Europa: `Cormorant Garamond` (serif inglés clásico).
- Copa: `Cinzel` títulos + `Cormorant Garamond` body.

### 5. Formato de fecha

Las plantillas en inglés (Champions, Copa, Europa) usan `formatDateEn` ("Wednesday, 14th January 2026, 21:00h"). Las plantillas en español (Liga 1 y 2) usan `formatDateEs`.

---

## Archivos a tocar

- `src/components/social/templates/shared.ts` — añadir `DomesticLeague`, `LEAGUE_LABELS`, `LEAGUE_ASSETS`, `domesticLeague` opcional en `TemplateData`.
- `src/components/social/ImageGenerator.tsx` — segundo selector + pasar `domesticLeague`.
- `src/components/social/templates/ResultadoLaLiga1.tsx` → renombrar a `ResultadoLiga1.tsx`, reescribir limpio.
- `src/components/social/templates/ResultadoLaLiga2.tsx` → `ResultadoLiga2.tsx`, reescribir limpio.
- `src/components/social/templates/ResultadoChampions.tsx` — reescribir limpio.
- `src/components/social/templates/ResultadoEuropa.tsx` — reescribir limpio.
- `src/components/social/templates/ResultadoCopa.tsx` — reescribir limpio.
- `src/components/social/TemplateRenderer.tsx` — actualizar imports.
- `index.html` — añadir Google Fonts (`Montserrat`, `Cormorant Garamond`, `Lora`).

## Assets que debes subir tú

- `public/social/competitions/leagues/premier.png`
- `public/social/competitions/leagues/laliga.png` (o reutilizar el actual)
- `public/social/competitions/leagues/bundesliga.png`
- `public/social/competitions/leagues/serie-a.png`
- `public/social/competitions/leagues/ligue-1.png`
- `public/social/competitions/leagues/eredivisie.png`
- `public/social/competitions/leagues/primeira-liga.png`

Si falta alguno, el generador mostrará un hueco vacío en ese sitio.
