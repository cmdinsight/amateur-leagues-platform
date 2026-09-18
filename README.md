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
- **Panel de administración** (`/admin/<slug-de-tu-liga>`) por liga, protegido
  con contraseña:
  - Editar marca (nombre, ciudad, logo, colores) con vista previa instantánea.
  - Crear divisiones y torneos (definiendo su sistema y cupo de equipos).
  - Crear equipos, cargar jugadores nuevos o sumar uno que ya juega en otro
    equipo de la misma liga (sin perder su historial).
  - Inscribir equipos a un torneo (y asignarlos a un grupo si aplica).
  - Programar partidos y capturar resultados, goleadores y convocatoria.
  - Logos, escudos y fotos se suben como archivo real (Vercel Blob), no como
    URL.
- **Landing de la plataforma** (`/`) con un formulario de "Solicitá tu liga"
  para clientes nuevos, y un panel privado (`/admin/solicitudes`) para ver
  esas solicitudes. `/admin` (sin liga) ya no lista las ligas existentes —
  solo pide el identificador de la que querés administrar, para no exponer
  qué clientes reales usan la plataforma.

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
- Solicitudes de nuevos clientes: `/admin/solicitudes`, contraseña
  `cmdtech2026` (o la que definas en la variable `PLATFORM_ADMIN_PASSWORD`).

## Despliegue

El proyecto está desplegado en Vercel apuntando a una base de datos Postgres
en Neon. Para que el build y el runtime funcionen ahí, configura en el
proyecto de Vercel (Settings → Environment Variables) una variable
`DATABASE_URL` con la cadena de conexión (pooled) de Neon.

La carga de logos, escudos y fotos usa Vercel Blob. Hace falta un Blob
store conectado al proyecto (Storage → Create Database → Blob, acceso
**Public**, con la opción "Add a read-write token env var to this
connection" tildada) para que quede configurada la variable
`BLOB_READ_WRITE_TOKEN`.

Cada solicitud del formulario "Solicitá tu liga" queda guardada en la base
(visible en `/admin/solicitudes`) y, si está configurada la variable
`RESEND_API_KEY` (cuenta en [resend.com](https://resend.com)), además se
envía un email de aviso a `administracion@coberturamedicad.com` (o a la
dirección que definas en `CONTACT_NOTIFY_EMAIL`).

**Importante:** mientras la cuenta de Resend no tenga un dominio propio
verificado, el remitente de prueba `onboarding@resend.dev` solo puede
entregar emails a la casilla con la que te registraste en Resend — a
cualquier otra dirección (como `administracion@coberturamedicad.com`) el
envío va a fallar. Para que llegue de verdad hay que verificar un dominio
de CMD Tech en Resend (Domains → Add Domain) y configurar
`RESEND_FROM_EMAIL` con una dirección de ese dominio.

## Próximos pasos sugeridos para llevarlo a producción

- Autenticación real (hash de contraseñas, roles por liga, múltiples admins).
- Subdominios por liga (`guadalupe.tuplataforma.com`) en vez de `/guadalupe`.
- Registro de tarjetas (amarillas/rojas) y sanciones desde el panel admin.
- Generación automática de llaves/brackets para el formato de eliminación
  directa (hoy los partidos de cada etapa se programan manualmente).
- App/vista optimizada para móvil o app nativa, como la competencia.
- Roles: super-admin de la plataforma (tú) vs. admin de cada liga (tu cliente).
