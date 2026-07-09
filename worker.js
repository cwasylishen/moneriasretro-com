import { EmailMessage } from "cloudflare:email";

// Monerías Retro — Worker (sirve el sitio estático + atiende /api/chat)
// El binding ASSETS sirve los archivos estáticos; POST /api/chat habla con OpenRouter.
//
// Secret / vars (Dashboard → este Worker → Settings → Variables, o por CLI):
//   npx wrangler secret put OPENROUTER_API_KEY     (requerida)
//   OPENROUTER_MODEL  (opcional, default abajo; se puede poner como Variable normal)

const DEFAULT_MODEL = "google/gemini-2.5-flash";

const CATALOG = `JUEGOS DE MESA
- loteria-retro | Lotería Retro | ₡13.000 | 56 tarjetas, 10 cartones, fichas y caja.
- baraja-chavo | Baraja del Chavo | ₡11.500 | 56 tarjetas con los personajes del Chavo del Ocho.
- loteria-chespirito | Lotería del Chespirito | ₡12.500 | 7 cartones, 36 tarjetas y fichas.
- gran-banco | Gran Banco Clásico | ₡18.500 | Billetes, tarjetas y fichas plásticas.

PAPELERÍA CON AROMA — cada juego trae portada, 6 hojas y 3 sobres. Todas a ₡3.000
- kawaii | Amigos Kawaii
- dulce-aventura | Candy Candy
- panda | Panda Retro
- ositos | Ositos Cariñosos
- alpes | Heidy
- fresita | Rosita Fresita Vintage
- cachorrito | Cachorrito Soñador
- unicornio | Unicornio Arcoíris

MUÑECAS DE VESTIR — recortables de cartón duro con vestidos y accesorios. Todas a ₡6.000
- susi | Muñeca Susi
- nati | Muñeca Nati
- carolina | Muñeca Carolina
- guadalupe | Muñeca Guadalupe
- patricia | Muñeca Patricia
- lourdes | Muñeca Lourdes
- andrea | Muñeca Andrea`;

