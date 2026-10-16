# Activar Premium: lista de pasos

Premium está programado y desplegado, pero apagado. Esta lista lleva de cero a cobrar. Hazla en orden y **prueba todo en modo test de Stripe antes de pasar a real**.

Qué incluye Premium: sin anuncios, archivos de hasta 300 MB, lotes de hasta 20 archivos en ZIP (gratis: hasta 5), plan mensual (2,99 €) y anual (24,99 €) con 7 días de prueba en la primera suscripción.

Arquitectura: la web (GitHub Pages) habla con **Supabase** (cuentas con Google o enlace por correo, y la tabla `subscriptions`). Cuatro **Edge Functions** hablan con Stripe: `create-checkout-session`, `create-portal-session`, `entitlement` y `stripe-webhook`. Solo el webhook escribe en la tabla.

## 1. Cuentas

- [ ] Proyecto de **Supabase** (región UE) **solo para Readably**: no reutilices el de otra app.
- [ ] Cuenta de **Stripe** con los datos del negocio (titular, NIF, IBAN). Puede tardar en verificarse: hazlo ya.
- [ ] Cuenta de **Google Cloud** (la misma de Gmail sirve) para el acceso con Google.
- [ ] CLI: `npm i -g supabase` (o `brew install supabase/tap/supabase`) y, para pruebas locales, `stripe`.

## 2. Supabase: base de datos y URLs

- [ ] **SQL Editor:** pegar y ejecutar `supabase/migrations/0001_subscriptions.sql`.
- [ ] **Authentication → URL Configuration:**
  - Site URL: `https://readably.online`
  - Redirect URLs: `https://readably.online/cuenta` y, para las pruebas, `http://localhost:5173/cuenta`.
- [ ] **Authentication → Providers → Email:** activado (enlace mágico, sin contraseña).
- [ ] **SMTP propio** (Authentication → SMTP Settings). El correo por defecto de Supabase tiene un límite muy bajo y llega a spam: con tráfico real, los enlaces de acceso no llegarían. Sirve cualquier proveedor (Resend, Brevo, Mailgun…). Si solo vas a ofrecer Google al principio, puedes dejarlo para después y ocultar el enlace por correo.
- [ ] Anotar la **URL del proyecto** y la clave **anon** (Project Settings → API). La `service_role` **nunca** va al navegador ni al repositorio.

## 3. Acceso con Google

- [ ] **Google Cloud Console** → crea un proyecto «Readably» → *APIs y servicios* → **Pantalla de consentimiento de OAuth**: tipo *Externo*, nombre «Readably», correo de soporte, dominio autorizado `readably.online`, ámbitos básicos (`email`, `profile`, `openid`). **Publica la app** («En producción»); si se queda en «Pruebas», solo podrán entrar los usuarios de prueba.
- [ ] *Credenciales → Crear credenciales → ID de cliente de OAuth → Aplicación web*:
  - Orígenes JavaScript autorizados: `https://readably.online` (y `http://localhost:5173` para pruebas).
  - URI de redireccionamiento autorizado: `https://<ref>.supabase.co/auth/v1/callback`.
  - Copiar el **Client ID** y el **Client Secret**.
- [ ] **Supabase → Authentication → Providers → Google:** activar y pegar Client ID y Secret.
- [ ] Ojo: en la pantalla de Google el usuario verá el dominio `<ref>.supabase.co` como destino del acceso. Cambiarlo exige un dominio personalizado en Supabase (de pago).

## 4. Stripe (en modo test)

- [ ] Producto «Readably Premium» con **dos precios recurrentes en EUR**: mensual 2,99 € y anual 24,99 €. Anotar los dos `price_...`.
- [ ] **Customer Portal** (Settings → Billing → Customer portal): permitir cancelar, cambiar método de pago, ver facturas y **cambiar de plan entre mensual y anual** (añadir ambos precios).
- [ ] Impuestos: decidir cómo se gestiona el IVA (Stripe Tax o precio con IVA incluido) y reflejarlo en el precio mostrado.
- [ ] **Webhook:** Developers → Webhooks → endpoint `https://<ref>.supabase.co/functions/v1/stripe-webhook` con los eventos `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`. Anotar su secreto `whsec_...`.

## 5. Desplegar las funciones

Mientras pruebas, `SITE_URL` apunta a localhost (las funciones solo admiten **un** origen y un destino de retorno):

```bash
supabase login
supabase link --project-ref <ref>
supabase functions deploy entitlement create-checkout-session create-portal-session stripe-webhook
supabase secrets set \
  SITE_URL=http://localhost:5173 \
  STRIPE_SECRET_KEY=sk_test_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  STRIPE_PRICE_ID=price_... \
  STRIPE_PRICE_ID_YEARLY=price_... \
  STRIPE_TRIAL_DAYS=7
```

