// XequeMate — Tabuleiro: arrastar e soltar peças + setas e círculos (botão direito).
// Carregue por ÚLTIMO (depois dos outros scripts). Funciona em index.html, ia.html e puzzles.html.
// Este arquivo NÃO conhece as regras do jogo: ele só "clica" nas casas (casa.click()),
// então quem decide se o lance vale continua sendo o onSquare/onSq de cada tela.
// As setas são só locais (nada é enviado ao Supabase).
(() => {
  const board = document.getElementById("board");
  if (!board || !window.PointerEvent) return;
  const wrap = board.parentElement;

  const sqEl = sq => board.querySelector('.sq[data-sq="' + sq + '"]');
  const sqAt = e => {   // casa que está embaixo do ponteiro (ou null se for fora do tabuleiro)
    const el = document.elementFromPoint(e.clientX, e.clientY), s = el && el.closest(".sq");
    return s && board.contains(s) ? s : null;
  };
  const has = (el, ...cls) => !!el && cls.some(c => el.classList.contains(c));
  const tap = sq => { const el = sqEl(sq); if (el) el.click(); };
  const release = id => { try { board.releasePointerCapture(id); } catch (e) {} };

  // ================= Setas e círculos =================
  const COLORS = { g: "#15781b", r: "#b02a2a", b: "#1f5fbf", y: "#e6a100" };   // verde, vermelho (Shift), azul (Ctrl), amarelo (Alt)
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "shapes"); svg.setAttribute("viewBox", "0 0 8 8"); svg.setAttribute("aria-hidden", "true");
  wrap.appendChild(svg);
  let shapes = [];   // { from, to, c }  (from === to é um círculo)
  const colorOf = e => e.shiftKey ? "r" : e.ctrlKey ? "b" : e.altKey ? "y" : "g";
  // centro da casa na tela, pela posição do botão dentro do tabuleiro (assim acompanha o tabuleiro virado)
  const center = sq => { const i = [...board.children].indexOf(sqEl(sq)); return i < 0 ? null : { x: i % 8 + .5, y: Math.floor(i / 8) + .5 }; };

  function paint() {
    let h = "<defs>" + Object.keys(COLORS).map(k =>
      `<marker id="xm-seta-${k}" orient="auto" markerWidth="4" markerHeight="4" refX="2.05" refY="2"><path d="M0,0 V4 L3,2 Z" fill="${COLORS[k]}"/></marker>`).join("") + "</defs>";
    for (const s of shapes) {
      const a = center(s.from), b = center(s.to); if (!a || !b) continue;
      if (s.from === s.to) { h += `<circle cx="${a.x}" cy="${a.y}" r=".45" fill="none" stroke="${COLORS[s.c]}" stroke-width=".08" opacity=".85"/>`; continue; }
      const len = Math.hypot(b.x - a.x, b.y - a.y), k = (len - .22) / len;   // encurta um pouco para a ponta cair no centro da casa
      h += `<line x1="${a.x}" y1="${a.y}" x2="${a.x + (b.x - a.x) * k}" y2="${a.y + (b.y - a.y) * k}" stroke="${COLORS[s.c]}" stroke-width=".16" stroke-linecap="round" opacity=".8" marker-end="url(#xm-seta-${s.c})"/>`;
    }
    svg.innerHTML = h;
  }
  function toggle(from, to, c) {
    const i = shapes.findIndex(s => s.from === from && s.to === to);
    if (i >= 0) { const same = shapes[i].c === c; shapes.splice(i, 1); if (same) return paint(); }   // desenho igual apaga; outra cor troca
    shapes.push({ from, to, c }); paint();
  }
  const clearShapes = () => { if (shapes.length) { shapes = []; paint(); } };

  // "Assinatura" da posição (casa + peça). Se mudar, alguém jogou (ou mudou o lance na revisão): apaga as setas.
  const ids = new Map();
  const sig = () => [...board.children].map(b => {
    const im = b.querySelector("img"); if (!im) return "";
    const s = im.getAttribute("src"); if (!ids.has(s)) ids.set(s, ids.size + 1);
    return b.dataset.sq + ids.get(s) + ";";
  }).sort().join("");
  let lastSig = sig();

  // ================= Arrastar e soltar =================
  let drag = null;   // { id, sq, x, y, tapped, can, ghost }
  let draw = null;   // { id, from, c }  (botão direito)
  const dim = () => { const el = drag && sqEl(drag.sq), im = el && el.querySelector("img"); if (im) im.classList.add("drag"); };

  // O tabuleiro é redesenhado (innerHTML) a cada render: redesenha as setas e mantém a peça arrastada apagadinha.
  new MutationObserver(() => {
    const s = sig(); if (s !== lastSig) { lastSig = s; shapes = []; }
    paint(); if (drag && drag.ghost) dim();
  }).observe(board, { childList: true });

  // Os cliques "de verdade" do mouse/dedo são bloqueados: quem clica nas casas agora é este arquivo (tap).
  // Clique pelo teclado (Enter/Espaço, detail = 0) continua passando normalmente.
  board.addEventListener("click", e => { if (e.isTrusted && e.detail > 0) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  board.addEventListener("contextmenu", e => e.preventDefault());
  board.addEventListener("dragstart", e => e.preventDefault());

  board.addEventListener("pointerdown", e => {
    if (drag || draw) return;   // segundo dedo/botão durante um gesto: ignora
    const el = sqAt(e); if (!el) return;
    const sq = el.dataset.sq;
    if (e.button === 2) {   // botão direito: começa seta/círculo
      if (board.querySelector(".sq.pre")) return;   // com pré-lance na fila, o botão direito só cancela a fila (regra do app.js)
      draw = { id: e.pointerId, from: sq, c: colorOf(e) };
      try { board.setPointerCapture(e.pointerId); } catch (x) {}
      return;
    }
    if (e.button !== 0) return;
    clearShapes();   // clique esquerdo apaga todos os desenhos
    drag = { id: e.pointerId, sq, x: e.clientX, y: e.clientY, tapped: false, can: false, ghost: null };
    if (has(el, "sel")) drag.can = true;   // já estava selecionada: pode arrastar
    else if (el.querySelector("img") && !has(el, "mv", "cp")) {   // peça que não é destino: seleciona já (mostra os lances)
      tap(sq); drag.tapped = true; drag.can = has(sqEl(sq), "sel");
    }
    try { board.setPointerCapture(e.pointerId); } catch (x) {}
  });

  document.addEventListener("pointermove", e => {
    if (!drag || e.pointerId !== drag.id || !drag.can) return;
    if (!drag.ghost) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 5) return;   // ainda é um clique, não um arrasto
      const el = sqEl(drag.sq), im = el && el.querySelector("img"); if (!im) return;
      const r = im.getBoundingClientRect(), g = im.cloneNode();
      g.className = "ghost"; g.style.width = r.width + "px"; g.style.height = r.height + "px";
      document.body.appendChild(g); drag.ghost = g; dim();
    }
    drag.ghost.style.left = e.clientX + "px"; drag.ghost.style.top = e.clientY + "px";
  });

  function endDrag(e, cancel) {
    const d = drag; drag = null; release(d.id);
    if (d.ghost) d.ghost.remove();
    const im = board.querySelector("img.drag"); if (im) im.classList.remove("drag");
    if (cancel) return;
    const el = sqAt(e), to = el && el.dataset.sq;
    if (!d.ghost) { if (to === d.sq && !d.tapped) tap(to); return; }   // clique simples (clique-clique de sempre)
    if (!to || to === d.sq) return;                                    // soltou fora ou na própria casa: a peça volta
    if (!has(sqEl(d.sq), "sel")) tap(d.sq);                            // a seleção sumiu no meio (ex.: o adversário jogou): seleciona de novo
    if (has(sqEl(d.sq), "sel") && has(sqEl(to), "mv", "cp")) tap(to);  // só joga se for um destino válido
  }
  document.addEventListener("pointerup", e => {
    if (draw && e.pointerId === draw.id) {
      const d = draw, el = sqAt(e); draw = null; release(d.id);
      if (el) toggle(d.from, el.dataset.sq, d.c);
      return;
    }
    if (drag && e.pointerId === drag.id) endDrag(e, false);
  });
  document.addEventListener("pointercancel", e => {
    if (draw && e.pointerId === draw.id) { release(draw.id); draw = null; }
    if (drag && e.pointerId === drag.id) endDrag(e, true);
  });
})();
