# RealDebrid Integration Testing - Progress Tracker

**Session Date**: 2026-02-01
**Testing Guide**: `docs/archive/REALDEBRID_TESTING.md`
**Test Method**: Playwright MCP (Browser Automation)

---

## Quick Start for New Session

```
Use Playwright MCP to follow the testing guide in docs/archive/REALDEBRID_TESTING.md
Update this file with results after each step.
```

---

## Prerequisites Check

- [x] RealDebrid API key configured in `.env`
- [x] Development server running (`pnpm dev:all`)
- [x] Database migrations applied
- [x] Background workers running
- [ ] Playwright MCP connected

**Verification Commands**:
```bash
# Check .env has REALDEBRID_API_KEY
grep REALDEBRID_API_KEY .env

# Check dev server
lsof -i :3000

# Check workers
ps aux | grep tsx | grep worker
```

---

## Test Results

### Step 1: Access the Import Page
**URL**: http://localhost:3000/admin/content/import

- [ ] Page loads successfully
- [ ] YouTube tab visible
- [ ] RealDebrid tab visible (🧲 icon)
- [ ] Can click RealDebrid tab

**Status**: ⏳ Not Started
**Result**:
**Timestamp**:
**Screenshots**:
**Notes**:

---

### Step 2: Test Magnet Link Preview
**Test Data**: `magnet:?xt=urn:btih:6a9759bffd5c0af65319979fb7832189f4f3c356&dn=ubuntu-22.04.1-desktop-amd64.iso`

- [ ] Magnet input field present
- [ ] "Preview Files" button present
- [ ] Paste magnet link works
- [ ] Click "Preview Files" triggers request
- [ ] Wait 5-10 seconds
- [ ] File list appears with:
  - [ ] Torrent name displayed
  - [ ] Total size displayed
  - [ ] Individual files listed
  - [ ] File sizes shown
  - [ ] Checkboxes present

**Status**: ⏳ Not Started
**Result**:
**Timestamp**:
**Screenshots**:
**Notes**:

---

### Step 3: Test File Selection
- [ ] Video files pre-selected by default
- [ ] Can click checkbox to deselect
- [ ] Can click checkbox to select
- [ ] "Select All" button works
- [ ] "Select None" button works
- [ ] At least one file can be selected

**Status**: ⏳ Not Started
**Result**:
**Timestamp**:
**Screenshots**:
**Notes**:

---

### Step 4: Test Import
- [ ] "Import Selected Files" button present
- [ ] Button enabled when files selected
- [ ] Click triggers import process
- [ ] Wait 10-30 seconds
- [ ] Success message appears with:
  - [ ] Number of videos imported
  - [ ] "What happens next" explanation
  - [ ] Auto-redirect countdown
- [ ] Redirects to `/admin/content`

**Status**: ⏳ Not Started
**Result**:
**Timestamp**:
**Screenshots**:
**Notes**:

---

### Step 5: Verify Video Records
**URL**: http://localhost:3000/admin/content

- [ ] Video cards appear
- [ ] RealDebrid badge visible (🧲)
- [ ] Status shows "PENDING"
- [ ] Purple color scheme applied
- [ ] Video metadata visible

**Status**: ⏳ Not Started
**Result**:
**Timestamp**:
**Screenshots**:
**Database Check**: `psql -d safestream -c "SELECT id, title, sourceType, status FROM videos WHERE sourceType='REALDEBRID' ORDER BY createdAt DESC LIMIT 5;"`
**Notes**:

---

### Step 6: Test Approval Flow
**URL**: http://localhost:3000/admin/content/approval

- [ ] Navigate to approval page
- [ ] RealDebrid videos visible
- [ ] Click on video opens details
- [ ] "Approve" button present
- [ ] Click "Approve" works
- [ ] Status changes to "DOWNLOADING"

**Status**: ⏳ Not Started
**Result**:
**Timestamp**:
**Screenshots**:
**Notes**:

---

### Step 7: Monitor Download Progress
**Log Command**: `tail -f .workers.log`

Expected log sequence:
- [ ] "Adding magnet to RealDebrid"
- [ ] "Magnet added successfully"
- [ ] "Selecting torrent files"
- [ ] "Files selected successfully"
- [ ] "Waiting for torrent download"
- [ ] "RealDebrid download completed"
- [ ] "Got download link"

Status progression:
- [ ] PENDING → DOWNLOADING
- [ ] DOWNLOADING → PROCESSING
- [ ] PROCESSING → READY

**Status**: ⏳ Not Started
**Result**:
**Time Taken**:
**Timestamp**:
**Log Excerpt**:
**Notes**:

