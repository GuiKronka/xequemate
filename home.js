// XequeMate — página inicial: tabuleiro animado (A Partida da Ópera, 1858) e atalhos.
(() => {
  const $ = id => document.getElementById(id);
  const P = window.XM_PIECES || {};
  const img = (c, t) => P[c + t] ? `<img src="${P[c + t]}" alt="" draggable="false">` : "";

  // Ícones dos cartões
  document.querySelectorAll("[data-pc]").forEach(el => { const k = el.dataset.pc; if (P[k]) el.innerHTML = `<img src="${P[k]}" alt="" draggable="false">`; });

  // Atalhos
  const openTournament = () => { const b = $("tBtn"); if (b) b.click(); };
  $("navT").onclick = openTournament;
  $("fcTorneio").onclick = openTournament;
  if (new URLSearchParams(location.search).get("torneio")) setTimeout(openTournament, 500);
  $("fcOnline").onclick = () => { const n = $("nickname"); n.scrollIntoView({ block: "center", behavior: "smooth" }); setTimeout(() => n.focus({ preventScroll: true }), 350); };

  // Tabuleiro decorativo
  const MOVES = "e4 e5 Nf3 d6 d4 Bg4 dxe5 Bxf3 Qxf3 dxe5 Bc4 Nf6 Qb3 Qe7 Nc3 c6 Bg5 b5 Nxb5 cxb5 Bxb5+ Nbd7 O-O-O Rd8 Rxd7 Rxd7 Rd1 Qe6 Bxd7+ Nxd7 Qb8+ Nxb8 Rd8#".split(" ");
  const box = $("hboard"); if (!box || typeof Chess === "undefined") return;
  const g = new Chess(); let i = 0, last = null;
  function draw() {
    let h = "";
    for (let r = 8; r >= 1; r--) for (let f = 0; f < 8; f++) {
      const sq = "abcdefgh"[f] + r, p = g.get(sq), dark = (f + r) % 2 === 1;
      h += `<div class="hs${dark ? " d" : ""}${last && (sq === last.from || sq === last.to) ? " l" : ""}">${p ? img(p.color, p.type.toUpperCase()) : ""}</div>`;
    }
    box.innerHTML = h;
  }
  draw();
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  (function tick() {
    if (document.hidden) return setTimeout(tick, 1500);
    if (i >= MOVES.length) { setTimeout(() => { g.reset(); i = 0; last = null; draw(); setTimeout(tick, 1200); }, 3200); return; }
    last = g.move(MOVES[i++]); draw(); setTimeout(tick, 1250);
  })();
})();