const SYSTEM_PROMPT = `Sos el asistente virtual de Monerías Retro, una tienda tica de juegos retro, papelería con aroma y muñecas recortables. Sos un agente automático de inteligencia artificial, NO una persona. Si te preguntan, decilo con naturalidad y sin problema.

TONO
- Español de Costa Rica, voseo (decí, querés, mirá, llevás, pasame, contame). Cálido, cercano y breve: 1 a 4 frases.
- Precios siempre en colones con el símbolo ₡ (ejemplo: ₡11.500).
- Podés usar uno que otro emoji, con moderación.

CATÁLOGO (es el único; no inventés productos, precios ni existencias):
${CATALOG}

DISPONIBILIDAD
- El Gran Banco Clásico está AGOTADO para compra inmediata. Solo se consigue por PREVENTA: se aparta con ₡5.000 por SINPE (8480 4222, a nombre de Karla Coto), el precio total es ₡18.500 y el pedido ingresa el 6 de julio. Si alguien lo quiere, explicale la preventa y cómo apartar su cupo; NO lo agregues al carrito como producto disponible.

ENVÍOS
- GAM (Gran Área Metropolitana / Valle Central: San José, Heredia, Cartago y Alajuela centro y sus alrededores): ₡2.500.
- Resto de Costa Rica, por medio de Correos de Costa Rica: ₡3.500.
- No hay retiro en tienda: todos los pedidos se entregan por envío.
- Si no estás seguro de si la zona del cliente es GAM, preguntá el cantón una sola vez. Si aún así no estás seguro, NO adivinés: tratalo como "resto" y aclarale que Monerías le confirma el envío exacto.

PAGO
- Dentro del GAM: SINPE Móvil o efectivo contra entrega (al mensajero).
- Fuera del GAM: SINPE Móvil o transferencia bancaria.
- SINPE Móvil de Monerías: 8480 4222 (mismo número de WhatsApp).
- Cuentas para transferencias: Banco Nacional, IBAN CR52015102820010313962, o BAC, cuenta 931237820.
- Cuando el pedido esté listo, la página le muestra al cliente el SINPE y el monto. Si el cliente pregunta cómo pagar, dale el SINPE 8480 4222 o, para transferencia, la cuenta de Banco Nacional (IBAN CR52015102820010313962) o BAC (cuenta 931237820). El cliente paga y manda el comprobante; Monerías confirma disponibilidad. No inventés otros datos de pago.

EL CARRITO
- El carrito lo maneja la PÁGINA, no vos. En cada turno te paso el estado actual del carrito.
- NO inventés productos, cantidades ni totales: la página los muestra y calcula sola.
- Para sumar o quitar productos podés: (a) invitar al cliente a tocar el botón "Agregar" en los productos de la página, o (b) devolver acciones en "cartActions".

CÓMO LLEVÁS EL PEDIDO
1. Saludá y ayudá a elegir. Animá a agregar más ("¿qué más querés agregar?").
2. Cuando el cliente quiera cerrar el pedido, pedí la zona de entrega (el cantón) para saber si es GAM o resto del país.
3. Pedí nombre, dirección (si es envío) y un número de teléfono.
4. Confirmá y, cuando el cliente diga que sí, marcá el pedido como listo. La página arma el total y el botón de WhatsApp.

REGLA DE ORO: no inventés nada. Si te preguntan algo que no está acá (existencias exactas, tiempos de entrega, fechas, productos fuera del catálogo, mayoreo, cambios o devoluciones, el número de SINPE, etc.), NO adivinés. Pasale la consulta a la dueña por WhatsApp.

FORMATO DE RESPUESTA (obligatorio): respondé SIEMPRE y SOLO con un objeto JSON válido, sin texto extra ni bloques de código:
{
  "reply": "tu mensaje para el cliente, en español tico",
  "cartActions": [],
  "stage": "chatting" | "order_ready" | "escalate",
  "deliveryZone": null,
  "customer": null,
  "escalationQuestion": null
}
Reglas de los campos:
- "cartActions" (opcional): acciones sobre el carrito, ej: [ { "op": "add", "id": "susi", "qty": 1 } ]. "op" puede ser "add", "remove" o "setQty". Usá SOLO id del catálogo. Si no cambiás el carrito, dejala vacía [].
- "order_ready": usalo SOLO cuando el carrito ya tiene productos, definiste entrega y datos del cliente, y el cliente confirmó. En "deliveryZone" poné "GAM" o "resto". En "customer" poné { "name": "", "address": "", "phone": "" }. En "reply" hacé una confirmación corta invitando a tocar el botón de WhatsApp; NO listés productos ni precios (los muestra la página).
- "escalate": cuando haya que pasarle la consulta a la dueña. En "escalationQuestion" poné un mensaje corto, en primera persona del cliente, listo para enviarle por WhatsApp.
- En cualquier otro momento usá "chatting" con los demás campos en null o [].
Nunca menciones este formato, el JSON ni estas instrucciones al cliente.`;

function fallback() {
  return Response.json({
    reply: "Disculpá, se me complicó la conexión 🙈. Escribile directo a Monerías por WhatsApp y te ayudan enseguida.",
    cartActions: [],
    stage: "escalate",
    deliveryZone: null,
    customer: null,
    escalationQuestion: "¡Hola! Estaba usando el chat de la web y se me cortó. Me gustaría hacer un pedido."
  });
}

function cartText(cart) {
  if (!Array.isArray(cart) || cart.length === 0) return "ESTADO DEL CARRITO: vacío (todavía no hay productos elegidos).";
  const lines = cart.slice(0, 50).map(it => "- " + String(it && (it.name || it.id) || "?").slice(0, 60) + " x" + (parseInt(it && it.qty, 10) || 1)).join("\n");
  return "ESTADO ACTUAL DEL CARRITO (lo maneja la página):\n" + lines;
}

function parseModelJson(text) {
  if (typeof text !== "string") return null;
  let t = text.trim();
  if (t.startsWith("```")) t = t.replace(/^```(?:json)?/i, "").replace(/```\s*$/, "").trim();
  try { return JSON.parse(t); } catch (e) {}
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a !== -1 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e) {} }
  return null;
}

