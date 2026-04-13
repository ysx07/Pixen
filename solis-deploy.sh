#!/usr/bin/env bash
set -euo pipefail

# solis-deploy.sh — Deploy Solis into a new or existing project directory.
# Run from inside the Solis repo directory.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOLIS_DIR="$SCRIPT_DIR"

# ── Helpers ──────────────────────────────────────────────────────────────────

usage() {
    cat <<'USAGE'
Usage:
  solis-deploy.sh --new <project-name>          Create a new project next to the Solis repo
  solis-deploy.sh --existing <path> [--force]   Deploy into an existing project directory

Options:
  --force   Overwrite existing safe files in the target (default: no clobber)

Examples:
  ./solis-deploy.sh --new my-app
  ./solis-deploy.sh --existing ../my-app
  ./solis-deploy.sh --existing ../my-app --force
USAGE
    exit 1
}

die() { echo "ERROR: $*" >&2; exit 1; }
info() { echo "  → $*"; }

# ── Safe files: these get committed to target project repos ──────────────────

copy_safe_files() {
    local target="$1"
    local force="$2"
    local cp_flag="-n"  # no clobber by default
    if [[ "$force" == "true" ]]; then
        cp_flag=""
    fi

    info "Copying safe files..."

    # .agent/memory/ — project state
    mkdir -p "$target/.agent/memory"
    for f in "$SOLIS_DIR/.agent/memory/"*; do
        [ -e "$f" ] || continue
        if [[ "$force" == "true" ]] || [ ! -e "$target/.agent/memory/$(basename "$f")" ]; then
            cp "$f" "$target/.agent/memory/"
        fi
    done

    # .agent/context/ — project-specific context
    mkdir -p "$target/.agent/context"
    for f in "$SOLIS_DIR/.agent/context/"*; do
        [ -e "$f" ] || continue
        if [[ "$force" == "true" ]] || [ ! -e "$target/.agent/context/$(basename "$f")" ]; then
            cp "$f" "$target/.agent/context/"
        fi
    done

    # .agent/mcp/README.md and mcp-registry.md
    mkdir -p "$target/.agent/mcp"
    for f in README.md mcp-registry.md; do
        if [ -e "$SOLIS_DIR/.agent/mcp/$f" ]; then
            if [[ "$force" == "true" ]] || [ ! -e "$target/.agent/mcp/$f" ]; then
                cp "$SOLIS_DIR/.agent/mcp/$f" "$target/.agent/mcp/$f"
            fi
        fi
    done

    # Root config files: CLAUDE.md, GEMINI.md
    for f in CLAUDE.md GEMINI.md; do
        if [ -e "$SOLIS_DIR/$f" ]; then
            if [[ "$force" == "true" ]] || [ ! -e "$target/$f" ]; then
                cp "$SOLIS_DIR/$f" "$target/$f"
            fi
        fi
    done

    # docs/
    if [ -d "$SOLIS_DIR/docs" ]; then
        mkdir -p "$target/docs"
        cp -r ${cp_flag:+"$cp_flag"} "$SOLIS_DIR/docs/." "$target/docs/" 2>/dev/null || true
    fi

    # site/
    if [ -d "$SOLIS_DIR/site" ]; then
        mkdir -p "$target/site"
        cp -r ${cp_flag:+"$cp_flag"} "$SOLIS_DIR/site/." "$target/site/" 2>/dev/null || true
    fi

    # justfile, .editorconfig, .env.example
    for f in justfile .editorconfig .env.example; do
        if [ -e "$SOLIS_DIR/$f" ]; then
            if [[ "$force" == "true" ]] || [ ! -e "$target/$f" ]; then
                cp "$SOLIS_DIR/$f" "$target/$f"
            fi
        fi
    done

    # .github/
    if [ -d "$SOLIS_DIR/.github" ]; then
        mkdir -p "$target/.github"
        cp -r ${cp_flag:+"$cp_flag"} "$SOLIS_DIR/.github/." "$target/.github/" 2>/dev/null || true
    fi

    # .claude/skills/README.md
    if [ -e "$SOLIS_DIR/.claude/skills/README.md" ]; then
        mkdir -p "$target/.claude/skills"
        if [[ "$force" == "true" ]] || [ ! -e "$target/.claude/skills/README.md" ]; then
            cp "$SOLIS_DIR/.claude/skills/README.md" "$target/.claude/skills/README.md"
        fi
    fi

    # .gemini/skills/README.md
    if [ -e "$SOLIS_DIR/.gemini/skills/README.md" ]; then
        mkdir -p "$target/.gemini/skills"
        if [[ "$force" == "true" ]] || [ ! -e "$target/.gemini/skills/README.md" ]; then
            cp "$SOLIS_DIR/.gemini/skills/README.md" "$target/.gemini/skills/README.md"
        fi
    fi
}

# ── Protected/IP files: gitignored in target, restored by bootstrap ──────────

