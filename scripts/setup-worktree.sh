#!/usr/bin/env bash
# Link installed dependencies and generated frontend assets into a git worktree.
# usage: scripts/setup-worktree.sh [worktree-path] (default: current directory)
set -euo pipefail

worktree="$(cd "${1:-.}" && git rev-parse --show-toplevel)"
main="$(cd "$(git -C "$worktree" rev-parse --git-common-dir)/.." && pwd)"

if [ "$worktree" = "$main" ]; then
  echo "setup-worktree: $worktree is the main checkout, nothing to do" >&2
  exit 1
fi

link() {
  local rel="$1"
  [ -e "$main/$rel" ] || return 0
  [ -d "$(dirname "$worktree/$rel")" ] || return 0
  if [ -e "$worktree/$rel" ] || [ -L "$worktree/$rel" ]; then return 0; fi
  ln -s "$main/$rel" "$worktree/$rel"
  echo "linked $rel"
}

link node_modules
for dir in "$main"/packages/*; do
  [ -d "$dir" ] && link "${dir#"$main/"}/node_modules"
done
link frontend/.env
link frontend/.env.production
link frontend/src/webfonts-generated
link frontend/static/webfonts-preview
