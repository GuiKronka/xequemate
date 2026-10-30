-- XequeMate MVP — execute no SQL Editor do Supabase.
-- Antes: Authentication > Providers > habilite Anonymous Sign-ins.

create table if not exists public.chess_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  white_id uuid not null,
  black_id uuid,
  white_name text not null,
  black_name text,
  fen text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  pgn text not null default '',
  white_ms integer not null default 600,
  black_ms integer not null default 600,
  initial_seconds integer not null default 600,
  finished_at timestamptz,
  result text,
  rematch_white boolean not null default false,
  rematch_black boolean not null default false,
  rematch_room_id uuid references public.chess_rooms(id),
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chess_rooms enable row level security;
revoke all on public.chess_rooms from anon, authenticated;
grant select on public.chess_rooms to authenticated;
create policy "room participants can read" on public.chess_rooms
for select to authenticated
using (auth.uid() = white_id or auth.uid() = black_id);

-- RPCs executadas no servidor, sem permitir escrita direta pela aplicação.
create or replace function public.create_chess_room(p_code text, p_name text, p_seconds integer)
returns public.chess_rooms language plpgsql security definer set search_path=public as $$
declare r public.chess_rooms;
begin
  if auth.uid() is null then raise exception 'Faça login para criar uma sala.'; end if;
  if p_seconds not in (300,600,900,1800) then raise exception 'Tempo inválido.'; end if;
  insert into chess_rooms(code,white_id,white_name,white_ms,black_ms,initial_seconds,updated_by)
  values(upper(p_code),auth.uid(),left(coalesce(nullif(trim(p_name),''),'Brancas'),18),p_seconds*1000,p_seconds*1000,p_seconds,auth.uid())
  returning * into r;
  return r;
end $$;

create or replace function public.join_chess_room(p_code text, p_name text)
returns public.chess_rooms language plpgsql security definer set search_path=public as $$
declare r public.chess_rooms;
begin
  select * into r from chess_rooms where code=upper(trim(p_code)) for update;
  if not found then raise exception 'Sala não encontrada.'; end if;
  if r.white_id=auth.uid() then return r; end if;
  if r.black_id is not null then raise exception 'Essa sala já está cheia.'; end if;
  if r.finished_at is not null then raise exception 'Essa partida já terminou.'; end if;
  update chess_rooms set black_id=auth.uid(),black_name=left(coalesce(nullif(trim(p_name),''),'Pretas'),18),updated_by=auth.uid(),updated_at=now()
  where id=r.id returning * into r;
  return r;
end $$;

create or replace function public.play_chess_move(p_room_id uuid,p_fen text,p_pgn text,p_white_ms integer,p_black_ms integer,p_finished boolean,p_result text)
returns public.chess_rooms language plpgsql security definer set search_path=public as $$
declare r public.chess_rooms;
begin
  select * into r from chess_rooms where id=p_room_id for update;
  if not found then raise exception 'Sala não encontrada.'; end if;
  if auth.uid() not in (r.white_id,r.black_id) or r.black_id is null then raise exception 'Você não participa desta partida.'; end if;
  if r.finished_at is not null then raise exception 'A partida já terminou.'; end if;
  if (r.updated_by=auth.uid()) then raise exception 'Aguarde a jogada do adversário.'; end if;
  if p_white_ms<0 or p_black_ms<0 or p_white_ms>r.initial_seconds*1000 or p_black_ms>r.initial_seconds*1000 then raise exception 'Relógio inválido.'; end if;
  update chess_rooms set fen=p_fen,pgn=p_pgn,white_ms=p_white_ms,black_ms=p_black_ms,
    finished_at=case when p_finished then now() else null end,result=nullif(p_result,''),
    updated_by=auth.uid(),updated_at=now()
  where id=p_room_id returning * into r;
  return r;
end $$;

create or replace function public.request_chess_rematch(p_room_id uuid)
returns public.chess_rooms language plpgsql security definer set search_path=public as $$
declare r public.chess_rooms; newr public.chess_rooms;
begin
  select * into r from chess_rooms where id=p_room_id for update;
  if not found or auth.uid() not in (r.white_id,r.black_id) then raise exception 'Partida não encontrada.'; end if;
  if r.finished_at is null then raise exception 'A partida ainda não terminou.'; end if;
  update chess_rooms set rematch_white=rematch_white or auth.uid()=white_id,
    rematch_black=rematch_black or auth.uid()=black_id,updated_at=now()
  where id=p_room_id returning * into r;
  if r.rematch_white and r.rematch_black then
    insert into chess_rooms(code,white_id,black_id,white_name,black_name,white_ms,black_ms,initial_seconds,updated_by)
    values(upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)),r.black_id,r.white_id,r.black_name,r.white_name,
      r.initial_seconds*1000,r.initial_seconds*1000,r.initial_seconds,auth.uid())
    returning * into newr;
    update chess_rooms set rematch_room_id=newr.id where id=p_room_id;
    return newr;
  end if;
  return r;
end $$;

grant execute on function public.create_chess_room(text,text,integer) to authenticated;
grant execute on function public.join_chess_room(text,text) to authenticated;
grant execute on function public.play_chess_move(uuid,text,text,integer,integer,boolean,text) to authenticated;
grant execute on function public.request_chess_rematch(uuid) to authenticated;

-- Realtime: no painel Database > Replication, habilite UPDATE para chess_rooms.
