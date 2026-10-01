#!/usr/bin/env bash
#
# Zero Factory precommit checks for `sdp-compact`.
#
# This is a TypeScript (ESM) library at the repo root:
#   - build/typecheck : `npm run build`  -> tsc   (respects package.json)
#   - tests           : `npm test`       -> jest  (respects package.json)
#   - formatting      : Prettier (TS/JS Zero Factory standard)
#
# The `page/` directory is a separate SvelteKit demo app with its own
# toolchain; it is excluded via .prettierignore and is not part of the
# library build/test cycle.
#
# Usage:
#   .zerofactory/precommit.sh            run all phases
#   .zerofactory/precommit.sh format     formatting / lint auto-fix only
#   .zerofactory/precommit.sh build      compile / typecheck only
#   .zerofactory/precommit.sh test       run the test suite only
#   .zerofactory/precommit.sh install-hook
#                                       link .git/hooks/pre-commit to this script

set -e

# Resolve the script's real location first: when run through a symlinked git
# hook (see install-hook below), BASH_SOURCE[0] is the hook path and does NOT
# follow the link, which would make `..` resolve to .git/ instead of the repo
# root. readlink -f resolves the symlink (and is a no-op for direct runs); the
# `|| echo` fallback keeps it working where readlink lacks -f.
SCRIPT_FILE="$(readlink -f "${BASH_SOURCE[0]}" 2>/dev/null || echo "${BASH_SOURCE[0]}")"

# The script lives in <repo>/.zerofactory/, so the repository root is one level up.
ROOT_DIR="$(cd "$(dirname "$SCRIPT_FILE")/.." && pwd)"
cd "$ROOT_DIR"

# Worktrees / fresh checkouts ship without node_modules; ensure the
# project's own dependencies are present so build/test are deterministic.
# No-op when node_modules already exists.
if [ ! -d node_modules ]; then
  echo "==> node_modules not found; running npm install..."
  npm install --no-audit --no-fund
fi

run_format() {
  echo "==> [format] Prettier (in-place, auto-fixing)..."
  npx -y prettier --write --ignore-unknown .
}

run_build() {
  echo "==> [build] compile / typecheck (npm run build -> tsc)..."
  npm run build
}

run_test() {
  echo "==> [test] jest test suite (npm test)..."
  npm test
}

install_hook() {
  HOOK_DIR="$(git rev-parse --git-path hooks 2>/dev/null || echo ".git/hooks")"
  mkdir -p "$HOOK_DIR"
  # Symlink to the script's absolute location so the link never dangles.
  # (In a worktree `--git-path hooks` resolves to the shared .git dir, where a
  # repo-relative `../../.zerofactory/precommit.sh` target would not resolve.)
  ln -sf "$ROOT_DIR/.zerofactory/precommit.sh" "$HOOK_DIR/pre-commit"
  chmod +x "$HOOK_DIR/pre-commit"
  echo "✓ Linked .zerofactory/precommit.sh -> $HOOK_DIR/pre-commit"
}

case "${1:-all}" in
  format)       run_format ;;
  build)        run_build ;;
  test)         run_test ;;
  install-hook) install_hook ;;
  all|*)
    run_format
    run_build
    run_test
    ;;
esac

echo "✓ Zero Factory precommit checks passed!"
