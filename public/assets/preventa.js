/* Monerías Retro — preventa Gran Banco Clásico.
   Antes: pop-up que tapaba el primer paint en cada visita.
   Ahora: el aviso vive en la página (#preventa, en la sección de juegos).
   Este script solo registra cuándo el bloque entra en pantalla, una vez por carga. */
(function () {
  "use strict";
  function init() {
    var block = document.getElementById("preventa");
    if (!block) return;
    var seen = false;
    function mark() { if (seen) return; seen = true; if (window.mrTrack) window.mrTrack("popup_view", { source: "gran-banco-inline" }); }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { mark(); io.disconnect(); } });
      }, { threshold: 0.4 });
      io.observe(block);
    } else { mark(); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
