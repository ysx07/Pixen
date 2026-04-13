# Pre-Deploy Checklist

Use this checklist before deploying to any environment.

## Build & Tests
- [ ] `npm run build` succeeds without errors
- [ ] All tests pass
- [ ] No new warnings introduced

## Environment
- [ ] `.env` file has correct values for the target environment
- [ ] All required environment variables are set
- [ ] Database migrations are ready (if applicable)
- [ ] External service credentials are configured

## Security
- [ ] No secrets in source code or config files
- [ ] API keys use environment variables
- [ ] CORS settings are appropriate for the environment
- [ ] Rate limiting is configured
- [ ] Input validation is in place for all endpoints

## Performance
- [ ] No N+1 query issues
- [ ] Static assets are minified/compressed
- [ ] Caching is configured appropriately
- [ ] No memory leaks in long-running processes

## Rollback Plan
- [ ] Previous version can be restored quickly
- [ ] Database changes are reversible (or have a migration-down)
- [ ] Deployment can be rolled back in under 5 minutes

## Post-Deploy
- [ ] Smoke test critical paths after deployment
- [ ] Monitor error rates for 30 minutes
- [ ] Confirm all health check endpoints respond