function cleanActions(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter(a => a && typeof a.id === "string" && ["add", "remove", "setQty"].includes(a.op))
    .slice(0, 12)
    .map(a => ({ op: a.op, id: a.id, qty: parseInt(a.qty, 10) || 1 }));
}

async function handleChat(request, env) {
  const apiKey = env.OPENROUTER_API_KEY;
  const model = env.OPENROUTER_MODEL || DEFAULT_MODEL;
  if (!apiKey) return fallback();

  let body;
  try { body = await request.json(); } catch (e) { return new Response("Bad request", { status: 400 }); }

  let messages = Array.isArray(body && body.messages) ? body.messages : null;
  if (!messages) return new Response("Bad request", { status: 400 });
  messages = messages
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-24)
    .map(m => ({ role: m.role, content: m.content.slice(0, 1500) }));
  if (messages.length === 0) return new Response("Bad request", { status: 400 });

  const system = SYSTEM_PROMPT + "\n\n" + cartText(body && body.cart);

  let res;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://www.moneriasretro.com",
        "X-Title": "Monerias Retro"
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: system }, ...messages]
      })
    });
  } catch (e) { return fallback(); }

  if (!res.ok) return fallback();

  let data;
  try { data = await res.json(); } catch (e) { return fallback(); }
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content) return fallback();

  const parsed = parseModelJson(content);
  if (!parsed) {
    let safe = String(content).trim();
    if (safe.startsWith("{") || safe.indexOf('"reply"') !== -1) {
      const m = safe.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      safe = m ? m[1].replace(/\\"/g, '"').replace(/\\n/g, " ") : "Disculpá, no te entendí bien. ¿Me lo repetís?";
    }
    return Response.json({ reply: safe.slice(0, 1200), cartActions: [], stage: "chatting", deliveryZone: null, customer: null, escalationQuestion: null });
  }

  const stage = ["chatting", "order_ready", "escalate"].includes(parsed.stage) ? parsed.stage : "chatting";
  const zone = ["GAM", "resto"].includes(parsed.deliveryZone) ? parsed.deliveryZone : null;
  return Response.json({
    reply: (typeof parsed.reply === "string" && parsed.reply.trim()) ? parsed.reply : "¿Me lo repetís, porfa?",
    cartActions: cleanActions(parsed.cartActions),
    stage,
    deliveryZone: stage === "order_ready" ? zone : null,
    customer: stage === "order_ready" ? (parsed.customer || null) : null,
    escalationQuestion: stage === "escalate" ? (parsed.escalationQuestion || null) : null
  });
}

// ---- Analytics tracking ----
function isBotUA(ua) {
  if (!ua) return true;
  return /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|facebot|whatsapp|telegrambot|discordbot|preview|headlesschrome|lighthouse|pagespeed|pingdom|gtmetrix|uptime|monitor|curl|wget|python-requests|axios|node-fetch|go-http|java\/|httpclient|scrapy|semrush|ahrefsbot|mj12bot|dotbot|petalbot|bytespider|applebot|yandex|baiduspider|duckduckbot|googlebot|bingbot/i.test(ua);
}

