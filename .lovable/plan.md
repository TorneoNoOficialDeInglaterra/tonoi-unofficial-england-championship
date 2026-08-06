# Selector de idioma (Español / Inglés / Italiano)

Sí, es totalmente factible. Se añade un botón de idioma en la barra superior, a la derecha del sobre de Contacto, con Español como idioma por defecto.

## Qué verás

- Nuevo botón con icono de globo (y el código del idioma: ES / EN / IT) a la derecha del sobre. Al pulsarlo se abre un pequeño menú con Español, English, Italiano.
- El idioma elegido se recuerda en el navegador, así que al volver a entrar se mantiene.
- Al cambiar de idioma se traduce toda la interfaz pública: menú de navegación, portada, clasificación (cabeceras, leyenda, sistema de puntuación), historial de partidos (filtros, décadas, marcadores históricos, estados de partido), estadísticas, historia del torneo, contacto y preguntas frecuentes.
- Los datos siguen igual en los tres idiomas: nombres de clubes, jugadores, estadios, resultados y fechas (las fechas se formatean según el idioma).
- Preguntas frecuentes: en el panel de administrador cada pregunta tendrá, además del español, campos opcionales para inglés e italiano. Si una traducción está vacía, se muestra el texto en español como respaldo.
- El panel de administrador se queda solo en español, como pediste.

## Detalles técnicos

- Añadir `i18next` + `react-i18next` con detección/persistencia en `localStorage`, y tres ficheros de traducción (`src/i18n/es.json`, `en.json`, `it.json`) organizados por página.
- `src/i18n/index.ts` inicializa i18n en `src/main.tsx`; idioma por defecto y fallback: `es`.
- Nuevo `src/components/LanguageSwitcher.tsx` (DropdownMenu de shadcn) insertado en `src/components/Header.tsx` tras el botón de Contacto; también accesible en el menú lateral móvil.
- Reemplazar los textos fijos por `t("clave")` en: `Header`, `Footer`, `Home`, `Standings`, `MatchHistory`, `Stats`, `History`, `Contact`, `Faq`, `NotFound`, `Unsubscribe`, `ScrollToTopButton` (aria-labels incluidos).
- Formato de fechas y números con el locale activo (`date-fns` locales `es`, `enGB`, `it`).
- Migración en la tabla `faqs`: columnas `question_en`, `answer_en`, `question_it`, `answer_it` (nullable, texto). Sin cambios de RLS ni de permisos más allá de lo ya existente.
- `Faq.tsx` elige el par pregunta/respuesta según idioma con respaldo al español; el formulario de FAQ del admin añade los cuatro campos nuevos.
- SEO: actualizar `<html lang>` y el `title`/`meta description` según el idioma activo.
