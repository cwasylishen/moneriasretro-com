/* /pedido.html — la bolsa en página completa. Lee y escribe el mismo carrito que el asistente
   (window.MRCart, chat.js). Precios, envío y formato del mensaje vienen de chat.js: acá no hay copia. */
(function () {
  "use strict";
  var M = window.MRCart; if (!M) return;
  var IMG = { "loteria-retro": "loteria-retro.png", "baraja-chavo": "baraja-chavo.png", "loteria-chespirito": "loteria-chespirito.png", "gran-banco": "gran-banco.png", "kawaii": "kawaii.png", "dulce-aventura": "hojas-aroma-dulce-aventura.png", "panda": "hojas-aroma-panda.png", "ositos": "hojas-aroma-care-bears.png", "alpes": "hojas-aroma-alpes.png", "fresita": "fresita.png", "cachorrito": "cachorrito.png", "unicornio": "unicornio.png", "susi": "muneca-susi.png", "nati": "muneca-nati.png", "carolina": "muneca-carolina.png", "guadalupe": "muneca-guadalupe.png", "patricia": "muneca-patricia.png", "lourdes": "muneca-lourdes.png", "andrea": "muneca-andrea.png" };
  var lines = document.getElementById("lines"), empty = document.getElementById("empty"), form = document.getElementById("order-form"),
      sum = document.getElementById("sum"), grand = document.getElementById("grand"), send = document.getElementById("send"), side = document.getElementById("side");
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function zone() { var z = form.querySelector("input[name=zona]:checked"); return z ? z.value : "resto"; }
  function customer() { return { name: form.name.value.trim(), phone: form.phone.value.trim(), address: form.address.value.trim() }; }
  function render() {
    var items = M.items(), has = items.length > 0;
    empty.hidden = has; form.hidden = !has; side.hidden = !has;
    if (!has) return;
    lines.innerHTML = items.map(function (it) {
      var c = M.CATALOG[it.id];
      return '<div class="line"><img src="/assets/images/' + (IMG[it.id] || "logo.png") + '" alt="" width="64" height="48" /><div><b><a href="/producto/' + it.id + '.html">' + esc(c.name) + '</a></b><span class="meta">' + M.crc(c.price) + ' c/u</span></div>' +
        '<div class="lrow"><div class="qty" role="group" aria-label="Cantidad de ' + esc(c.name) + '"><button type="button" data-act="dec" data-id="' + it.id + '" aria-label="Quitar uno">−</button><span>' + it.qty + '</span><button type="button" data-act="inc" data-id="' + it.id + '" aria-label="Sumar uno">+</button></div>' +
        '<span class="amt">' + M.crc(c.price * it.qty) + '</span><button type="button" class="rm" data-act="rm" data-id="' + it.id + '">Quitar</button></div></div>';
    }).join("");
    var z = zone(), ship = M.SHIP[z];
    sum.innerHTML = items.map(function (it) { var c = M.CATALOG[it.id]; return "<li>" + esc(c.name) + " × " + it.qty + " <b>" + M.crc(c.price * it.qty) + "</b></li>"; }).join("") +
      "<li>" + esc(M.SHIP_LABEL[z]) + " <b>" + M.crc(ship) + "</b></li>";
    grand.textContent = M.crc(M.subtotal() + ship);
    send.href = M.waLink(M.orderMessage(z, customer()));
  }
  lines.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-act]"); if (!b) return;
    var id = b.getAttribute("data-id"), act = b.getAttribute("data-act");
    if (act === "inc") M.add(id, 1); else if (act === "dec") M.add(id, -1); else M.remove(id);
    render();
  });
  form.addEventListener("input", render);
  form.addEventListener("change", render);
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  send.addEventListener("click", function () { if (window.mrTrack) window.mrTrack("checkout", { source: "pedido" }); });
  document.addEventListener("mr:cart", render);
  render();
})();