copy_protected_files() {
    local target="$1"

    info "Copying protected Solis files (these will be gitignored in your project)..."

    # Root files that reveal Solis
    if [ -e "$SOLIS_DIR/USER_GUIDE.md" ]; then
        cp "$SOLIS_DIR/USER_GUIDE.md" "$target/USER_GUIDE.md"
    fi
    if [ -e "$SOLIS_DIR/README.md" ]; then
        if [ -e "$target/README.md" ]; then
            cp "$SOLIS_DIR/README.md" "$target/SOLIS.md"
            info "Project already has a README.md; Solis documentation copied as SOLIS.md"
        else
            cp "$SOLIS_DIR/README.md" "$target/README.md"
        fi
    fi

    # .agent/ internal files
    for f in CLAUDE.md system-prompt.md coding-standards.md project-conventions.md; do
        if [ -e "$SOLIS_DIR/.agent/$f" ]; then
            cp "$SOLIS_DIR/.agent/$f" "$target/.agent/$f"
        fi
    done

    # docs/CLAUDE.md, site/CLAUDE.md
    for subdir in docs site; do
        if [ -e "$SOLIS_DIR/$subdir/CLAUDE.md" ]; then
            mkdir -p "$target/$subdir"
            cp "$SOLIS_DIR/$subdir/CLAUDE.md" "$target/$subdir/CLAUDE.md"
        fi
    done

    # .agent/agents/
    if [ -d "$SOLIS_DIR/.agent/agents" ]; then
        mkdir -p "$target/.agent/agents"
        cp -r "$SOLIS_DIR/.agent/agents/." "$target/.agent/agents/"
    fi

    # .agent/skills/
    if [ -d "$SOLIS_DIR/.agent/skills" ]; then
        mkdir -p "$target/.agent/skills"
        cp -r "$SOLIS_DIR/.agent/skills/." "$target/.agent/skills/"
    fi

    # .agent/prompts/
    if [ -d "$SOLIS_DIR/.agent/prompts" ]; then
        mkdir -p "$target/.agent/prompts"
        cp -r "$SOLIS_DIR/.agent/prompts/." "$target/.agent/prompts/"
    fi

    # .agent/mcp/ config files (not README or registry — those are safe)
    for f in claude-mcp-config.json gemini-mcp-config.json; do
        if [ -e "$SOLIS_DIR/.agent/mcp/$f" ]; then
            cp "$SOLIS_DIR/.agent/mcp/$f" "$target/.agent/mcp/$f"
        fi
    done

    # .claude/commands/, .claude/hooks/, .claude/settings.json, .claude/skills/
    if [ -d "$SOLIS_DIR/.claude/commands" ]; then
        mkdir -p "$target/.claude/commands"
        cp -r "$SOLIS_DIR/.claude/commands/." "$target/.claude/commands/"
    fi
    if [ -d "$SOLIS_DIR/.claude/hooks" ]; then
        mkdir -p "$target/.claude/hooks"
        cp -r "$SOLIS_DIR/.claude/hooks/." "$target/.claude/hooks/"
    fi
    if [ -d "$SOLIS_DIR/.claude/skills" ]; then
        mkdir -p "$target/.claude/skills"
        cp -r "$SOLIS_DIR/.claude/skills/." "$target/.claude/skills/"
    fi
    if [ -e "$SOLIS_DIR/.claude/settings.json" ]; then
        mkdir -p "$target/.claude"
        cp "$SOLIS_DIR/.claude/settings.json" "$target/.claude/settings.json"
    fi

    # .gemini/skills/
    if [ -d "$SOLIS_DIR/.gemini/skills" ]; then
        mkdir -p "$target/.gemini/skills"
        cp -r "$SOLIS_DIR/.gemini/skills/." "$target/.gemini/skills/"
    fi

    # .agent/workflows/
    if [ -d "$SOLIS_DIR/.agent/workflows" ]; then
        mkdir -p "$target/.agent/workflows"
        cp -r "$SOLIS_DIR/.agent/workflows/." "$target/.agent/workflows/"
    fi

    # .templates/
    if [ -d "$SOLIS_DIR/.templates" ]; then
        mkdir -p "$target/.templates"
        cp -r "$SOLIS_DIR/.templates/." "$target/.templates/"
    fi
}

# ── Write .solis-version ─────────────────────────────────────────────────────

write_solis_version() {
    local target="$1"
    local commit
    local timestamp

    cd "$SOLIS_DIR"
    commit="$(git rev-parse HEAD)"
    timestamp="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

    cat > "$target/.solis-version" <<EOF
# Written by solis-deploy.sh at deploy time. Do not edit manually.
# Used by bootstrap.sh on a new machine to check out the correct Solis version.
SOLIS_COMMIT=$commit
DEPLOYED_AT=$timestamp
EOF

    info "Wrote .solis-version (commit: ${commit:0:12})"
}

