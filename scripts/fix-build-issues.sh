#!/bin/bash
# Fix common CI/CD issues
# Auto-fix common build failures
# Usage: bash scripts/fix-build-issues.sh

set -e

echo "🔧 DevMapper Build Issue Fixer"
echo "=============================="
echo ""

echo "📦 Step 1: Clean slate"
rm -rf node_modules package-lock.json dist
echo "✅ Cleaned"
echo ""

echo "📦 Step 2: Fresh install"
npm install --legacy-peer-deps
echo "✅ Dependencies installed"
echo ""

echo "🔧 Step 3: Auto-fix ESLint issues"
npm run lint -- --fix || true
echo "✅ ESLint auto-fixes applied"
echo ""

echo "🔍 Step 4: Update browserslist"
npx update-browserslist-db@latest || true
echo "✅ Browserslist updated"
echo ""

echo "🔨 Step 5: Rebuild"
npm run build
echo "✅ Build successful"
echo ""

echo "✅ Build issues fixed!"
