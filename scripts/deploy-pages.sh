#!/usr/bin/env bash
# Publica el build en la rama gh-pages (GitHub Pages, origen: rama gh-pages).
#
# Uso:  npm run deploy:pages
# Variables opcionales:
#   PAGES_BASE      ruta base del sitio      (por defecto /<repo>/)
#   PAGES_SITE_URL  URL pública sin barra    (por defecto https://<owner>.github.io/<repo>)
#
# gh-pages es una rama de despliegue: se reescribe entera en cada publicación.
set -euo pipefail

cd "$(dirname "$0")/.."

REMOTE_URL="$(git remote get-url origin)"
CLEAN_URL="${REMOTE_URL%.git}"
REPO_NAME="$(basename "$CLEAN_URL")"
OWNER="$(basename "$(dirname "$CLEAN_URL")")"
OWNER="${OWNER##*:}" # soporta git@github.com:owner/repo
OWNER_LOWER="$(printf '%s' "$OWNER" | tr '[:upper:]' '[:lower:]')"

BASE="${PAGES_BASE:-/${REPO_NAME}/}"
SITE_URL="${PAGES_SITE_URL:-https://${OWNER_LOWER}.github.io/${REPO_NAME}}"

if [ -n "$(git status --porcelain)" ]; then
  echo "Hay cambios sin confirmar: haz commit antes de publicar." >&2
  exit 1
fi

GIT_NAME="$(git config user.name)"
GIT_EMAIL="$(git config user.email)"
COMMIT="$(git rev-parse --short HEAD)"

echo "→ Build (base: ${BASE}, sitio: ${SITE_URL})"
VITE_BASE="$BASE" VITE_SITE_URL="$SITE_URL" npm run build

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp -R dist/. "$TMP/"
touch "$TMP/.nojekyll" # sin Jekyll: no ignorar carpetas que empiezan por _

cd "$TMP"
git init -q -b gh-pages
git config user.name "$GIT_NAME"
git config user.email "$GIT_EMAIL"
git add -A
git commit -q -m "Despliegue de ${COMMIT}"

echo "→ Subiendo a gh-pages"
git -c credential.helper= -c 'credential.helper=!gh auth git-credential' \
  push --force "$REMOTE_URL" gh-pages

echo "✓ Publicado: ${SITE_URL}/"
