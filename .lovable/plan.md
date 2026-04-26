
# Web del ToNOI — Plan de construcción

Web multipágina dedicada al Torneo No Oficial de Inglaterra. Estética blanca y roja, datos en base de datos propia (Lovable Cloud) con panel admin para que tú edites partidos, jugadores y porteros.

## Estética y layout global

- Paleta blanco / rojo (rojo principal tipo `#C8102E`, fondos blancos, acentos negros).
- Tipografía sans-serif moderna y deportiva.
- Header presente en todas las páginas:
  - Izquierda: botón ☰ (3 rayitas) que abre un menú lateral con todas las páginas.
  - Centro/izquierda: logo del torneo (clic → home) + nombre "ToNOI".
  - Derecha: iconos de redes sociales (Twitter activo enlazando, huecos preparados para añadir más).
- Footer simple con enlace al canal de YouTube y créditos.
- Responsive (móvil + escritorio).

## Páginas

### 1. Inicio (`/`)

- **Tarjeta del campeón actual**: escudo del equipo, nombre con corona 👑, días como campeón (calculado desde la fecha del partido en que ganó el título).
- **Tarjeta del último partido**: fecha, equipos con escudos, resultado.
- **Sección "¿Qué es el ToNOI?"** con el texto que diste, ligeramente ampliado pero conservando idea y reglamento íntegros.
- **Reglamento Oficial** en formato lista destacada.
- **Vídeo de YouTube** embebido (`SpRxKO4BRfk`) debajo.

### 2. Clasificación (`/clasificacion`)

- Calculada en vivo a partir del historial de partidos de la BD (no se introduce a mano).
- Buscador de equipo.
- Encima de la tabla, leyenda de columnas (PJ, V/E/D, P, PPP, GF/GC/DG, PcT, MJ, I, Des, ID).
- Tabla con columnas en este orden: Pos · Escudo · Equipo · PJ · V · E · D · P · GF · GC · DG · PPP · PcT · MJ · I · Des · ID.
- Orden por defecto por puntos; cualquier columna ordenable haciendo clic en su cabecera.
- 👑 al lado del nombre del campeón actual.

### 3. Historial de partidos (`/historial`)

- Agrupado por décadas. Al entrar se muestra la década actual con el último partido arriba.
- Tabla por década con columnas: Fecha · Equipo local (escudo + nombre) · Resultado · Equipo visitante (escudo + nombre).
- Como la BD guarda ganador-perdedor, deducimos local/visitante por el resultado; en empates se asigna aleatoriamente pero **estable** (semilla por id de partido) para que no cambie al refrescar.
- Botones inferiores «← Década anterior» y «Década siguiente →» + selector con todas las décadas.

### 4. Estadísticas individuales (`/estadisticas`)

- Selector de **temporada** arriba (por defecto temporada actual = 2025/2026, con opción "Histórico" acumulado).
- Pestañas:
  - **Goleadores y asistentes**: columnas Jugador · Goles · Asistencias · G+A. Orden por defecto por G+A. Buscador. Cualquier columna ordenable.
  - **Porterías a 0**: columnas Portero · Porterías a 0. Orden por porterías a 0.
- Cuando me digas que ha terminado una temporada, archivamos los datos en una tabla histórica y reseteamos la temporada activa, manteniendo el acumulado consultable desde el desplegable.

### 5. Historia del torneo (`/historia`)

- Página placeholder: «Próximamente». Estilo cuidado, no en blanco.

### 6. Panel admin (`/admin`)

- Login con email/contraseña (Lovable Cloud Auth).
- Solo usuarios con rol `admin` ven el panel (tabla `user_roles` separada).
- Secciones para gestionar: equipos (nombre + URL del escudo), partidos (fecha, equipo A, goles A, equipo B, goles B, penaltis si hubo), jugadores (goles/asistencias por temporada), porteros (porterías a 0 por temporada).
- Botón «Cerrar temporada»: archiva estadísticas individuales en histórico y vacía la temporada activa.

## Datos y backend (técnico)

- **Lovable Cloud (Supabase)** con estas tablas:
  - `teams` (id, nombre, slug, logo_url).
  - `matches` (id, fecha, winner_team_id, loser_team_id, winner_goals, loser_goals, was_draw, penalties_winner_team_id, notes). El campeón después del partido = ganador (o el que retiene si pierde el retador).
  - `seasons` (id, label ej. "2025/2026", is_active, started_at, ended_at).
  - `player_stats` (id, season_id, player_name, team_id?, goals, assists).
  - `goalkeeper_stats` (id, season_id, goalkeeper_name, team_id?, clean_sheets).
  - `player_stats_history`, `goalkeeper_stats_history` (snapshot al cerrar temporada).
  - `user_roles` (id, user_id, role enum) + función `has_role` security definer.
- RLS: lectura pública en datos del torneo; escritura solo `admin`.
- Clasificación derivada en cliente con un único query a `matches` + `teams` (cálculo de PJ, V, E, D, P, GF, GC, DG, PPP, PcT, MJ, I, Des, ID, racha actual y campeón vigente recorriendo partidos en orden cronológico).
- Escudos: campo `logo_url` por equipo, editable en admin. Pre-poblamos los equipos que aparezcan con URLs públicas (Wikipedia/CDN); si alguno no encaja, lo cambias desde admin.
- Datos iniciales: te pediré que pegues/exportes el contenido actual del Sheet (CSV) o lo importamos desde el panel admin con un importador simple.

## Texto "¿Qué es el ToNOI?"

Se conserva íntegro tu texto y reglamento, con una breve introducción ampliada en el mismo tono. Sin inventar reglas nuevas.

## Lo que necesitaré de ti tras aprobar el plan

1. Exportar el Google Sheet a CSV (las 4 pestañas) o hacerlo público temporalmente para una importación inicial — lo más cómodo para ti.
2. Confirmar que quieres login admin con email/contraseña (te crearé el primer admin).
