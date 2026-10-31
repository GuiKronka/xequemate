// XequeMate — Torneio suíço. Carregue DEPOIS do app.js (usa as variáveis dele).
(() => {
  let T = null, ch = null, loading = false, again = false, entered = null, timer = null;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const css = document.createElement("style");
  css.textContent = "#tv{max-width:780px;margin:3vh auto;padding:0 12px}#tv h3{margin:18px 0 8px;font-size:1.05rem}#tv table{width:100%;border-collapse:collapse}#tv td,#tv th{padding:6px 8px;text-align:left;border-bottom:1px solid rgba(127,127,127,.25)}#tv .dim{opacity:.5}#tv .grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}#tv .gm{padding:8px 10px;margin:6px 0;background:var(--bg);border-radius:8px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between}#tv .win{color:var(--acc);font-weight:700}#tt{position:fixed;top:12px;left:50%;transform:translateX(-50%);background:var(--acc);color:#1c2a31;font-weight:700;padding:10px 16px;border-radius:8px;z-index:20;max-width:92vw;text-align:center}@media(max-width:600px){#tv .grid{grid-template-columns:1fr}}";
  document.head.appendChild(css);
  const tv = document.createElement("section"); tv.id = "tv"; tv.className = "hidden"; document.body.insertBefore(tv, $("game"));
  const tt = document.createElement("div"); tt.id = "tt"; tt.hidden = true; document.body.appendChild(tt);
  $("setup").querySelector(".card").insertAdjacentHTML("beforeend", '<div class="row"><button id="tBtn" style="flex:1">🏆 Torneio</button></div>');
  document.querySelector("#game .btns").insertAdjacentHTML("beforeend", '<button id="backT" class="hidden" disabled>🏆 Voltar ao torneio</button>');
  const toast = m => { tt.textContent = m || ""; tt.hidden = !m; };

  // Ao entrar numa sala, esconde a tela do torneio
  const _enter = enterRoom;
  enterRoom = async row => { tv.classList.add("hidden"); return _enter(row); };

  function forms(msg) {
    T = null; if (ch) { client.removeChannel(ch); ch = null; }
    tv.classList.remove("hidden"); $("setup").classList.add("hidden"); $("backT").classList.add("hidden");
    const nick = esc($("nickname").value);
    tv.innerHTML = `<div class="card"><h2>🏆 Torneio suíço</h2><div class="grid"><div>
      <h3>Criar torneio</h3>
      <label>Nome<input id="tn" maxlength="30" placeholder="Torneio Resenha"></label>
      <label>Seu apelido<input id="th" maxlength="18" value="${nick}"></label>
      <label>PIN do anfitrião (4 números)<input id="tp" maxlength="4" inputmode="numeric"></label>
      <label>Ritmo<select id="tr"><option value="180+0" selected>3+0</option><option value="60+0">1+0 (relâmpago)</option><option value="180+2">3+2</option></select></label>
      <label>Rodadas<select id="tq"><option>3</option><option selected>4</option><option>5</option><option>6</option><option>7</option></select></label>
      <label><input type="checkbox" id="tpl" checked style="width:auto;display:inline;margin-right:6px">Eu também jogo</label>
      <div class="row"><button id="tc" class="primary" style="flex:1">Criar torneio</button></div></div><div>
      <h3>Entrar em um torneio</h3>
      <label>Código<input id="jc" maxlength="6" style="text-transform:uppercase"></label>
      <label>Seu apelido<input id="jn" maxlength="18" value="${nick}"></label>
      <div class="row"><button id="jb" class="primary" style="flex:1">Entrar</button></div>
      <h3>Voltar a ser anfitrião</h3>
      <label>Código<input id="rc" maxlength="6" style="text-transform:uppercase"></label>
      <label>PIN<input id="rp" maxlength="4" inputmode="numeric"></label>
      <div class="row"><button id="rb" style="flex:1">Recuperar</button></div></div></div>
      <p id="tm" class="msg">${esc(msg || "")}</p><div class="row"><button id="tx">Voltar</button></div></div>`;
    const go = async (fn, nid) => { try { await ensureUser(); const { data, error } = await fn(); if (error) throw error; store("xm-nick", $(nid).value.trim()); openT(data); } catch (e) { say("tm", e.message); } };
    $("tc").onclick = () => go(() => { const [s, i] = $("tr").value.split("+").map(Number);
      return client.rpc("t_create", { p_code: code(), p_name: $("tn").value, p_host: $("th").value, p_pin: $("tp").value, p_seconds: s, p_inc: i, p_rounds: Number($("tq").value), p_play: $("tpl").checked }); }, "th");
    $("jb").onclick = () => go(() => client.rpc("t_join", { p_code: $("jc").value, p_name: $("jn").value }), "jn");
    $("rb").onclick = () => go(() => client.rpc("t_reclaim", { p_code: $("rc").value, p_pin: $("rp").value }), "jn");
    $("tx").onclick = () => { tv.classList.add("hidden"); $("setup").classList.remove("hidden"); };
  }

  function openT(t) {
    T = { t, players: [], games: [] }; entered = null; store("xm-torneio", t.code);
    muted = true; if (typeof paintMute === "function") paintMute();   // no torneio os sons começam mudos
    tv.classList.remove("hidden"); $("setup").classList.add("hidden"); $("backT").classList.remove("hidden");
    if (ch) client.removeChannel(ch);
    const f = (table, filter) => ["postgres_changes", { event: "*", schema: "public", table, filter }, () => load()];
    ch = client.channel("t-" + t.id).on(...f("tournaments", "id=eq." + t.id)).on(...f("tournament_players", "tournament_id=eq." + t.id))
      .on(...f("tournament_games", "tournament_id=eq." + t.id)).subscribe(s => { if (s === "SUBSCRIBED") load(); });
    load();
  }
  function gone() { store("xm-torneio", null); forms("Esse torneio foi encerrado ou apagado."); }

  async function load() {
    if (!T) return; if (loading) { again = true; return; } loading = true;
    try {
      const id = T.t.id;
      const [a, b, c] = await Promise.all([
        client.from("tournaments").select("*").eq("id", id).maybeSingle(),
        client.from("tournament_players").select("*").eq("tournament_id", id),
        client.from("tournament_games").select("*").eq("tournament_id", id).order("round")]);
      if (!a.data) { if (!a.error) gone(); return; }
      T.t = a.data; T.players = b.data || []; T.games = c.data || [];
      draw(); maybeEnter();
    } catch (e) {} finally { loading = false; if (again) { again = false; load(); } }
  }

  // Classificação: pontos, Buchholz (soma dos pontos dos adversários) e vitórias
  function stand() {
    const S = {};
    T.players.forEach(p => S[p.id] = { p, pts: 0, buch: 0, wins: 0, opp: [], played: new Set(), bye: false, whites: 0, last: "" });
    for (const g of T.games.slice().sort((x, y) => x.round - y.round)) {
      const W = S[g.white_player], B = g.black_player ? S[g.black_player] : null; if (!W) continue;
      if (!B) { W.pts++; W.wins++; W.bye = true; continue; }
      W.whites++; W.last = "w"; B.last = "b"; W.played.add(B.p.id); B.played.add(W.p.id);
      if (g.result === "w") { W.pts++; W.wins++; } else if (g.result === "b") { B.pts++; B.wins++; } else if (g.result === "d") { W.pts += .5; B.pts += .5; }
      if (g.result) { W.opp.push(B.p.id); B.opp.push(W.p.id); }
    }
    Object.values(S).forEach(s => s.buch = s.opp.reduce((n, id) => n + (S[id] ? S[id].pts : 0), 0));
    return S;
  }
  const rank = S => Object.values(S).sort((a, b) => b.pts - a.pts || b.buch - a.buch || b.wins - a.wins || a.p.name.localeCompare(b.p.name));
  const fmt = n => String(n).replace(".5", "½").replace(/^0½$/, "½");

  // Pareamento suíço: sorteio na 1ª rodada; depois por pontos, sem repetir adversário
  function pair() {
    const S = stand(); let pool = T.players.filter(p => p.active);
    const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    shuffle(pool);
    if (T.t.current_round > 0) pool.sort((a, b) => S[b.id].pts - S[a.id].pts || S[b.id].buch - S[a.id].buch);
    let bye = null;
    if (pool.length % 2) { const i = pool.map(p => S[p.id].bye).lastIndexOf(false); bye = pool.splice(i >= 0 ? i : pool.length - 1, 1)[0]; }
    const res = [];
    const solve = (list, strict) => {
      if (!list.length) return true;
      const a = list[0];
      for (let i = 1; i < list.length; i++) {
        const b = list[i]; if (strict && S[a.id].played.has(b.id)) continue;
        res.push([a, b]); if (solve(list.filter((_, k) => k && k !== i), strict)) return true; res.pop();
      }
      return false;
    };
    if (!solve(pool, true)) { res.length = 0; solve(pool, false); }
    const out = res.map(([a, b]) => {
      const sa = S[a.id], sb = S[b.id];
      const aw = sa.whites < sb.whites ? true : sa.whites > sb.whites ? false : sa.last === "b" ? true : sb.last === "b" ? false : Math.random() < .5;
      return aw ? { w: a.id, b: b.id } : { w: b.id, b: a.id };
    });
    if (bye) out.push({ w: bye.id, b: null });
    return out;
  }

  const me = () => T.players.find(p => p.user_id === user.id);
  const isHost = () => T.t.host_id === user.id;
  const STAT = { lobby: "Aguardando início", playing: "Rodada em andamento", between: "Entre rodadas", finished: "Terminou" };
  const SC = { w: "1–0", b: "0–1", d: "½–½" };

  function draw() {
    if (!T || tv.classList.contains("hidden")) return;
    const t = T.t, S = stand(), R = rank(S), host = isHost(), mine = me(), nm = id => esc((T.players.find(p => p.id === id) || {}).name || "?");
    const act = T.players.filter(p => p.active).length;
    const cur = T.games.filter(g => g.round === t.current_round);
    const canStart = host && (t.status === "lobby" || t.status === "between") && t.current_round < t.rounds && act >= 2;
    let h = `<div class="card"><div class="row" style="justify-content:space-between;align-items:center;margin:0"><h2>🏆 ${esc(t.name)}</h2><span class="pill">${STAT[t.status]}</span></div>
      <p class="msg">Código <b style="letter-spacing:2px;color:var(--ink)">${t.code}</b> · ritmo ${t.seconds / 60}+${t.increment} · rodada ${t.current_round}/${t.rounds} · ${act} jogador(es)</p>
      <h3>Classificação</h3><table><tr><th>#</th><th>Jogador</th><th>Pts</th><th title="Buchholz">Desempate</th><th>V</th>${host ? "<th></th>" : ""}</tr>`;
    R.forEach((s, i) => { h += `<tr class="${s.p.active ? "" : "dim"}"><td>${i + 1}</td><td>${esc(s.p.name)}${s.p.id === (mine || {}).id ? " (você)" : ""}${s.p.active ? "" : " · saiu"}</td><td><b>${fmt(s.pts)}</b></td><td>${fmt(s.buch)}</td><td>${s.wins}</td>${host ? `<td>${s.p.active ? `<button data-rm="${s.p.id}">remover</button>` : ""}</td>` : ""}</tr>`; });
    h += "</table>";
    if (t.status === "finished" && R[0]) h += `<p class="win big" style="font-size:1.3rem">🏆 Campeão: ${esc(R[0].p.name)}! A classificação fica salva por 4 horas.</p>`;
    if (cur.length) {
      h += `<h3>Rodada ${t.current_round}</h3>`;
      cur.forEach(g => {
        const bye = !g.black_player, res = bye ? "folga (1 ponto)" : g.result ? SC[g.result] + (g.forfeit ? " (W.O.)" : "") : "● jogando";
        h += `<div class="gm"><span>⬜ ${nm(g.white_player)} × ${bye ? "—" : nm(g.black_player)} ⬛</span><span>${res}${host && !g.result ? ` <button data-g="${g.id}" data-r="w">1–0</button><button data-g="${g.id}" data-r="d">½</button><button data-g="${g.id}" data-r="b">0–1</button>` : ""}</span></div>`;
      });
    }
    h += `<p id="tm2" class="msg"></p><div class="btns">`;
    if (host && t.status !== "finished") h += `<button id="ts" class="primary" ${canStart ? "" : "disabled"}>Iniciar rodada ${Math.min(t.current_round + 1, t.rounds)}</button>`;
    if (mine && mine.active && t.status === "playing" && cur.some(g => !g.result && g.room_id && (g.white_player === mine.id || g.black_player === mine.id))) h += `<button id="tgo">Ir para minha partida</button>`;
    if (mine && mine.active && t.status !== "finished") h += `<button id="tle">Sair do torneio</button>`;
    if (host) h += `<button id="tdel">Apagar torneio</button>`;
    h += `<button id="tsw">Trocar de torneio</button><button id="tx2">Fechar</button></div></div>`;
    tv.innerHTML = h;
    const call = async (fn, args) => { try { const { error } = await client.rpc(fn, args); if (error) throw error; } catch (e) { say("tm2", e.message); } };
    tv.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => confirm("Remover este jogador? Se ele estiver numa partida, o adversário vence por W.O.") && call("t_leave", { p_tid: t.id, p_player: b.dataset.rm }));
    tv.querySelectorAll("[data-g]").forEach(b => b.onclick = () => call("t_set_result", { p_game: b.dataset.g, p_result: b.dataset.r }));
    if ($("ts")) $("ts").onclick = () => call("t_start_round", { p_tid: t.id, p_pairs: pair() });
    if ($("tgo")) $("tgo").onclick = () => maybeEnter(true);
    if ($("tle")) $("tle").onclick = () => confirm("Sair do torneio? Sua partida atual conta como derrota.") && call("t_leave", { p_tid: t.id });
    if ($("tdel")) $("tdel").onclick = async () => { if (confirm("Apagar o torneio e a classificação para todos?")) { await call("t_delete", { p_tid: t.id }); gone(); } };
    $("tsw").onclick = () => { store("xm-torneio", null); forms(); };
    $("tx2").onclick = () => { tv.classList.add("hidden"); $("setup").classList.remove("hidden"); };
  }

  // Quando a rodada começa, entra sozinho na própria partida (com 3 s de aviso)
  function maybeEnter(force) {
    if (!T || T.t.status !== "playing") return;
    const m = me(); if (!m || !m.active) return;
    const g = T.games.find(x => x.round === T.t.current_round && !x.result && x.room_id && (x.white_player === m.id || x.black_player === m.id));
    if (!g || (!force && entered === g.id)) return;
    if (!force && typeof room !== "undefined" && room && !isOver()) return;
    entered = g.id;
    const white = g.white_player === m.id, opp = (T.players.find(p => p.id === (white ? g.black_player : g.white_player)) || {}).name || "?";
    toast(`Rodada ${T.t.current_round}! Você joga de ${white ? "brancas" : "pretas"} contra ${opp}. Entrando em 3 s…`);
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try { const { data } = await client.from("chess_rooms").select("*").eq("id", g.room_id).maybeSingle(); if (data) await enterRoom(data); } catch (e) {}
      toast("");
    }, 3000);
  }

  $("tBtn").onclick = async () => {
    const s = recall("xm-torneio");
    if (s) { try { await ensureUser(); const { data } = await client.rpc("t_join", { p_code: s, p_name: $("nickname").value }); if (data) return openT(data); } catch (e) {} }
    forms();
  };
  $("backT").onclick = async () => { await leaveRoom(); tv.classList.remove("hidden"); $("setup").classList.add("hidden"); draw(); };
  setInterval(() => { $("backT").disabled = !(typeof room !== "undefined" && room && isOver()); if (T) load(); }, 15000);
  setInterval(() => { $("backT").disabled = !(room && isOver()); }, 1000);

  // Ao abrir o site, volta sozinho para o torneio salvo
  (async () => {
    const s = recall("xm-torneio"); if (!s) return;
    try {
      await ensureUser();
      const { data, error } = await client.rpc("t_join", { p_code: s, p_name: recall("xm-nick") || "" });
      if (data) { if ($("game").classList.contains("hidden")) openT(data); else { T = { t: data, players: [], games: [] }; $("backT").classList.remove("hidden"); load(); } }
      else if (error && /não encontrado|terminou|removido/i.test(error.message)) store("xm-torneio", null);
    } catch (e) {}
  })();
})();
