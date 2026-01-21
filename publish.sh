#!/usr/bin/env bash
set -euo pipefail

# Run from repo root
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# ---- helpers ----
die () { echo "ERROR: $*" >&2; exit 1; }

need_cmd () { command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"; }

# ---- preflight ----
need_cmd pnpm
need_cmd npm
need_cmd git
need_cmd node

echo "==> Ensure clean git working tree (recommended)"
if ! git diff --quiet || ! git diff --cached --quiet; then
  die "Working tree is not clean. Commit or stash changes before publishing."
fi

echo "==> Ensure npm login"
npm whoami >/dev/null 2>&1 || die "Not logged in to npm. Run: npm login"

echo "==> Verify we are at repo root"
test -f pnpm-workspace.yaml || die "pnpm-workspace.yaml not found in current directory"

echo "==> Workspace packages detected:"
pnpm -r list --depth -1

# Safety: ensure no workspace protocol remains other than workspace:^
echo "==> Check dependency specifiers"
if grep -R --line-number '"workspace:\*"' packages/*/package.json; then
  die 'Found "workspace:*". Use "workspace:^0.1.0" (or another explicit range) instead.'
fi
if grep -R --line-number '"workspace:' packages/*/package.json | grep -v '"workspace:\^'; then
  die 'Found workspace protocol not using "workspace:^...". Please normalize to "workspace:^0.1.0".'
fi

echo "==> Full prepublish checks (clean/build/typecheck/test)"
pnpm prepublish:check

# ---- publish order (dependency order) ----
PKGS=(
  "packages/micromark-extension-dl-list"
  "packages/mdast-util-dl-list"
  "packages/hast-util-dl-list"
  "packages/remark-dl-list"
)

# Optional: show what would be published (pnpm pack), without uploading
pack_preview () {
  local dir="$1"
  echo "==> Pack preview: $dir"
  (cd "$dir" && pnpm pack --silent --pack-destination "$ROOT_DIR/.pack-preview" >/dev/null)
}

echo "==> Pack preview (local tarballs)"
rm -rf .pack-preview
mkdir -p .pack-preview
for dir in "${PKGS[@]}"; do
  pack_preview "$dir"
done
echo "==> Pack preview created in ./.pack-preview (you can inspect tar contents if you want)"

# -----------------------------------------------------------------------------
# Pack preview smoke test (install tgz into clean consumer and run)
# -----------------------------------------------------------------------------
echo "==> Pack preview smoke test (clean install + runtime check)"

PACK_DIR="$ROOT_DIR/.pack-preview"
test -d "$PACK_DIR" || die ".pack-preview not found"
ls -1 "$PACK_DIR"/*.tgz >/dev/null 2>&1 || die "No .tgz found under .pack-preview"

TMP_DIR="$ROOT_DIR/.pack-preview/.tmp-consumer"
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"
trap 'rm -rf "$TMP_DIR"' EXIT

# Resolve tgz robustly (avoid unmatched globs)
tgz_one () {
  local pattern="$1"
  local found
  found="$(ls -1 $pattern 2>/dev/null | head -n 1 || true)"
  if [ -z "$found" ]; then
    echo "Available tarballs:" >&2
    ls -1 "$PACK_DIR"/*.tgz >&2 || true
    die "Tarball not found for pattern: $pattern"
  fi
  echo "$found"
}

TGZ_MICROMARK="$(tgz_one "$PACK_DIR"/*micromark-extension-dl-list*.tgz)"
TGZ_MDAST="$(tgz_one "$PACK_DIR"/*mdast-util-dl-list*.tgz)"
TGZ_HAST="$(tgz_one "$PACK_DIR"/*hast-util-dl-list*.tgz)"
TGZ_REMARK="$(tgz_one "$PACK_DIR"/*remark-dl-list*.tgz)"

echo "==> Using tarballs:"
echo " - $TGZ_MICROMARK"
echo " - $TGZ_MDAST"
echo " - $TGZ_HAST"
echo " - $TGZ_REMARK"

cd "$TMP_DIR"

cat > package.json <<'JSON'
{
  "name": "pack-preview-consumer",
  "private": true,
  "type": "module"
}
JSON

# Install the packed tarballs (no workspace links). Also install runtime deps for the test.
# We install remark deps from registry; this is fine because it validates real-world usage.
echo "==> Installing tarballs into clean consumer project"
npm install --no-audit --no-fund --silent \
  "$TGZ_MICROMARK" \
  "$TGZ_MDAST" \
  "$TGZ_HAST" \
  "$TGZ_REMARK" \
  unified remark-parse remark-gfm remark-rehype rehype-stringify

cat > smoke.mjs <<'MJS'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

import remarkDlList from 'remark-dl-list'
import { dlListHandlers } from 'hast-util-dl-list'

const md = `\
: fruits
    : **apple**
      _grape_
      ~~orange~~
`

const html = unified()
  .use(remarkParse)
  .use(remarkGfm)      // other plugins first
  .use(remarkDlList)   // dl-list after
  .use(remarkRehype, { handlers: { ...dlListHandlers() } })
  .use(rehypeStringify)
  .processSync(md)
  .toString()

if (!html.includes('<dl>')) {
  console.error('Smoke test failed: <dl> not found')
  console.error(html)
  process.exit(1)
}
if (!html.includes('<del>orange</del>')) {
  console.error('Smoke test failed: <del>orange</del> not found (GFM strikethrough not applied)')
  console.error(html)
  process.exit(1)
}

console.log('OK: pack-preview smoke test passed')
MJS

echo "==> Running smoke test"
node smoke.mjs

echo "==> Pack preview smoke test PASSED"

# Return to repo root for publish
cd "$ROOT_DIR"

# DRY_RUN=1 ./publish.sh
if [ "${DRY_RUN:-}" = "1" ]; then
  echo "==> Dry run mode: publish skipped"
  exit 0
fi

# ---- publish ----
publish_one () {
  local dir="$1"
  echo ""
  echo "==> Publishing: $dir"

  # pnpm publish uses pnpm pack internally and will rewrite workspace:^ ranges to semver in the published tarball.
  # --no-git-checks: we already checked cleanliness above; avoids pnpm being extra strict on tags/branch state.
  (cd "$dir" && pnpm publish --no-git-checks)

  echo "==> Published: $dir"
}

for dir in "${PKGS[@]}"; do
  publish_one "$dir"
done

echo ""
echo "==> All packages published successfully."
echo "Tip: create a git tag for this release (e.g. v0.1.0) if you haven't already."
