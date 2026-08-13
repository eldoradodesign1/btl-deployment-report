-- BTL - Deployment report: supervisor comments only.
-- This migration does not alter any existing application table.
-- It creates only the two comment tables consumed by the dashboard.

create extension if not exists pgcrypto;

create table if not exists public.superviseur_commentaires_quotidiens (
    id uuid primary key default gen_random_uuid(),
    date date not null,
    jour text not null,
    niveau_activite text not null,
    activations integer not null default 0,
    variation_vs_jour_precedent numeric(8,4),
    hotesses_declarees integer not null default 0,
    hotesses_avec_activation integer not null default 0,
    hotesses_a_zero integer not null default 0,
    shops_declares integer not null default 0,
    activations_par_hotesse numeric(10,2),
    privilege integer not null default 0,
    roaming integer not null default 0,
    bundle integer not null default 0,
    commentaire_superviseur text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint superviseur_commentaires_quotidiens_date_unique unique (date)
);

create index if not exists idx_superviseur_commentaires_quotidiens_date
    on public.superviseur_commentaires_quotidiens (date);

create table if not exists public.superviseur_commentaires_hebdomadaires (
    id uuid primary key default gen_random_uuid(),
    semaine integer not null,
    debut date not null,
    fin date not null,
    jours_reporting integer not null default 0,
    activations_totales integer not null default 0,
    moyenne_activations_jour numeric(10,2),
    pic_activite integer not null default 0,
    date_pic date,
    hotesses_moyennes numeric(10,2),
    shops_moyens numeric(10,2),
    commentaire_superviseur text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint superviseur_commentaires_hebdo_semaine_unique unique (semaine),
    constraint superviseur_commentaires_hebdo_dates_chk check (debut <= fin)
);

create index if not exists idx_superviseur_commentaires_hebdo_debut
    on public.superviseur_commentaires_hebdomadaires (debut);

create or replace function public.set_superviseur_commentaires_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_superviseur_commentaires_quotidiens_updated_at
on public.superviseur_commentaires_quotidiens;

create trigger trg_superviseur_commentaires_quotidiens_updated_at
before update on public.superviseur_commentaires_quotidiens
for each row execute function public.set_superviseur_commentaires_updated_at();

drop trigger if exists trg_superviseur_commentaires_hebdomadaires_updated_at
on public.superviseur_commentaires_hebdomadaires;

create trigger trg_superviseur_commentaires_hebdomadaires_updated_at
before update on public.superviseur_commentaires_hebdomadaires
for each row execute function public.set_superviseur_commentaires_updated_at();

alter table public.superviseur_commentaires_quotidiens enable row level security;
alter table public.superviseur_commentaires_hebdomadaires enable row level security;

drop policy if exists superviseur_commentaires_quotidiens_read
on public.superviseur_commentaires_quotidiens;

create policy superviseur_commentaires_quotidiens_read
on public.superviseur_commentaires_quotidiens
for select to anon, authenticated
using (true);

drop policy if exists superviseur_commentaires_hebdomadaires_read
on public.superviseur_commentaires_hebdomadaires;

create policy superviseur_commentaires_hebdomadaires_read
on public.superviseur_commentaires_hebdomadaires
for select to anon, authenticated
using (true);
