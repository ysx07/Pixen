# Deployment Guide

## Prerequisites
- Node.js 18+ installed
- Environment variables configured (see `.env.example`)
- Access to the target deployment environment

## Build
```bash
npm run build
```

## Environment Configuration
Ensure all required environment variables are set for the target environment.
Refer to `.env.example` for the complete list.

## Deployment Steps
<!-- Customize these steps for your specific deployment target -->

### Option A: Static Hosting (Vercel, Netlify, etc.)
1. Connect your repository to the hosting provider
2. Set the build command: `npm run build`
3. Set the output directory: `dist/` (or your build output folder)
4. Configure environment variables in the hosting dashboard
5. Deploy

### Option B: Docker
1. Build the image: `docker build -t your-app .`
2. Run: `docker run -p 3000:3000 --env-file .env your-app`

### Option C: Manual / VPS
1. SSH into the server
2. Pull latest changes: `git pull origin main`
3. Install dependencies: `npm ci --production`
4. Build: `npm run build`
5. Restart the process manager (e.g., PM2): `pm2 restart your-app`

## Post-Deploy
Run through the `docs/checklists/pre-deploy.md` checklist, then:
1. Smoke test critical paths
2. Monitor error rates for 30 minutes
3. Confirm health check endpoints respond

## Rollback
If something goes wrong:
1. Revert to the previous Git tag/commit
2. Rebuild and redeploy
3. Investigate the issue before re-attempting
