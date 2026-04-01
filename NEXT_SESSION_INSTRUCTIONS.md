# Next Session Instructions - PlayPatch Development

## Context Summary

**Branch:** `feature/realdebrid-integration`
**Last Session Date:** 2026-02-02
**Completed:** 3 Quick Wins (Sentry, Time Badge, Health Check)

## What Was Accomplished

### ✅ Completed Features (10 commits)

1. **Sentry Error Tracking** (commits: 140252f, b89beee, 70da2e1)
   - Installed and configured @sentry/nextjs
   - Created client, server, and edge configs
   - DSN configured in apps/web/.env (not committed)
   - **Note:** Network blocking prevented local testing - needs testing on another machine
   - See: `SENTRY_TESTING.md` and `docs/SENTRY_SETUP.md`

2. **Time Remaining Badge** (commits: 32c4335, 8f9d459)
   - Displays time remaining on child home screens (explorer + toddler modes)
   - Auto-refreshes every minute via API
   - Color-coded: green/yellow/orange/red
   - API: `/api/profiles/[profileId]/time-remaining`
   - Utilities: `apps/web/src/lib/utils/time-limits.ts`
   - Component: `apps/web/src/components/child/time-remaining-badge.tsx`
   - Next.js 15 compatible (uses `await params`)

3. **Health Check Script** (commits: 36fdfd3, 8f9d459)
   - Improved `infrastructure/scripts/health-check.sh`
   - Works from any directory (path-independent)
   - Checks: Docker, Node, pnpm, PostgreSQL, Redis, MinIO, Meilisearch, Ollama, .env, Prisma connection
   - Run with: `pnpm health:check`

### Critical Fixes Applied

- Next.js 15 compatibility: All API routes now use `await params`
- Health check script: Calculates PROJECT_ROOT dynamically
- Sentry config: Error filtering for dev mode (SENTRY_DEBUG controls)

## Current State

### Environment Configuration

**apps/web/.env contains (NOT committed):**
```bash
SENTRY_DSN=https://d79c05622b7f13b522c0822539a59fa5@o4510817971077120.ingest.de.sentry.io/4510818071740496
NEXT_PUBLIC_SENTRY_DSN=https://d79c05622b7f13b522c0822539a59fa5@o4510817971077120.ingest.de.sentry.io/4510818071740496
SENTRY_DEBUG=true
NEXT_PUBLIC_SENTRY_DEBUG=true
```

**Important:** This .env is local only. Other developers need to add their own DSN.

### Known Issues

1. **Sentry Network Blocking** (documented in SENTRY_TESTING.md)
   - Current machine blocks requests to ingest.de.sentry.io
   - Error: `net::ERR_BLOCKED_BY_CLIENT`
   - Likely ad blocker or firewall
   - **Action Required:** Test on another machine or disable ad blocker

2. **Medium Priority Items** (from oathkeeper review, ~2 hours):
   - Missing SENTRY_ORG/SENTRY_PROJECT in .env.example (needed for source maps)
   - Placeholder URL in sentry.client.config.ts:16 (`yourserver.io`)
   - No error UI state in TimeRemainingBadge component
   - No caching for time-remaining queries (minor performance issue)
   - Meilisearch health check accepts 401/403 as healthy (should be warnings)

## Immediate Next Steps (Choose One)

### Option A: Test Sentry on Clean Machine ⭐ RECOMMENDED
**Time:** 5 minutes
**Action:**
1. Use machine without ad blocker/network restrictions
2. Follow instructions in `SENTRY_TESTING.md`
3. Open http://localhost:3000
4. Open browser console (F12)
5. Run: `throw new Error('Test from clean machine');`
6. Check: https://sentry.io/organizations/o4510817971077120/issues/?project=4510818071740496
7. Confirm error appears in dashboard

### Option B: Fix Medium Priority Issues
**Time:** 2 hours
**Files to modify:**
- `.env.example` - Add SENTRY_ORG and SENTRY_PROJECT
- `apps/web/sentry.client.config.ts` - Fix placeholder URL
- `apps/web/src/components/child/time-remaining-badge.tsx` - Add error state UI
- `infrastructure/scripts/health-check.sh` - Improve Meilisearch check

**Reference:** See oathkeeper review output in previous session

### Option C: Continue Quick Wins
**Time:** 4-8 hours each
**Options from:** `docs/roadmap/QUICK_WINS.md`

1. **Dark Mode Support** (4 hours)
   - Install next-themes
   - Create dark color palette
   - Update Tailwind config
   - Add theme toggle button

2. **Continue Watching Section** (6 hours)
   - Query WatchSession with 10-90% completion
   - Create ContinueWatching component
   - Show progress overlay on thumbnails
   - Already has placeholder in child pages

3. **Video Thumbnail Generation** (4 hours)
   - Install fluent-ffmpeg
   - Create thumbnail generation worker
   - Generate at video midpoint
   - Store in MinIO

4. **Progress Bars on Video Cards** (2 hours)
   - Create ProgressBar component
   - Add to video cards
   - Show percentage complete

### Option D: Major Features (Plan First)
**Time:** 1-2 weeks each

1. **Time Limits Enforcement UI** 🔴 Critical for production
   - Admin UI for setting limits (weekday/weekend)
   - Real-time usage tracking display
   - "Time's up" screen with grace period
   - Parent PIN override system
   - **Note:** Schema and badge exist, needs enforcement UI

