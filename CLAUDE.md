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
- `lobby.js`: lista de salas e torneios públicos na tela inicial (atualiza a cada 10 s; entra com um clique). Carregado depois do `tabuleiro.js`, por último. SQL em `sql/lobby.sql` (já aplicado).
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

## Futuro: sistema de contas
Ainda não existe. O código já está no formato certo para receber, então **manter estas regras**:
- Todo o banco identifica a pessoa por `auth.uid()` (`white_id`, `black_id`, `host_id`, `user_id`). Não criar identificação por apelido nem por `localStorage`.
- O único ponto de login no navegador é o `ensureUser()` do `app.js`. Qualquer tela nova deve chamar ele, nunca `signInAnonymously` direto.
- Caminho previsto: transformar o usuário anônimo em conta com `client.auth.updateUser({ email, password })` (ou `linkIdentity`). O `auth.uid()` **continua o mesmo**, então salas, torneios e RLS seguem funcionando sem migração.
- Com contas, a retomada de lugar passa a ser pelo login: aí dá para remover a retomada por apelido (`t_join`, `join_chess_room`) e o PIN do anfitrião (`t_reclaim`, `pin_hash`).
- Apelido continua sendo só o nome de exibição (`white_name`, `tournament_players.name`); não usar como chave.

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
- **Segurança deixada para o sistema de contas (decisão do Gui em 14/11/2026: por enquanto fica assim):**
  - `tournaments.pin_hash` (SHA-256 sem sal de 4 números) chega ao navegador de todo participante (`select("*")` no `torneio.js` e retorno de `t_create`/`t_join`/`t_reclaim`). `t_reclaim` não limita tentativas.
  - `t_join` e `join_chess_room` devolvem o lugar a quem digitar o mesmo apelido (retomada em outro aparelho), sem senha.
- `sql/schema.sql` é a versão inicial. O banco real tem também `chess_presence`, as tabelas de torneio, `chess_chat` e várias funções; `sql/torneio.sql` e `sql/chat.sql` não estão na pasta.
- Teste de rede na escola ainda pendente (WebSocket do Supabase, CDNs e GitHub Pages).