---

### Step 8: Verify Transcoding
- [ ] Status reaches "PROCESSING"
- [ ] Transcoding worker activates
- [ ] Multiple quality versions created
- [ ] Status changes to "READY"

**Status**: ⏳ Not Started
**Result**:
**Timestamp**:
**Storage Check**: `ls -lh storage/videos/ | grep -i realdebrid`
**Notes**:

---

### Step 9: Test Video Playback
- [ ] Navigate to video page
- [ ] Video player loads
- [ ] Video plays successfully
- [ ] Quality selector works
- [ ] Different qualities play correctly
- [ ] Thumbnail displays
- [ ] Seek/scrub works
- [ ] Audio plays

**Status**: ⏳ Not Started
**Result**:
**Timestamp**:
**Screenshots**:
**Notes**:

---

### Step 10: Test Error Handling

#### Test 10a: Invalid Magnet Link
**Test Data**: `magnet:?xt=urn:btih:invalid`

- [ ] Enter invalid magnet
- [ ] Click "Preview Files"
- [ ] Clear error message displayed
- [ ] No crash or hanging

**Status**: ⏳ Not Started
**Result**:
**Error Message**:
**Notes**:

#### Test 10b: Empty File Selection
- [ ] Preview valid magnet
- [ ] Deselect all files
- [ ] Click "Import Selected Files"
- [ ] Error message: "Please select at least one file"

**Status**: ⏳ Not Started
**Result**:
**Error Message**:
**Notes**:

---

## Edge Cases

### Edge Case 1: Multi-File Torrents
**Objective**: Test with 5+ files, import only 2-3

- [ ] Find multi-file torrent
- [ ] Preview shows all files
- [ ] Select only 2-3 files
- [ ] Import succeeds
- [ ] Only selected files create video records

**Status**: ⏳ Not Started
**Result**:
**Notes**:

---

### Edge Case 2: Large Files
**Objective**: Test with 100MB-500MB file

- [ ] Find large file torrent
- [ ] Preview succeeds
- [ ] Import succeeds
- [ ] Download completes (may take longer)
- [ ] Transcode succeeds

**Status**: ⏳ Not Started
**Result**:
**File Size**:
**Time Taken**:
**Notes**:

---

### Edge Case 3: Already Imported
**Objective**: Import same magnet twice

- [ ] Import magnet successfully
- [ ] Try importing same magnet again
- [ ] Error message: "already imported"
- [ ] No duplicate records created

**Status**: ⏳ Not Started
**Result**:
**Notes**:

---

### Edge Case 4: Concurrent Imports
**Objective**: Import 2-3 different torrents simultaneously

- [ ] Open multiple browser tabs/windows
- [ ] Import different magnets in each
- [ ] All process correctly
- [ ] No race conditions
- [ ] No database conflicts

**Status**: ⏳ Not Started
**Result**:
**Notes**:

---

## Performance Metrics

Expected timings for 50MB video:

| Step | Expected Time | Actual Time | Pass/Fail |
|------|---------------|-------------|-----------|
| Preview magnet | 2-5 seconds | | |
| Import (create records) | 10-20 seconds | | |
| RealDebrid download | 1-5 minutes | | |
| Fetch to storage | 30-60 seconds | | |
| Transcode | 2-5 minutes | | |
| **Total** | **5-12 minutes** | | |

---

## Issues Encountered

### Issue #1
**Step**:
**Description**:
**Error Message**:
**Screenshot**:
**Browser Console**:
**Worker Logs**:
**Resolution**:

### Issue #2
**Step**:
**Description**:
**Error Message**:
**Screenshot**:
**Browser Console**:
**Worker Logs**:
**Resolution**:

---

## Success Criteria

- [ ] All 10 test steps pass
- [ ] All edge cases handled correctly
- [ ] Error handling works properly
- [ ] Performance within expected ranges
- [ ] No memory leaks or hanging processes
- [ ] UI displays correctly across all states
- [ ] Videos are playable end-to-end

---

## Final Summary

**Test Completion Date**:
**Total Time**:
**Steps Passed**:
**Steps Failed**:
**Edge Cases Passed**:
**Critical Issues**:
**Overall Status**: ⏳ In Progress / ✅ Passed / ❌ Failed

**Recommendation**:
**Next Steps**:

---

## Cleanup Commands

```bash
# Stop workers
pnpm dev:stop

# View logs
tail -100 .workers.log

# Check Docker
docker ps

# Optional: Clean test data
# (Delete from admin UI or database)
```

---

## Notes for Next Session

**Important Findings**:

**Blockers**:

**Recommendations**:
