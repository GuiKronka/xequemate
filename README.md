# XequeMate — MVP multiplayer

## Estrutura
- `index.html`: estrutura da interface.
- `style.css`: visual responsivo inspirado em sites de xadrez.
- `app.js`: tabuleiro, regras via chess.js, Supabase Auth e Realtime.
- `sql/schema.sql`: tabela, RLS e funções RPC.

## Configuração
1. Crie um projeto em https://supabase.com.
2. Em Authentication > Providers, habilite **Anonymous Sign-Ins**.
3. No SQL Editor, execute todo o arquivo `sql/schema.sql`.
4. Em Database > Replication (ou Publications), habilite a tabela `chess_rooms` para eventos UPDATE do Realtime.
5. Copie Project URL e anon/public key em Project Settings > API e cole no topo de `app.js`.
6. Publique os arquivos em um host estático HTTPS (por exemplo, GitHub Pages) ou rode localmente com um servidor estático.
7. Abra o mesmo endereço nos dois Chromebooks. Um cria a sala e envia o código; o outro entra.

## Importante: estágio do projeto
Este é um MVP para teste entre amigos, não uma plataforma pronta para partidas competitivas. O navegador valida as regras com chess.js, mas a RPC ainda aceita FEN/PGN enviados pelo cliente sem revalidar cada lance no servidor. Um usuário tecnicamente malicioso poderia adulterar a partida. Antes de uso público, mover a validação de jogadas para uma Edge Function ou servidor confiável e reforçar o controle de relógio, reconexão, empate e revanche.

O relógio nesta primeira versão é uma contagem local aproximada; para precisão e resistência a manipulações, o servidor deve calcular o tempo usando timestamps confiáveis. Não coloque a `service_role` key no navegador. Use apenas a chave anon/public.
