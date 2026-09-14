# LigaPro — plataforma para ligas deportivas amateur

Prototipo funcional de una plataforma tipo "Liga del Rey / Zione", pero pensada
como producto white-label: cada liga cliente tiene su propia marca (nombre,
colores, logo) y todas comparten la misma base, lo que permite que el
**historial de un jugador viaje con él** aunque cambie de equipo o incluso de
liga — algo que las plataformas de referencia no ofrecen (su historial vive
aislado dentro de cada liga).

## Qué incluye este prototipo

- **Multi-tenant real**: cada liga vive en su propia ruta (`/guadalupe`,
  `/centenario`, ...) con sus colores y logo aplicados a toda la interfaz.
- **Tabla de posiciones y goleo** calculados automáticamente a partir de los
  partidos jugados.
- **Calendario** de próximos partidos y resultados.
- **Equipos y plantillas**, con ficha de cada jugador.
- **Perfil global del jugador** (`/jugador/[id]`): goles, tarjetas y
  trayectoria agregados de todas las ligas y equipos en los que ha jugado.
- **Panel de administración** (`/admin`) por liga, protegido con contraseña,
  para:
  - Editar nombre, ciudad, logo y colores de marca (con vista previa
    instantánea en el sitio público).
  - Capturar resultados de partidos y goleadores, lo que recalcula tabla y
    goleo al instante.

## Stack

- Next.js 16 (App Router, Server Actions) + TypeScript + Tailwind CSS
- Prisma ORM sobre SQLite (fácil de migrar a Postgres para producción)

## Cómo correrlo localmente

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run db:seed   # crea 2 ligas de ejemplo con equipos, jugadores y partidos
npm run dev
```

Abre `http://localhost:3000`.

- Ligas de ejemplo: `/guadalupe` y `/centenario`.
- Admin de cada liga: `/admin/guadalupe` o `/admin/centenario`, contraseña
  `demo1234` (definida por liga en el modelo `League.adminPassword`; en
  producción debe reemplazarse por autenticación real y contraseñas hasheadas).

## Próximos pasos sugeridos para llevarlo a producción

- Autenticación real (hash de contraseñas, roles por liga, múltiples admins).
- Subida de logos/imagenes (hoy se pega una URL) a un storage tipo S3.
- Migrar SQLite → Postgres (el schema de Prisma ya es compatible).
- Subdominios por liga (`guadalupe.tuplataforma.com`) en vez de `/guadalupe`.
- Registro de tarjetas (amarillas/rojas) y sanciones desde el panel admin.
- App/vista optimizada para móvil o app nativa, como la competencia.
- Roles: super-admin de la plataforma (tú) vs. admin de cada liga (tu cliente).
