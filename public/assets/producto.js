/* Página de producto: cantidad + "Agregar al pedido" contra el carrito de chat.js (window.MRCart).
   Sin JavaScript el botón es un enlace a WhatsApp, como en el catálogo. */
(function () {
  "use strict";
  var bar = document.querySelector(".buybar[data-product]");
  if (!bar || !window.MRCart) return;
  var id = bar.getAttribute("data-product"), qtyEl = bar.querySelector(".qty span"), btn = bar.querySelector(".btn-add"), qty = 1;
  if (!window.MRCart.CATALOG[id]) return;
  bar.querySelectorAll(".qty button").forEach(function (b) {
    b.addEventListener("click", function () { qty = Math.min(20, Math.max(1, qty + Number(b.getAttribute("data-q")))); qtyEl.textContent = qty; });
  });
  btn.removeAttribute("href"); btn.setAttribute("role", "button"); btn.setAttribute("tabindex", "0");
  function add() {
    window.MRCart.add(id, qty);
    var o = btn.innerHTML; btn.innerHTML = "✓ Agregado"; btn.classList.add("mrc-added");
    setTimeout(function () { btn.innerHTML = o; btn.classList.remove("mrc-added"); }, 1100);
    var n = window.MRCart.count();
    var note = document.getElementById("added-note");
    if (!note) { note = document.createElement("p"); note.id = "added-note"; note.className = "fine"; note.setAttribute("role", "status"); bar.insertAdjacentElement("afterend", note); }
    note.innerHTML = 'En tu bolsa: ' + n + (n === 1 ? ' artículo' : ' artículos') + ' · <a href="/pedido.html">Ver el pedido</a> o seguí mirando.';
  }
  btn.addEventListener("click", function (e) { e.preventDefault(); add(); });
  btn.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); add(); } });
})();
