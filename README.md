# API de licencias revocadas (Vercel gratis)

## Qué hace

La app de escritorio llama a esta URL **cada vez que comprueba la licencia** (al abrir el programa) y pregunta si el `licenseId` está en la lista de revocadas.

## Desplegar en Vercel (gratis)

1. Crea cuenta en [vercel.com](https://vercel.com) (puede ser con GitHub).
2. **New Project** → importa un repo que contenga esta carpeta `license-api`, **o** sube solo esta carpeta como proyecto.
3. **Root directory**: si el repo es solo el monorepo, pon `license-api` como raíz del proyecto en Vercel.
4. En **Environment Variables** añade:
   - `REVOKED_LICENSE_IDS` — lista de UUID revocados, separados por coma, ejemplo:  
     `0528c987-9863-4a80-a704-03d88e0c6979,otro-uuid-aqui`
   - (Opcional) `LICENSE_API_KEY` — una clave larga aleatoria; si la pones, la app debe enviar la misma clave (ver abajo).

5. Deploy. Copia la URL pública, por ejemplo: `https://tu-proyecto.vercel.app`

6. En el PC de desarrollo / variables del instalador, configura la app:
   - `VENTAS_LICENSE_SERVER_URL=https://tu-proyecto.vercel.app`  
   (sin barra final; la app llama a `.../api/check`)

## Actualizar revocaciones (sin tocar código)

1. En Vercel → tu proyecto → **Settings** → **Environment Variables**.
2. Edita `REVOKED_LICENSE_IDS` y añade el nuevo UUID (separado por coma).
3. **Save**. No hace falta redeploy: el siguiente request ya usa el valor nuevo.

## Opcional: clave compartida

Si defines `LICENSE_API_KEY` en Vercel, en la app del cliente define la misma variable:

- `VENTAS_LICENSE_API_KEY=tu_clave_secreta`

La app la envía en la query `?key=` (y el servidor la valida).

## Probar en el navegador

```
https://TU-DOMINIO.vercel.app/api/check?product=ventas-express-ingresos-v1&licenseId=UUID-DE-PRUEBA
```

Respuesta ejemplo: `{"ok":true,"revoked":false,"product":"ventas-express-ingresos-v1"}`

## Alternativas gratis

- **Cloudflare Workers** (mismo patrón: un `fetch` handler).
- **Render** (web service Node pequeño en plan gratuito con cold start).

## Límites

- Plan gratuito de Vercel tiene límites de invocaciones; para muchos clientes abriendo la app a la vez suele ser suficiente en talleres pequeños.
- Si la API no responde, la app puede seguir funcionando según `VENTAS_LICENSE_STRICT` (ver `LICENSE-ACTIVACION.md`).
