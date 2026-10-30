// >>> COPIE do seu app.js antigo as duas linhas abaixo (sua URL e sua chave sb_publishable_) <<<
const SUPABASE_URL = "https://ioftthhkqecqkxgtcyhy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_DHyEhkFkPxnbUc5yk9sq8Q_CKym_f8e";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = id => document.getElementById(id);
const chess = new Chess();
const G = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
const PT = { K: "R", Q: "D", R: "T", N: "C" }; // notação em português (só na tela)
let user = null, room = null, channel = null, myColor = "w", flipped = false;
let sel = null, targets = [], pend = null, armed = 0, gameOver = false;
let remaining = { w: 600, b: 600 }, lastTick = Date.now();

const say = (id, m) => { $(id).textContent = m || ""; };
const timeText = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
const store = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
const recall = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const isOver = () => gameOver || chess.game_over();
const code = () => Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "X");
const pt = s => s.replace(/^[KQRN]/, m => PT[m]).replace(/=([QRN])/, (x, m) => "=" + PT[m]);

// Correção de alinhamento vertical dos glifos (mede a fonte no canvas)
const DY = {};
(function () { try {
  const x = document.createElement("canvas").getContext("2d"), Z = 100;
  x.font = Z + 'px "Segoe UI Symbol","Noto Sans Symbols 2","DejaVu Sans","Apple Symbols",sans-serif';
  for (const t in G) {
    const m = x.measureText(G[t] + "\uFE0E"); if (m.fontBoundingBoxAscent == null) return;
    const base = (Z - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
    DY[t] = (Z / 2 - (2 * base - m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / 2) / Z;
  }
} catch (e) {} })();
const glyph = (color, t) => `<span class="p ${color}" style="top:${DY[t] || 0}em">${G[t]}\uFE0E</span>`;

async function ensureUser() {
  if (user) return user;
  const { data, error } = await client.auth.getSession(); if (error) throw error;
  if (data.session) user = data.session.user;
  else { const r = await client.auth.signInAnonymously(); if (r.error) throw r.error; user = r.data.user; }
  return user;
}

async function createRoom() {
  try {
    await ensureUser();
    const name = $("nickname").value.trim() || "Brancas"; store("xm-nick", name);
    const { data, error } = await client.rpc("create_chess_room", { p_code: code(), p_name: name, p_seconds: Number($("timeControl").value) });
    if (error) throw error;
    await enterRoom(data);
  } catch (e) { say("setupMessage", e.message); }
}
async function joinRoom() {
  try {
    await ensureUser();
    const name = $("nickname").value.trim() || "Pretas", roomCode = $("roomCode").value.trim().toUpperCase();
    if (!roomCode) throw new Error("Digite o código da sala.");
    store("xm-nick", name);
    const { data, error } = await client.rpc("join_chess_room", { p_code: roomCode, p_name: name });
    if (error) throw error;
    await enterRoom(data);
  } catch (e) { say("setupMessage", e.message); }
}
async function enterRoom(row) {
  room = row; myColor = row.white_id === user.id ? "w" : "b"; flipped = myColor === "b";
  sel = null; targets = []; pend = null; store("xm-room", row.code);
  $("setup").classList.add("hidden"); $("game").classList.remove("hidden");
  $("roomLabel").textContent = row.code; say("gameMessage", "");
  $("orientation").textContent = myColor === "w" ? "você joga de brancas" : "você joga de pretas";
  applyRow(row); subscribe();
}
function applyRow(row) {
  room = row;
  if (!(row.pgn && chess.load_pgn(row.pgn))) { chess.reset(); if (row.fen) chess.load(row.fen); }
  remaining = { w: Number(row.white_ms), b: Number(row.black_ms) }; lastTick = Date.now();
  gameOver = !!row.finished_at; sel = null; targets = [];
  $("rematchBtn").disabled = !gameOver; $("resignBtn").disabled = gameOver || !row.black_id;
  if (row.rematch_white || row.rematch_black) say("rematchInfo", "Pedido de revanche: " + (row.rematch_white ? "brancas " : "") + (row.rematch_black ? "pretas" : ""));
  else say("rematchInfo", "");
  render();
}
function subscribe() {
  if (channel) client.removeChannel(channel);
  channel = client.channel("room-" + room.id)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chess_rooms", filter: "id=eq." + room.id }, async payload => {
      if (payload.new.id !== room.id) return;
      if (payload.new.rematch_room_id && payload.new.rematch_room_id !== room.id) {
        const { data } = await client.from("chess_rooms").select("*").eq("id", payload.new.rematch_room_id).single();
        if (data) { await enterRoom(data); say("gameMessage", "Nova partida criada!"); }
        return;
      }
      if (payload.new.updated_by !== user.id) applyRow(payload.new); else render();
    })
    .subscribe(status => {
      $("connection").textContent = status === "SUBSCRIBED" ? "Conectado" : "Reconectando…";
      if (status === "SUBSCRIBED") client.from("chess_rooms").select("*").eq("id", room.id).single().then(({ data }) => { if (data) applyRow(data); });
    });
}

