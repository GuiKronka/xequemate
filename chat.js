// XequeMate — Chat da partida. Carregue DEPOIS do app.js.
(() => {
  const CHAT_ON = true;   // coloque false para desligar o chat (ex.: no dia do torneio)
  if (!CHAT_ON) return;

  const css = document.createElement("style");
  css.textContent = "#chat{order:-1;flex:1 1 220px;max-width:300px;min-width:200px;height:min(620px,80vh);padding:12px;gap:8px}" +
    ".ch-h{display:flex;align-items:center;justify-content:space-between}.ch-h button{padding:.2em .6em}" +
    ".ch-l{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:6px;font-size:.92rem}" +
    ".ch-m{background:var(--bg);padding:6px 9px;border-radius:8px;max-width:92%;word-break:break-word}" +
    ".ch-m b{display:block;font-size:.72rem;color:var(--mut)}" +
    ".ch-m.me{align-self:flex-end;background:rgba(230,191,85,.22)}" +
    ".ch-m.sys{align-self:center;background:none;color:var(--mut);font-size:.8rem;font-style:italic}" +
    ".ch-r{display:flex;gap:6px}.ch-r input{flex:1;min-width:0}" +
    "#chat.min{height:auto}#chat.min .ch-l,#chat.min .ch-r{display:none}" +
    "@media(max-width:900px){#chat{order:3;max-width:none;flex-basis:100%;height:300px}#chat.min{height:auto}}";
  document.head.appendChild(css);

  const box = document.createElement("aside"); box.id = "chat";
  box.innerHTML = '<div class="ch-h"><b>💬 Chat <span id="chDot" hidden>●</span></b><button id="chX" title="Mostrar ou ocultar">–</button></div>' +
    '<div id="chL" class="ch-l"></div><div class="ch-r"><input id="chI" maxlength="200" placeholder="Mensagem…" autocomplete="off"><button id="chS">Enviar</button></div>';
  $("game").insertBefore(box, $("game").firstElementChild);
  const L = $("chL"), dot = $("chDot");
  dot.style.color = "var(--acc)";

  let cur = null, ch = null, seen = new Set();
  const minimized = () => box.classList.contains("min");
  const setMin = v => { box.classList.toggle("min", v); store("xm-chat", v ? "min" : null); if (!v) { dot.hidden = true; L.scrollTop = L.scrollHeight; } };
  setMin(recall("xm-chat") === "min");
  $("chX").onclick = () => setMin(!minimized());

  function note(text) {
    const d = document.createElement("div"); d.className = "ch-m sys"; d.textContent = text; L.appendChild(d); L.scrollTop = L.scrollHeight;
  }
  function add(m) {
    if (seen.has(m.id)) return; seen.add(m.id);
    const mine = m.user_id === user.id, d = document.createElement("div"), n = document.createElement("b"), t = document.createElement("span");
    d.className = "ch-m" + (mine ? " me" : ""); n.textContent = mine ? "Você" : m.name; t.textContent = m.body; d.append(n, t);
    const atEnd = L.scrollHeight - L.scrollTop - L.clientHeight < 60;
    L.appendChild(d); if (atEnd || mine) L.scrollTop = L.scrollHeight;
    if (!mine && minimized()) dot.hidden = false;
  }
  async function loadAll(id) {
    const { data } = await client.from("chess_chat").select("*").eq("room_id", id).order("id", { ascending: false }).limit(60);
    if (cur === id && data) data.reverse().forEach(add);
  }
  function start(id) {
    L.innerHTML = ""; seen = new Set(); dot.hidden = true;
    loadAll(id);
    ch = client.channel("chat-" + id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chess_chat", filter: "room_id=eq." + id }, p => add(p.new))
      .subscribe(s => { if (s === "SUBSCRIBED") loadAll(id); });
  }
  // Acompanha a sala atual (entrar, sair, revanche)
  setInterval(() => {
    const id = typeof room !== "undefined" && room ? room.id : null;
    if (id === cur) return;
    cur = id; if (ch) { client.removeChannel(ch); ch = null; }
    if (id) start(id);
  }, 700);

  async function send() {
    const inp = $("chI"), body = inp.value.trim(); if (!body || !cur) return;
    inp.value = "";
    const { data, error } = await client.rpc("send_chess_chat", { p_room_id: cur, p_body: body });
    if (error) { note(error.message); inp.value = body; return; }
    add(data);
  }
  $("chS").onclick = send;
  $("chI").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); send(); } });
})();