2. **Chat Memory/History UI** 🟣 High value
   - Backend already exists (AI conversation tracking)
   - Need: Child chat history page
   - Conversation detail view with resume
   - Search through past conversations
   - "Past Chats" section on watch page

3. **Interactive Knowledge Graph** 🟣 Unique differentiator
   - Graph database schema (nodes + edges)
   - D3.js visualization
   - Interactive exploration
   - Discovery flow

## Important File Locations

### Documentation
- `SENTRY_TESTING.md` - Sentry testing on clean machine
- `docs/SENTRY_SETUP.md` - Complete Sentry setup guide
- `docs/roadmap/QUICK_WINS.md` - All quick win tasks
- `docs/roadmap/REALISTIC_ROADMAP.md` - Full roadmap with priorities

### Key Components
- `apps/web/src/components/child/time-remaining-badge.tsx` - Time badge
- `apps/web/src/lib/utils/time-limits.ts` - Time calculation utilities
- `apps/web/sentry.*.config.ts` - Sentry configuration (3 files)
- `infrastructure/scripts/health-check.sh` - Health check script

### API Routes
- `apps/web/src/app/api/profiles/[profileId]/time-remaining/route.ts` - Time remaining
- `apps/web/src/app/api/profiles/[profileId]/conversations/` - Conversation APIs (exist)

## Development Commands

```bash
# Health check before starting
pnpm health:check

# Start everything
pnpm dev:all

# Docker only
pnpm docker:dev
pnpm docker:down

# Dev server only
pnpm dev

# Database
pnpm db:migrate
pnpm db:studio

# Check Docker status
pnpm docker:status
```

## Git Status

```bash
# Current branch
git branch
# Should show: feature/realdebrid-integration

# Recent commits (last 10)
git log --oneline -10

# Check for uncommitted changes
git status

# If needed, create new feature branch
git checkout -b feature/your-feature-name
```

## Testing Checklist (If Sentry Test Passed)

Once Sentry is verified working:
- [ ] Remove SENTRY_DEBUG from production .env (keep for dev)
- [ ] Configure Sentry alerts (email/Slack)
- [ ] Add SENTRY_AUTH_TOKEN for source maps (optional)
- [ ] Test time remaining badge displays correctly
- [ ] Run health check from different directories
- [ ] Verify all services pass health check

## Common Issues & Solutions

### Sentry Not Capturing Errors
- Check: Ad blocker disabled
- Check: SENTRY_DSN in .env
- Check: SENTRY_DEBUG=true for dev testing
- Check: Browser console for network errors
- Solution: Test on machine without restrictions

### Health Check Fails
- Run: `pnpm docker:dev` to start services
- Check: Docker Desktop is running
- Check: .env file exists in apps/web/
- Run: `pnpm health:check` for detailed output

### Time Badge Not Showing
- Check: Child profile has timeLimits set in database
- Check: API endpoint returns 200: `curl http://localhost:3000/api/profiles/[id]/time-remaining`
- Check: Browser console for errors
- Note: Badge hides if no time limit is set (by design)

### Dev Server Not Starting
- Kill existing: `pkill -f "next dev"`
- Check ports: `lsof -i :3000`
- Check .env: `cat apps/web/.env | grep -v "^#"`
- Restart: `pnpm dev`

## Recommended Workflow

1. **Start fresh:**
   ```bash
   git pull origin feature/realdebrid-integration
   pnpm health:check
   pnpm dev:all
   ```

2. **Pick a task** from options above

3. **Use task tracking:**
   - Create tasks: "Setup Sentry error tracking"
   - Update status: in_progress → completed
   - Track progress throughout session

4. **Commit frequently:**
   - After each feature completion
   - Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
   - Include Co-Authored-By line

5. **Run oathkeeper before finishing:**
   ```
   Use the oathkeeper agent to verify:
   - Features actually work end-to-end
   - No incomplete implementations
   - Production-ready quality
   ```

## Context for AI Agents

### CLAUDE.md Workflow
- User has comprehensive agent workflow in ~/.claude/CLAUDE.md
- Prefer using specialized agents for tasks
- Use oathkeeper to verify completion
- Use project-manager for compliance checks
- Use workflow-orchestrator for comprehensive reviews

### Agent Recommendations
- **Quick reality check:** oathkeeper agent
- **Code review:** staff-engineer-reviewer
- **Security audit:** security-auditor
- **Testing strategy:** qa-test-architect
- **Deep debugging:** ultrathink-debugger
- **Performance:** performance-engineer

## Success Criteria

**Session is successful when:**
- [ ] At least one feature fully completed and tested
- [ ] All changes committed with clear messages
- [ ] oathkeeper review shows >85% completion
- [ ] No critical blockers introduced
- [ ] Documentation updated (if needed)
- [ ] Next session instructions updated

## Questions to Ask User

When starting new session:
1. "Did Sentry work on the other machine?" (if testing was pending)
2. "Which option would you like to work on? (A/B/C/D)"
3. "Any specific features or bugs you want to prioritize?"
4. "Should I run health check first to verify environment?"

## Final Notes

- **Branch:** feature/realdebrid-integration (has RealDebrid + quick wins)
- **Main blocking issue:** Sentry network testing (needs clean machine)
- **Production readiness:** 85% complete for quick wins
- **Next big milestone:** Time Limits Enforcement UI (critical for launch)
- **Unique features:** Knowledge Graph, AI Chat Analytics (already built)

---

**Generated:** 2026-02-02
**For Claude Session:** Context reset continuation
**Last Commit:** 70da2e1 - Sentry testing docs