`supabase/config.toml` desactiva la verificación JWT solo para el webhook (Stripe no envía JWT; se autentica por firma).

## 6. Probar en local (modo test)

`.env.local` en la raíz (no se sube al repositorio):

```
VITE_PREMIUM_ENABLED=true
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon>
VITE_PREMIUM_PRICE_LABEL=2,99 €/mes
VITE_PREMIUM_YEARLY_PRICE_LABEL=24,99 €/año
VITE_PREMIUM_TRIAL_DAYS=7
```

- [ ] `npm run dev`, abrir `/cuenta` y probar **Continuar con Google** y el **enlace por correo**.
- [ ] Suscribirse al plan **anual** con la tarjeta de prueba `4242 4242 4242 4242`: debe mostrar la prueba de 7 días y, al volver, pasar a Premium (puede tardar unos segundos).
- [ ] Con Premium: sin anuncios, etiqueta de 300 MB, y lotes de hasta 20 archivos (sin Premium, el aviso aparece al pasar de 5).
- [ ] «Gestionar facturación»: cambiar a mensual, cancelar y comprobar que sigue Premium hasta el fin del periodo.
- [ ] Segunda suscripción del mismo usuario tras cancelar: **no** debe ofrecer prueba de nuevo.
- [ ] Pago fallido: tarjeta `4000 0000 0000 0341` → Premium debe desactivarse (`past_due` no da acceso).
- [ ] Un usuario sin suscripción sigue viendo anuncios y el límite de 50 MB.
- [ ] En Stripe, ningún evento del webhook debe figurar como fallido; en Supabase, revisar los logs de las funciones.

## 7. Textos legales (antes de cobrar)

- [ ] Completar en `src/content/legal.ts` el `[COMPLETAR]` de «Premium»: precio vigente, renovación y **derecho de desistimiento**. Con acceso inmediato al servicio digital suele pedirse el consentimiento expreso del usuario para empezar antes de los 14 días; conviene que lo revise un profesional.
- [ ] Revisar el `[REVISAR]` sobre transferencias internacionales (Supabase, Google, Stripe) y el aviso legal.
- [ ] Mostrar el precio final con impuestos y las condiciones de la prueba (la página ya las indica; revisar la redacción).

## 8. Pasar a real

- [ ] En Stripe, **modo real**: repetir producto, **los dos precios**, portal y webhook (los `price_...` y el `whsec_...` son distintos de los de prueba).
- [ ] Actualizar secretos: `supabase secrets set SITE_URL=https://readably.online STRIPE_SECRET_KEY=sk_live_... STRIPE_WEBHOOK_SECRET=... STRIPE_PRICE_ID=... STRIPE_PRICE_ID_YEARLY=...`.
- [ ] Crear `.env.production.local` con las variables `VITE_*` de arriba (el despliegue compila en tu máquina y Vite lo lee; no se sube al repositorio).
- [ ] `npm run deploy:pages` y comprobar en producción que `/premium` y `/cuenta` existen y que el menú muestra «Premium».
- [ ] **Compra real de prueba** con tu propia tarjeta, comprobar que se activa y reembolsarla desde Stripe.

## Si algo falla: apagarlo

Poner `VITE_PREMIUM_ENABLED=false` (o quitar `.env.production.local`) y volver a ejecutar `npm run deploy:pages`. La web vuelve a ser solo gratuita; las suscripciones existentes siguen en Stripe y hay que gestionarlas allí.

## Qué se ha probado y qué no

Probado en Chrome real con Supabase y sus funciones **simulados**: el botón de Google redirige a Supabase con `provider=google` y vuelta a `/cuenta`, el enlace por correo pide el OTP, el plan elegido llega a la función de pago, la prueba solo se anuncia a quien nunca tuvo suscripción, y con Premium se aplican los 100 MB y los lotes.

**No probado:** contra un proyecto real de Supabase, contra Stripe real, el acceso real con Google, el webhook con eventos reales ni móviles reales. Las Edge Functions están escritas pero nunca se han ejecutado contra Supabase.

## Cosas que conviene saber

- **Plan gratuito de Supabase:** hasta donde recuerdo, pausa los proyectos sin actividad durante una semana, y un proyecto pausado deja a los usuarios sin poder entrar. Con visitas reales no debería ocurrir; compruébalo en su documentación.
- Las ventajas (300 MB, lotes, sin anuncios) se controlan en el navegador: quien manipule el código podría saltárselas. Es aceptable porque los archivos no pasan por ningún servidor. El cobro y el estado de la suscripción sí se deciden en el servidor.
- Premium solo existe en español.
- Lotes: probado hasta 4 archivos y un PDF de 75 MB; no se ha medido memoria con 20 archivos grandes ni en móviles reales.
