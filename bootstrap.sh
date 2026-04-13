#!/usr/bin/env bash
set -euo pipefail

# bootstrap.sh — Restore protected Solis files into a cloned project.
# Run from inside the Solis repo directory, pointing at a project.
#
# Workflow:
#   1. Developer clones their project repo (has .solis-version, memory, context)
#   2. Developer clones Solis separately
#   3. Developer runs: ./bootstrap.sh <path-to-project>
#   4. Script reads .solis-version, checks out that Solis commit, copies
#      protected files, then returns Solis to its previous branch/HEAD.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOLIS_DIR="$SCRIPT_DIR"

# ── Helpers ──────────────────────────────────────────────────────────────────

die() { echo "ERROR: $*" >&2; exit 1; }
info() { echo "  → $*"; }

usage() {
    cat <<'USAGE'
Usage:
  bootstrap.sh <path-to-project>

Restores protected Solis files into a project that was previously deployed
with solis-deploy.sh. Reads .solis-version from the project to determine
which Solis commit to use.

The project's own files (.agent/memory/, .agent/context/) are never touched.
USAGE
    exit 1
}

# ── Protected file copy (same set as solis-deploy.sh copy_protected_files) ───

copy_protected_files() {
    local target="$1"

    # Root files that reveal Solis
    if [ -e "$SOLIS_DIR/USER_GUIDE.md" ]; then
        cp "$SOLIS_DIR/USER_GUIDE.md" "$target/USER_GUIDE.md"
        info "Restored USER_GUIDE.md"
    fi
    if [ -e "$SOLIS_DIR/README.md" ]; then
        if [ -e "$target/README.md" ]; then
            cp "$SOLIS_DIR/README.md" "$target/SOLIS.md"
            info "Restored Solis documentation as SOLIS.md (README.md already exists)"
        else
            cp "$SOLIS_DIR/README.md" "$target/README.md"
            info "Restored README.md"
        fi
    fi

    # .agent/ internal files
    for f in CLAUDE.md system-prompt.md coding-standards.md project-conventions.md; do
        if [ -e "$SOLIS_DIR/.agent/$f" ]; then
            mkdir -p "$target/.ai"
            cp "$SOLIS_DIR/.agent/$f" "$target/.agent/$f"
            info "Restored .agent/$f"
        fi
    done

    # docs/CLAUDE.md, site/CLAUDE.md
    for subdir in docs site; do
        if [ -e "$SOLIS_DIR/$subdir/CLAUDE.md" ]; then
            mkdir -p "$target/$subdir"
            cp "$SOLIS_DIR/$subdir/CLAUDE.md" "$target/$subdir/CLAUDE.md"
            info "Restored $subdir/CLAUDE.md"
        fi
    done

    # .agent/agents/
    if [ -d "$SOLIS_DIR/.agent/agents" ]; then
        mkdir -p "$target/.agent/agents"
        cp -r "$SOLIS_DIR/.agent/agents/." "$target/.agent/agents/"
        info "Restored .agent/agents/"
    fi

    # .agent/skills/
    if [ -d "$SOLIS_DIR/.agent/skills" ]; then
        mkdir -p "$target/.agent/skills"
        cp -r "$SOLIS_DIR/.agent/skills/." "$target/.agent/skills/"
        info "Restored .agent/skills/"
    fi

    # .agent/prompts/
    if [ -d "$SOLIS_DIR/.agent/prompts" ]; then
        mkdir -p "$target/.agent/prompts"
        cp -r "$SOLIS_DIR/.agent/prompts/." "$target/.agent/prompts/"
        info "Restored .agent/prompts/"
    fi

    # .agent/mcp/ config files
    for f in claude-mcp-config.json gemini-mcp-config.json; do
        if [ -e "$SOLIS_DIR/.agent/mcp/$f" ]; then
            mkdir -p "$target/.agent/mcp"
            cp "$SOLIS_DIR/.agent/mcp/$f" "$target/.agent/mcp/$f"
            info "Restored .agent/mcp/$f"
        fi
    done

    # .claude/commands/, .claude/hooks/, .claude/settings.json, .claude/skills/
    if [ -d "$SOLIS_DIR/.claude/commands" ]; then
        mkdir -p "$target/.claude/commands"
        cp -r "$SOLIS_DIR/.claude/commands/." "$target/.claude/commands/"
        info "Restored .claude/commands/"
    fi
    if [ -d "$SOLIS_DIR/.claude/hooks" ]; then
        mkdir -p "$target/.claude/hooks"
        cp -r "$SOLIS_DIR/.claude/hooks/." "$target/.claude/hooks/"
        info "Restored .claude/hooks/"
    fi
    if [ -d "$SOLIS_DIR/.claude/skills" ]; then
        mkdir -p "$target/.claude/skills"
        cp -r "$SOLIS_DIR/.claude/skills/." "$target/.claude/skills/"
        info "Restored .claude/skills/"
    fi
    if [ -e "$SOLIS_DIR/.claude/settings.json" ]; then
        mkdir -p "$target/.claude"
        cp "$SOLIS_DIR/.claude/settings.json" "$target/.claude/settings.json"
        info "Restored .claude/settings.json"
    fi

    # .gemini/skills/
    if [ -d "$SOLIS_DIR/.gemini/skills" ]; then
        mkdir -p "$target/.gemini/skills"
        cp -r "$SOLIS_DIR/.gemini/skills/." "$target/.gemini/skills/"
        info "Restored .gemini/skills/"
    fi

    # .agent/workflows/
    if [ -d "$SOLIS_DIR/.agent/workflows" ]; then
        mkdir -p "$target/.agent/workflows"
        cp -r "$SOLIS_DIR/.agent/workflows/." "$target/.agent/workflows/"
        info "Restored .agent/workflows/"
    fi

    # .templates/
    if [ -d "$SOLIS_DIR/.templates" ]; then
        mkdir -p "$target/.templates"
        cp -r "$SOLIS_DIR/.templates/." "$target/.templates/"
        info "Restored .templates/"
    fi
}

