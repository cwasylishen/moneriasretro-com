/* Monerías Retro — beacon de analítica liviano y sin cookies.
   Envía pageview + eventos a /api/track. Expone window.mrTrack(type, props). */
(function () {
  "use strict";
  var EP = "/api/track";

  function send(type, props) {
    try {
      var payload = { type: type, path: location.pathname, referrer: document.referrer || "" };
      if (props) for (var k in props) payload[k] = props[k];
      var body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(EP, new Blob([body], { type: "application/json" }));
      } else {
        fetch(EP, { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true });
      }
    } catch (e) {}
  }
  window.mrTrack = send;

  function waSource(a) {
    var c = a.classList;
    if (c.contains("wa-float")) return "float";
    if (c.contains("nav-wa")) return "nav";
    if (c.contains("mrp-cta")) return "popup";
    if (c.contains("mrc-cta")) return "chat";
    if (c.contains("btn-preventa")) return "reserve";
    if (c.contains("btn-wa")) return "hero";
    return a.getAttribute("data-mr-source") || "link";
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var a = t.closest('a[href*="wa.me"], a[href*="api.whatsapp.com"]');
    if (a) send("whatsapp_click", { source: waSource(a) });
  }, true);

  send("pageview", {});
})();
