#!/usr/bin/env bash
set -euo pipefail

# repo root で実行する想定
pnpm -v >/dev/null
npm -v >/dev/null

echo "==> npm whoami (must be logged in)"
npm whoami >/dev/null

echo "==> Build all packages"
pnpm -r run build

echo "==> Run tests"
pnpm -r run test

# publish 順（依存関係順）
PKGS=(
  "packages/micromark-extension-dl-list"
  "packages/mdast-util-dl-list"
  "packages/hast-util-dl-list"
  "packages/remark-dl-list"
)

# 事前に workspace:* が dependencies に残ってないかチェック（安全）
echo "==> Check workspace:* in dependencies"
if grep -R --line-number '"workspace:\*"' packages/*/package.json; then
  echo ""
  echo "ERROR: Found workspace:* in package.json. Replace with real semver (e.g. ^0.1.0) before publishing."
  exit 1
fi

for dir in "${PKGS[@]}"; do
  echo ""
  echo "==> Publishing: $dir"

  # 何が publish されるか確認（安心）
  (cd "$dir" && npm pack --silent >/dev/null)

  # dry-run 推奨（必要ならコメント外す）
  # (cd "$dir" && npm publish --dry-run)

  # scoped で public が必要なら --access public を付ける
  (cd "$dir" && npm publish)

  echo "==> Published: $dir"
done

echo ""
echo "==> All packages published"
