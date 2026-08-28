// Genera public/producto/<id>.html a partir de scripts/catalog.json.
// El encabezado y el pie se toman de public/index.html (marcas @header / @footer): una sola fuente.
// Uso: node scripts/build-productos.js
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "scripts/catalog.json"), "utf8"));
const index = fs.readFileSync(path.join(root, "public/index.html"), "utf8");
const cut = (a, b) => index.slice(index.indexOf(a) + a.length, index.indexOf(b));
const header = cut("<!-- @header -->", "<!-- @/header -->").trim();
const footer = cut("<!-- @footer -->", "<!-- @/footer -->").trim().replace('<script src="/assets/preventa.js" defer></script>\n', "");
const CATS = {
  juegos: { name: "Juegos de mesa", band: "grape", papel: "Papelería" },
  papeleria: { name: "Papelería con aroma", band: "cream" },
  munecas: { name: "Muñecas de vestir", band: "menta" }
};
const WA_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.1 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-2.9-1.3-4.8-4.3-5-4.5-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.8 1.9.9 2s.1.3 0 .5c-.1.2-.2.3-.3.5l-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1.9 2 1.2 2.3 1.4.2.1.4.1.5-.1.2-.2.6-.7.8-1 .1-.3.3-.2.6-.1.2.1 1.5.7 1.8.9.3.1.4.2.5.3.1.2.1.6-.1 1.1Z"/></svg>';
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const card = p => `<article class="card product${p.soldout ? " soldout out" : ""}"><a class="shot" href="/producto/${p.id}.html" tabindex="-1" aria-hidden="true">${p.soldout ? '<span class="flag">Agotado</span>' : ""}<img src="/assets/images/${p.img}" alt="${esc(p.alt)}" width="600" height="450" loading="lazy" /></a><div class="txt"><h3><a href="/producto/${p.id}.html">${esc(p.name)}</a></h3><p class="note">${esc(p.desc)}</p><div class="row"><span class="sticker price">${p.price}</span>${p.soldout ? `<a class="btn mini ghost" href="/#preventa">Ver preventa</a>` : `<a class="btn mini btn-wa" href="https://wa.me/50684804222?text=${p.wa}" rel="noopener">Comprar</a>`}</div></div></article>`;

for (const p of catalog) {
  const cat = CATS[p.cat];
  const others = catalog.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4);
  const trae = p.trae || (p.cat === "papeleria" ? [["Portada", "1"], ["Hojas", "6"], ["Sobres", "3"], ["Aroma", "Sí"]] : [["Material", "Cartón duro"], ["Vestidos y accesorios", "Incluidos"]]);
  const stock = p.soldout
    ? `<p class="stock out"><i aria-hidden="true"></i> Agotado por ahora · disponible en preventa, fecha de regreso por confirmar</p>`
    : `<p class="stock"><i aria-hidden="true"></i> Disponible · pedido por WhatsApp</p>`;
  const buy = p.soldout
    ? `<div class="buybar"><span class="sticker price">${p.price}</span><a class="btn btn-preventa" href="https://wa.me/50684804222?text=${p.wa}" rel="noopener">${WA_ICON}Apuntarme a la preventa</a></div>
      <p class="fine">Sin adelanto. Te avisamos por WhatsApp apenas haya fecha de entrada.</p>`
    : `<div class="buybar" data-product="${p.id}"><span class="sticker price">${p.price}</span>
        <div class="qty" role="group" aria-label="Cantidad"><button type="button" data-q="-1" aria-label="Quitar uno">−</button><span aria-live="polite">1</span><button type="button" data-q="1" aria-label="Agregar uno">+</button></div>
        <a class="btn btn-add" href="https://wa.me/50684804222?text=${p.wa}" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Agregar al pedido</a>
      </div>`;
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(p.name)} ${p.price} | Monerías Retro Costa Rica</title>
<meta name="description" content="${esc(p.desc)} Envíos a todo Costa Rica. Pedidos por WhatsApp." />
<meta name="theme-color" content="#5B21B6" />
<link rel="canonical" href="https://moneriasretro.com/producto/${p.id}" />
<meta property="og:type" content="product" />
<meta property="og:url" content="https://moneriasretro.com/producto/${p.id}" />
<meta property="og:title" content="${esc(p.name)} | Monerías Retro" />
<meta property="og:description" content="${esc(p.desc)}" />
<meta property="og:image" content="https://moneriasretro.com/assets/images/${p.img}" />
<meta property="og:locale" content="es_CR" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Chango&family=Archivo:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/assets/styles.css" />
<link rel="icon" type="image/png" href="/assets/images/logo.png" />
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product","name":${JSON.stringify(p.name)},"image":"https://moneriasretro.com/assets/images/${p.img}","description":${JSON.stringify(p.desc)},"brand":{"@type":"Brand","name":"Monerías Retro"},"offers":{"@type":"Offer","priceCurrency":"CRC","price":"${p.price.replace(/[₡.]/g, "")}","availability":"https://schema.org/${p.soldout ? "PreOrder" : "InStock"}","url":"https://moneriasretro.com/producto/${p.id}"}}
</script>
</head>
<body>
<script>document.documentElement.classList.add("js")</script>

${header}

<main class="page">
<div class="wrap">
  <nav class="crumb" aria-label="Migas de pan">
    <a href="/">Inicio</a>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
    <a href="/#${p.cat}">${cat.name}</a>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
    <span aria-current="page">${esc(p.name)}</span>
  </nav>

  <article class="pdp">
    <div class="gallery">
      <div class="main"><img src="/assets/images/${p.img}" alt="${esc(p.alt)}" width="600" height="450" fetchpriority="high" /></div>
    </div>
    <div>
      <h1>${esc(p.name)}</h1>
      ${stock}
      <p class="desc">${esc(p.desc)}</p>
      ${buy}
      <a class="ask" href="https://wa.me/50684804222?text=${p.wa}" rel="noopener">${WA_ICON}Preguntanos algo antes de pedir</a>
      <div class="panel">
        <h4>Qué trae</h4>
        <ul>${trae.map(([k, v]) => `<li>${esc(k)} <b>${esc(v)}</b></li>`).join("")}</ul>
      </div>
      <div class="panel">
        <h4>Cómo te llega</h4>
        <p>Dentro del Gran Área Metropolitana ₡2.500, y podés pagarle al mensajero contra entrega. Al resto del país ₡3.500 por Correos de Costa Rica. Coordinamos la entrega por WhatsApp.</p>
      </div>
    </div>
  </article>
</div>
</main>

<section class="band ${cat.band}" aria-labelledby="mas-t">
  <div class="dots" aria-hidden="true"></div>
  <div class="wrap band-in">
    <div class="band-head"><h2 id="mas-t">Más de ${cat.name.toLowerCase()}</h2><p><a class="more-link" href="/#${p.cat}">Ver toda la categoría →</a></p></div>
    <div class="grid${others.length === 3 ? " three" : ""}">
      ${others.map(card).join("\n      ")}
    </div>
  </div>
</section>

${footer}
<script src="/assets/producto.js" defer></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(root, "public/producto", p.id + ".html"), html);
}
console.log("ok", catalog.length, "páginas de producto");
