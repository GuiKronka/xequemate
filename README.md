# ♟ XequeMate

Xadrez online entre amigos para jogar em navegadores diferentes (pensado para Chromebooks de sala de aula). Sem instalação: abre no navegador, cria-se uma sala, envia-se o código ou o link e pronto. Inclui torneio suíço para a turma.

> Projeto educacional e experimental. Funciona bem para uso entre colegas, mas **não é uma plataforma pronta para partidas competitivas abertas ao público** (veja [Limitações](#limitações-conhecidas)).

## Recursos

**Partida**
- Salas privadas com código de 6 caracteres e **link de convite** (`?sala=CÓDIGO`)
- Regras completas via [chess.js](https://github.com/jhlywa/chess.js) (roque, en passant, promoção, empates)
- Ritmos de 1 a 60 minutos, com ou sem incremento (ex.: 3+0, 3+2, 10+5)
- **Relógio calculado no servidor**, com derrota por tempo. Quando os dois jogadores estão desconectados, o relógio **congela**
- Desistência (com confirmação), empate por acordo e revanche com cores trocadas
- Reconexão automática: a partida continua salva se o Chromebook for fechado. Quem trocar de aparelho retoma o lugar com o **mesmo apelido** e o código da sala
- Salas sem atividade por 1h40 são apagadas automaticamente

**Interface**
- Peças em SVG, destaque do último lance e do rei em xeque, coordenadas nas casas
- Peças capturadas e **vantagem de material** (+N)
- **Pré-lances**: desligado, único ou vários lances em fila
- Sons de lance, captura, xeque e fim de partida (com botão de mudo)
- Revisão dos lances depois do fim da partida (botões e setas do teclado)
- Chat da partida, entre os dois jogadores

**Torneio suíço**
- Anfitrião cria o torneio (também pode jogar), alunos entram com código e apelido
- Pareamento automático por rodada, sem repetir adversário e com folga (bye) para número ímpar
- Resultados entram sozinhos; o anfitrião pode lançar resultado manual ou remover jogadores (W.O.)
- Classificação por pontos, desempate por Buchholz e vitórias
- PIN de 4 dígitos para o anfitrião recuperar o comando em outro aparelho
- A classificação é apagada 4 horas após o fim do torneio

## Estrutura

```
index.html        Estrutura da página
style.css         Visual (tema escuro)
app.js            Lógica principal: salas, jogadas, relógio, Realtime
extras.js         Peças SVG, material, revisão de lances, modo de pré-lance
chat.js           Chat da partida
torneio.js        Torneio suíço
teste-rede.html   Página de diagnóstico de rede (use na escola)
sql/
  schema.sql      Banco base e funções da partida
  torneio.sql     Tabelas e funções do torneio
  chat.sql        Tabela e função do chat
```

Ordem de carregamento no `index.html` (importa): `app.js`, `torneio.js`, `extras.js`, `chat.js`.

Tecnologias: HTML, CSS e JavaScript puros, chess.js, Supabase (banco Postgres, login anônimo, Realtime) e GitHub Pages para hospedagem. Não há etapa de build.

## Como configurar

1. **Crie um projeto** em [supabase.com](https://supabase.com).
2. Em **Authentication > Sign In / Providers**, habilite **Anonymous**.
3. No **SQL Editor**, execute, nesta ordem: `sql/schema.sql`, `sql/torneio.sql` e `sql/chat.sql`.
4. Confirme em **Database > Publications** (`supabase_realtime`) que as tabelas `chess_rooms`, `tournaments`, `tournament_players`, `tournament_games` e `chess_chat` estão habilitadas.
5. Em **Project Settings > API**, copie a **Project URL** e a **Publishable key** (`sb_publishable_...`) e cole nas duas primeiras constantes do `app.js`:
   ```js
   const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
   const SUPABASE_ANON_KEY = "sb_publishable_...";
   ```
   Se for usar o `teste-rede.html`, cole os mesmos dois valores nele.
6. **Publique**: no GitHub, em **Settings > Pages**, escolha *Deploy from a branch*, branch `main`, pasta `/ (root)`. O site fica em `https://SEU_USUARIO.github.io/NOME-DO-REPOSITORIO/`.

Para testar no computador, use a extensão **Live Server** do VS Code (não abra o arquivo com duplo clique). Para simular dois jogadores no mesmo computador, use uma janela normal e uma **anônima**: o login anônimo fica salvo no navegador, então duas abas comuns viram o mesmo jogador.

> Depois de publicar uma mudança, use **Ctrl+Shift+R** para recarregar sem o cache do navegador.

## Segurança

- Use **somente** a chave pública (`sb_publishable_...`) no navegador. **Nunca** coloque a *secret key* ou a `service_role` no código.
- As tabelas têm RLS ativado e o acesso de escrita acontece apenas por funções do banco (RPC). Cada jogador só lê as salas, torneios e mensagens de que participa.
- Os apelidos são o único dado pessoal. Peça que os alunos **não usem o nome completo**.

## Antes de usar na escola

1. Abra o `teste-rede.html` em um Chromebook na rede da escola. Todas as linhas precisam ficar ✅ (principalmente **Tempo real**).
2. O Supabase limita logins anônimos por IP (padrão de cerca de 30 por hora). Em turmas grandes, aumente em **Authentication > Rate Limits**.
3. Se algo for bloqueado pela rede, peça à TI para liberar: `*.github.io`, `*.supabase.co` (HTTPS e WebSocket), `cdn.jsdelivr.net` e `cdnjs.cloudflare.com`.

## Limitações conhecidas

- **O servidor não revalida as jogadas.** Ele confere de quem é a vez e controla o relógio, mas confia no navegador para a legalidade dos lances e para declarar xeque-mate. Um usuário técnico poderia adulterar uma partida. Para uso público, o próximo passo é validar os lances em uma Edge Function com chess.js.
- **O chat não tem filtro de palavras.** Para desativá-lo (por exemplo, no dia do torneio), defina `CHAT_ON = false` no topo do `chat.js`.
- Não há contas nem ranking: o login é anônimo, então a identidade se perde ao limpar os dados do navegador (por isso existe a retomada por apelido).
- Promoção de peão em pré-lance sempre vira dama.
- Em ritmos muito curtos (1+0), o atraso da internet pesa no relógio.

## Créditos

- [chess.js](https://github.com/jhlywa/chess.js) (regras do xadrez)
- [Supabase](https://supabase.com) (banco, autenticação e tempo real)
- Peças: conjunto **cburnett**, de [Colin M.L. Burnett](https://en.wikipedia.org/wiki/User:Cburnett), distribuído pelo projeto [Lichess](https://github.com/lichess-org/lila) sob a licença [GPLv2+](https://www.gnu.org/licenses/gpl-2.0.txt)
