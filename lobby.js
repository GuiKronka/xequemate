// XequeMate — Lista de salas e torneios públicos na tela inicial.
// Carregue POR ÚLTIMO no index.html (usa client, $, store, ensureUser e enterRoom do app.js e xmOpenT do torneio.js).
(() => {
  const css = document.createElement("style");
  css.textContent = ".lobby{display:grid;grid-template-columns:1fr 1fr;gap:16px}" +
    ".lobby h4{margin:0 0 8px;font-size:1rem}" +
    ".lb-i{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;margin:6px 0;background:var(--bg);border-radius:8px}" +
    ".lb-i div{min-width:0}.lb-i b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".lb-i span{color:var(--mut);font-size:.85rem}" +
    "@media(max-width:700px){.lobby{grid-template-columns:1fr}}";
  document.head.appendChild(css);

  // Monta a seção (fica logo acima dos cartões "Jogar online", "Torneio suíço"...)
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const title = el("h3", "sect", "Salas e torneios públicos");
  const wrap = el("div", "lobby");
  const cardR = el("div", "card"), cardT = el("div", "card");
  const listR = el("div"), listT = el("div"), info = el("p", "msg");
  cardR.append(el("h4", "", "♟ Salas aguardando adversário"), listR);
  cardT.append(el("h4", "", "🏆 Torneios abertos"), listT);
  wrap.append(cardR, cardT);
  const anchor = document.querySelector("#setup .features");
  anchor.before(title, wrap, info);

  const say2 = m => { info.textContent = m || ""; };
  const ritmo = (s, i) => (s / 60) + "+" + (i || 0);
  const nick = () => $("nickname").value.trim();

  // Desenha uma lista. Tudo com textContent (os nomes vêm de outras pessoas).
  function paint(box, rows, empty, line, sub, onClick) {
    box.textContent = "";
    if (!rows.length) { box.append(el("p", "msg", empty)); return; }
    rows.forEach(r => {
      const item = el("div", "lb-i"), txt = el("div"), btn = el("button", "primary", "Entrar");
      txt.append(el("b", "", line(r)), el("span", "", sub(r)));
      btn.onclick = () => onClick(r, btn);
      item.append(txt, btn); box.append(item);
    });
  }

  async function enterPublicRoom(r, btn) {
    btn.disabled = true; say2("");
    try {
      await ensureUser();
      const name = nick() || "Pretas"; store("xm-nick", name);
      const { data, error } = await client.rpc("join_chess_room", { p_code: r.code, p_name: name });
      if (error) throw error;
      await enterRoom(data);
    } catch (e) { say2(e.message); refresh(true); }
    btn.disabled = false;
  }

  async function enterPublicTournament(t, btn) {
    const name = nick();
    if (!name) { say2("Digite seu apelido lá em cima antes de entrar no torneio."); $("nickname").focus(); return; }
    btn.disabled = true; say2("");
    try {
      await ensureUser(); store("xm-nick", name);
      const { data, error } = await client.rpc("t_join", { p_code: t.code, p_name: name });
      if (error) throw error;
      window.xmOpenT(data);
    } catch (e) { say2(e.message); refresh(true); }
    btn.disabled = false;
  }

  let busy = false, lastLoad = 0, lastData = "", wasVisible = false;
  async function refresh(force) {
    if (busy) return; busy = true; lastLoad = Date.now();
    try {
      const [a, b] = await Promise.all([client.rpc("list_public_rooms"), client.rpc("list_public_tournaments")]);
      if (a.error || b.error) throw (a.error || b.error);
      const rooms = a.data || [], ts = b.data || [], sig = JSON.stringify([rooms, ts]);
      if (force || sig !== lastData) {   // só redesenha se algo mudou (não atrapalha quem está clicando)
        lastData = sig;
        paint(listR, rooms, "Nenhuma sala pública aguardando agora.",
          r => r.white_name, r => "ritmo " + ritmo(r.initial_seconds, r.increment_seconds) + (r.chat_off ? " · sem chat" : ""), enterPublicRoom);
        paint(listT, ts, "Nenhum torneio público aberto agora.",
          t => t.name, t => "ritmo " + ritmo(t.seconds, t.increment) + " · " + t.rounds + " rodadas · " + t.players + " jogador(es)", enterPublicTournament);
      }
    } catch (e) { if (!lastData) { listR.textContent = ""; listT.textContent = ""; listR.append(el("p", "msg", "Não consegui carregar a lista.")); } }
    busy = false;
  }

  // Atualiza a cada 10 s, só enquanto a tela inicial estiver visível (e na hora em que ela volta a aparecer)
  setInterval(() => {
    const visible = !document.hidden && !$("setup").classList.contains("hidden");
    if (visible && (!wasVisible || Date.now() - lastLoad >= 10000)) refresh();
    wasVisible = visible;
  }, 1000);
  refresh();
})();
