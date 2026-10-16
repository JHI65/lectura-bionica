// Utilidades HTTP comunes. El origen permitido sale de SITE_URL (server-side):
// nunca se acepta un returnUrl del cliente, para evitar redirecciones abiertas.

export const SITE_URL = (Deno.env.get('SITE_URL') ?? '').replace(/\/+$/, '');

export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': SITE_URL || 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
  };
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}

export function preflight(req: Request): Response | null {
  if (req.method !== 'OPTIONS') return null;
  return new Response(null, { status: 204, headers: corsHeaders() });
}
