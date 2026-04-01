# 🚀 Start RealDebrid Testing Here

**For the next Claude session after restart**

---

## Quick Start Command

```
Use Playwright MCP to test the RealDebrid integration by following
docs/archive/REALDEBRID_TESTING.md and updating
REALDEBRID_TEST_PROGRESS.md with results after each step.
```

---

## What You Need to Know

### Context
- We're testing the new RealDebrid direct streaming feature (Stremio-style)
- Previous session set up comprehensive testing documentation
- Testing was interrupted before Playwright MCP could be used
- All documentation is ready - just need to execute with browser automation

### Key Files
1. **docs/archive/REALDEBRID_TESTING.md** - Complete testing guide with step-by-step instructions
2. **REALDEBRID_TEST_PROGRESS.md** - Progress tracker (update this as you test)
3. **REALDEBRID_STREAMING.md** - Feature documentation

### Prerequisites to Verify
```bash
# 1. Check dev server running
lsof -i :3000

# 2. Check workers running
ps aux | grep tsx | grep worker

# 3. Check RealDebrid API key configured
grep REALDEBRID_API_KEY .env

# 4. If any not running, start with:
pnpm dev:all
```

---

## Testing Approach

### Phase 1: Core Workflow (Steps 1-9)
Use Playwright MCP to:
1. Navigate to http://localhost:3000/admin/content/import
2. Click RealDebrid tab
3. Paste test magnet link
4. Preview files
5. Select files
6. Import
7. Verify video records
8. Approve video
9. Monitor download & verify playback

### Phase 2: Error Handling (Step 10)
Test:
- Invalid magnet links
- Empty file selection
- Other error scenarios

### Phase 3: Edge Cases
Test:
- Multi-file torrents
- Large files
- Duplicate imports
- Concurrent imports

---

## After Each Step

Update `REALDEBRID_TEST_PROGRESS.md` with:
- ✅ Status (pass/fail)
- Screenshot paths
- Actual vs expected behavior
- Any issues encountered
- Timestamps

---

## Test Data

**Small test magnet** (Ubuntu ISO):
```
magnet:?xt=urn:btih:6a9759bffd5c0af65319979fb7832189f4f3c356&dn=ubuntu-22.04.1-desktop-amd64.iso
```

**Invalid magnet** (for error testing):
```
magnet:?xt=urn:btih:invalid
```

---

## Expected Outcomes

### Success Criteria
- All imports complete without errors
- Videos are viewable and playable
- Status updates reflect actual progress
- UI shows RealDebrid badges correctly
- Error messages are clear and helpful
- Multi-file torrents work properly
- No memory leaks or hanging processes

### Time Estimate
- Full test suite: 30-45 minutes
- Core workflow only: 15-20 minutes
- Single happy path: 10-15 minutes

---

## If Issues Occur

1. **Check logs**: `tail -f .workers.log`
2. **Check browser console**: F12 → Console tab
3. **Check Docker**: `docker ps`
4. **Document in progress tracker** with:
   - Error message
   - Screenshot
   - Steps to reproduce
   - Potential fix

---

## Branch Context

**Current branch**: `feature/realdebrid-integration`
**Recent commits**:
- feat: add RealDebrid direct streaming (Stremio-style)
- feat: improve YouTube download resilience
- fix: correct health check imports
- feat: add network storage configuration

---

## Post-Testing

Once all tests pass:
1. Update final summary in progress tracker
2. Consider committing test results
3. Ready for code review or PR creation

---

**Good luck with testing! 🧲**
