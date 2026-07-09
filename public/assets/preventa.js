/* Monerías Retro — pop-up de preventa Gran Banco Clásico. Autocontenido.
   Aparece en cada visita (carga de página), tras un pequeño retraso. Cerrable. */
(function () {
  "use strict";
  var WA = "50684804222";
  var WA_MSG = "¡Hola! Quiero reservar mi Gran Banco Clásico en preventa. ¿Cómo aparto mi cupo?";

  var CSS = [
    ".mrp-overlay{position:fixed;inset:0;z-index:1000;background:rgba(42,27,54,.62);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .25s ease}",
    ".mrp-overlay.mrp-on{opacity:1}",
    ".mrp-card{position:relative;width:100%;max-width:392px;max-height:92vh;overflow-y:auto;background:var(--cream,#FFF8EE);border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,.4);transform:translateY(16px) scale(.97);transition:transform .25s ease;font-family:var(--font-body,'Plus Jakarta Sans',system-ui,sans-serif);text-align:center}",
    ".mrp-overlay.mrp-on .mrp-card{transform:none}",
    ".mrp-x{position:absolute;top:10px;right:12px;z-index:2;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.9);color:var(--ink,#2A1B36);font-size:21px;line-height:1;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.18)}",
    ".mrp-x:hover{background:#fff}",
    ".mrp-top{background:linear-gradient(135deg,#7C3AED 0%,#C026A8 100%);padding:16px 16px 12px;border-radius:20px 20px 0 0}",
    ".mrp-badge{display:inline-block;background:var(--yellow,#FACC15);color:#6b3b00;font-family:var(--font-head,'Baloo 2',system-ui,sans-serif);font-weight:800;font-size:.78rem;letter-spacing:.04em;padding:5px 14px;border-radius:999px;text-transform:uppercase}",
    ".mrp-img{width:132px;height:132px;object-fit:contain;margin:8px auto 0;display:block;filter:drop-shadow(0 6px 12px rgba(0,0,0,.3))}",
    ".mrp-body{padding:14px 20px 20px}",
    ".mrp-title{font-family:var(--font-display,'Chango',cursive);color:var(--purple,#7C3AED);font-size:1.65rem;line-height:1.04;margin:2px 0 8px;text-shadow:2px 2px 0 #C9B8F2}",
    ".mrp-urg{color:var(--ink,#2A1B36);font-size:.94rem;line-height:1.5;margin:0 0 13px}",
    ".mrp-urg b{color:#C026A8}",
    ".mrp-list{text-align:left;display:flex;flex-direction:column;gap:8px;margin:0 0 16px}",
    ".mrp-list li{position:relative;padding-left:25px;font-size:.9rem;line-height:1.4;color:var(--ink-soft,#5B4B66)}",
    ".mrp-list li::before{content:'\\2713';position:absolute;left:0;top:0;color:var(--teal,#14B8A6);font-weight:800}",
    ".mrp-list b{color:var(--ink,#2A1B36)}",
    ".mrp-cta{display:flex;align-items:center;justify-content:center;gap:9px;background:var(--whatsapp,#25D366);color:#fff;font-family:var(--font-head,'Baloo 2',system-ui,sans-serif);font-weight:800;font-size:1rem;padding:13px;border-radius:14px;box-shadow:0 8px 20px rgba(37,211,102,.35);transition:transform .15s ease}",
    ".mrp-cta:hover{background:var(--whatsapp-2,#1DA851);transform:translateY(-1px)}.mrp-cta svg{width:20px;height:20px}",
    ".mrp-note{font-size:.77rem;color:var(--ink-soft,#5B4B66);opacity:.85;margin:11px 0 0}"
  ].join("");

  var ICON_WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.4 1.3 4.9L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.5 0-3-.4-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3C4.4 15.4 4 13.7 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8zm4.5-5.6c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.3-.6.8-.8 1-.1.1-.3.2-.5.1-.3-.1-1.1-.4-2-1.2-.7-.6-1.2-1.4-1.4-1.7-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4.1-.1 0-.3 0-.4 0-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 4 3.4 1.4.6 1.9.6 2.6.5.4-.1 1.3-.5 1.5-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.1-.4-.2z"/></svg>';

  var overlay;
  function onKey(e) { if (e.key === "Escape") close(); }
  function close() {
    if (!overlay) return;
    overlay.classList.remove("mrp-on");
    var o = overlay; overlay = null;
    setTimeout(function () { if (o) o.remove(); }, 280);
    document.removeEventListener("keydown", onKey);
  }

  function show() {
    if (window.mrTrack) window.mrTrack("popup_view", { source: "gran-banco" });
    var style = document.createElement("style"); style.textContent = CSS; document.head.appendChild(style);
    overlay = document.createElement("div"); overlay.className = "mrp-overlay";
    overlay.innerHTML =
      '<div class="mrp-card" role="dialog" aria-modal="true" aria-label="Preventa Gran Banco Clásico">' +
      '<button class="mrp-x" aria-label="Cerrar">&times;</button>' +
      '<div class="mrp-top"><span class="mrp-badge">🔥 Preventa limitada</span>' +
      '<img class="mrp-img" src="assets/images/gran-banco.png" alt="Gran Banco Clásico" /></div>' +
      '<div class="mrp-body">' +
      '<h3 class="mrp-title">Gran Banco Clásico</h3>' +
      '<p class="mrp-urg">Por la <b>enorme demanda</b>, abrimos preventa solo para las primeras <b>100 personas</b>. ¡Aún quedan cupos!</p>' +
      '<ul class="mrp-list">' +
      '<li>Apartá el tuyo con <b>₡5.000</b> por SINPE (8480 4222, Karla Coto)</li>' +
      '<li>Precio total <b>₡18.500</b>. El pedido ingresa el <b>6 de julio</b></li>' +
      '<li>Envíos a todo el país por Correos o retiro en Curridabat</li>' +
      '</ul>' +
      '<a class="mrp-cta" href="https://wa.me/' + WA + '?text=' + encodeURIComponent(WA_MSG) + '" target="_blank" rel="noopener">' + ICON_WA + 'Reservar mi Gran Banco</a>' +
      '<p class="mrp-note">Si se llena el cupo, te reintegramos en 24 horas.</p>' +
      '</div></div>';
    document.body.appendChild(overlay);
    overlay.querySelector(".mrp-x").addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    overlay.querySelector(".mrp-cta").addEventListener("click", function () { setTimeout(close, 120); });
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(function () { overlay.classList.add("mrp-on"); });
  }

  function init() { setTimeout(show, 1400); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
