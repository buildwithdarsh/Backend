#!/usr/bin/env bash
set -euo pipefail

# ─── Setup Vercel Environment Variables ──────────────────────────────────────
# Run once to configure all required env vars for the project.
# Usage: ./scripts/setup-env.sh

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "🔧 Darsh Gupta Backend — Vercel Env Setup"
echo "============================================"
echo ""

# ─── Check Vercel CLI ────────────────────────────────────────────────────────
if ! command -v vercel &>/dev/null && ! npx vercel --version &>/dev/null 2>&1; then
  echo "❌ Vercel CLI not found. Install with: npm i -g vercel"
  exit 1
fi

VERCEL="npx vercel"

# ─── Helper to add env var to all environments ──────────────────────────────
add_env() {
  local name="$1"
  local value="$2"
  local sensitive="${3:-false}"

  echo "$value" | $VERCEL env add "$name" production preview development --force 2>/dev/null || \
  echo "$value" | $VERCEL env add "$name" production preview development 2>/dev/null || true

  if [ "$sensitive" = "true" ]; then
    echo "  ✅ $name = [hidden]"
  else
    echo "  ✅ $name = $value"
  fi
}

# ─── Generate JWT RSA Key Pair ───────────────────────────────────────────────
echo ""
echo "🔑 Generating RSA key pair for JWT..."
JWT_PRIVATE_KEY=$(openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 2>/dev/null)
JWT_PUBLIC_KEY=$(echo "$JWT_PRIVATE_KEY" | openssl rsa -pubout 2>/dev/null)

# ─── Generate Encryption Key ────────────────────────────────────────────────
echo "🔐 Generating AES-256 encryption key..."
ENCRYPTION_KEY=$(openssl rand -hex 32)

# ─── Prompt for Database & Redis URLs ────────────────────────────────────────
echo ""
echo "📦 Enter your Vercel Postgres connection string"
echo "   (Find it in Vercel Dashboard → Storage → Your DB → .env tab)"
read -rp "   DATABASE_URL: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is required"
  exit 1
fi

echo ""
echo "📦 Enter your Vercel KV (Redis) connection string"
echo "   (Find it in Vercel Dashboard → Storage → Your KV → .env tab → KV_URL)"
read -rp "   REDIS_URL: " REDIS_URL

if [ -z "$REDIS_URL" ]; then
  echo "❌ REDIS_URL is required"
  exit 1
fi

# ─── Set all env vars ────────────────────────────────────────────────────────
echo ""
echo "📤 Pushing environment variables to Vercel..."
echo ""

add_env "NODE_ENV"        "production"
add_env "PORT"            "3000"
add_env "DATABASE_URL"    "$DATABASE_URL"    "true"
add_env "REDIS_URL"       "$REDIS_URL"       "true"
add_env "JWT_PRIVATE_KEY" "$JWT_PRIVATE_KEY"  "true"
add_env "JWT_PUBLIC_KEY"  "$JWT_PUBLIC_KEY"   "true"
add_env "ENCRYPTION_KEY"  "$ENCRYPTION_KEY"   "true"

echo ""
echo "✅ All environment variables configured!"
echo ""
echo "Next step: Run ./scripts/deploy.sh to deploy"
