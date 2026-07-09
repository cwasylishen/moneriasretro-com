/* Monerías Retro — widget de chat + carrito con asistente IA
   El catálogo de la página alimenta un carrito (fuente de la verdad en el cliente).
   El asistente ayuda a agregar más y arma la entrega; el pedido se envía por WhatsApp
   desde el propio teléfono del cliente. Autocontenido: inyecta estilos y HTML.
   Si este script no carga, los botones siguen funcionando como enlaces a WhatsApp. */
(function () {
  "use strict";
  var WA = "50684804222";
  var ENDPOINT = "/api/chat";

  var CATALOG = {
    "loteria-retro": { name: "Lotería Retro", price: 13000 },
    "baraja-chavo": { name: "Baraja del Chavo", price: 11500 },
    "loteria-chespirito": { name: "Lotería del Chespirito", price: 12500 },
    "gran-banco": { name: "Gran Banco Clásico", price: 18500 },
    "kawaii": { name: "Amigos Kawaii", price: 3000 },
    "dulce-aventura": { name: "Candy Candy", price: 3000 },
    "panda": { name: "Panda Retro", price: 3000 },
    "ositos": { name: "Ositos Cariñosos", price: 3000 },
    "alpes": { name: "Heidy", price: 3000 },
    "fresita": { name: "Rosita Fresita Vintage", price: 3000 },
    "cachorrito": { name: "Cachorrito Soñador", price: 3000 },
    "unicornio": { name: "Unicornio Arcoíris", price: 3000 },
    "susi": { name: "Muñeca Susi", price: 6000 },
    "nati": { name: "Muñeca Nati", price: 6000 },
    "carolina": { name: "Muñeca Carolina", price: 6000 },
    "guadalupe": { name: "Muñeca Guadalupe", price: 6000 },
    "patricia": { name: "Muñeca Patricia", price: 6000 },
    "lourdes": { name: "Muñeca Lourdes", price: 6000 },
    "andrea": { name: "Muñeca Andrea", price: 6000 }
  };
  var NAME_TO_ID = {};
  Object.keys(CATALOG).forEach(function (id) { NAME_TO_ID[CATALOG[id].name.trim().toLowerCase()] = id; });

  var SHIP = { GAM: 2500, resto: 3500 };
  var SHIP_LABEL = { GAM: "Envío GAM", resto: "Envío resto del país por Correos" };
  var SINPE = "8480 4222";
  var GREETING = "¡Hola! 👋 Soy el asistente virtual de Monerías Retro, un agente automático (no soy una persona). Te ayudo a encontrar productos y a armar tu pedido. ¿Qué andás buscando?";

  function crc(n) { n = Math.round(n || 0); return "₡" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function waLink(t) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(t); }
  function makeRef() {
    var d = new Date(), dd = ("0" + d.getDate()).slice(-2), mm = ("0" + (d.getMonth() + 1)).slice(-2);
    return "MR-" + dd + mm + "-" + Math.random().toString(36).slice(2, 4).toUpperCase();
  }

  // ---- carrito ----
  var cart = [];
  function cartFind(id) { for (var i = 0; i < cart.length; i++) if (cart[i].id === id) return cart[i]; return null; }
  function cartRemove(id) { cart = cart.filter(function (x) { return x.id !== id; }); }
  function cartAdd(id, n) { if (!CATALOG[id]) return; var it = cartFind(id); if (it) { it.qty += n; if (it.qty < 1) cartRemove(id); } else if (n > 0) cart.push({ id: id, qty: n }); }
  function cartSetQty(id, n) { if (!CATALOG[id]) return; var it = cartFind(id); if (it) { it.qty = n; if (it.qty < 1) cartRemove(id); } else if (n > 0) cart.push({ id: id, qty: n }); }
  function cartCount() { var n = 0; cart.forEach(function (x) { n += x.qty; }); return n; }
  function cartSubtotal() { var s = 0; cart.forEach(function (x) { var c = CATALOG[x.id]; if (c) s += c.price * x.qty; }); return s; }
  function cartForApi() { return cart.map(function (it) { return { id: it.id, name: CATALOG[it.id].name, qty: it.qty }; }); }
  function applyCartActions(acts) {
    if (!Array.isArray(acts)) return;
    acts.forEach(function (a) {
      if (!a || !CATALOG[a.id]) return;
      var q = parseInt(a.qty, 10); if (isNaN(q)) q = 1;
      if (a.op === "add") cartAdd(a.id, Math.max(1, q));
      else if (a.op === "remove") cartRemove(a.id);
      else if (a.op === "setQty") cartSetQty(a.id, Math.max(0, q));
    });
  }

  var CSS = [
    ".mrc-launch{position:fixed;right:24px;bottom:24px;z-index:101;height:56px;border-radius:999px;background:var(--purple,#7C3AED);color:#fff;display:flex;align-items:center;gap:9px;padding:0 20px 0 17px;box-shadow:0 10px 26px rgba(124,58,237,.45);transition:transform .2s ease;animation:mrcPulse 2.6s infinite}",
    ".mrc-launch:hover{transform:scale(1.05);animation:none}.mrc-launch svg{width:25px;height:25px;flex:none}.mrc-launch b{font-family:var(--font-head,'Baloo 2',system-ui,sans-serif);font-weight:700;font-size:.95rem;white-space:nowrap}",
    "@keyframes mrcPulse{0%,100%{box-shadow:0 10px 26px rgba(124,58,237,.45),0 0 0 0 rgba(124,58,237,.5)}50%{box-shadow:0 10px 26px rgba(124,58,237,.45),0 0 0 13px rgba(124,58,237,0)}}",
    ".mrc-badge{position:absolute;top:-4px;left:-4px;min-width:21px;height:21px;border-radius:11px;background:var(--pink,#F472B6);color:#fff;font-size:.72rem;font-weight:700;display:none;align-items:center;justify-content:center;padding:0 5px;border:2px solid #fff}",
    ".mrc-toast{position:fixed;right:24px;bottom:96px;z-index:103;background:var(--ink,#2A1B36);color:#fff;padding:9px 14px;border-radius:999px;font-size:.85rem;font-family:var(--font-body,system-ui,sans-serif);box-shadow:0 8px 20px rgba(0,0,0,.2);transition:opacity .3s,transform .3s}",
    ".mrc-toast-out{opacity:0;transform:translateY(8px)}",
    ".mrc-panel{position:fixed;right:28px;bottom:28px;z-index:102;width:374px;max-width:calc(100vw - 32px);height:580px;max-height:calc(100vh - 48px);background:var(--cream,#FFF8EE);border-radius:18px;overflow:hidden;display:none;flex-direction:column;box-shadow:0 24px 60px rgba(42,27,54,.28);font-family:var(--font-body,'Plus Jakarta Sans',system-ui,sans-serif)}",
    ".mrc-panel.mrc-on{display:flex}",
    ".mrc-head{background:var(--purple,#7C3AED);color:#fff;padding:14px 16px;display:flex;align-items:center;gap:11px;flex:none}",
    ".mrc-av{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;flex:none}.mrc-av svg{width:22px;height:22px}",
    ".mrc-htxt{flex:1;min-width:0;line-height:1.25}",
    ".mrc-htxt b{font-family:var(--font-display,'Fraunces',serif);font-weight:700;font-size:1.05rem;display:block}",
    ".mrc-htxt span{font-size:.78rem;color:rgba(255,255,255,.85);display:flex;align-items:center;gap:5px}",
    ".mrc-on-dot{width:7px;height:7px;border-radius:50%;background:#34d399;display:inline-block}",
    ".mrc-x{color:#fff;opacity:.85;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;flex:none}.mrc-x:hover{opacity:1;background:rgba(255,255,255,.15)}",
    ".mrc-body{flex:1;overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;gap:9px}",
    ".mrc-msg{max-width:85%;padding:9px 13px;border-radius:15px;font-size:.92rem;line-height:1.5;white-space:pre-wrap;word-wrap:break-word}",
    ".mrc-bot{align-self:flex-start;background:#fff;color:var(--ink,#2A1B36);border:1px solid var(--line,#F0E5D6);border-bottom-left-radius:5px}",
    ".mrc-user{align-self:flex-end;background:var(--purple-soft,#EDE9FE);color:var(--ink,#2A1B36);border-bottom-right-radius:5px}",
    ".mrc-sys{align-self:center;font-size:.78rem;color:var(--purple,#7C3AED);background:var(--purple-soft,#EDE9FE);padding:4px 12px;border-radius:999px;margin:1px 0}",
    ".mrc-note{align-self:center;font-size:.72rem;color:var(--ink-soft,#5B4B66);opacity:.7;text-align:center;padding:2px 8px}",
    ".mrc-card{align-self:flex-start;max-width:92%;background:#fff;border:1px solid var(--line,#F0E5D6);border-radius:14px;padding:12px 14px;font-size:.9rem;color:var(--ink,#2A1B36)}",
    ".mrc-card .mrc-row{display:flex;justify-content:space-between;gap:10px;padding:3px 0}",
    ".mrc-card .mrc-tot{border-top:1px dashed var(--line,#F0E5D6);margin-top:6px;padding-top:7px;font-weight:700}",
    ".mrc-card h5{font-family:var(--font-display,'Fraunces',serif);font-size:.95rem;margin:0 0 7px;color:var(--purple,#7C3AED)}",
    ".mrc-cta{align-self:stretch;display:flex;align-items:center;justify-content:center;gap:8px;text-align:center;padding:12px;border-radius:13px;font-weight:700;font-size:.92rem;color:#fff;background:var(--whatsapp,#25D366);box-shadow:0 8px 20px rgba(37,211,102,.3)}",
    ".mrc-cta:hover{background:var(--whatsapp-2,#1DA851)}.mrc-cta svg{width:19px;height:19px}",
    ".mrc-cart{flex:none;border-top:1px solid var(--line,#F0E5D6);background:#fff;display:none}",
    ".mrc-cart-head{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:11px 14px;font-size:.88rem;font-weight:700;color:var(--ink,#2A1B36);font-family:inherit}",
    ".mrc-cart-chev{color:var(--purple,#7C3AED);font-size:.8rem}",
    ".mrc-cart-items{padding:0 12px 4px;max-height:168px;overflow-y:auto}",
    ".mrc-citem{display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px dashed var(--line,#F0E5D6);font-size:.85rem}",
    ".mrc-cname{flex:1;min-width:0;color:var(--ink,#2A1B36)}",
    ".mrc-cqty{display:flex;align-items:center;gap:7px;flex:none}",
    ".mrc-cqty button{width:22px;height:22px;border-radius:50%;background:var(--purple-soft,#EDE9FE);color:var(--purple,#7C3AED);font-weight:700;line-height:1;display:flex;align-items:center;justify-content:center}",
    ".mrc-cqty b{min-width:14px;text-align:center;font-weight:700}",
    ".mrc-cline{flex:none;color:var(--ink-soft,#5B4B66);min-width:56px;text-align:right}",
    ".mrc-crm{flex:none;color:#b9899f;width:22px;height:22px;font-size:16px;border-radius:50%}.mrc-crm:hover{background:#fdecf2;color:#d33}",
    ".mrc-checkout{width:calc(100% - 24px);margin:4px 12px 12px;padding:11px;border-radius:12px;background:var(--purple,#7C3AED);color:#fff;font-weight:700;font-size:.9rem}.mrc-checkout:hover{background:#6D28D9}",
    ".mrc-foot{flex:none;border-top:1px solid var(--line,#F0E5D6);background:var(--cream,#FFF8EE);padding:10px;display:flex;gap:8px;align-items:center}",
    ".mrc-foot input{flex:1;border:1px solid var(--line,#F0E5D6);background:#fff;border-radius:999px;padding:11px 15px;font-size:.92rem;font-family:inherit;color:var(--ink,#2A1B36);outline:none}",
    ".mrc-foot input:focus{border-color:var(--purple,#7C3AED)}",
    ".mrc-send{width:42px;height:42px;border-radius:50%;background:var(--purple,#7C3AED);color:#fff;display:flex;align-items:center;justify-content:center;flex:none}.mrc-send:hover{background:#6D28D9}.mrc-send:disabled{opacity:.5}.mrc-send svg{width:19px;height:19px}",
    ".mrc-typing{align-self:flex-start;background:#fff;border:1px solid var(--line,#F0E5D6);border-radius:15px;border-bottom-left-radius:5px;padding:11px 14px;display:flex;gap:4px}",
    ".mrc-typing i{width:7px;height:7px;border-radius:50%;background:#c9bcd6;display:inline-block;animation:mrcb 1s infinite}.mrc-typing i:nth-child(2){animation-delay:.15s}.mrc-typing i:nth-child(3){animation-delay:.3s}",
    "@keyframes mrcb{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-4px);opacity:1}}",
    ".product .btn.mrc-added{background:var(--teal,#14B8A6)!important;color:#fff!important}",
    "@media (max-width:600px){.mrc-launch{right:16px;bottom:16px;height:52px;padding:0 17px 0 15px}.mrc-toast{right:16px;bottom:78px}.mrc-panel{right:0;left:0;bottom:0;width:100%;max-width:100%;height:88vh;max-height:88vh;border-radius:18px 18px 0 0}}"
  ].join("");

  var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3C6.5 3 2 6.8 2 11.5c0 2.2 1 4.2 2.7 5.7-.1 1-.6 2.4-1.5 3.5 1.6-.2 3.2-.8 4.4-1.7 1.3.5 2.8.7 4.4.7 5.5 0 10-3.8 10-8.5S17.5 3 12 3z"/></svg>';
  var ICON_BOT = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a1 1 0 0 1 1 1v1h3a3 3 0 0 1 3 3v2h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-1H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1V7a3 3 0 0 1 3-3h3V3a1 1 0 0 1 1-1zM9 11a1.2 1.2 0 1 0 0 2.4A1.2 1.2 0 0 0 9 11zm6 0a1.2 1.2 0 1 0 0 2.4A1.2 1.2 0 0 0 15 11z"/></svg>';
  var ICON_WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2.1-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z"/><path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.4 1.3 4.9L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.5 0-3-.4-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3C4.4 15.4 4 13.7 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8z"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4l17.5-7.5c.8-.4.8-1.5 0-1.9L3.4 3.6c-.7-.3-1.4.2-1.4.9L2 9.1c0 .5.4 1 .9 1.1l9.1 1.8-9.1 1.8c-.5.1-.9.5-.9 1.1L2 19.5c0 .7.7 1.2 1.4.9z"/></svg>';

  var history = [];
  var busy = false, seeded = false, cartOpen = true;
  var panel, body, input, sendBtn, launch, badge, cartBar;

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function scrollDown() { body.scrollTop = body.scrollHeight; }
  function panelOpen() { return panel.classList.contains("mrc-on"); }

  function addBubble(role, text) {
    var b = el("div", "mrc-msg " + (role === "user" ? "mrc-user" : "mrc-bot")); b.textContent = text;
    body.appendChild(b); scrollDown();
  }
  function addSys(text) { var s = el("div", "mrc-sys"); s.textContent = text; body.appendChild(s); scrollDown(); }
  function addCTA(label, href) {
    var a = el("a", "mrc-cta", ICON_WA + "<span>" + esc(label) + "</span>");
    a.href = href; a.target = "_blank"; a.rel = "noopener"; body.appendChild(a); scrollDown();
  }
  function typingOn() { var t = el("div", "mrc-typing", "<i></i><i></i><i></i>"); t.id = "mrc-typing"; body.appendChild(t); scrollDown(); }
  function typingOff() { var t = document.getElementById("mrc-typing"); if (t) t.remove(); }

  function updateBadge() { var n = cartCount(); if (n > 0) { badge.textContent = n; badge.style.display = "flex"; } else { badge.style.display = "none"; } }

  function toast(msg) {
    var t = el("div", "mrc-toast"); t.textContent = msg; document.body.appendChild(t);
    setTimeout(function () { t.classList.add("mrc-toast-out"); }, 1600);
    setTimeout(function () { t.remove(); }, 2000);
  }

  function renderCartBar() {
    if (cart.length === 0) { cartBar.style.display = "none"; return; }
    cartBar.style.display = "block";
    var html = '<button class="mrc-cart-head" aria-expanded="' + cartOpen + '"><span>🛍️ Tu pedido · ' + cartCount() + ' art. · ' + crc(cartSubtotal()) + '</span><span class="mrc-cart-chev">' + (cartOpen ? "▾ ocultar" : "▸ ver") + "</span></button>";
    if (cartOpen) {
      html += '<div class="mrc-cart-items">';
      cart.forEach(function (it) {
        var c = CATALOG[it.id];
        html += '<div class="mrc-citem"><span class="mrc-cname">' + esc(c.name) + "</span>" +
          '<span class="mrc-cqty"><button data-act="dec" data-id="' + it.id + '" aria-label="Quitar uno">−</button><b>' + it.qty + '</b><button data-act="inc" data-id="' + it.id + '" aria-label="Sumar uno">+</button></span>' +
          '<span class="mrc-cline">' + crc(c.price * it.qty) + "</span>" +
          '<button class="mrc-crm" data-act="rm" data-id="' + it.id + '" aria-label="Eliminar">×</button></div>';
      });
      html += "</div><button class=\"mrc-checkout\">Finalizar pedido</button>";
    }
    cartBar.innerHTML = html;
  }

  function framingMsg(id) {
    return "Agregué " + CATALOG[id].name + " a tu pedido 🛍️ ¿Qué más querés agregar? Podés seguir tocando “Agregar” en los productos de la página, o escribime y lo armamos juntos.";
  }

  function ensureSeeded(context) {
    if (seeded) return; seeded = true;
    var g = context === "add"
      ? "¡Hola! 👋 Soy el asistente virtual de Monerías Retro, un agente automático (no soy una persona). ¡Con gusto te ayudo a armar tu pedido! 🛍️"
      : GREETING;
    addBubble("bot", g); history.push({ role: "assistant", content: g });
    body.appendChild(el("div", "mrc-note", "Asistente con IA · si algo no lo sé, te paso con la dueña"));
  }

  function openChat(context) {
    if (!panelOpen() && window.mrTrack) window.mrTrack("chat_open", { source: context });
    panel.classList.add("mrc-on"); launch.style.display = "none";
    ensureSeeded(context); renderCartBar();
    setTimeout(function () { input.focus(); }, 80);
  }
  function close() { panel.classList.remove("mrc-on"); launch.style.display = "flex"; updateBadge(); }

  function onAddProduct(id, btn) {
    cartAdd(id, 1); updateBadge();
    if (window.mrTrack) window.mrTrack("add_to_cart", { source: id });
    if (btn) { var o = "Agregar"; btn.textContent = "✓ Agregado"; btn.classList.add("mrc-added"); setTimeout(function () { btn.textContent = o; btn.classList.remove("mrc-added"); }, 1100); }
    if (!seeded) { openChat("add"); addBubble("bot", framingMsg(id)); history.push({ role: "assistant", content: framingMsg(id) }); }
    else if (panelOpen()) addSys("Agregué " + CATALOG[id].name + " 🛍️");
    else toast("✓ " + CATALOG[id].name);
    renderCartBar();
  }

  function renderOrder(zone, customer) {
    if (cart.length === 0) return;
    zone = SHIP.hasOwnProperty(zone) ? zone : "resto";
    customer = customer || {};
    var sub = cartSubtotal(), ship = SHIP[zone], total = sub + ship, ref = makeRef();
    var rows = "";
    cart.forEach(function (it) { var c = CATALOG[it.id]; rows += '<div class="mrc-row"><span>' + esc(c.name) + " ×" + it.qty + "</span><span>" + crc(c.price * it.qty) + "</span></div>"; });
    var card = el("div", "mrc-card", "<h5>Tu pedido</h5>" + rows +
      '<div class="mrc-row"><span>' + SHIP_LABEL[zone] + "</span><span>" + (ship ? crc(ship) : "Gratis") + "</span></div>" +
      '<div class="mrc-row mrc-tot"><span>Total</span><span>' + crc(total) + "</span></div>" +
      '<div class="mrc-row" style="color:var(--purple,#7C3AED);margin-top:4px"><span>SINPE Móvil</span><span>' + SINPE + "</span></div>");
    body.appendChild(card); scrollDown();
    addBubble("bot", "💳 Podés pagar por SINPE Móvil al " + SINPE + " (mandá el comprobante) o en efectivo contra entrega si estás en el GAM. Monerías te confirma apenas reciba tu pedido.");

    var msg = "🛍️ NUEVO PEDIDO · Monerías Retro\n";
    cart.forEach(function (it) { var c = CATALOG[it.id]; msg += "• " + c.name + " ×" + it.qty + " — " + crc(c.price * it.qty) + "\n"; });
    msg += "Subtotal: " + crc(sub) + "\n" + SHIP_LABEL[zone] + ": " + (ship ? crc(ship) : "gratis") + "\nTOTAL: " + crc(total) + "\n\n";
    if (customer.name) msg += "Cliente: " + customer.name + "\n";
    msg += "Entrega: Envío (" + (zone === "GAM" ? "GAM" : "resto del país") + ")\n";
    if (customer.address) msg += "Dirección: " + customer.address + "\n";
    if (customer.phone) msg += "Tel: " + customer.phone + "\n";
    msg += "Ref: " + ref + "\n\nApenas me confirmen disponibilidad, pago por SINPE Móvil. ¡Gracias! 💛";
    addCTA("Enviar mi pedido por WhatsApp", waLink(msg));
  }

  function sendText(text) {
    if (!text || busy) return;
    addBubble("user", text); history.push({ role: "user", content: text });
    busy = true; sendBtn.disabled = true; typingOn();
    fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history, cart: cartForApi() }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        typingOff();
        if (d && Array.isArray(d.cartActions) && d.cartActions.length) { applyCartActions(d.cartActions); updateBadge(); renderCartBar(); }
        var reply = (d && d.reply) ? d.reply : "Disculpá, no te entendí. ¿Me lo repetís?";
        addBubble("bot", reply); history.push({ role: "assistant", content: reply });
        if (d && d.stage === "order_ready" && cart.length > 0) renderOrder(d.deliveryZone, d.customer);
        else if (d && d.stage === "escalate") addCTA("Escribirle a la dueña por WhatsApp", waLink(d.escalationQuestion || "¡Hola! Tengo una consulta sobre sus productos."));
      })
      .catch(function () {
        typingOff();
        addBubble("bot", "Disculpá, se me cayó la conexión 🙈. Escribile directo a Monerías y te ayudan enseguida.");
        addCTA("Escribir por WhatsApp", waLink("¡Hola! Quiero hacer una consulta sobre sus productos retro."));
      })
      .then(function () { busy = false; sendBtn.disabled = false; input.focus(); });
  }
  function send() { var t = (input.value || "").trim(); if (!t) return; input.value = ""; sendText(t); }
  function checkout() { if (cart.length === 0) return; if (window.mrTrack) window.mrTrack("checkout", { source: "chat" }); openChat("launcher"); sendText("Listo, quiero finalizar mi pedido 🙌"); }

  function wireProducts() {
    var prods = document.querySelectorAll(".product");
    for (var i = 0; i < prods.length; i++) {
      var card = prods[i], h3 = card.querySelector("h3"), btn = card.querySelector(".btn");
      if (!h3 || !btn || card.classList.contains("soldout")) continue;
      var id = NAME_TO_ID[h3.textContent.trim().toLowerCase()];
      if (!id) continue;
      btn.classList.remove("btn-wa"); btn.classList.add("btn-purple", "mrc-add");
      btn.textContent = "Agregar";
      if (btn.tagName === "A") { btn.removeAttribute("href"); btn.setAttribute("role", "button"); btn.style.cursor = "pointer"; }
      (function (pid, pbtn) { pbtn.addEventListener("click", function (e) { e.preventDefault(); onAddProduct(pid, pbtn); }); })(id, btn);
    }
  }

  function build() {
    var style = el("style"); style.textContent = CSS; document.head.appendChild(style);

    launch = el("button", "mrc-launch", ICON_CHAT + '<b>Asistente IA</b><span class="mrc-badge"></span>');
    launch.setAttribute("aria-label", "Abrir chat con el asistente y ver tu pedido");
    launch.addEventListener("click", function () { openChat("launcher"); });

    panel = el("div", "mrc-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Asistente virtual de Monerías Retro");
    panel.innerHTML =
      '<div class="mrc-head"><div class="mrc-av">' + ICON_BOT + "</div>" +
      '<div class="mrc-htxt"><b>Monerías Retro</b><span><i class="mrc-on-dot"></i>Asistente IA · responde al toque</span></div>' +
      '<button class="mrc-x" aria-label="Cerrar chat">&times;</button></div>' +
      '<div class="mrc-body"></div>' +
      '<div class="mrc-cart"></div>' +
      '<div class="mrc-foot"><input type="text" placeholder="Escribí tu mensaje..." aria-label="Mensaje" autocomplete="off" />' +
      '<button class="mrc-send" aria-label="Enviar">' + ICON_SEND + "</button></div>";

    document.body.appendChild(launch);
    document.body.appendChild(panel);

    body = panel.querySelector(".mrc-body");
    input = panel.querySelector(".mrc-foot input");
    sendBtn = panel.querySelector(".mrc-send");
    badge = launch.querySelector(".mrc-badge");
    cartBar = panel.querySelector(".mrc-cart");

    panel.querySelector(".mrc-x").addEventListener("click", close);
    sendBtn.addEventListener("click", send);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); send(); } });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && panelOpen()) close(); });

    cartBar.addEventListener("click", function (e) {
      var head = e.target.closest(".mrc-cart-head");
      if (head) { cartOpen = !cartOpen; renderCartBar(); return; }
      if (e.target.closest(".mrc-checkout")) { checkout(); return; }
      var b = e.target.closest("button[data-act]"); if (!b) return;
      var id = b.getAttribute("data-id"), act = b.getAttribute("data-act");
      if (act === "inc") cartAdd(id, 1); else if (act === "dec") cartAdd(id, -1); else if (act === "rm") cartRemove(id);
      updateBadge(); renderCartBar();
    });

    wireProducts();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