function findKing(col) {
  const b = chess.board();
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = b[r][c]; if (p && p.type === "k" && p.color === col) return "abcdefgh"[c] + (8 - r); }
}
function captured() {
  const n = { w: {}, b: {} }, S = { p: 8, n: 2, b: 2, r: 2, q: 1 }, out = { w: "", b: "" };
  chess.board().flat().forEach(p => { if (p) n[p.color][p.type] = (n[p.color][p.type] || 0) + 1; });
  for (const col of ["w", "b"]) { const o = col === "w" ? "b" : "w";
    for (const t of "qrbnp") for (let i = S[t] - (n[o][t] || 0); i > 0; i--) out[col] += glyph(o, t); }
  return out;
}
function paintPlayers() {
  const top = flipped ? "w" : "b", bot = flipped ? "b" : "w";
  const nm = c => c === "w" ? (room.white_name || "Brancas") : (room.black_name || "Aguardando…");
  [["Top", top], ["Bot", bot]].forEach(([k, c]) => {
    $("name" + k).textContent = nm(c) + (c === myColor ? " (você)" : "");
    $("clock" + k).textContent = timeText(remaining[c]);
    $("pl" + k).classList.toggle("turn", !isOver() && !!room.black_id && chess.turn() === c);
  });
}
function render() {
  if (!room) return;
  const hv = chess.history({ verbose: true }), last = hv[hv.length - 1];
  const kingSq = chess.in_check() ? findKing(chess.turn()) : null;
  const files = flipped ? "hgfedcba" : "abcdefgh", ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  let h = "";
  ranks.forEach((r, ri) => [...files].forEach((f, fi) => {
    const sq = f + r, p = chess.get(sq);
    let c = "sq" + (((f.charCodeAt(0) - 97) + r) % 2 === 0 ? " d" : "");
    if (last && (sq === last.from || sq === last.to)) c += " last";
    if (sq === sel) c += " sel";
    if (sq === kingSq) c += " chk";
    if (targets.includes(sq)) c += p ? " cp" : " mv";
    h += `<button class="${c}" data-sq="${sq}" aria-label="${sq}${p ? ", " + p.type + " " + (p.color === "w" ? "branca" : "preta") : ""}">` +
      (fi === 0 ? `<i class="co rk">${r}</i>` : "") + (ri === 7 ? `<i class="co fl">${f}</i>` : "") + (p ? glyph(p.color, p.type) : "") + "</button>";
  }));
  $("board").innerHTML = h;
  const over = isOver();
  const t = !room.black_id ? "Aguardando adversário" : over ? (room.result || (chess.in_checkmate() ? "Xeque-mate!" : "Empate")) :
    (chess.turn() === myColor ? "Sua vez" : "Vez do adversário") + (chess.in_check() ? " – xeque!" : "");
  $("gameStatus").textContent = t;
  $("banner").textContent = over ? t : ""; $("banner").classList.toggle("show", over && !!room.black_id);
    const cp = captured(), topC = flipped ? "w" : "b", botC = flipped ? "b" : "w";
  $("capTop").innerHTML = cp[topC]; $("capBot").innerHTML = cp[botC];
  const hist = chess.history(); let l = "";
  for (let i = 0; i < hist.length; i += 2) l += `<span class="n">${i / 2 + 1}.</span><span>${pt(hist[i])}</span><span>${hist[i + 1] ? pt(hist[i + 1]) : ""}</span>`;
  $("moveList").innerHTML = l || '<span class="msg">Nenhum lance ainda.</span>'; $("moveList").scrollTop = 1e6;
  $("rematchBtn").disabled = !over; $("resignBtn").disabled = over || !room.black_id;
  paintPlayers();
}

