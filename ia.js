// XequeMate — Computador (Stockfish 19 lite): jogar contra a máquina e analisar partidas.
(() => {
  const $ = id => document.getElementById(id);
  const P = window.XM_PIECES;
  const pc = (c, t) => `<img class="pc" src="${P[c + t.toUpperCase()]}" alt="" draggable="false">`;
  const PT = { K: "R", Q: "D", R: "T", N: "C" };
  const pt = s => s.replace(/^[KQRN]/, m => PT[m]).replace(/=([QRN])/, (x, m) => "=" + PT[m]);
  const win = cp => 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);   // chance de vitória (0–100), fórmula do Lichess
  const msg = t => { $("msg").textContent = t || ""; };
  const store = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
  const recall = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };

  const css = document.createElement("style");
  css.textContent = ".sq .pc{width:90%;height:90%;position:relative;z-index:1;pointer-events:none;user-select:none}" +
    ".sq.best::before{background:rgba(80,200,120,.55)}" +
    ".eb{height:18px;border-radius:9px;overflow:hidden;background:#111c24;position:relative;margin:8px 0}" +
    ".eb i{position:absolute;left:0;top:0;bottom:0;background:#f4f4ee;transition:width .25s}" +
    ".eb span{position:absolute;right:8px;top:0;line-height:18px;font-size:.75rem;font-weight:700;color:#fff;mix-blend-mode:difference}" +
    ".tabs{display:flex;gap:6px}.tabs button{flex:1}.tabs .on{background:var(--acc);color:#1c2a31;border-color:var(--acc)}" +
    ".nav{display:flex;gap:6px}.nav button{flex:1}" +
    "textarea{width:100%;min-height:90px;background:var(--bg);color:var(--ink);border:1px solid rgba(127,127,127,.4);border-radius:6px;padding:8px;font:inherit;font-size:.85rem}" +
    ".prog{height:8px;background:var(--bg);border-radius:4px;overflow:hidden}.prog i{display:block;height:100%;width:0;background:var(--acc)}" +
    ".sum{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sum div{background:var(--bg);padding:8px;border-radius:8px;font-size:.88rem}.sum b{display:block;font-size:1.3rem}" +
    "#graph{width:100%;background:var(--bg);border-radius:8px;cursor:pointer}" +
    ".log .m{cursor:pointer}.log .cur{background:var(--acc);color:#1c2a31;border-radius:4px;padding:0 4px}" +
    ".k1{color:#ffd24a}.k2{color:#ff9f43}.k3{color:#ff5a5a}.cur.k1,.cur.k2,.cur.k3{color:#1c2a31}" +
    "#side{gap:10px}#side .btns{margin-top:4px}";
  document.head.appendChild(css);

  // ---------- Motor (Stockfish em Web Worker) ----------
  const E = (() => {
    let w = null, ready = null, cur = null, chain = Promise.resolve();
    const boot = () => ready || (ready = new Promise((res, rej) => {
      try { w = new Worker("engine/stockfish-19-lite-single.js"); } catch (e) { ready = null; return rej(e); }
      w.onerror = () => { ready = null; rej(new Error("Não consegui carregar o motor (arquivo ausente ou bloqueado).")); };
      w.onmessage = ev => {
        const l = String(ev.data);
        if (l === "uciok") { w.postMessage("setoption name Hash value 16"); w.postMessage("isready"); }
        else if (l === "readyok") res();
        else if (cur) cur(l);
      };
      w.postMessage("uci");
    }));
    const search = (fen, go, cfg) => {
      const run = chain.catch(() => {}).then(boot).then(() => new Promise(res => {
        const o = cfg || {}, white = fen.split(" ")[1] === "w"; let info = { type: "cp", v: 0 };
        cur = l => {
          if (l.startsWith("info") && / score /.test(l) && !/bound/.test(l)) {
            const m = l.match(/score (cp|mate) (-?\d+)/); if (m) info = { type: m[1], v: +m[2] };
          } else if (l.startsWith("bestmove")) {
            cur = null; const s = white ? 1 : -1;
            res(info.type === "mate"
              ? { cp: s * Math.sign(info.v) * (10000 - Math.min(Math.abs(info.v), 100) * 10), mate: s * info.v, best: l.split(" ")[1] }
              : { cp: s * info.v, mate: null, best: l.split(" ")[1] });
          }
        };
        w.postMessage("setoption name UCI_LimitStrength value " + (o.elo ? "true" : "false"));
        if (o.elo) w.postMessage("setoption name UCI_Elo value " + o.elo);
        w.postMessage("setoption name Skill Level value " + (o.skill == null ? 20 : o.skill));
        w.postMessage("position fen " + fen); w.postMessage("go " + go);
      }));
      chain = run; return run;
    };
    return { search, loaded: () => !!ready };
  })();

  // ---------- Tabuleiro ----------
  let flipped = false, mode = "play";
  const kingOf = (pos, col) => { const b = pos.board(); for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = b[r][c]; if (p && p.type === "k" && p.color === col) return "abcdefgh"[c] + (8 - r); } };
  function drawBoard(pos, o = {}) {
    const files = flipped ? "hgfedcba" : "abcdefgh", ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
    const kingSq = pos.in_check() ? kingOf(pos, pos.turn()) : null; let h = "";
    ranks.forEach((r, ri) => [...files].forEach((f, fi) => {
      const sq = f + r, p = pos.get(sq); let c = "sq" + (((f.charCodeAt(0) - 97) + r) % 2 === 0 ? " d" : "");
      if (o.last && (sq === o.last.from || sq === o.last.to)) c += " last";
      if (o.best && (sq === o.best.from || sq === o.best.to)) c += " best";
      if (sq === o.sel) c += " sel";
      if (sq === kingSq) c += " chk";
      if (o.targets && o.targets.includes(sq)) c += p ? " cp" : " mv";
      h += `<button class="${c}" data-sq="${sq}" aria-label="${sq}">` + (fi === 0 ? `<i class="co rk">${r}</i>` : "") + (ri === 7 ? `<i class="co fl">${f}</i>` : "") + (p ? pc(p.color, p.type) : "") + "</button>";
    }));
    $("board").innerHTML = h;
  }

  // ---------- Modo: jogar contra o computador ----------
  const LV = [
    { n: "1 · Iniciante", skill: 0, depth: 1 }, { n: "2 · Fácil", skill: 4, depth: 2 },
    { n: "3 · Médio-fácil (≈1300)", elo: 1320, ms: 150 }, { n: "4 · Médio (≈1600)", elo: 1600, ms: 250 },
    { n: "5 · Bom (≈1900)", elo: 1900, ms: 400 }, { n: "6 · Forte (≈2300)", elo: 2300, ms: 600 },
    { n: "7 · Mestre (≈2800)", elo: 2800, ms: 800 }, { n: "8 · Máximo", skill: 20, ms: 1200 }];
  $("lv").innerHTML = LV.map((l, i) => `<option value="${i}">${l.n}</option>`).join(""); $("lv").value = recall("xm-lv") || "3";
  $("lv").onchange = () => store("xm-lv", $("lv").value);
  let g = new Chess(), my = "w", busy = false, sel = null, targets = [], hintMv = null, gameId = 0;
  const lvl = () => LV[Number($("lv").value)];

  function playView() {
    const h = g.history({ verbose: true }), last = h[h.length - 1];
    drawBoard(g, { sel, targets, last, best: hintMv });
    const topC = flipped ? "w" : "b", lab = c => c === my ? "Você" : "Computador";
    $("nTop").textContent = lab(topC); $("nBot").textContent = lab(topC === "w" ? "b" : "w");
    $("sTop").textContent = $("sBot").textContent = "";
    $("status").textContent = g.in_checkmate() ? (g.turn() === my ? "Xeque-mate: o computador venceu." : "Xeque-mate: você venceu! 🎉")
      : g.in_stalemate() ? "Empate por afogamento." : g.in_draw() ? "Empate." : busy ? "Computador pensando…" : g.turn() === my ? "Sua vez" + (g.in_check() ? " – xeque!" : "") : "Vez do computador";
    const hist = g.history(); let l = "";
    for (let i = 0; i < hist.length; i += 2) l += `<span class="n">${i / 2 + 1}.</span><span>${pt(hist[i])}</span><span>${hist[i + 1] ? pt(hist[i + 1]) : ""}</span>`;
    $("plog").innerHTML = l || '<span class="msg">Nenhum lance ainda.</span>'; $("plog").scrollTop = 1e6;
  }
  async function engineMove() {
    if (g.game_over() || g.turn() === my) return;
    const gid = gameId; busy = true; playView();
    if (!E.loaded()) msg("Carregando o motor (1,8 MB)…");
    try {
      const L = lvl(), r = await E.search(g.fen(), L.depth ? "depth " + L.depth : "movetime " + L.ms, L);
      if (gid !== gameId) return;
      msg("");
      if (r.best && r.best !== "(none)") g.move({ from: r.best.slice(0, 2), to: r.best.slice(2, 4), promotion: r.best[4] });
    } catch (e) { if (gid === gameId) msg(e.message); }
    if (gid !== gameId) return;
    busy = false; hintMv = null; playView();
  }
  function onSq(sq) {
    if (mode !== "play" || busy || g.game_over() || g.turn() !== my) return;
    const p = g.get(sq);
    if (sel && targets.includes(sq)) { g.move({ from: sel, to: sq, promotion: "q" }); sel = null; targets = []; hintMv = null; msg(""); playView(); engineMove(); return; }
    if (p && p.color === my && sq !== sel) { sel = sq; targets = g.moves({ square: sq, verbose: true }).map(m => m.to); } else { sel = null; targets = []; }
    playView();
  }
  function newGame() {
    my = $("col").value === "r" ? (Math.random() < .5 ? "w" : "b") : $("col").value;
    flipped = my === "b"; g = new Chess(); gameId++; busy = false; sel = null; targets = []; hintMv = null; msg("");
    playView(); engineMove();
  }
  $("nw").onclick = newGame;
  $("un").onclick = () => { if (busy || !g.history().length) return; gameId++; g.undo(); if (g.turn() !== my) g.undo(); sel = null; targets = []; hintMv = null; playView(); if (g.turn() !== my) engineMove(); };
  $("ht").onclick = async () => {
    if (busy || g.game_over() || g.turn() !== my) return;
    busy = true; msg("Pensando na dica…"); const gid = gameId;
    try {
      const r = await E.search(g.fen(), "depth 12", { skill: 20 }); if (gid !== gameId) return;
      hintMv = { from: r.best.slice(0, 2), to: r.best.slice(2, 4) };
      const t = new Chess(g.fen()), m = t.move({ from: hintMv.from, to: hintMv.to, promotion: r.best[4] }); msg("Dica: " + (m ? pt(m.san) : r.best));
    } catch (e) { msg(e.message); }
    busy = false; playView();
  };
  $("fl").onclick = () => { flipped = !flipped; refresh(); };
  $("toAn").onclick = () => { if (!g.history().length) return msg("Jogue alguns lances antes de analisar."); $("pgn").value = g.pgn(); setTab("an"); analyze(); };

  // ---------- Modo: analisar partida ----------
  let A = null, ply = 0, cancel = false;
  const label = r => r.mate === 0 ? "#" : r.mate != null ? (r.mate > 0 ? "M" : "-M") + Math.abs(r.mate) : (r.cp >= 0 ? "+" : "") + (r.cp / 100).toFixed(1);
  const sanOf = (fen, u) => { try { const t = new Chess(fen), m = t.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }); return m ? pt(m.san) : u; } catch (e) { return u; } };
  const MARK = ["", "?!", "?", "??"], NAME = ["", "imprecisão", "erro", "erro grave"];

  async function analyze() {
    const txt = $("pgn").value.trim(); if (!txt) return msg("Cole um PGN ou use a última partida online.");
    const c = new Chess(); if (!c.load_pgn(txt)) return msg("Não consegui ler esse PGN.");
    const hv = c.history({ verbose: true }); if (!hv.length) return msg("Essa partida não tem lances.");
    const r = c.header().FEN ? new Chess(c.header().FEN) : new Chess(), fens = [r.fen()]; hv.forEach(m => { r.move(m.san); fens.push(r.fen()); });
    const D = Number($("depth").value), res = []; cancel = false; A = null; msg("");
    $("go").disabled = true; $("stop").classList.remove("hidden"); $("progW").classList.remove("hidden"); $("prog").style.width = "0";
    $("sum").innerHTML = ""; $("graph").classList.add("hidden"); $("navA").classList.add("hidden"); $("alog").innerHTML = ""; $("info").textContent = E.loaded() ? "" : "Carregando o motor (1,8 MB)…";
    try {
      for (let i = 0; i < fens.length && !cancel; i++) {
        const pos = new Chess(fens[i]);
        if (pos.game_over()) res.push({ cp: pos.in_checkmate() ? (pos.turn() === "w" ? -10000 : 10000) : 0, mate: pos.in_checkmate() ? 0 : null, best: null });
        else res.push(await E.search(fens[i], "depth " + D));
        $("prog").style.width = Math.round((i + 1) / fens.length * 100) + "%"; $("info").textContent = `Analisando… posição ${i + 1} de ${fens.length}`;
      }
    } catch (e) { msg(e.message); }
    $("go").disabled = false; $("stop").classList.add("hidden"); $("progW").classList.add("hidden");
    if (cancel || res.length < fens.length) { $("info").textContent = "Análise interrompida."; return; }
    const cls = hv.map((m, i) => {
      const w0 = win(res[i].cp), w1 = win(res[i + 1].cp), b = m.color === "w" ? w0 : 100 - w0, a = m.color === "w" ? w1 : 100 - w1;
      const loss = m.from + m.to + (m.promotion || "") === res[i].best ? 0 : Math.max(0, b - a);
      return { loss, k: loss >= 15 ? 3 : loss >= 10 ? 2 : loss >= 5 ? 1 : 0, acc: Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * loss) - 3.1669)) };
    });
    A = { fens, hv, res, cls }; ply = 0; sumView(); $("graph").classList.remove("hidden"); $("navA").classList.remove("hidden"); anView();
  }
  function sumView() {
    const box = col => {
      const xs = A.hv.map((m, i) => m.color === col ? A.cls[i] : null).filter(Boolean), n = k => xs.filter(x => x.k === k).length;
      const acc = xs.length ? Math.round(xs.reduce((s, x) => s + x.acc, 0) / xs.length) : 0;
      return `<div>${col === "w" ? "Brancas" : "Pretas"}<b>${acc}%</b>precisão<br><span class="k1">?! ${n(1)}</span> · <span class="k2">? ${n(2)}</span> · <span class="k3">?? ${n(3)}</span></div>`;
    };
    $("sum").innerHTML = box("w") + box("b");
  }
  function anView() {
    if (!A) return;
    const pos = new Chess(A.fens[ply]), mv = ply > 0 ? A.hv[ply - 1] : null, ck = ply > 0 ? A.cls[ply - 1] : null, bu = ply > 0 && ck.k > 0 ? A.res[ply - 1].best : null;
    drawBoard(pos, { last: mv, best: bu ? { from: bu.slice(0, 2), to: bu.slice(2, 4) } : null });
    const rr = A.res[ply]; $("eb").classList.remove("hidden"); $("eb").firstChild.style.width = win(rr.cp) + "%"; $("eb").lastChild.textContent = label(rr);
    $("nTop").textContent = flipped ? "Brancas" : "Pretas"; $("nBot").textContent = flipped ? "Pretas" : "Brancas";
    $("status").textContent = ply === 0 ? "Posição inicial" : `Lance ${ply} de ${A.hv.length}`;
    const parts = [];
    if (mv) parts.push(`${Math.ceil(ply / 2)}${mv.color === "w" ? "." : "..."} ${pt(mv.san)}${MARK[ck.k]} ${ck.k ? "(" + NAME[ck.k] + ")" : "(boa jogada)"}`);
    if (bu) parts.push(`o melhor era ${sanOf(A.fens[ply - 1], bu)}`);
    if (rr.best) parts.push(`melhor agora: ${sanOf(A.fens[ply], rr.best)}`);
    $("info").textContent = parts.join(" · ");
    let l = "";
    for (let i = 0; i < A.hv.length; i += 2) {
      const cell = j => A.hv[j] ? `<span class="m k${A.cls[j].k}${ply === j + 1 ? " cur" : ""}" data-p="${j + 1}">${pt(A.hv[j].san)}${MARK[A.cls[j].k]}</span>` : "<span></span>";
      l += `<span class="n">${i / 2 + 1}.</span>${cell(i)}${cell(i + 1)}`;
    }
    $("alog").innerHTML = l; const c = $("alog").querySelector(".cur"); if (c) c.scrollIntoView({ block: "nearest" });
    // gráfico: chance de vitória das brancas ao longo da partida
    const N = A.fens.length - 1, X = i => N ? i / N * 300 : 0, Y = i => 80 - win(A.res[i].cp) * .8;
    $("graph").innerHTML = `<line x1="0" y1="40" x2="300" y2="40" stroke="#5a8179" stroke-width=".6" stroke-dasharray="3"/><polyline fill="none" stroke="#e6bf55" stroke-width="1.6" points="${A.fens.map((f, i) => X(i).toFixed(1) + "," + Y(i).toFixed(1)).join(" ")}"/><line x1="${X(ply)}" y1="0" x2="${X(ply)}" y2="80" stroke="#fff" stroke-width="1"/>`;
  }
  const jump = n => { if (!A) return; ply = Math.max(0, Math.min(A.hv.length, n)); anView(); };
  $("go").onclick = analyze; $("stop").onclick = () => { cancel = true; };
  $("useLast").onclick = () => { const p = recall("xm-lastpgn"); if (p) { $("pgn").value = p; analyze(); } else msg("Ainda não há partida salva neste navegador."); };
  $("aF").onclick = () => jump(0); $("aP").onclick = () => jump(ply - 1); $("aN").onclick = () => jump(ply + 1); $("aL").onclick = () => jump(1e9);
  $("alog").onclick = e => { const s = e.target.closest("[data-p]"); if (s) jump(Number(s.dataset.p)); };
  $("graph").onclick = e => { if (!A) return; const r = $("graph").getBoundingClientRect(); jump(Math.round((e.clientX - r.left) / r.width * A.hv.length)); };
  document.addEventListener("keydown", e => {
    if (mode !== "an" || !A || /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName)) return;
    const k = { ArrowLeft: () => jump(ply - 1), ArrowRight: () => jump(ply + 1), Home: () => jump(0), End: () => jump(1e9) }[e.key];
    if (k) { e.preventDefault(); k(); }
  });

  // ---------- Abas ----------
  function refresh() { if (mode === "play") { $("eb").classList.add("hidden"); playView(); } else if (A) anView(); else { drawBoard(new Chess(), {}); $("status").textContent = "Cole um PGN para analisar."; $("eb").classList.add("hidden"); } }
  function setTab(m) {
    mode = m; $("tPlay").classList.toggle("on", m === "play"); $("tAn").classList.toggle("on", m === "an");
    $("pPlay").classList.toggle("hidden", m !== "play"); $("pAn").classList.toggle("hidden", m !== "an"); msg(""); refresh();
  }
  $("tPlay").onclick = () => setTab("play"); $("tAn").onclick = () => setTab("an");
  $("board").addEventListener("click", e => { const el = e.target.closest(".sq"); if (el) onSq(el.dataset.sq); });

  // início
  if (new URLSearchParams(location.search).get("tab") === "analisar") {
    setTab("an"); const p = recall("xm-lastpgn"); if (p) { $("pgn").value = p; analyze(); }
  } else newGame();
})();
