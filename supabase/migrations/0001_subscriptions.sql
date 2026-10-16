-- Estado de suscripción Premium. Solo lo escriben las Edge Functions con la
-- service role, a partir de eventos firmados de Stripe. Los clientes solo leen su fila.

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'none',
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Lectura propia. No hay políticas de insert/update/delete para clientes.
create policy "Lectura de la propia suscripción"
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;