function onSquare(sq) {
  if (isOver() || !room?.black_id || chess.turn() !== myColor) return;
  const p = chess.get(sq);
  if (sel && targets.includes(sq)) {
    const mv = chess.moves({ square: sel, verbose: true }).find(m => m.to === sq);
    if (mv.promotion) { pend = { from: sel, to: sq }; showPromo(); return; }
    return doMove({ from: sel, to: sq });
  }
  if (p && p.color === myColor && sq !== sel) { sel = sq; targets = chess.moves({ square: sq, verbose: true }).map(m => m.to); }
  else { sel = null; targets = []; }
  render();
}
function doMove(m) { if (!chess.move(m)) return; sel = null; targets = []; render(); persistMove(); }
function showPromo() {
  $("pbtns").innerHTML = ["q", "r", "b", "n"].map(q => `<button data-q="${q}" aria-label="${q}">${G[q]}\uFE0E</button>`).join("");
  $("promo").hidden = false;
}
async function persistMove() {
  try {
    const now = Date.now(), elapsed = now - lastTick; lastTick = now;
    const mover = myColor; remaining[mover] = Math.max(0, remaining[mover] - elapsed);
    const finished = chess.game_over() || remaining[mover] <= 0;
    const result = chess.in_checkmate() ? (mover === "w" ? "Brancas venceram por xeque-mate" : "Pretas venceram por xeque-mate") :
      remaining[mover] <= 0 ? (mover === "w" ? "Pretas venceram pelo tempo" : "Brancas venceram pelo tempo") : chess.in_draw() ? "Empate" : "";
    const { data, error } = await client.rpc("play_chess_move", { p_room_id: room.id, p_fen: chess.fen(), p_pgn: chess.pgn(), p_white_ms: remaining.w, p_black_ms: remaining.b, p_finished: finished, p_result: result });
    if (error) throw error;
    if (finished) applyRow(data);
  } catch (e) { say("gameMessage", "Não consegui salvar a jogada: " + e.message + " — atualize a página para recuperar o estado do servidor."); }
}

async function resign() {
  const b = $("resignBtn");
  if (!armed) { armed = 1; b.textContent = "Clique de novo para desistir"; setTimeout(() => { armed = 0; b.textContent = "Desistir"; }, 3000); return; }
  armed = 0; b.textContent = "Desistir";
  try { const { data, error } = await client.rpc("resign_chess_game", { p_room_id: room.id }); if (error) throw error; applyRow(data); }
  catch (e) { say("gameMessage", e.message); }
}
async function requestRematch() {
  try {
    const { data, error } = await client.rpc("request_chess_rematch", { p_room_id: room.id });
    if (error) throw error;
    if (data && data.id !== room.id) { await enterRoom(data); say("gameMessage", "Nova partida criada!"); }
    else say("rematchInfo", "Pedido enviado. Aguardando seu adversário.");
  } catch (e) { say("gameMessage", e.message); }
}
async function leaveRoom() {
  if (channel) await client.removeChannel(channel);
  channel = null; room = null; store("xm-room", null);
  $("game").classList.add("hidden"); $("setup").classList.remove("hidden"); $("connection").textContent = "Desconectado";
}
async function copy(text, btn, ok) {
  try { await navigator.clipboard.writeText(text); const old = btn.textContent; btn.textContent = ok; setTimeout(() => { btn.textContent = old; }, 1500); }
  catch (e) { say("gameMessage", "Não consegui copiar. Selecione e copie manualmente: " + text); }
}

$("createBtn").onclick = createRoom; $("joinBtn").onclick = joinRoom; $("leaveBtn").onclick = leaveRoom;
$("rematchBtn").onclick = requestRematch; $("resignBtn").onclick = resign;
$("flipBtn").onclick = () => { flipped = !flipped; render(); };
$("copyCode").onclick = () => copy(location.origin + location.pathname + "?sala=" + room.code, $("copyCode"), "Copiado!");
$("pgnBtn").onclick = () => copy(chess.pgn() || "(sem lances)", $("pgnBtn"), "Copiado!");
$("banner").onclick = () => $("banner").classList.remove("show");
$("board").addEventListener("click", e => { const el = e.target.closest(".sq"); if (el) onSquare(el.dataset.sq); });
$("promo").addEventListener("click", e => {
  const q = e.target.closest("[data-q]");
  if (q && pend) { const m = { ...pend, promotion: q.dataset.q }; $("promo").hidden = true; pend = null; doMove(m); }
  else if (e.target === $("promo")) { $("promo").hidden = true; pend = null; }
});

setInterval(() => {
  if (!room || isOver() || !room.black_id) return;
  const now = Date.now(), elapsed = now - lastTick; lastTick = now;
  const turn = chess.turn(); remaining[turn] = Math.max(0, remaining[turn] - elapsed);
  paintPlayers();
  if (remaining[turn] === 0) { gameOver = true; say("gameMessage", "O tempo acabou. Na próxima versão vamos registrar a vitória por tempo no servidor."); render(); }
}, 250);

// Ao abrir: apelido salvo, convite por link (?sala=CODIGO) e reentrada automática na última sala
(async () => {
  $("nickname").value = recall("xm-nick") || "";
  const q = new URLSearchParams(location.search).get("sala");
  if (q) { $("roomCode").value = q.toUpperCase(); return; }
  const saved = recall("xm-room"); if (!saved) return;
  try {
    await ensureUser();
    const { data, error } = await client.rpc("join_chess_room", { p_code: saved, p_name: $("nickname").value.trim() || "Pretas" });
    if (!error && data && !data.finished_at && (data.white_id === user.id || data.black_id === user.id)) await enterRoom(data);
    else store("xm-room", null);
  } catch (e) { store("xm-room", null); }
})();