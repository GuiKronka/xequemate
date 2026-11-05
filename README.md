# ♟ XequeMate

Xadrez online entre amigos para jogar em navegadores diferentes (pensado para Chromebooks de sala de aula). Sem instalação e sem cadastro: abre no navegador, cria-se uma sala, envia-se o código ou o link e pronto. Também tem torneio suíço para a turma, partidas contra o computador (Stockfish) e quebra-cabeças.

> Projeto educacional e experimental. Funciona bem para uso entre colegas, mas **não é uma plataforma pronta para partidas competitivas abertas ao público** (veja [Limitações](#limitações-conhecidas)).

## Recursos

**Partida online**
- Salas privadas com código de 6 caracteres e **link de convite** (`?sala=CÓDIGO`)
- Regras completas via [chess.js](https://github.com/jhlywa/chess.js) (roque, en passant, promoção, empates)
- Ritmos de 1 a 60 minutos, com ou sem incremento (ex.: 3+0, 3+2, 10+5)
- **Relógio calculado no servidor**, com derrota por tempo. Quando os dois jogadores estão desconectados, o relógio **congela**
- Desistência (com confirmação), empate por acordo e revanche com cores trocadas
- Reconexão automática: a partida continua salva se o Chromebook for fechado. Quem trocar de aparelho retoma o lugar com o **mesmo apelido** e o código da sala
- Salas sem atividade por 1h40 são apagadas automaticamente
- Peças em SVG, destaque do último lance e do rei em xeque, peças capturadas e **vantagem de material** (+N)
- **Pré-lances**: desligado, único ou vários lances em fila
- Sons de lance, captura, xeque e fim de partida (com botão de mudo)
- Revisão dos lances depois do fim da partida e chat entre os dois jogadores

**Torneio suíço**
- Anfitrião cria o torneio (também pode jogar), alunos entram com código e apelido
- Pareamento automático por rodada, sem repetir adversário e com folga (bye) para número ímpar
- Resultados entram sozinhos; o anfitrião pode lançar resultado manual ou remover jogadores (W.O.)
- Classificação por pontos, desempate por Buchholz e vitórias
- PIN de 4 dígitos para o anfitrião recuperar o comando em outro aparelho
- A classificação é apagada 4 horas após o fim do torneio

**Computador (`ia.html`)**
- Jogue contra o **Stockfish 19 (lite)** rodando no próprio navegador, em 8 níveis, com dica e desfazer
- **Análise de partidas**: cole um PGN (ou use o botão "Analisar partida" ao fim de um jogo) e veja precisão de cada lado, erros e erros graves, melhor lance, gráfico e barra de avaliação

**Quebra-cabeças (`puzzles.html`)**
- Problemas de mate em 1 a 4 lances e de ganho de material, com dica, solução e "nível" que sobe e desce conforme os acertos (salvo no navegador)
- Os problemas foram **gerados por análise de partidas simuladas com o Stockfish** (posições em que existe um único lance vencedor). A dificuldade mostrada é uma estimativa

## Estrutura

```
index.html        Página inicial e a tela da partida online
style.css         Visual (tema escuro) compartilhado por todas as páginas
app.js            Lógica principal: salas, jogadas, relógio, Realtime
torneio.js        Torneio suíço
extras.js         Peças SVG, material, revisão de lances, pré-lances, atalhos
chat.js           Chat da partida
home.js           Tabuleiro animado e atalhos da página inicial
pecas.js          Peças SVG embutidas (usadas por várias páginas)
ia.html / ia.js   Jogar contra o computador e analisar partidas
puzzles.html      Quebra-cabeças
puzzles.js        Lógica dos quebra-cabeças
puzzles-data.js   Banco de problemas
teste-rede.html   Página de diagnóstico de rede (use na escola)
engine/           Stockfish (WebAssembly) e licença GPL
sql/
  schema.sql      Banco base e funções da partida
  torneio.sql     Tabelas e funções do torneio
  chat.sql        Tabela e função do chat
```

Ordem de carregamento no `index.html` (importa): `pecas.js`, `app.js`, `torneio.js`, `extras.js`, `chat.js`, `home.js`.

Tecnologias: HTML, CSS e JavaScript puros, chess.js, Stockfish.js (WebAssembly), Supabase (Postgres, login anônimo, Realtime) e GitHub Pages. Não há etapa de build.

## Como configurar

1. **Crie um projeto** em [supabase.com](https://supabase.com).
2. Em **Authentication > Sign In / Providers**, habilite **Anonymous**.
3. No **SQL Editor**, execute, nesta ordem: `sql/schema.sql`, `sql/torneio.sql` e `sql/chat.sql`.
4. Confirme em **Database > Publications** (`supabase_realtime`) que as tabelas `chess_rooms`, `tournaments`, `tournament_players`, `tournament_games` e `chess_chat` estão habilitadas.
5. Em **Project Settings > API**, copie a **Project URL** e a **Publishable key** (`sb_publishable_...`) e cole nas duas primeiras constantes do `app.js`. Se for usar o `teste-rede.html`, cole os mesmos valores nele.
6. **Publique**: no GitHub, em **Settings > Pages**, escolha *Deploy from a branch*, branch `main`, pasta `/ (root)`.

As páginas `ia.html` e `puzzles.html` funcionam **sem Supabase**: só precisam dos arquivos estáticos (e da pasta `engine/`, no caso do computador).

Para testar no computador, use a extensão **Live Server** do VS Code (não abra o arquivo com duplo clique). Para simular dois jogadores no mesmo computador, use uma janela normal e uma **anônima**.

> Depois de publicar uma mudança, use **Ctrl+Shift+R** para recarregar sem o cache do navegador.

## Segurança

- Use **somente** a chave pública (`sb_publishable_...`) no navegador. **Nunca** coloque a *secret key* ou a `service_role` no código.
- As tabelas têm RLS ativado e a escrita acontece apenas por funções do banco (RPC). Cada jogador só lê as salas, torneios e mensagens de que participa.
- Os apelidos são o único dado pessoal. Peça que os alunos **não usem o nome completo**.

## Antes de usar na escola

1. Abra o `teste-rede.html` em um Chromebook na rede da escola. Todas as linhas precisam ficar ✅ (principalmente **Tempo real**).
2. O Supabase limita logins anônimos por IP (padrão de cerca de 30 por hora). Em turmas grandes, aumente em **Authentication > Rate Limits**.
3. Se algo for bloqueado pela rede, peça à TI para liberar: `*.github.io`, `*.supabase.co` (HTTPS e WebSocket), `cdn.jsdelivr.net` e `cdnjs.cloudflare.com`.

## Limitações conhecidas

- **O servidor não revalida as jogadas.** Ele confere de quem é a vez e controla o relógio, mas confia no navegador para a legalidade dos lances e para declarar xeque-mate. Um usuário técnico poderia adulterar uma partida.
- **O chat não tem filtro de palavras.** Para desativá-lo, defina `CHAT_ON = false` no topo do `chat.js`.
- Não há contas nem ranking: o login é anônimo, então a identidade se perde ao limpar os dados do navegador.
- Os quebra-cabeças são gerados automaticamente e podem ter lances alternativos equivalentes que não são reconhecidos; a dificuldade é estimada.
- A análise usa a versão lite do Stockfish, que é bem mais fraca que a completa, e a precisão segue as fórmulas públicas do Lichess (não bate exatamente com o Chess.com).
- Promoção de peão em pré-lance, contra o computador e nos quebra-cabeças pode virar dama automaticamente.

## Créditos e licenças

- [chess.js](https://github.com/jhlywa/chess.js) (regras do xadrez)
- [Supabase](https://supabase.com) (banco, autenticação e tempo real)
- [Stockfish](https://github.com/official-stockfish/Stockfish) e [Stockfish.js](https://github.com/nmrugg/stockfish.js) (Nathan Rugg), licença **GPLv3** (texto em `engine/Copying.txt`)
- Peças: conjunto **cburnett**, de [Colin M.L. Burnett](https://en.wikipedia.org/wiki/User:Cburnett), distribuído pelo projeto [Lichess](https://github.com/lichess-org/lila) sob a licença [GPLv2+](https://www.gnu.org/licenses/gpl-2.0.txt)
- A animação da página inicial reproduz a "Partida da Ópera" (Morphy × Duque de Brunswick, 1858), de domínio público
