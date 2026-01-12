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
