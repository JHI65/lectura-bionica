# Activar Premium: lista de pasos

Premium está programado y desplegado, pero apagado. Esta lista lleva de cero a cobrar. Hazla en orden y **prueba todo en modo test de Stripe antes de pasar a real**.

Qué incluye Premium: sin anuncios, archivos de hasta 100 MB, conversión por lotes (20 archivos, ZIP), plan mensual (2,99 €) y anual (24,99 €) con 7 días de prueba en la primera suscripción.

Arquitectura: la web (GitHub Pages) habla con **Firebase Authentication** (Google o enlace por correo) y lee su documento `subscriptions/{uid}` de **Firestore**. Tres **Cloud Functions** hablan con Stripe: crear el pago, abrir el portal de facturación y recibir el webhook, que es lo único que escribe en Firestore.

## 1. Cuentas

- [ ] Proyecto de **Firebase nuevo y exclusivo para Readably** (no reutilices el de KRUX: mezclaría usuarios, reglas y facturación). Desactiva Google Analytics si te lo ofrece.
- [ ] Pasar el proyecto al **plan Blaze** (de pago por uso, pide tarjeta). Cloud Functions no se puede desplegar en el plan gratuito. Con el tráfico de un sitio pequeño, el uso entra normalmente en la cuota gratuita, pero el coste no es cero garantizado.
- [ ] En Google Cloud → Facturación, crear un **presupuesto con alerta** (por ejemplo 5 €) para enterarte si algo se dispara.
- [ ] Cuenta de **Stripe** con los datos del negocio (titular, NIF, IBAN). Stripe puede tardar en verificarla: hazlo ya.
- [ ] Tener instaladas las CLI `firebase` (`npm i -g firebase-tools`) y, para pruebas locales, `stripe`. Iniciar sesión: `firebase login`.

## 2. Firebase

- [ ] **Authentication → Sign-in method:**
  - Activar **Google** (pide un correo de soporte del proyecto; Firebase crea el cliente OAuth por ti).
  - Activar **Correo electrónico/contraseña** y dentro **Enlace por correo (sin contraseña)**.
- [ ] **Authentication → Settings → Authorized domains:** añadir `readably.online` (`localhost` ya viene).
- [ ] **Authentication → Templates:** personalizar el correo del enlace (remitente, asunto y texto en español).
- [ ] **Firestore Database:** crear la base en modo producción y en una región de la UE (por ejemplo `eur3` o `europe-west1`). Las reglas ya vienen en `firestore.rules`.
- [ ] **Project settings → Tus apps → Web:** registrar una app web y anotar `apiKey`, `authDomain`, `projectId` y `appId`. La `apiKey` de Firebase es pública por diseño.
- [ ] En la raíz del repo: `firebase use --add` y elegir el proyecto (crea `.firebaserc`).

## 3. Stripe (en modo test)

- [ ] Producto «Readably Premium» con **dos precios recurrentes en EUR**: mensual 2,99 € y anual 24,99 €. Anotar los dos `price_...`.
- [ ] **Customer Portal** (Settings → Billing → Customer portal): permitir cancelar, cambiar método de pago, ver facturas y **cambiar de plan entre mensual y anual** (añadir ambos precios del producto).
- [ ] Impuestos: decidir cómo se gestiona el IVA (Stripe Tax o precio con IVA incluido) y reflejarlo en el precio mostrado.
- [ ] El webhook se crea en el paso 5, cuando ya tengas su URL.

## 4. Desplegar las funciones

Mientras pruebas, `SITE_URL` apunta a localhost (las funciones solo admiten **un** destino de retorno):

```bash
cp functions/.env.example functions/.env.<id-del-proyecto>
# edita: SITE_URL=http://localhost:5173, los dos price_..., STRIPE_TRIAL_DAYS=7

firebase functions:secrets:set STRIPE_SECRET_KEY        # sk_test_...
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET    # de momento un valor cualquiera; se cambia en el paso 5

cd functions && npm install && cd ..
firebase deploy --only functions,firestore:rules
```

- [ ] Al terminar, el despliegue imprime la URL de `stripeWebhook`. Cópiala.
- [ ] Orígenes permitidos para llamar a las funciones: `https://readably.online`, `http://localhost:5173` y `http://localhost:4173` (ver `CORS` en `functions/src/index.ts`). Si pruebas desde otro puerto, añádelo y vuelve a desplegar.

## 5. Webhook de Stripe

- [ ] Stripe → Developers → Webhooks → añadir endpoint con la URL de `stripeWebhook` y estos eventos: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.
- [ ] Copiar su secreto `whsec_...` y guardarlo: `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET`, y volver a desplegar con `firebase deploy --only functions`.