# ── Main ─────────────────────────────────────────────────────────────────────

main() {
    [[ $# -lt 1 ]] && usage

    local project_arg="$1"

    # Verify Solis repo
    if [ ! -d "$SOLIS_DIR/.agent/skills" ] || [ ! -f "$SOLIS_DIR/CLAUDE.md" ]; then
        die "This script must be run from inside the Solis repository."
    fi

    if ! git -C "$SOLIS_DIR" rev-parse --is-inside-work-tree &>/dev/null; then
        die "Solis directory is not a git repository."
    fi

    # Resolve and verify project directory
    local project
    project="$(cd "$project_arg" 2>/dev/null && pwd)" || die "Directory not found: $project_arg"

    # Read .solis-version
    local version_file="$project/.solis-version"
    if [ ! -f "$version_file" ]; then
        die "No .solis-version found in $project. Was this project deployed with solis-deploy.sh?"
    fi

    local solis_commit=""
    local deployed_at=""

    # Parse the version file (source it safely by reading key=value lines)
    while IFS='=' read -r key value; do
        key="$(echo "$key" | tr -d '[:space:]')"
        value="$(echo "$value" | tr -d '[:space:]')"
        case "$key" in
            SOLIS_COMMIT) solis_commit="$value" ;;
            DEPLOYED_AT)  deployed_at="$value" ;;
        esac
    done < <(grep -v '^#' "$version_file" | grep '=')

    if [[ -z "$solis_commit" ]]; then
        die ".solis-version exists but SOLIS_COMMIT is empty. File may be corrupted."
    fi

    echo "Bootstrapping project: $project"
    echo "  Solis commit: ${solis_commit:0:12}"
    [[ -n "$deployed_at" ]] && echo "  Deployed at:  $deployed_at"
    echo ""

    # Check for uncommitted changes in Solis repo
    if ! git -C "$SOLIS_DIR" diff --quiet 2>/dev/null || \
       ! git -C "$SOLIS_DIR" diff --cached --quiet 2>/dev/null; then
        die "Solis repo has uncommitted changes. Commit or stash them before bootstrapping."
    fi

    # Check out the exact Solis commit
    info "Checking out Solis commit ${solis_commit:0:12}..."
    if ! git -C "$SOLIS_DIR" checkout "$solis_commit" --quiet 2>/dev/null; then
        die "Failed to check out commit $solis_commit. Is the Solis repo up to date? Try: git fetch --all"
    fi

    # Copy protected files
    copy_protected_files "$project"

    # Return Solis to previous HEAD
    info "Returning Solis repo to previous HEAD..."
    git -C "$SOLIS_DIR" checkout - --quiet

    echo ""
    echo "Bootstrap complete! Restored files:"
    echo "  ✓ .agent/agents/, .agent/skills/, .agent/prompts/"
    echo "  ✓ .agent/CLAUDE.md, .agent/system-prompt.md, .agent/coding-standards.md, .agent/project-conventions.md"
    echo "  ✓ .agent/mcp/ config files"
    echo "  ✓ .claude/commands/, .claude/hooks/, .claude/settings.json"
    echo "  ✓ .templates/"
    echo "  ✓ docs/CLAUDE.md, site/CLAUDE.md"
    echo "  ✓ USER_GUIDE.md, README.md"
    echo ""
    echo "Your project memory (.agent/memory/) and context (.agent/context/) were NOT touched."
    echo "You're ready to work. Start a Claude Code session in your project directory."
}

main "$@"
