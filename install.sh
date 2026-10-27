#!/bin/sh
# ai-project-starter installer (POSIX shell, no Node required).
# Clones the repository and copies the setup-project skill into the
# current directory's harness skill directories.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/cberane/ai-project-starter/main/install.sh | sh
#   sh install.sh [target-dir]

set -eu

REPO_URL="https://github.com/cberane/ai-project-starter.git"
SKILL_NAME="setup-project"
TARGET_DIR="${1:-.}"

tmp_dir=$(mktemp -d 2>/dev/null) || { echo "ai-project-starter: cannot create temp dir" >&2; exit 1; }
trap 'rm -rf "$tmp_dir"' EXIT INT TERM

echo "Cloning ai-project-starter..."
git clone --depth 1 "$REPO_URL" "$tmp_dir" || {
  echo "ai-project-starter: clone failed - check your network and git access" >&2
  exit 1
}

SKILL_SRC="$tmp_dir/skills/$SKILL_NAME"
[ -d "$SKILL_SRC" ] || { echo "ai-project-starter: skill not found in clone" >&2; exit 1; }
VERSION=$(cat "$SKILL_SRC/references/VERSION" 2>/dev/null || echo unknown)

install_for() {
  harness="$1"
  skills_dir="$2"
  dest="$skills_dir/$SKILL_NAME"
  mkdir -p "$skills_dir"
  if [ -d "$dest" ]; then
    if [ -f "$dest/references/VERSION" ] && [ "$(cat "$dest/references/VERSION")" = "$VERSION" ]; then
      echo "  $harness: already at version $VERSION - nothing to do"
      return 0
    fi
    rm -rf "$dest"
    echo "  $harness: updated -> $VERSION"
  else
    echo "  $harness: installed $VERSION -> $dest"
  fi
  cp -R "$SKILL_SRC" "$dest"
}

echo "Installing $SKILL_NAME skill (version $VERSION) into: $TARGET_DIR"

if [ -d "$TARGET_DIR/.claude" ]; then
  install_for claude "$TARGET_DIR/.claude/skills"
fi
if [ -d "$TARGET_DIR/.vibe" ]; then
  install_for vibe "$TARGET_DIR/.vibe/skills"
fi

if [ ! -d "$TARGET_DIR/.claude" ] && [ ! -d "$TARGET_DIR/.vibe" ]; then
  echo "No harness detected - installing for both Claude Code and vibe."
  install_for claude "$TARGET_DIR/.claude/skills"
  install_for vibe "$TARGET_DIR/.vibe/skills"
fi

cat <<'EOF'

Next steps:
- Claude Code: launch it in this directory and run /setup-project
  (if .claude/skills/ was just created mid-session, run /reload-skills first)
- vibe: run `vibe` here; trust the folder when prompted (or start with
  `vibe --trust`), then run /setup-project

The skill will interview you one question at a time, then generate
AGENTS.md, spec templates, agent roles, and optionally the repo scaffold.
EOF