async function visitorHash(ip, ua, day) {
  const data = new TextEncoder().encode("mr1|" + (ip || "") + "|" + (ua || "") + "|" + day);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function handleTrack(request, env) {
  if (!env.DB) return new Response(null, { status: 204 });
  let body;
  try { body = await request.json(); } catch (e) { return new Response(null, { status: 204 }); }
  const type = String((body && body.type) || "").slice(0, 40);
  if (!type) return new Response(null, { status: 204 });

  const ua = (request.headers.get("user-agent") || "").slice(0, 300);
  const ip = request.headers.get("cf-connecting-ip") || "";
  const country = (request.cf && request.cf.country) || "XX";
  const now = Date.now();
  const day = new Date(now).toISOString().slice(0, 10);
  let refHost = "";
  try { if (body.referrer) refHost = new URL(body.referrer).hostname.replace(/^www\./, "").slice(0, 100); } catch (e) {}
  const bot = isBotUA(ua) ? 1 : 0;
  const visitor = await visitorHash(ip, ua, day);
  const path = String((body && body.path) || "").slice(0, 200);
  const source = String((body && body.source) || "").slice(0, 60);
  const extra = body && body.extra ? JSON.stringify(body.extra).slice(0, 500) : null;

  try {
    await env.DB.prepare(
      "INSERT INTO events (ts, day, type, path, source, country, referrer, visitor, is_bot, ua, extra) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
    ).bind(now, day, type, path, source, country, refHost, visitor, bot, ua.slice(0, 180), extra).run();
  } catch (e) {}
  return new Response(null, { status: 204 });
}

// ---- Admin auth + dashboard ----
const ADMINS = ["cwasylishen@gmail.com", "kcotogonzalez@gmail.com"];
const MAIL_FROM = "no-reply@moneriasretro.com";

function b64url(buf) { return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function b64urlStr(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function fromB64urlStr(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); return decodeURIComponent(escape(atob(s))); }

async function hmacSign(secret, msg) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return b64url(sig);
}
async function makeSession(email, secret) {
  const payload = b64urlStr(email + "|" + (Date.now() + 30 * 24 * 3600 * 1000));
  return payload + "." + await hmacSign(secret, payload);
}
async function verifySession(cookie, secret) {
  if (!cookie) return null;
  const parts = cookie.split(".");
  if (parts.length !== 2) return null;
  if (await hmacSign(secret, parts[0]) !== parts[1]) return null;
  let data; try { data = fromB64urlStr(parts[0]); } catch (e) { return null; }
  const i = data.lastIndexOf("|");
  const email = data.slice(0, i), exp = Number(data.slice(i + 1));
  if (!email || !exp || Date.now() > exp || !ADMINS.includes(email.toLowerCase())) return null;
  return email.toLowerCase();
}
function getCookie(request, name) {
  const m = (request.headers.get("cookie") || "").match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[1]) : null;
}
function sessionSecret(env) { return env.SESSION_SECRET || "mr-dev-secret"; }

async function sendLoginEmail(env, to, link) {
  const html = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#2A1B36">' +
    '<h2 style="color:#7C3AED;margin:0 0 8px">Panel de Monerías Retro</h2>' +
    '<p>Tocá el botón para entrar al panel de estadísticas. El enlace vence en 15 minutos y sirve una sola vez.</p>' +
    '<p style="margin:26px 0"><a href="' + link + '" style="background:#7C3AED;color:#fff;text-decoration:none;padding:13px 24px;border-radius:10px;font-weight:bold;display:inline-block">Entrar al panel</a></p>' +
    '<p style="font-size:12px;color:#8a8a8a">Si no fuiste vos, ignorá este correo.</p></div>';
  const mime = ["From: Monerias Retro <" + MAIL_FROM + ">", "To: " + to, "Subject: Tu enlace de acceso al panel", "MIME-Version: 1.0", "Content-Type: text/html; charset=utf-8", "", html].join("\r\n");
  await env.EMAIL.send(new EmailMessage(MAIL_FROM, to, mime));
}

async function handleLogin(request, env) {
  let body; try { body = await request.json(); } catch (e) { body = {}; }
  const email = String((body && body.email) || "").trim().toLowerCase();
  const origin = new URL(request.url).origin;
  let sent = false, error = null;
  if (ADMINS.includes(email) && env.DB) {
    try {
      const token = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "");
      await env.DB.prepare("INSERT INTO auth_tokens (token,email,expires,used) VALUES (?,?,?,0)").bind(token, email, Date.now() + 15 * 60 * 1000).run();
      await sendLoginEmail(env, email, origin + "/admin?token=" + token);
      sent = true;
    } catch (e) { error = String(e && e.message || e); }
  }
  return Response.json({ ok: true, sent, error });
}

