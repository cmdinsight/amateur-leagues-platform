# LigaPro — plataforma para ligas deportivas amateur

Creado por [**CMD Tech**](https://cmdtech.uy). Prototipo funcional de una plataforma tipo "Liga del
Rey / Zione", pero pensada como producto white-label: cada liga cliente tiene
su propia marca (nombre, colores, logo), puede organizar varias divisiones y
torneos con distintos sistemas de competencia, y el **historial de cada
jugador y equipo viaja con ellos** a través de divisiones, torneos e incluso
otras ligas de la plataforma — algo que las plataformas de referencia no
ofrecen (su historial vive aislado dentro de cada liga/torneo).

## Qué incluye este prototipo

- **Multi-tenant real**: cada liga vive en su propia ruta (`/guadalupe`,
  `/centenario`, ...) con sus colores y logo aplicados a toda la interfaz.
- **Divisiones**: cada liga puede tener varias divisiones (Primera, Segunda,
  ...), cada una con sus propios equipos y torneos.
- **Torneos configurables por división**: nombre, sistema (liga todos-contra-
  todos, fase de grupos, o eliminación directa) y cupo máximo de equipos.
  Los grupos se crean y se asignan equipos desde el panel admin.
- **Tabla de posiciones y goleo** calculados automáticamente por torneo (y por
  grupo, si el torneo usa fase de grupos).
- **Estadísticas acumuladas** a nivel de división y de liga completa (goles
  totales, partidos jugados, equipos y jugadores), sin importar en qué
  torneo o división hayan ocurrido.
- **Jugadores y equipos globales**: un jugador puede jugar en varios equipos
  a lo largo del tiempo, incluso en divisiones o ligas distintas, y su perfil
  (`/jugador/[id]`) suma su historial completo automáticamente.
- **Panel de administración** (`/admin`) por liga, protegido con contraseña:
  - Editar marca (nombre, ciudad, logo, colores) con vista previa instantánea.
  - Crear divisiones y torneos (definiendo su sistema y cupo de equipos).
  - Inscribir equipos a un torneo (y asignarlos a un grupo si aplica).
  - Programar partidos y capturar resultados y goleadores.

## Stack

- Next.js 16 (App Router, Server Actions) + TypeScript + Tailwind CSS
- Prisma ORM sobre PostgreSQL (Neon)

## Cómo correrlo localmente

```bash
npm install
cp .env.example .env   # agrega tu propia cadena de conexión de Postgres
npx prisma migrate dev
npm run db:seed        # crea 2 ligas de ejemplo con divisiones, torneos y partidos
npm run dev
```

Abre `http://localhost:3000`.

- Ligas de ejemplo: `/guadalupe` (2 divisiones) y `/centenario` (1 división
  con fase de grupos).
- Admin de cada liga: `/admin/guadalupe` o `/admin/centenario`, contraseña
  `demo1234` (definida por liga en el modelo `League.adminPassword`; en
  producción debe reemplazarse por autenticación real y contraseñas hasheadas).

## Despliegue

El proyecto está desplegado en Vercel apuntando a una base de datos Postgres
en Neon. Para que el build y el runtime funcionen ahí, configura en el
proyecto de Vercel (Settings → Environment Variables) una variable
`DATABASE_URL` con la cadena de conexión (pooled) de Neon.

## Próximos pasos sugeridos para llevarlo a producción

- Autenticación real (hash de contraseñas, roles por liga, múltiples admins).
- Subida de logos/imágenes (hoy se pega una URL) a un storage tipo S3.
- Subdominios por liga (`guadalupe.tuplataforma.com`) en vez de `/guadalupe`.
- Registro de tarjetas (amarillas/rojas) y sanciones desde el panel admin.
- Generación automática de llaves/brackets para el formato de eliminación
  directa (hoy los partidos de cada etapa se programan manualmente).
- App/vista optimizada para móvil o app nativa, como la competencia.
- Roles: super-admin de la plataforma (tú) vs. admin de cada liga (tu cliente).
