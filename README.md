# Obra Clara · Control de obra

App web para que una residente de obra lleve sus obras, las épicas de cada una
(Cimentación, Estructura, Acabados…) y sus tareas, con etiquetas de color según
lo cerca que está cada vencimiento y **avisos al celular** antes de que se venza
una tarea. No tiene login: es una app personal.

- **Inicio:** resumen del día, obras con su avance y lista de “Próximas a vencer”.
- **Obra:** tablero por épica (columnas) o lista agrupada, filtros (Todas, Por
  vencer, Vencidas, Completadas) y búsqueda.
- **Tareas:** marcar como hecha, cambiar estado (Pendiente → En proceso →
  Hecha), editar y eliminar.
- **Colores:** rojo = vencida o vence hoy · naranja = 1 a 3 días · amarillo =
  4 a 7 días · gris = más de una semana.
- **Avisos:** cada mañana a las 6:30 (hora Colombia) llega una notificación con
  lo vencido y lo que vence hoy, mañana o en 3 días.

- **Sin internet:** se instala como app (PWA) y funciona sin señal. Todo lo que
  hagas en obra se guarda en el celular y se envía solo cuando vuelve la
  conexión; arriba aparece “Sin conexión · N cambios por enviar”.

## Cómo está armada

| Pieza         | Qué usa                                | Costo            |
| ------------- | -------------------------------------- | ---------------- |
| Interfaz      | React Router 8 en modo SPA, Tailwind 4 | —                |
| API           | Funciones de Vercel en [`api/`](api)   | Vercel Hobby: $0 |
| Base de datos | Supabase Postgres                      | Free tier: $0    |
| Avisos        | Web Push (VAPID) + Vercel Cron diario  | $0               |

El navegador nunca habla con Supabase directamente: las funciones de `api/`
usan la llave _service role_ en el servidor, y las tablas tienen RLS activo sin
políticas, así que la llave pública no sirve para leer nada.

```
app/            interfaz (rutas, componentes, lógica de fechas en lib/due.ts)
api/            funciones de Vercel: data, projects, epics, tasks, push, cron
server/         código compartido de las funciones (Supabase, web-push)
supabase/       schema.sql para crear las tablas
public/sw.js    service worker: caché de la app sin conexión y notificaciones
scripts/        build-sw.mjs inyecta en sw.js la lista de archivos a precachear
```

### Sin conexión

- **La app:** `pnpm build` corre [`scripts/build-sw.mjs`](scripts/build-sw.mjs),
  que escribe en `build/client/sw.js` la lista de todos los archivos del build.
  El service worker los guarda al instalarse, así que la app abre sin señal.
  Cada despliegue genera una caché nueva y borra la anterior.
- **Los datos:** la última copia del servidor se guarda en `localStorage`.
  Cada cambio se aplica al instante en pantalla y entra a una cola (_outbox_)
  que se envía en orden al volver la señal, al reabrir la app o cada 30
  segundos. Los ids se generan en el celular y la API ignora un “crear”
  repetido, así que reintentar es seguro.
- **Límites:** si se edita la misma tarea en dos dispositivos, gana el último
  cambio que llega al servidor. Activar notificaciones requiere conexión.

> No hay login: quien conozca la URL de la app puede ver y editar los datos.
> No compartas el enlace públicamente.

## Puesta en marcha (una sola vez)

### 1. Supabase

1. Crea una cuenta y un proyecto en [supabase.com](https://supabase.com)
   (plan Free; región `South America (São Paulo)` queda más cerca).
2. Ve a **SQL Editor → New query**, pega [`supabase/schema.sql`](supabase/schema.sql)
   y dale **Run**.
3. En **Project Settings → API** copia la **Project URL** y la llave
   **`service_role`** (no la `anon`).

> El plan Free pausa el proyecto tras 7 días **sin ninguna petición**. El cron
> diario de avisos consulta la base cada mañana, así que en la práctica no se
> pausa.

### 2. Llaves de notificaciones

```bash
pnpm install
pnpm vapid
```

Guarda la _Public Key_ y la _Private Key_. No las cambies después: los celulares
ya suscritos dejarían de recibir avisos.

### 3. Vercel

1. En [vercel.com](https://vercel.com) → **Add New → Project** → importa este
   repositorio. Vercel lee [`vercel.json`](vercel.json); no cambies el preset.
2. En **Settings → Environment Variables** agrega (para _Production_):

   | Variable                    | Valor                                  |
   | --------------------------- | -------------------------------------- |
   | `SUPABASE_URL`              | Project URL de Supabase                |
   | `SUPABASE_SERVICE_ROLE_KEY` | llave `service_role`                   |
   | `VITE_VAPID_PUBLIC_KEY`     | Public Key de `pnpm vapid`             |
   | `VAPID_PRIVATE_KEY`         | Private Key de `pnpm vapid`            |
   | `VAPID_SUBJECT`             | `mailto:tu-correo@…`                   |
   | `CRON_SECRET`               | resultado de `openssl rand -base64 32` |

3. **Deploy.** El cron (`30 11 * * *` UTC = 6:30 a. m. en Colombia) queda
   registrado solo. En el plan Hobby Vercel lo ejecuta una vez al día, en algún
   momento dentro de esa hora.

### 4. En el celular

- **iPhone (iOS 16.4 o más):** abre la URL en Safari → **Compartir → Agregar a
  pantalla de inicio** → abre la app desde el ícono → **Activar
  notificaciones**. En iPhone los avisos solo funcionan desde el ícono.
- **Android:** abre la URL en Chrome → **Activar notificaciones** (y, si quieres,
  menú ⋮ → **Instalar app**).

Al activarlas llega un aviso de prueba. Después puedes usar **Probar aviso**.

## Desarrollo local

```bash
cp .env.example .env   # y llena los valores
pnpm dev
```

`pnpm dev` también sirve las funciones de `api/` (un plugin en
[`vite.config.ts`](vite.config.ts) las monta igual que Vercel), así que no
necesitas `vercel dev`. Las notificaciones push requieren HTTPS o `localhost`.

| Script           | Qué hace                             |
| ---------------- | ------------------------------------ |
| `pnpm dev`       | App + API en `http://localhost:5173` |
| `pnpm build`     | Build estático en `build/client`     |
| `pnpm typecheck` | Tipos de rutas + `tsc`               |
| `pnpm test`      | Pruebas (Vitest)                     |
| `pnpm vapid`     | Genera un par de llaves VAPID        |

Para disparar el aviso diario a mano en producción:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://TU-APP.vercel.app/api/cron/reminders
```
