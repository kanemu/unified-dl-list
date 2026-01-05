#!/usr/bin/env bash
set -euo pipefail

# repo root で実行する想定
pnpm -v >/dev/null

echo "==> Clean (optional)"
# pnpm -r run clean || true

echo "==> Build all packages"
pnpm -r run build

echo "==> Test all packages"
pnpm -r run test

echo "==> Done"
