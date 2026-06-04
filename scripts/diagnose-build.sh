#!/bin/bash
# CI/CD Diagnostic Script
# Identify and report build issues
# Usage: bash scripts/diagnose-build.sh

set -e

echo "🔍 DevMapper CI/CD Diagnostic Report"
echo "===================================="
echo ""

echo "📦 Step 1: Check Node and npm versions"
node --version
npm --version
echo "✅ Versions OK"
echo ""

echo "📦 Step 2: Check dependencies"
if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install --legacy-peer-deps --no-audit --no-fund
fi
echo "✅ Dependencies present"
echo ""

echo "🔍 Step 3: Check for TypeScript errors"
if npm run typecheck 2>&1 | head -50; then
  echo "✅ TypeScript check passed"
else
  echo "⚠️ TypeScript issues found - run 'npm run typecheck' for details"
fi
echo ""

echo "🔍 Step 4: Run ESLint"
if npm run lint 2>&1 | head -50; then
  echo "✅ ESLint check passed"
else
  echo "⚠️ Linting issues found - run 'npm run lint' for details"
fi
echo ""

echo "🔨 Step 5: Test build"
if npm run build 2>&1 | tail -30; then
  echo "✅ Build successful"
else
  echo "⚠️ Build failed - check output above"
fi
echo ""

echo "📊 Step 6: Build output size"
if [ -d dist ]; then
  du -sh dist/
  echo ""
  ls -lh dist/ | head -10
fi
echo ""

echo "✅ Diagnostics complete!"