# ── Merge .gitignore ─────────────────────────────────────────────────────────

merge_gitignore() {
    local target="$1"
    local target_gitignore="$target/.gitignore"
    local solis_marker="# [SOLIS-IP] — Protected Solis files (do not commit these)"

    # Rules to inject into the target's .gitignore
    local -a rules=(
        "USER_GUIDE.md"
        "README.md"
        "SOLIS.md"
        ".agent/CLAUDE.md"
        "docs/CLAUDE.md"
        "site/CLAUDE.md"
        ".agent/system-prompt.md"
        ".agent/agents/"
        ".agent/skills/"
        ".agent/prompts/"
        ".agent/coding-standards.md"
        ".agent/project-conventions.md"
        ".claude/commands/"
        ".claude/hooks/"
        ".claude/settings.json"
        ".claude/skills/"
        ".gemini/skills/"
        ".templates/"
        ".agent/workflows/"
        ".agent/mcp/claude-mcp-config.json"
        ".agent/mcp/gemini-mcp-config.json"
    )

    # Create .gitignore if it doesn't exist
    touch "$target_gitignore"

    # Check if SOLIS-IP section already exists
    if grep -qF "$solis_marker" "$target_gitignore" 2>/dev/null; then
        info ".gitignore already contains SOLIS-IP section — skipping merge"
        return
    fi

    # Append rules, skipping any that already exist
    {
        echo ""
        echo "$solis_marker"
    } >> "$target_gitignore"

    for rule in "${rules[@]}"; do
        if ! grep -qxF "$rule" "$target_gitignore" 2>/dev/null; then
            echo "$rule" >> "$target_gitignore"
        fi
    done

    info "Merged Solis gitignore rules into $target_gitignore"
}

# ── Main ─────────────────────────────────────────────────────────────────────

main() {
    # Verify we're inside a Solis repo
    if [ ! -d "$SOLIS_DIR/.agent/skills" ] || [ ! -f "$SOLIS_DIR/CLAUDE.md" ]; then
        die "This script must be run from inside the Solis repository."
    fi

    if ! git -C "$SOLIS_DIR" rev-parse --is-inside-work-tree &>/dev/null; then
        die "Solis directory is not a git repository."
    fi

    local mode=""
    local target_arg=""
    local force="false"

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --new)
                mode="new"
                target_arg="${2:-}"
                [[ -z "$target_arg" ]] && die "--new requires a project name"
                shift 2
                ;;
            --existing)
                mode="existing"
                target_arg="${2:-}"
                [[ -z "$target_arg" ]] && die "--existing requires a path"
                shift 2
                ;;
            --force)
                force="true"
                shift
                ;;
            -h|--help)
                usage
                ;;
            *)
                die "Unknown option: $1"
                ;;
        esac
    done

    [[ -z "$mode" ]] && usage

    # ── --new mode ───────────────────────────────────────────────────────────

    if [[ "$mode" == "new" ]]; then
        local parent_dir
        parent_dir="$(dirname "$SOLIS_DIR")"
        local target="$parent_dir/$target_arg"

        if [ -d "$target" ]; then
            die "Directory already exists: $target — use --existing instead."
        fi

        echo "Creating new project: $target"
        mkdir -p "$target"

        copy_safe_files "$target" "true"
        copy_protected_files "$target"
        write_solis_version "$target"
        merge_gitignore "$target"

        # Initialize git repo
        git -C "$target" init -q
        info "Initialized git repository"

        echo ""
        echo "Done! Next steps:"
        echo "  1. cd $target"
        echo "  2. Review and customize CLAUDE.md and GEMINI.md for your project"
        echo "  3. Update .agent/memory/active-context.md with your project context"
        echo "  4. git add -A && git commit -m 'chore: initial project setup from Solis'"
        echo ""
    fi

    # ── --existing mode ──────────────────────────────────────────────────────

    if [[ "$mode" == "existing" ]]; then
        local target
        target="$(cd "$target_arg" 2>/dev/null && pwd)" || die "Directory not found: $target_arg"

        if ! git -C "$target" rev-parse --is-inside-work-tree &>/dev/null; then
            die "Target is not a git repository: $target"
        fi

        echo "Deploying Solis into existing project: $target"
        if [[ "$force" == "true" ]]; then
            echo "  (--force enabled: existing safe files will be overwritten)"
        fi

        copy_safe_files "$target" "$force"
        copy_protected_files "$target"
        write_solis_version "$target"
        merge_gitignore "$target"

        echo ""
        echo "Done! Next steps:"
        echo "  1. cd $target"
        echo "  2. Review and customize CLAUDE.md and GEMINI.md for your project"
        echo "  3. Update .agent/memory/active-context.md with your project context"
        echo "  4. Review git diff to see what changed"
        echo "  5. git add -A && git commit -m 'chore: integrate Solis tooling'"
        echo ""
    fi
}

main "$@"
