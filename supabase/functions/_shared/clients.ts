// Clientes de servidor. La service role nunca llega al navegador.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.45.4';
import Stripe from 'npm:stripe@17.7.0';

export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Usuario autenticado a partir del JWT de la petición (nunca del cuerpo). */
export async function authenticatedUser(req: Request): Promise<{ id: string; email: string | null } | null> {
  const header = req.headers.get('Authorization') ?? '';
  const token = header.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await adminClient().auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

export function stripeClient(): Stripe {
  return new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    httpClient: Stripe.createFetchHttpClient(),
  });
}
