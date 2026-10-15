# Dominio propio: readably.online

Registrado el 2026-10-15 en GoDaddy (servidores de nombres `*.domaincontrol.com`). Hasta que el DNS apunte a GitHub Pages, **no se debe publicar** `public/CNAME`: GitHub redirigiría la URL actual a un dominio que aún no resuelve. `npm run deploy:pages` lo comprueba y se niega a publicar.

## 1. Registros DNS en GoDaddy

GoDaddy → Mis productos → `readably.online` → DNS. **Borra primero** los registros por defecto (`A @` a "WebsiteBuilder Site"/Parked, y `CNAME www` a `@`) y crea estos:

| Tipo | Nombre | Valor |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| AAAA | @ | 2606:50c0:8000::153 |
| AAAA | @ | 2606:50c0:8001::153 |
| AAAA | @ | 2606:50c0:8002::153 |
| AAAA | @ | 2606:50c0:8003::153 |
| CNAME | www | jhi65.github.io |

Los AAAA (IPv6) son opcionales. No pongas la barra final ni `https://` en ningún valor.

## 2. Esperar a que propague

```bash
dig +short A readably.online @1.1.1.1      # debe devolver las 4 IP 185.199.x.153
dig +short CNAME www.readably.online @1.1.1.1   # jhi65.github.io.
```

Suele tardar de minutos a unas horas.

## 3. Publicar con el dominio

`public/CNAME` ya contiene `readably.online`. Con él, `deploy-pages.sh` compila con base `/` y `VITE_SITE_URL=https://readably.online`.

```bash
git add -A && git commit -m "Dominio propio readably.online"
git push origin main
npm run deploy:pages
```

GitHub detecta el `CNAME` y configura el dominio solo. La URL antigua (`jhi65.github.io/lectura-bionica`) pasa a redirigir al dominio nuevo.

## 4. HTTPS

GitHub emite el certificado automáticamente (hasta ~1 h tras publicar). Cuando esté disponible: Settings → Pages → marcar **Enforce HTTPS**.

Recomendado: verificar el dominio en tu cuenta (Settings → Pages → Add a domain → registro TXT) para que nadie más pueda reclamarlo en Pages.

## 5. Después

- Search Console: añadir `https://readably.online/` como propiedad y enviar `https://readably.online/sitemap.xml`.
- AdSense: añadir el dominio y seguir `docs/publicidad-adsense.md`.
- Rellenar los datos legales (`src/content/legal.ts`).
