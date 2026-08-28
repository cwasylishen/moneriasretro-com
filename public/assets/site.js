/* Monerías Retro — encabezado que se encoge, chip activo, bolsa del pedido.
   Sin dependencias; si no carga, todo sigue funcionando como enlaces. */
(function () {
  "use strict";
  var html = document.documentElement;
  var last = false;
  function onScroll() {
    var s = (window.scrollY || 0) > 40;
    if (s !== last) { last = s; html.classList.toggle("is-scrolled", s); }
  }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // chip activo según la sección visible
  var chips = document.querySelectorAll(".chip[href^='#'], .chip[href^='/#']");
  var targets = [];
  for (var i = 0; i < chips.length; i++) {
    var id = chips[i].getAttribute("href").split("#")[1], el = id && document.getElementById(id);
    if (el) targets.push({ el: el, chip: chips[i] });
  }
  function setChip(chip) {
    for (var j = 0; j < chips.length; j++) { chips[j].classList.toggle("on", chips[j] === chip); if (chips[j] === chip) chips[j].setAttribute("aria-current", "true"); else chips[j].removeAttribute("aria-current"); }
    if (chip && chip.scrollIntoView && chip.parentNode.scrollWidth > chip.parentNode.clientWidth) {
      var p = chip.parentNode.parentNode; p.scrollTo({ left: chip.offsetLeft - 18, behavior: "smooth" });
    }
  }
  if (targets.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) for (var k = 0; k < targets.length; k++) if (targets[k].el === e.target) setChip(targets[k].chip); });
    }, { rootMargin: "-40% 0px -55% 0px" });
    targets.forEach(function (t) { io.observe(t.el); });
  }

  // bolsa: cantidad desde el carrito de chat.js
  function paintBag() {
    var n = (window.MRCart && window.MRCart.count()) || 0;
    var bags = document.querySelectorAll(".bag");
    for (var i = 0; i < bags.length; i++) {
      var b = bags[i].querySelector("i");
      if (b) { b.textContent = n; b.classList.toggle("on", n > 0); }
      bags[i].setAttribute("aria-label", n ? "Tu pedido, " + n + (n === 1 ? " artículo" : " artículos") : "Tu pedido, vacío");
    }
  }
  document.addEventListener("mr:cart", paintBag);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paintBag); else paintBag();

  // botones que abren el asistente (el lanzador flotante de chat.js queda oculto: un solo botón flotante)
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-open-chat]");
    if (!b) return;
    var l = document.querySelector(".mrc-launch");
    if (l) { e.preventDefault(); l.click(); }
  });

  // año del pie
  var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
})();
