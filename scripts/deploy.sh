#!/usr/bin/env bash
set -euo pipefail

# ─── Branch-based Vercel Deployment ──────────────────────────────────────────
# Deploys based on current git branch:
#   main → production  (api.build.withdarsh.com)
#   dev  → preview     (dev-api.build.withdarsh.com)
#
# Usage:
#   ./scripts/deploy.sh          # auto-detect branch
#   ./scripts/deploy.sh main     # deploy as main
#   ./scripts/deploy.sh dev      # deploy as dev

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

VERCEL="npx vercel"
BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD)}"

echo "🚀 Darsh Gupta Backend — Deploy"
echo "================================="
echo "  Branch: $BRANCH"
echo ""

# ─── Check for uncommitted changes ──────────────────────────────────────────
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  Warning: You have uncommitted changes."
  read -rp "   Continue anyway? (y/N): " confirm
  if [[ ! "$confirm" =~ ^[yY]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

# ─── Build locally first to catch errors early ──────────────────────────────
echo "📦 Building project..."
npm run build

# ─── Deploy based on branch ─────────────────────────────────────────────────
case "$BRANCH" in
  main)
    echo ""
    echo "🌐 Deploying to PRODUCTION (api.build.withdarsh.com)..."
    echo ""
    DEPLOYMENT_URL=$($VERCEL --prod --yes 2>&1 | tail -1)
    echo ""
    echo "✅ Production deployment complete!"
    echo "   URL: $DEPLOYMENT_URL"
    echo "   Domain: https://api.build.withdarsh.com"
    ;;

  dev)
    echo ""
    echo "🧪 Deploying to PREVIEW (dev-api.build.withdarsh.com)..."
    echo ""
    DEPLOYMENT_URL=$($VERCEL --yes 2>&1 | tail -1)
    echo ""
    echo "✅ Preview deployment complete!"
    echo "   URL: $DEPLOYMENT_URL"
    echo "   Domain: https://dev-api.build.withdarsh.com"
    ;;

  *)
    echo ""
    echo "🧪 Deploying branch '$BRANCH' as preview..."
    echo ""
    DEPLOYMENT_URL=$($VERCEL --yes 2>&1 | tail -1)
    echo ""
    echo "✅ Preview deployment complete!"
    echo "   URL: $DEPLOYMENT_URL"
    ;;
esac
