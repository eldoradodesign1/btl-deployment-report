-- Isolated shared settings for BTL Deployment Report.
-- This migration creates a new table only; it does not modify public.targets or any other existing table.
create table if not exists public.btl_deployment_target_settings (
  setting_key text primary key,
  target_matrix jsonb not null,
  show_progress_targets boolean not null default false,
  show_histogram_targets boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.btl_deployment_target_settings enable row level security;

create policy "target settings read"
  on public.btl_deployment_target_settings
  for select to anon using (true);

create policy "target settings write"
  on public.btl_deployment_target_settings
  for all to anon using (true) with check (true);

insert into public.btl_deployment_target_settings (
  setting_key, target_matrix, show_progress_targets, show_histogram_targets, updated_by
)
values (
  'campaign',
  '{"shop":{"bundle":20,"roaming":3,"privilege":20},"airportJeffery":{"bundle":20,"roaming":10,"privilege":20}}'::jsonb,
  false,
  false,
  'BTL'
)
on conflict (setting_key) do nothing;
