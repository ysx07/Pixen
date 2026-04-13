# Show available commands
default:
    @just --list

# ─── PROJECT SETUP ───────────────────────────────────────

# Initial project setup
setup:
    cp -n .env.example .env || true
    npm install
    @echo "✅ Setup complete. Edit .env and then run /solis-init to onboard context."

# Onboard existing project into Solis
solis-init:
    @echo "🚀 Initiating Solis onboarding workflow..."
    @echo "Please run the following command in your AI tool:"
    @echo "  /solis-init"

# ─── PHASE MANAGEMENT ───────────────────────────────────

# Create next phase completion doc from template
new-phase NUMBER:
    cp .templates/PHASE_COMPLETE_TEMPLATE.md docs/archive/PHASE_{{NUMBER}}_COMPLETE.md
    @echo "📄 Created docs/archive/PHASE_{{NUMBER}}_COMPLETE.md"

# ─── DEVELOPMENT ─────────────────────────────────────────

# Run dev server
dev:
    npm run dev

# Run tests
test:
    npm test

# Run linting
lint:
    npm run lint

# ─── UTILITIES ───────────────────────────────────────────

# Show project status from memory bank
status:
    @echo "═══ Active Context ═══"
    @cat .ai/memory/active-context.md 2>/dev/null || echo "(empty)"
    @echo ""
    @echo "═══ Known Issues ═══"
    @cat .ai/memory/known-issues.md 2>/dev/null || echo "(none)"
    @echo ""
    @echo "═══ Current Tasks ═══"
    @head -30 .ai/memory/task-plan.md 2>/dev/null || echo "(no plan)"

# Clean build artifacts
clean:
    rm -rf dist/ build/ .next/ node_modules/.cache/
    @echo "🧹 Cleaned."
