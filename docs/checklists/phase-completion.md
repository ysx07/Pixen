# Phase Completion Checklist

Use this checklist before declaring a phase complete.

## Code Quality
- [ ] All new code follows `coding-standards.md`
- [ ] No TODO/FIXME/HACK comments left unresolved
- [ ] No debug statements or console.logs remain
- [ ] Functions are under 50 lines, files under 700 lines

## Testing
- [ ] All new functionality has test coverage
- [ ] All tests pass (new + existing)
- [ ] Edge cases and error paths are tested
- [ ] Manual test scenarios have been verified

## Documentation
- [ ] Code has appropriate inline comments (why, not what)
- [ ] API changes are documented
- [ ] ADRs created for non-obvious decisions
- [ ] Phase completion doc generated from `.templates/PHASE_COMPLETE_TEMPLATE.md`

## Memory Bank
- [ ] `.agent/memory/active-context.md` updated with handoff
- [ ] `.agent/memory/progress.md` has a milestone entry
- [ ] `.agent/memory/decisions-log.md` has any new decisions
- [ ] `.agent/memory/known-issues.md` has any new issues

## Final Checks
- [ ] No secrets or credentials in the codebase
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Git history is clean (no WIP commits)
