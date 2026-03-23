# API de licencias revocadas (Vercel + panel admin)

## Qué hace

- **`GET /api/check`** — la app de escritorio pregunta si un `licenseId` está revocado.
- **Lista de revocados** puede venir de:
  1. Variable **`REVOKED_LICENSE_IDS`** en Vercel (texto con UUID separados por coma), **y/o**
  2. **Upstash Redis** (recomendado): los ID que añades desde el **panel web** `/`.

El panel **`/`** (archivo `public/index.html`) permite agregar/quitar/listar IDs en Redis usando una contraseña **`ADMIN_SECRET`**.

> No se puede escribir en las variables de entorno de Vercel desde un navegador de forma segura. Por eso el panel usa **Redis gratis (Upstash)**.

---

## 1) Upstash Redis (gratis)

1. Cuenta en [upstash.com](https://upstash.com) → **Create database** (Redis).
2. En el dashboard, copia:
   - **REST URL** → `UPSTASH_REDIS_REST_URL`
   - **REST TOKEN** → `UPSTASH_REDIS_REST_TOKEN`

---

## 2) Variables en Vercel

En el proyecto → **Settings** → **Environment Variables**:

| Nombre | Valor |
|--------|--------|
| `UPSTASH_REDIS_REST_URL` | (pegar de Upstash) |
| `UPSTASH_REDIS_REST_TOKEN` | (pegar de Upstash) |
| `ADMIN_SECRET` | una contraseña larga **solo tuya** (para el panel web) |
| `REVOKED_LICENSE_IDS` | *(opcional)* UUID separados por coma; se combinan con Redis |
| `LICENSE_API_KEY` | *(opcional)* misma clave que en la app de escritorio |

**Redeploy** después de añadir variables (o “Redeploy” desde el último deployment).

---

## 3) Panel

Abre la URL de tu proyecto:

`https://TU-DOMINIO.vercel.app/`

- Contraseña = `ADMIN_SECRET`
- Pega el **License ID** y pulsa **Revocar** o **Quitar revocación** o **Listar todo**

### Registro local en Redis (License ID + ID de equipo del cliente)

Además de marcar un UUID como revocado, puedes **guardar en Redis** un registro por licencia:

- **HWID** (mismo “ID de equipo” que copia el cliente en la app de escritorio)
- Opcional: nombre, cédula, nota interna

**Guardar registro (ID + PC)** — `POST /api/admin/upsert-record`  
Body JSON: `{ "secret", "licenseId", "hwid", "clienteNombre?", "clienteCedula?", "note?" }`

**Borrar registro completo** — `POST /api/admin/delete-record`  
Quita el UUID del set de **revocados** (si estaba) **y** borra los metadatos (HWID, etc.) del hash en Redis.  
Body: `{ "secret", "licenseId", "hwid?" }` — si envías `hwid`, debe coincidir con el guardado; si no envías `hwid`, borra sin comprobar.

La lista (**Listar todo**) muestra dos tablas: revocados y registros con HWID.

---

## 4) Probar la API

```
https://TU-DOMINIO.vercel.app/api/check?product=ventas-express-ingresos-v1&licenseId=UUID
```

---

## Estructura

```
license-api/
  package.json          # dependencia @upstash/redis
  public/
    index.html          # panel admin
  api/
    check.js
    _redis.js
    _parseBody.js
    admin/
      revoke.js
      remove.js
      list.js
      upsert-record.js
      delete-record.js
```

---

## Instalación local (opcional)

```bash
cd license-api
npm install
```

Vercel ejecuta `npm install` solo al desplegar.
