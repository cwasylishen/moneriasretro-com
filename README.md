# moneriasretro.com

Tienda online de juegos retro, papelería con aroma y muñecas de vestir. Pedidos por WhatsApp, envíos a todo Costa Rica.

## Stack

Worker de Cloudflare con static assets (no es Pages). Sin build.

- `public/` — el sitio que se sirve (es la carpeta de assets). Nada fuera de `public/` se publica.
  - `public/index.html` — homepage con catálogo completo
  - `public/blog/` — notas y artículos
  - `public/assets/styles.css` — sistema de diseño
  - `public/assets/chat.js` — widget del asistente IA (autocontenido)
  - `public/assets/images/` — fotos de productos
  - `public/_headers` / `public/_redirects`, `public/sitemap.xml`, `public/robots.txt`
- `worker.js` — entrypoint del Worker: sirve `public/` (binding `ASSETS`) y atiende `POST /api/chat`
- `wrangler.toml` — config del Worker + assets

## Deploy

Desde esta carpeta:

```
npx wrangler deploy
```

(o por Git con Workers Builds; lee `wrangler.toml`).

Antes del primer deploy hay que poner la llave de OpenRouter:

```
npx wrangler secret put OPENROUTER_API_KEY
```

o en el Dashboard → el Worker `moneriasretro-com` → Settings → Variables and Secrets. Esto recién se puede porque el Worker ya tiene código (`worker.js`); un Worker de solo static assets no deja agregar variables.

Para probar local con el modelo real: poné `OPENROUTER_API_KEY=sk-or-...` en un archivo `.dev.vars` (no se commitea) y corré `npx wrangler dev`.

## Asistente de chat (IA)

El widget (`public/assets/chat.js`) llama a `/api/chat`, que atiende `worker.js` y consulta a un modelo vía OpenRouter. El pedido armado se envía por WhatsApp desde el propio teléfono del cliente (no se guardan datos). Si el modelo falla, el chat ofrece un botón directo a WhatsApp.

Los botones "Comprar" de cada producto se convierten en "Agregar": suman el producto a un carrito que vive en el cliente (la fuente de la verdad de los items y los totales) y abren el chat. El asistente ayuda a agregar más, junta la entrega y los datos, y al finalizar arma el resumen y el botón de WhatsApp. El carrito se conecta por el nombre del producto (el `<h3>` de la tarjeta tiene que coincidir con `CATALOG` en `public/assets/chat.js`); si un nombre no coincide, ese botón cae de vuelta al enlace original de WhatsApp. El asistente puede sumar o quitar items con `cartActions`, pero los totales siempre los calcula la página.

Variables (Dashboard → Worker → Settings → Variables and Secrets, o por CLI):

- `OPENROUTER_API_KEY` — requerida, como **Secret**.
- `OPENROUTER_MODEL` — opcional. Default: `google/gemini-2.5-flash`. Se puede cambiar sin tocar código (ej. un modelo `:free`).

Catálogo, precios, zonas de envío (GAM ₡2.500 / resto ₡3.500 / retiro gratis en Cartago) y tono viven en el prompt de `worker.js`. Los precios también están en `public/assets/chat.js` para calcular los totales en el cliente; si cambian, actualizá ambos.
