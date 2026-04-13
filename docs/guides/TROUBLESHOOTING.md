# Troubleshooting

## Common Issues

### Build Fails
- **Missing dependencies**: Run `npm install` to ensure all packages are installed
- **Node version mismatch**: Check `.nvmrc` or `package.json` engines field
- **Environment variables**: Ensure `.env` exists and has all required values from `.env.example`

### Tests Fail
- **Stale dependencies**: Delete `node_modules/` and run `npm install`
- **Environment-specific**: Ensure test environment variables are set
- **Port conflicts**: Check if another process is using the required ports

### Agent Not Reading Context
- **Memory files empty**: Check `.agent/memory/active-context.md` has content
- **Wrong directory**: Ensure your IDE workspace root is the project root

### MCP Server Connection Issues
- **Check configuration**: Review `.agent/mcp/mcp-registry.md` for setup instructions
- **API keys**: Verify environment variables match the keys in `.env.example`
- **Server running**: Ensure the MCP server process is actually started

## Debug Strategies
1. Use the `systematic-debugging` skill (`.agent/skills/systematic-debugging/`)
2. Check error logs first — read the full stack trace
3. Reproduce consistently before attempting a fix
4. Make one change at a time

## Getting Help
- Review `docs/guides/SETUP.md` for initial setup
- Check `.agent/memory/known-issues.md` for known problems
- Open a GitHub issue using the bug report template
