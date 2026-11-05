// XequeMate — Quebra-cabeças: ache o melhor lance. Dados em puzzles-data.js.
(() => {
  const $ = id => document.getElementById(id);
  const P = window.XM_PIECES, RAW = window.XM_PUZZLES || [];
  const DATA = RAW.map((p, i) => ({ id: i, f: p[0], m: p[1].split(" "), r: p[2], t: p[3] }));
  const pc = (c, t) => `<img class="pc" src="${P[c + t.toUpperCase()]}" alt="" draggable="false">`;
  const THEMES = { all: "Todos", mate1: "Mate em 1", mate2: "Mate em 2", mate3: "Mate em 3", mate4: "Mate em 4", tatica: "Ganhar material" };
  const msg = t => { $("msg").textContent = t || ""; };

  const css = document.createElement("style");
  css.textContent = ".sq .pc{width:90%;height:90%;position:relative;z-index:1;pointer-events:none;user-select:none}" +
    ".sq.hint::before{background:rgba(80,200,120,.6)}.sq.bad::before{background:rgba(217,83,79,.6)}" +
    ".pzstats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.pzstats div{background:var(--bg);border-radius:10px;padding:8px 10px;text-align:center}" +
    ".pzstats span{display:block;font-size:.72rem;color:var(--mut)}.pzstats b{font-size:1.45rem}.pzstats i{display:block;font-style:normal;font-size:.8rem;min-height:1em;font-weight:700}" +
    ".up{color:#6fdc8c}.down{color:#ff7b72}";
  document.head.appendChild(css);

  // ---------- Progresso salvo no navegador ----------
  let S = { rating: 1000, streak: 0, best: 0, solved: 0, done: [] };
  try { S = Object.assign(S, JSON.parse(localStorage.getItem("xm-pz") || "{}")); } catch (e) {}
  const save = () => { try { localStorage.setItem("xm-pz", JSON.stringify(S)); } catch (e) {} };
  const paintStats = (delta) => {
    $("rating").textContent = S.rating; $("streak").textContent = S.streak; $("solvedN").textContent = S.solved;
    const d = $("delta"); d.textContent = delta ? (delta > 0 ? "+" : "") + delta : ""; d.className = delta > 0 ? "up" : "down";
  };

  // ---------- Estado do problema atual ----------
  let g = null, pz = null, k = 0, my = "w", flipped = false, sel = null, targets = [], last = null;
  let locked = true, solved = false, failed = false, counted = false, hintStep = 0, bad = null, token = 0;

  function drawBoard() {
    const files = flipped ? "hgfedcba" : "abcdefgh", ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
    const exp = pz && !solved && pz.m[k] ? pz.m[k] : null; let h = "";
    ranks.forEach((r, ri) => [...files].forEach((f, fi) => {
      const sq = f + r, p = g.get(sq); let c = "sq" + (((f.charCodeAt(0) - 97) + r) % 2 === 1 ? " d" : "");
      if (last && (sq === last.from || sq === last.to)) c += " last";
      if (sq === sel) c += " sel";
      if (sq === bad) c += " bad";
      if (hintStep >= 1 && exp && sq === exp.slice(0, 2)) c += " hint";
      if (hintStep >= 2 && exp && sq === exp.slice(2, 4)) c += " hint";
      if (targets.includes(sq)) c += p ? " cp" : " mv";
      h += `<button class="${c}" data-sq="${sq}" aria-label="${sq}">` + (fi === 0 ? `<i class="co rk">${r}</i>` : "") + (ri === 7 ? `<i class="co fl">${f}</i>` : "") + (p ? pc(p.color, p.type) : "") + "</button>";
    }));
    $("board").innerHTML = h;
  }
  function view() {
    drawBoard();
    $("pzTitle").textContent = pz ? `Quebra-cabeça nº ${pz.id + 1}` : "Quebra-cabeça";
    $("pzTheme").textContent = pz ? THEMES[pz.t] || "Tática" : "";
    $("pzDiff").textContent = pz ? `dificuldade ≈ ${pz.r}` : "";
    $("pzTurn").textContent = pz ? `Você joga de ${my === "w" ? "brancas" : "pretas"}` : "";
    $("status").textContent = !pz ? "" : solved ? (failed ? "Resolvido (com ajuda)." : "✔ Resolvido!") : locked ? "…" : "Ache o melhor lance para " + (my === "w" ? "as brancas" : "as pretas") + ".";
    $("next").classList.toggle("primary", solved || !pz);
  }

  // ---------- Escolha do próximo problema ----------
  function pick() {
    const th = $("theme").value; let pool = DATA.filter(p => (th === "all" || p.t === th));
    if (!pool.length) return null;
    let fresh = pool.filter(p => !S.done.includes(p.id)); if (!fresh.length) { S.done = S.done.filter(id => !pool.some(p => p.id === id)); fresh = pool; }
    fresh.sort((a, b) => Math.abs(a.r - S.rating) - Math.abs(b.r - S.rating));
    const top = fresh.slice(0, 8); return top[Math.floor(Math.random() * top.length)];
  }
  function start(p) {
    const my0 = ++token; pz = p; g = new Chess(p.f); k = 0; sel = null; targets = []; last = null; bad = null;
    locked = true; solved = false; failed = false; counted = false; hintStep = 0; msg("");
    my = g.turn() === "w" ? "b" : "w"; flipped = my === "b"; delta0(); view();
    setTimeout(() => { if (my0 !== token) return; play(p.m[0]); k = 1; locked = false; view(); }, 650);
  }
  const delta0 = () => paintStats(0);
  function play(u) { const m = g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }); if (m) last = m; return m; }

  // ---------- Resultado e nível ----------
  function finish(success) {
    if (counted) return; counted = true;
    const exp = 1 / (1 + Math.pow(10, (pz.r - S.rating) / 400)), d = Math.round(32 * ((success ? 1 : 0) - exp));
    S.rating = Math.max(400, S.rating + d); S.done.push(pz.id);
    if (success) { S.streak++; S.best = Math.max(S.best, S.streak); S.solved++; } else S.streak = 0;
    save(); paintStats(d);
  }
  function win() {
    solved = true; locked = true; sel = null; targets = []; hintStep = 0;
    if (!failed) finish(true); else { S.solved += 0; save(); }
    msg(failed ? "Boa! Agora você já conhece essa posição." : "Muito bem! 🎉 Clique em “Próximo” para continuar."); view();
  }

  // ---------- Jogadas ----------
  function onSq(sq) {
    if (!pz || locked || solved) return;
    const p = g.get(sq);
    if (sel && targets.includes(sq)) {
      const cand = g.moves({ square: sel, verbose: true }).find(m => m.to === sq), want = pz.m[k];
      let promo; if (cand && cand.promotion) promo = want && want.slice(0, 4) === sel + sq && want[4] ? want[4] : "q";
      const from = sel, m = g.move({ from, to: sq, promotion: promo }); sel = null; targets = []; if (!m) return view();
      last = m;
      const uci = from + sq + (promo || "");
      if (uci === want || g.in_checkmate()) {
        k++;
        if (k >= pz.m.length || g.in_checkmate()) return win();
        locked = true; view(); const t = token; hintStep = 0;
        setTimeout(() => { if (t !== token) return; play(pz.m[k]); k++; locked = false; view(); msg(""); }, 450);
      } else {
        g.undo(); last = null; bad = sq; if (!failed) { failed = true; finish(false); }
        locked = true; msg("Esse não é o melhor lance. Tente de novo!"); view();
        const t = token; setTimeout(() => { if (t !== token) return; bad = null; locked = false; const h = g.history({ verbose: true }); last = h.length ? h[h.length - 1] : null; view(); }, 700);
      }
      return;
    }
    if (p && p.color === my && sq !== sel) { sel = sq; targets = g.moves({ square: sq, verbose: true }).map(m => m.to); } else { sel = null; targets = []; }
    view();
  }
  function hint() {
    if (!pz || locked || solved) return;
    hintStep = Math.min(2, hintStep + 1); if (!failed) { failed = true; finish(false); }
    msg(hintStep === 1 ? "Dica: mexa a peça marcada." : "Dica: a casa de destino está marcada."); view();
  }
  function solution() {
    if (!pz || solved) return;
    if (!failed) { failed = true; finish(false); }
    locked = true; sel = null; targets = []; const t = token; msg("Esta era a solução:");
    (function step() {
      if (t !== token) return;
      if (k >= pz.m.length) { solved = true; view(); return; }
      play(pz.m[k]); k++; view(); setTimeout(step, 800);
    })();
  }

  // ---------- Controles ----------
  const fillThemes = () => {
    const counts = { all: DATA.length }; DATA.forEach(p => counts[p.t] = (counts[p.t] || 0) + 1);
    $("theme").innerHTML = Object.keys(THEMES).filter(t => counts[t]).map(t => `<option value="${t}">${THEMES[t]} (${counts[t]})</option>`).join("");
  };
  const nextPuzzle = () => { const p = pick(); if (p) start(p); else { $("status").textContent = "Nenhum problema desse tipo."; } };
  $("next").onclick = nextPuzzle; $("hint").onclick = hint; $("sol").onclick = solution; $("theme").onchange = nextPuzzle;
  $("reset").onclick = () => { if (confirm("Zerar o seu nível, a sequência e a lista de problemas resolvidos?")) { S = { rating: 1000, streak: 0, best: 0, solved: 0, done: [] }; save(); paintStats(0); nextPuzzle(); } };
  $("board").addEventListener("click", e => { const el = e.target.closest(".sq"); if (el) onSq(el.dataset.sq); });

  if (!DATA.length) { $("status").textContent = "Os problemas ainda não foram carregados (puzzles-data.js)."; return; }
  fillThemes(); paintStats(0); nextPuzzle();
})();
