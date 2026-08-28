// node scripts/verify.js <baseUrl> <shotPrefix>   — capturas, consola, desborde, contraste, altura, primer producto
const { chromium } = require("/home/mike/buddy-wizardweb/node_modules/playwright");
const base = process.argv[2], prefix = process.argv[3] || "/home/mike/buddy-wizardweb/files/images/monerias-b-built";
const pages = [
  ["home", "/", false], ["home-full", "/", true], ["category", "/#munecas", false],
  ["producto", "/producto/loteria-retro.html", false], ["pedido", "/pedido.html", false], ["404", "/no-existe-esta-pagina", false]
];
const vps = [[390, 844], [1280, 900]];
const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
(async () => {
  const browser = await chromium.launch();
  const out = [];
  for (const [w, h] of vps) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", m => { if (m.type() === "error" || m.type() === "warning") errors.push(m.type() + ": " + m.text()); });
    page.on("pageerror", e => errors.push("pageerror: " + e.message));
    page.on("requestfailed", r => { if (!/wizardweb|api\/track/.test(r.url())) errors.push("reqfail: " + r.url()); });
    for (const [name, path, full] of pages) {
      errors.length = 0;
      const resp = await page.goto(base + path, { waitUntil: "networkidle" }).catch(e => { errors.push("nav: " + e.message); return null; });
      await page.evaluate(() => document.fonts.ready);
      if (name === "pedido") { await page.evaluate(() => { localStorage.setItem("mr_cart_v1", JSON.stringify([{ id: "loteria-retro", qty: 1 }, { id: "susi", qty: 2 }, { id: "dulce-aventura", qty: 1 }])); }); await page.reload({ waitUntil: "networkidle" }); await page.evaluate(() => document.fonts.ready); }
      if (name === "category") { await page.evaluate(() => location.hash = "#munecas"); await page.waitForTimeout(800); }
      await page.waitForTimeout(300);
      const m = await page.evaluate(() => {
        const first = document.querySelector(".product img, .pdp img");
        const r = first ? first.getBoundingClientRect() : null;
        const toRGB = s => { const m = s.match(/\d+(\.\d+)?/g); return m ? m.slice(0, 4).map(Number) : null; };
        const bgOf = el => { let e = el; while (e) { const c = toRGB(getComputedStyle(e).backgroundColor); if (c && (c.length < 4 || c[3] > 0.9)) return c.slice(0, 3); e = e.parentElement; } return [255, 255, 255]; };
        const seen = new Map();
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let n; while ((n = walker.nextNode())) {
          const t = n.textContent.trim(); if (!t) continue; const el = n.parentElement; if (!el) continue;
          const cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none" || el.closest("[hidden],script,style,noscript")) continue;
          const rect = el.getBoundingClientRect(); if (!rect.width || !rect.height) continue;
          const fg = toRGB(cs.color); if (!fg || (fg.length === 4 && fg[3] === 0)) continue;
          const bg = bgOf(el);
          const key = cs.color + "|" + bg.join(",") + "|" + cs.fontSize + "|" + cs.fontWeight;
          if (!seen.has(key)) seen.set(key, { fg: fg.slice(0, 3), bg, size: parseFloat(cs.fontSize), weight: +cs.fontWeight || 400, sample: t.slice(0, 40), sel: el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).join(".") : "") });
        }
        return { scrollW: document.documentElement.scrollWidth, innerW: innerWidth, height: document.documentElement.scrollHeight, firstY: r ? Math.round(r.top + scrollY) : null, texts: [...seen.values()], title: document.title, status: null };
      });
      const fails = [];
      for (const t of m.texts) { const c = ratio(t.fg, t.bg); const large = t.size >= 24 || (t.size >= 18.66 && t.weight >= 700); const min = large ? 3 : 4.5; if (c < min) fails.push({ sel: t.sel, sample: t.sample, ratio: +c.toFixed(2), fg: t.fg, bg: t.bg, size: t.size }); }
      const shot = `${prefix}-${name}-${w}x${h}.png`;
      await page.screenshot({ path: shot, fullPage: !!full });
      out.push({ page: name, vp: `${w}x${h}`, status: resp && resp.status(), title: m.title, height: m.height, overflow: m.scrollW > m.innerW ? `${m.scrollW}>${m.innerW}` : "clean", firstProductY: m.firstY, textStyles: m.texts.length, contrastFails: fails, console: errors.slice(), shot });
    }
    await ctx.close();
  }
  await browser.close();
  for (const r of out) { console.log(JSON.stringify(r)); }
})().catch(e => { console.error(e); process.exit(1); });
