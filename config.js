// XequeMate — Configurações: botão ⚙️ no cabeçalho e painel de preferências.
// Carregue por ÚLTIMO. Só mexe na aparência (DOM/CSS): não conhece as regras do jogo.
// Os botões de som e de pré-lance que já existem na página são MOVIDOS para o painel,
// então os cliques deles continuam sendo tratados pelo app.js e pelo extras.js.
(() => {
  const top = document.querySelector(".topin");
  if (!top) return;
  const el = id => document.getElementById(id);

  // ---- Botão ⚙️ (fica antes do "Conectado", se ele existir) ----
  const btn = document.createElement("button");
  btn.id = "cfgBtn"; btn.type = "button"; btn.textContent = "⚙️";
  btn.title = "Configurações"; btn.setAttribute("aria-label", "Configurações");
  top.insertBefore(btn, el("connection"));   // se não houver #connection, vai para o fim

  // ---- Painel ----
  const ov = document.createElement("div");
  ov.id = "cfg"; ov.className = "ov"; ov.hidden = true;
  ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Configurações");
  ov.innerHTML = '<div class="card"><b class="cfg-t">⚙️ Configurações</b><div id="cfgRows"></div>' +
    '<div class="row"><button id="cfgX" type="button" style="flex:1">Fechar</button></div></div>';
  document.body.appendChild(ov);
  const rows = el("cfgRows");

  // Cria uma linha "Nome ........ [controle]" e devolve a linha
  function row(text, control) {
    const r = document.createElement("div"), s = document.createElement("span");
    r.className = "cfg-r"; s.textContent = text; r.append(s, control); rows.appendChild(r);
    return r;
  }

  // Som e pré-lance: só existem na partida online (index.html)
  if (el("muteBtn")) row("Som", el("muteBtn"));
  if (el("preBtn")) row("Pré-lance", el("preBtn"));

  // ---- Abrir e fechar ----
  const open = () => { ov.hidden = false; el("cfgX").focus(); };
  const close = () => { if (ov.hidden) return; ov.hidden = true; btn.focus(); };
  btn.onclick = open;
  el("cfgX").onclick = close;
  ov.addEventListener("click", e => { if (e.target === ov) close(); });   // clique fora do cartão
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
})();