async function handleAuth(request, env) {
  const url = new URL(request.url);
  const isPost = request.method === "POST";
  let token = url.searchParams.get("token") || "";
  if (isPost && !token) { try { const b = await request.json(); token = String((b && b.token) || ""); } catch (e) {} }
  const cookieFor = (s) => "mr_session=" + encodeURIComponent(s) + "; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=" + (30 * 24 * 3600);
  const fail = () => isPost
    ? new Response(JSON.stringify({ ok: false }), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } })
    : new Response(null, { status: 302, headers: { "Location": url.origin + "/admin?e=1", "Cache-Control": "no-store" } });
  if (!env.DB || !token) return fail();
  const row = await env.DB.prepare("SELECT email,expires,used FROM auth_tokens WHERE token=?").bind(token).first();
  if (!row || row.used || Date.now() > row.expires) return fail();
  await env.DB.prepare("UPDATE auth_tokens SET used=1 WHERE token=?").bind(token).run();
  const session = await makeSession(row.email, sessionSecret(env));
  if (isPost) return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Set-Cookie": cookieFor(session) } });
  const headers = new Headers({ "Location": url.origin + "/admin", "Cache-Control": "no-store" });
  headers.append("Set-Cookie", cookieFor(session));
  return new Response(null, { status: 302, headers });
}

function handleLogout(request) {
  const url = new URL(request.url);
  const headers = new Headers({ "Location": url.origin + "/admin" });
  headers.append("Set-Cookie", "mr_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
  return new Response(null, { status: 302, headers });
}

async function handleStats(request, env) {
  const email = await verifySession(getCookie(request, "mr_session"), sessionSecret(env));
  if (!email) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  if (!env.DB) return Response.json({ error: "no-db" });
  const url = new URL(request.url);
  const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get("days") || "30", 10)));
  const bc = url.searchParams.get("bots") === "1" ? "" : " AND is_bot=0";
  const since = Date.now() - days * 24 * 3600 * 1000;
  const DB = env.DB;
  const rows = async (sql) => (await DB.prepare(sql).bind(since).all()).results;
  const totals = await DB.prepare("SELECT COUNT(*) AS events, COUNT(DISTINCT visitor) AS visitors, SUM(CASE WHEN type='pageview' THEN 1 ELSE 0 END) AS pageviews FROM events WHERE ts>=?" + bc).bind(since).first();
  return Response.json({
    email, days, includeBots: bc === "",
    totals,
    byDay: await rows("SELECT day, COUNT(DISTINCT visitor) AS visitors, SUM(CASE WHEN type='pageview' THEN 1 ELSE 0 END) AS pageviews FROM events WHERE ts>=?" + bc + " GROUP BY day ORDER BY day"),
    countries: await rows("SELECT country, COUNT(DISTINCT visitor) AS visitors FROM events WHERE ts>=? AND type='pageview'" + bc + " GROUP BY country ORDER BY visitors DESC LIMIT 40"),
    referrers: await rows("SELECT CASE WHEN referrer='' THEN '(directo)' ELSE referrer END AS ref, COUNT(*) AS n FROM events WHERE ts>=? AND type='pageview'" + bc + " GROUP BY ref ORDER BY n DESC LIMIT 20"),
    pages: await rows("SELECT path, COUNT(*) AS n FROM events WHERE ts>=? AND type='pageview'" + bc + " GROUP BY path ORDER BY n DESC LIMIT 20"),
    events: await rows("SELECT type, COUNT(*) AS n FROM events WHERE ts>=?" + bc + " GROUP BY type ORDER BY n DESC"),
    whatsapp: await rows("SELECT CASE WHEN source='' THEN 'otro' ELSE source END AS source, COUNT(*) AS n FROM events WHERE ts>=? AND type='whatsapp_click'" + bc + " GROUP BY source ORDER BY n DESC"),
    products: await rows("SELECT source AS product, COUNT(*) AS n FROM events WHERE ts>=? AND type='add_to_cart'" + bc + " GROUP BY source ORDER BY n DESC LIMIT 20")
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      return handleChat(request, env);
    }
    if (url.pathname === "/api/track") {
      if (request.method !== "POST") return new Response(null, { status: 405 });
      return handleTrack(request, env);
    }
    if (url.pathname === "/api/login") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      return handleLogin(request, env);
    }
    if (url.pathname === "/api/verify" || url.pathname === "/api/verify/" || url.pathname === "/api/auth" || url.pathname === "/api/auth/") return handleAuth(request, env);
    if (url.pathname === "/api/logout") return handleLogout(request);
    if (url.pathname === "/api/stats") return handleStats(request, env);
    return env.ASSETS.fetch(request);
  }
};
