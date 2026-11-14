-- XequeMate — Salas e torneios públicos (lista na tela inicial) + opção de sala sem chat.
-- Cole TUDO no SQL Editor do Supabase e clique em Run. Pode rodar mais de uma vez sem problema.
-- Não muda nenhuma política RLS nem nenhuma função antiga: só adiciona colunas, funções e gatilhos novos.
-- Colunas conferidas com a estrutura real do banco em 14/11/2026.

-- ---------- 1. Colunas novas (tudo começa privado e com chat ligado) ----------
alter table public.chess_rooms add column if not exists is_public boolean not null default false;
alter table public.chess_rooms add column if not exists chat_off  boolean not null default false;
alter table public.tournaments add column if not exists is_public boolean not null default false;

-- ---------- 2. Sala: marcar como pública e/ou sem chat ----------
-- Só quem criou a sala, e só enquanto ninguém entrou.
create or replace function public.set_room_options(p_room_id uuid, p_public boolean, p_chat_off boolean)
returns public.chess_rooms language plpgsql security definer set search_path=public as $$
declare r public.chess_rooms;
begin
  if auth.uid() is null then raise exception 'Faça login primeiro.'; end if;
  select * into r from chess_rooms where id=p_room_id for update;
  if not found or r.white_id<>auth.uid() then raise exception 'Sala não encontrada.'; end if;
  if r.black_id is not null or r.finished_at is not null then raise exception 'A partida já começou.'; end if;
  -- no máximo 1 sala pública aberta por pessoa (evita encher a lista)
  if coalesce(p_public,false) then
    update chess_rooms set is_public=false where white_id=auth.uid() and black_id is null and is_public and id<>p_room_id;
  end if;
  update chess_rooms set is_public=coalesce(p_public,false), chat_off=coalesce(p_chat_off,false)
  where id=p_room_id returning * into r;
  return r;
end $$;

-- ---------- 3. Lista de salas públicas aguardando adversário ----------
-- Devolve SÓ os campos seguros (nada de white_id, fen, pgn...).
-- Só aparece se o criador ainda está com a sala aberta (sinal de vida do chess_beat nos últimos 60 s).
create or replace function public.list_public_rooms()
returns table(code text, white_name text, initial_seconds integer, increment_seconds integer, chat_off boolean, created_at timestamptz)
language sql stable security definer set search_path=public as $$
  select r.code, r.white_name, r.initial_seconds::integer, coalesce(r.increment_seconds,0)::integer, r.chat_off, r.created_at
  from chess_rooms r
  join chess_presence p on p.room_id = r.id
  where r.is_public and r.black_id is null and r.finished_at is null
    and r.updated_at > now() - interval '100 minutes'
    and p.white_seen > now() - interval '60 seconds'
  order by r.created_at desc
  limit 30;
$$;

-- ---------- 4. Sala sem chat: bloqueio no servidor ----------
-- Vale mesmo que alguém tente enviar mensagem por fora do site.
create or replace function public.chess_chat_guard()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if exists (select 1 from chess_rooms where id=new.room_id and chat_off) then
    raise exception 'O chat está desligado nesta sala.';
  end if;
  return new;
end $$;
drop trigger if exists chess_chat_guard on public.chess_chat;
create trigger chess_chat_guard before insert on public.chess_chat
for each row execute function public.chess_chat_guard();

-- A revanche de uma sala sem chat também nasce sem chat.
create or replace function public.chess_rematch_keep_chat()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.chat_off and new.rematch_room_id is not null and new.rematch_room_id is distinct from old.rematch_room_id then
    update chess_rooms set chat_off=true where id=new.rematch_room_id;
  end if;
  return new;
end $$;
drop trigger if exists chess_rematch_keep_chat on public.chess_rooms;
create trigger chess_rematch_keep_chat after update of rematch_room_id on public.chess_rooms
for each row execute function public.chess_rematch_keep_chat();

-- ---------- 5. Torneio: marcar como público ----------
-- Só o anfitrião.
create or replace function public.t_set_public(p_tid uuid, p_public boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Faça login primeiro.'; end if;
  update tournaments set is_public=coalesce(p_public,false) where id=p_tid and host_id=auth.uid();
  if not found then raise exception 'Só o anfitrião pode mudar isso.'; end if;
end $$;

-- ---------- 6. Lista de torneios públicos que ainda não começaram ----------
-- Não devolve host_id nem PIN.
create or replace function public.list_public_tournaments()
returns table(code text, name text, seconds integer, increment integer, rounds integer, players integer)
language sql stable security definer set search_path=public as $$
  select t.code, t.name, t.seconds::integer, coalesce(t.increment,0)::integer, t.rounds::integer,
    (select count(*) from tournament_players p where p.tournament_id=t.id and p.active)::integer
  from tournaments t
  where t.is_public and t.status='lobby'
    and t.updated_at > now() - interval '12 hours'   -- mesmo prazo da limpeza do t_create/t_join
  order by t.created_at desc
  limit 30;
$$;

-- ---------- 7. Permissões ----------
revoke all on function public.set_room_options(uuid,boolean,boolean) from public, anon;
revoke all on function public.t_set_public(uuid,boolean) from public, anon;
revoke all on function public.list_public_rooms() from public;
revoke all on function public.list_public_tournaments() from public;
revoke all on function public.chess_chat_guard() from public, anon, authenticated;
revoke all on function public.chess_rematch_keep_chat() from public, anon, authenticated;
grant execute on function public.set_room_options(uuid,boolean,boolean) to authenticated;
grant execute on function public.t_set_public(uuid,boolean) to authenticated;
-- As listas podem ser vistas sem login (assim abrir a tela inicial não cria usuário anônimo).
grant execute on function public.list_public_rooms() to anon, authenticated;
grant execute on function public.list_public_tournaments() to anon, authenticated;

-- ---------- 8. Teste rápido (deve devolver tabelas vazias, sem erro) ----------
select * from public.list_public_rooms();
select * from public.list_public_tournaments();