## 6. Probar en local (modo test)

`.env.local` en la raíz del proyecto (no se sube al repositorio):

```
VITE_PREMIUM_ENABLED=true
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=<proyecto>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<proyecto>
VITE_FIREBASE_APP_ID=...
VITE_PREMIUM_PRICE_LABEL=2,99 €/mes
VITE_PREMIUM_YEARLY_PRICE_LABEL=24,99 €/año
VITE_PREMIUM_TRIAL_DAYS=7
```

- [ ] `npm run dev` y abrir `/cuenta`. Probar **Continuar con Google** y también el **enlace por correo** (abrirlo en el mismo navegador).
- [ ] Suscribirse al plan **anual** con la tarjeta de prueba `4242 4242 4242 4242`: debe mostrar la prueba de 7 días y, al volver, pasar a Premium sin recargar.
- [ ] Comprobar con Premium: sin anuncios, etiqueta de 100 MB, y carga de varios archivos (lote + ZIP).
- [ ] «Gestionar facturación»: cambiar a mensual, cancelar y comprobar que sigue Premium hasta el fin del periodo.
- [ ] Segunda suscripción con el mismo usuario tras cancelar: **no** debe ofrecer prueba de nuevo.
- [ ] Pago fallido: tarjeta `4000 0000 0000 0341` → Premium debe desactivarse (`past_due` no da acceso).
- [ ] Un usuario sin suscripción sigue viendo anuncios y el límite de 20 MB.
- [ ] En Stripe, ningún evento del webhook debe aparecer como fallido; en Firebase, revisar los logs de las funciones.

## 7. Textos legales (antes de cobrar)

- [ ] Completar en `src/content/legal.ts` el `[COMPLETAR]` de «Premium»: precio vigente, renovación y **derecho de desistimiento**. Con acceso inmediato al servicio digital suele pedirse el consentimiento expreso del usuario para empezar antes de los 14 días; conviene que lo revise un profesional.
- [ ] Revisar el `[REVISAR]` sobre transferencias internacionales a Google (Firebase) y a Stripe, y el aviso legal.
- [ ] Mostrar el precio final con impuestos y las condiciones de la prueba (la página ya las indica; revisar la redacción).

## 8. Pasar a real

- [ ] En Stripe, **modo real**: repetir producto, **los dos precios**, portal y webhook (los `price_...` y el `whsec_...` son distintos de los de prueba).
- [ ] Actualizar: `functions/.env.<id>` con `SITE_URL=https://readably.online` y los `price_...` reales; `firebase functions:secrets:set` de `STRIPE_SECRET_KEY` (`sk_live_...`) y `STRIPE_WEBHOOK_SECRET`; y `firebase deploy --only functions`.
- [ ] Crear `.env.production.local` en el proyecto con las variables `VITE_*` de arriba (el despliegue compila en tu máquina y Vite lo lee; no se sube al repositorio).
- [ ] `npm run deploy:pages` y comprobar en producción que `/premium` y `/cuenta` existen y que el menú muestra «Premium».
- [ ] **Compra real de prueba** con tu propia tarjeta, comprobar que se activa y reembolsarla desde Stripe.

## Si algo falla: apagarlo

Poner `VITE_PREMIUM_ENABLED=false` (o quitar `.env.production.local`) y volver a ejecutar `npm run deploy:pages`. La web vuelve a ser solo gratuita; las suscripciones existentes siguen en Stripe y hay que gestionarlas allí.

## Qué se ha probado y qué no

Probado con los emuladores de Firebase (Auth, Firestore y Functions) y un Stripe simulado: enlace de correo, pago con precio y prueba correctos, webhook con firma válida y falsa, paso a Premium en vivo, cancelación, portal, y las reglas de Firestore (nadie escribe desde el navegador, nadie lee la suscripción de otro). 

**No probado:** contra un proyecto real de Firebase, contra Stripe real, el acceso con la ventana de Google (necesita Google real), ni en móviles reales. La política de seguridad del navegador (CSP) incluye los orígenes de Firebase solo cuando Premium está activado, y el acceso con Google necesita permitir `apis.google.com`: si algo falla al entrar con Google, mira primero la consola del navegador.

## Límites que conviene saber

- Las ventajas (100 MB, lotes, sin anuncios) se controlan en el navegador: quien manipule el código podría saltárselas. Es aceptable porque los archivos no pasan por ningún servidor. El cobro y el estado de la suscripción sí se deciden en el servidor.
- Premium solo existe en español.
- Lotes: probado hasta 4 archivos y un PDF de 75 MB; no se ha medido memoria con 20 archivos grandes ni en móviles reales.
