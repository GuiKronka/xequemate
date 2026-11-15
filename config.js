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

  // ---- Preferências salvas (se o localStorage falhar, vale o padrão) ----
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  // Som: só existe na partida online (index.html)
  if (el("muteBtn")) row("Som", el("muteBtn"));

  // Tema do tabuleiro: vira body[data-tema="..."] e o style.css troca as cores das casas
  const TEMAS = { verde: "Verde-água (padrão)", madeira: "Madeira", azul: "Azul", cinza: "Cinza" };
  // Um quadradinho colorido por tema (as cores de cada um ficam no style.css, em .sw[data-t="..."])
  const boxTema = document.createElement("div");
  boxTema.className = "cfg-sw";
  for (const k in TEMAS) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "sw"; b.dataset.t = k; b.title = TEMAS[k]; b.setAttribute("aria-label", "Tema " + TEMAS[k]);
    boxTema.appendChild(b);
  }
  const setTema = t => {
    if (!TEMAS[t]) t = "verde";
    document.body.dataset.tema = t;
    boxTema.querySelectorAll(".sw").forEach(b => b.setAttribute("aria-pressed", b.dataset.t === t ? "true" : "false"));
  };
  setTema(get("xm-tema"));
  boxTema.onclick = e => { const b = e.target.closest(".sw"); if (b) { setTema(b.dataset.t); set("xm-tema", b.dataset.t); } };
  row("Tema do tabuleiro", boxTema);

  // Coordenadas (a–h, 1–8): vira body[data-coord="0"] quando ocultas
  const chkCoord = document.createElement("input");
  chkCoord.type = "checkbox"; chkCoord.setAttribute("aria-label", "Mostrar coordenadas");
  const setCoord = on => { document.body.dataset.coord = on ? "1" : "0"; chkCoord.checked = on; };
  setCoord(get("xm-coord") !== "0");
  chkCoord.onchange = () => { setCoord(chkCoord.checked); set("xm-coord", chkCoord.checked ? "1" : "0"); };
  row("Mostrar coordenadas", chkCoord);

  // Pré-lance: só existe na partida online (index.html)
  if (el("preBtn")) row("Pré-lance", el("preBtn"));

  // ---- Abrir e fechar ----
  const open = () => { ov.hidden = false; el("cfgX").focus(); };
  const close = () => { if (ov.hidden) return; ov.hidden = true; btn.focus(); };
  btn.onclick = open;
  el("cfgX").onclick = close;
  ov.addEventListener("click", e => { if (e.target === ov) close(); });   // clique fora do cartão
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  // Com o painel aberto, as teclas (ex.: setas) não chegam aos atalhos da revisão de lances
  ov.addEventListener("keydown", e => { if (e.key !== "Escape") e.stopPropagation(); });
})();
