# XequeMate — contexto para o Claude Code

Site de xadrez online para jogar entre amigos em Chromebooks de sala de aula, com torneio suíço, chat, partidas contra o computador (Stockfish) e quebra-cabeças. Sem cadastro (login anônimo).

## Sobre o usuário
- O Gui está aprendendo. Dê **passos diretos**, diga **em qual arquivo e em qual ponto** mudar, e prefira **soluções simples** a soluções perfeitas.
- Interface e comentários em **português do Brasil**.

## Stack e regras gerais
- HTML, CSS e JavaScript puros. **Não há build.** Hospedagem: GitHub Pages (branch `main`, pasta raiz).
- Backend: Supabase (Postgres, login anônimo, Realtime). No navegador só vai a chave pública `sb_publishable_...` (nas duas primeiras linhas do `app.js`). **Nunca** colocar `secret key` ou `service_role` no código.
- Regras do xadrez: **chess.js 0.10.3** (via cdnjs). **Não atualizar para 1.x**: os nomes mudam (`game_over()` vira `isGameOver()` etc.).
- Motor: Stockfish 19 lite (single-thread, WebAssembly) em `engine/`, rodando em Web Worker, usado só em `ia.html`. Licença GPLv3 (manter `engine/Copying.txt`).
- Peças: SVG cburnett embutidas em data URI em `pecas.js` (GPLv2+, manter o crédito).

## Arquivos
- `index.html`: página inicial e a tela da partida online. `style.css`: visual compartilhado (tema escuro).
- `app.js`: salas, jogadas, relógio, Realtime, reconexão. `torneio.js`: torneio suíço. `chat.js`: chat da partida.
- `extras.js`: peças SVG, material, revisão de lances, pré-lances, motivo do empate e atalhos.
- `tabuleiro.js`: arrastar e soltar peças e setas/círculos (botão direito). Carregado por último em `index.html`, `ia.html` e `puzzles.html`. Só mexe no DOM: bloqueia o clique nativo no `#board` e chama `casa.click()`, então as regras continuam no `onSquare`/`onSq` de cada tela.
- `home.js`: tabuleiro animado e atalhos da página inicial.
- `ia.html` + `ia.js`: jogar contra o Stockfish e analisar partidas. `puzzles.html` + `puzzles.js` + `puzzles-data.js`: quebra-cabeças.
- `teste-rede.html`: diagnóstico de rede para a escola.
- `sql/schema.sql`, `sql/torneio.sql`, `sql/chat.sql`: banco de dados.

## Convenções que importam
- Os scripts compartilham o escopo global. Ordem de carga no `index.html`: `pecas.js`, `app.js`, `torneio.js`, `extras.js`, `chat.js`, `home.js`. **Não mudar a ordem.**
- O `extras.js` **substitui** funções do `app.js`: `render`, `captured`, `findKing`, `vget`, `showPromo`, `onPre`. Para mudar o desenho do tabuleiro ou do painel da partida, edite o `extras.js` (o `render` do `app.js` é sobrescrito).
- Cor das casas: escura quando (índice da coluna, com a = 0, + número da linha) é **ímpar** (a1 escura, h1 clara).
- Nomes de jogadores vêm do usuário: ao colocar em HTML use `textContent` ou escape (`esc`). Nunca `innerHTML` com texto digitado sem escapar.
- O relógio é calculado no servidor (`chess_beat`, `chess_touch`, `play_chess_move`). O cliente só exibe e faz uma contagem local entre os "sinais de vida".
- As tabelas têm RLS e a escrita é só por funções RPC (`security definer`). Cada jogador lê apenas o que é seu.
- Salas expiram após 100 min sem atividade (limpeza feita em `create_chess_room` e `join_chess_room`). Torneios: 4 h após terminar, ou 12 h se abandonados.

## Mudanças no banco (SQL)
O Claude Code **não executa SQL no Supabase**. Quando uma mudança exigir SQL: escreva o SQL, copie para o arquivo certo em `sql/`, e peça ao Gui para colar no SQL Editor do Supabase e clicar em Run. Aplicar o SQL **antes** de publicar o JavaScript que depende dele.

## Como testar
- Abrir com a extensão Live Server do VS Code (não abrir o arquivo com duplo clique).
- Para simular dois jogadores no mesmo computador: uma janela normal e uma anônima (o login anônimo fica salvo no navegador).
- Depois de publicar no GitHub Pages, recarregar com Ctrl+Shift+R (cache).

## Limitações e pendências conhecidas
- O servidor **não revalida a legalidade dos lances** nem o xeque-mate; só confere a vez e o relógio. Para uso público, o próximo passo é uma Edge Function com chess.js.
- O chat não tem filtro de palavras (`CHAT_ON = false` no `chat.js` desliga).
- Os quebra-cabeças foram gerados com o Stockfish (não são do Lichess); a dificuldade é estimada.
- Conferir se `sql/schema.sql` está consolidado com todas as funções criadas depois da versão inicial (criar/entrar na sala, `play_chess_move`, `chess_beat`, `chess_touch`, `chess_draw`, `resign_chess_game`, revanche).
- Teste de rede na escola ainda pendente (WebSocket do Supabase, CDNs e GitHub Pages).
