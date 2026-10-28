-- Rapports (Orbit) : accès client par campagne, réglage du quota de questions à l'IA et décompte des questions.
-- Crée trois tables nouvelles et deux fonctions ; ne modifie aucune table existante.

-- 1. Accès client (profil Vodacom) par campagne. Sans ligne, la campagne garde le comportement actuel :
--    visible, objectifs visibles, questions à l'IA fermées.
create table if not exists public.rapports_client_access (
  campaign_id uuid primary key references public.campaigns(id) on delete cascade,
  campaign_visible boolean not null default true,
  targets_visible boolean not null default true,
  ai_questions boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- 2. Réglages de Rapports modifiables par un super admin (clé → valeur).
create table if not exists public.rapports_settings (
  setting_key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);
insert into public.rapports_settings (setting_key, value) values ('ai_daily_quota', '20'::jsonb)
on conflict (setting_key) do nothing;

-- 3. Décompte des questions : un sujet = un utilisateur BTL (son id) ou un navigateur Vodacom (identifiant aléatoire local).
--    Écrit uniquement par la fonction serveur « ask-campaign » (clé de service) ; jamais lisible depuis l'appli.
create table if not exists public.rapports_ai_usage (
  subject text not null,
  usage_day date not null default current_date,
  questions integer not null default 0,
  primary key (subject, usage_day)
);

alter table public.rapports_client_access enable row level security;
alter table public.rapports_settings enable row level security;
alter table public.rapports_ai_usage enable row level security;

-- Lecture libre des accès et des réglages (l'appli en a besoin pour s'afficher) ; aucune écriture directe.
create policy "rapports client access read" on public.rapports_client_access for select to anon, authenticated using (true);
create policy "rapports settings read" on public.rapports_settings for select to anon, authenticated using (true);
-- rapports_ai_usage : aucune politique, donc aucun accès hors clé de service.

-- Écriture des accès : réservée aux comptes admin et super_admin (même contrôle explicite que les autres RPC du projet).
create or replace function public.rapports_set_client_access(p_actor text, p_campaign uuid, p_visible boolean, p_targets boolean, p_ai boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.users where id::text = p_actor and lower(role) in ('admin', 'super_admin', 'superadmin')) then
    raise exception 'Accès réservé aux administrateurs BTL';
  end if;
  insert into public.rapports_client_access (campaign_id, campaign_visible, targets_visible, ai_questions, updated_at, updated_by)
  values (p_campaign, p_visible, p_targets, p_ai, now(), p_actor)
  on conflict (campaign_id) do update set campaign_visible = excluded.campaign_visible, targets_visible = excluded.targets_visible,
    ai_questions = excluded.ai_questions, updated_at = now(), updated_by = p_actor;
end $$;

-- Écriture du quota : réservée au super_admin.
create or replace function public.rapports_set_ai_quota(p_actor text, p_quota integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.users where id::text = p_actor and lower(role) in ('super_admin', 'superadmin')) then
    raise exception 'Réglage réservé au super admin';
  end if;
  if p_quota < 0 or p_quota > 1000 then raise exception 'Quota hors limites'; end if;
  insert into public.rapports_settings (setting_key, value, updated_at, updated_by) values ('ai_daily_quota', to_jsonb(p_quota), now(), p_actor)
  on conflict (setting_key) do update set value = excluded.value, updated_at = now(), updated_by = p_actor;
end $$;

grant execute on function public.rapports_set_client_access(text, uuid, boolean, boolean, boolean) to anon, authenticated;
grant execute on function public.rapports_set_ai_quota(text, integer) to anon, authenticated;
