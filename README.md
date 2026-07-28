# COELI BARBER CLUB

Plataforma de reservas online para **COELI BARBER CLUB** — barbería premium en Costa Rica.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Prisma 7 + PostgreSQL (Supabase)
- Supabase Auth
- Server Actions + Zod
- WhatsApp Business Cloud API (Fase 6)
- Deploy: Vercel

## Arquitectura

```
app/           → rutas (marketing, reserva, admin, auth, seo)
components/    → UI compartida + shadcn
features/      → módulos por dominio (UI)
actions/       → Server Actions
services/      → lógica de dominio
schemas/       → validaciones Zod
lib/           → prisma, supabase, env, utils
utils/         → fechas, dinero, overlap
prisma/        → schema + seed + migrations
```

## Reglas de negocio (confirmadas)

| Regla | Valor |
|-------|--------|
| Horario | Lun–Sáb 9:00–20:00 |
| Almuerzo | 12:00–13:00 (no reservable) |
| Última cita | Inicio máximo 19:00 (cualquier duración) |
| Buffer | 0 |
| Intervalo base de inicio | 30 min + huecos al terminar citas (ej. 9:45) |
| Barbero inicial | Kaled Barrantes |
| Teléfono | +506 7193-6588 |
| Mapa | [Google Maps](https://maps.app.goo.gl/pHUVWPaKvmfoYpyJ7?g_st=ic) |

## Setup local

1. Copia variables de entorno:

```bash
cp .env.example .env
```

2. Completa `DATABASE_URL` y `DIRECT_URL` desde Supabase.

3. Instala dependencias (si aún no):

```bash
npm install
```

4. Genera el cliente Prisma y aplica el schema:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. Arranca el servidor:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Desarrollo |
| `npm run build` | Build producción |
| `npm run db:generate` | Genera Prisma Client |
| `npm run db:push` | Sincroniza schema (dev) |
| `npm run db:migrate` | Migraciones |
| `npm run db:seed` | Seed (Kaled Barrantes + 10 servicios + horarios) |
| `npm run db:studio` | Prisma Studio |

## Roadmap

- [x] **Fase 0** — Fundación (scaffold, Prisma, seed, estructura)
- [ ] **Fase 1** — Disponibilidad + citas (server)
- [ ] **Fase 2** — Wizard de reserva (UI)
- [ ] **Fase 3** — Landing premium
- [ ] **Fase 4** — Auth + Admin core
- [ ] **Fase 5** — Admin configuración + analytics
- [ ] **Fase 6** — WhatsApp + cron recordatorios
- [ ] **Fase 7** — Hardening + producción

## Notas

- Los precios se guardan en colones enteros (`priceCrc`).
- `endAt` = `startAt` + `durationMinutes` del servicio.
- El schema soporta múltiples barberos sin cambios de base de datos.
