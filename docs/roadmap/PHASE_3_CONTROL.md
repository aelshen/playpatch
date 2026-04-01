# Phase 3: Give Parents Control

**Duration:** 2-3 weeks
**Goal:** Parents have full visibility and control over usage
**Status:** 📋 Planned
**Prerequisites:** Phase 1 complete (Phase 2 can run in parallel)

## Overview

This phase empowers parents with comprehensive analytics, time management controls, and actionable insights. Parents can see what their children watch, how much time they spend, and what topics interest them.

## Success Criteria

- ✅ Dashboard shows accurate viewing data in real-time
- ✅ Time limits enforce correctly (±1 minute accuracy)
- ✅ Analytics update within 1 minute of watch activity
- ✅ Reports export successfully (CSV, PDF)
- ✅ All graphs render correctly on mobile and desktop
- ✅ No data privacy leaks between child profiles
- ✅ Weekly digest emails send automatically

## Key Features

### 1. Parent Dashboard

**Overview Section:**
- Family-wide statistics (week/month/all-time)
- Per-child quick stats
- Recent activity timeline
- Pending approvals count
- Quick actions (approve content, view alerts)

**Visualizations:**
- Watch time trends (line chart)
- Category distribution (pie chart)
- Most watched videos (bar chart)
- Viewing patterns heatmap (day/time)
- Interest evolution (area chart)

### 2. Individual Child Analytics

**Engagement Metrics:**
- Total sessions and average duration
- Videos watched (unique count)
- Completion rate
- Favorites added
- Playlists created
- AI conversations count

**Viewing Patterns:**
- Peak viewing times (heatmap)
- Day-of-week patterns
- Session length distribution
- Binge-watching detection

**Interest Analysis:**
- Topic distribution by watch time
- Emerging interests (new topics with growth)
- Interest depth score (rewatches, related content)
- Category preferences over time
- AI question topics

### 3. Time Management System

**Screen Time Limits:**
- Daily limits (weekday/weekend separate)
- Weekly limits (cumulative)
- Per-session limits
- Grace period (finish current video)
- Bedtime mode (auto-enable at time)

**Break Reminders:**
- Interval-based (every 30 min)
- Suggest movement activities
- Optional enforced breaks
- Eye rest reminders

**Scheduled Restrictions:**
- Allowed viewing hours
- Blocked times (bedtime, school hours)
- Special day overrides
- Holiday schedules

### 4. Weekly Digest Email

**Content:**
- Per-child summary statistics
- Top videos and categories
- New interests detected
- AI conversation highlights
- Content suggestions based on interests
- Pending approvals reminder

**Customization:**
- Frequency (weekly, bi-weekly, monthly)
- Which children to include
- Metric selection
- Delivery day/time

### 5. Export & Reporting

**Export Formats:**
- CSV (raw data for analysis)
- PDF (formatted reports)
- JSON (API integration)

**Report Types:**
- Watch history
- AI conversations
- Safety alerts
- Interest analysis
- Time usage breakdown

## Technical Specifications

### Database Schema

```sql
-- Time Limit Configuration
CREATE TABLE time_limits (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  day_type TEXT NOT NULL CHECK (day_type IN ('weekday', 'weekend')),
  daily_limit_minutes INTEGER NOT NULL,
  grace_period_minutes INTEGER NOT NULL DEFAULT 5,
  allowed_hours_start TIME,
  allowed_hours_end TIME,
  break_interval_minutes INTEGER,
  bedtime_mode_start TIME,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, day_type)
);

-- Time Usage Tracking
CREATE TABLE daily_usage (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES child_profiles(id),
  date DATE NOT NULL,
  total_minutes INTEGER NOT NULL DEFAULT 0,
  session_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, date)
);

CREATE INDEX idx_daily_usage_profile_date ON daily_usage(profile_id, date DESC);

-- Interest Tracking (aggregated)
CREATE TABLE interest_snapshots (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES child_profiles(id),
  date DATE NOT NULL,
  interests JSONB NOT NULL, -- { topic: minutes_watched }
  categories JSONB NOT NULL, -- { category: minutes_watched }
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, date)
);

CREATE INDEX idx_interest_snapshots_profile_date ON interest_snapshots(profile_id, date DESC);

-- Email Preferences
CREATE TABLE email_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekly_digest BOOLEAN NOT NULL DEFAULT true,
  digest_day TEXT NOT NULL DEFAULT 'sunday',
  digest_time TIME NOT NULL DEFAULT '18:00',
  include_profiles TEXT[] NOT NULL DEFAULT '{}', -- Array of profile IDs
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### API Endpoints

```typescript
// Dashboard & Analytics
GET    /api/admin/dashboard/overview
  Query: { period?: 'week' | 'month' | 'all' }
  Response: {
    familyStats: FamilyStats,
    childStats: ChildStats[],
    recentActivity: Activity[],
    pendingApprovals: number
  }

GET    /api/admin/analytics/child/[profileId]
  Query: { from?: string, to?: string }
  Response: {
    engagement: EngagementMetrics,
    viewingPatterns: ViewingPattern[],
    interests: InterestAnalysis,
    topVideos: VideoStat[]
  }

GET    /api/admin/analytics/interests/[profileId]
  Query: { period?: 'week' | 'month' }
  Response: {
    current: Record<string, number>,
    emerging: string[],
    trending: string[],
    timeline: Array<{ date: string, interests: Record<string, number> }>
  }

// Time Limits
GET    /api/admin/time-limits/[profileId]
  Response: {
    weekday: TimeLimitConfig,
    weekend: TimeLimitConfig
  }

PUT    /api/admin/time-limits/[profileId]
  Body: {
    dayType: 'weekday' | 'weekend',
    config: TimeLimitConfig
  }
  Response: { success: boolean }

GET    /api/profiles/[profileId]/usage/today
  Response: {
    minutesUsed: number,
    minutesRemaining: number,
    limitReached: boolean,
    nextResetAt: string
  }

POST   /api/profiles/[profileId]/usage/extend
  Body: { additionalMinutes: number, parentPin: string }
  Response: { success: boolean, newLimit: number }

// Reports & Export
GET    /api/admin/reports/watch-history
  Query: {
    profileId: string,
    from: string,
    to: string,
    format: 'csv' | 'pdf' | 'json'
  }
  Response: File download

POST   /api/admin/reports/generate
  Body: {
    reportType: string,
    profileId?: string,
    dateRange: { from: string, to: string },
    format: 'csv' | 'pdf' | 'json'
  }
  Response: { downloadUrl: string }

// Email Digest
GET    /api/admin/email/preferences
PUT    /api/admin/email/preferences
  Body: EmailPreferences
  Response: { success: boolean }

POST   /api/admin/email/send-test-digest
  Response: { success: boolean, preview: string }

// Analytics Helpers
GET    /api/admin/analytics/viewing-patterns/[profileId]
  Query: { period?: 'week' | 'month' }
  Response: {
    heatmap: Array<{ day: string, hour: number, minutes: number }>,
    peakTime: { day: string, hour: number },
    avgSessionDuration: number
  }
```

### Analytics Calculations

```typescript
// apps/web/src/lib/analytics/interest-tracker.ts
export async function calculateInterests(
  profileId: string,
  dateRange: DateRange
): Promise<InterestAnalysis> {
  // Get all watch sessions in range
  const sessions = await getWatchSessions(profileId, dateRange);

  // Aggregate by topic/category
  const topicMinutes: Record<string, number> = {};
  const categoryMinutes: Record<string, number> = {};

  for (const session of sessions) {
    const video = await getVideo(session.videoId);

    // Add topic watch time
    for (const topic of video.topics) {
      topicMinutes[topic] = (topicMinutes[topic] || 0) + session.duration / 60;
    }

    // Add category watch time
    for (const category of video.categories) {
      categoryMinutes[category] = (categoryMinutes[category] || 0) + session.duration / 60;
    }
  }

  // Identify emerging interests (new in last 7 days with growth)
  const emerging = await findEmergingInterests(profileId, topicMinutes);

  return {
    topics: sortByValue(topicMinutes),
    categories: sortByValue(categoryMinutes),
    emerging,
    topTopic: Object.keys(topicMinutes)[0],
    topCategory: Object.keys(categoryMinutes)[0]
  };
}

export async function findEmergingInterests(
  profileId: string,
  currentInterests: Record<string, number>
): Promise<string[]> {
  // Get interests from 2 weeks ago
  const twoWeeksAgo = subDays(new Date(), 14);
  const oldInterests = await getInterestSnapshot(profileId, twoWeeksAgo);

  const emerging: string[] = [];

  for (const [topic, minutes] of Object.entries(currentInterests)) {
    const oldMinutes = oldInterests[topic] || 0;
    const growth = oldMinutes > 0 ? (minutes - oldMinutes) / oldMinutes : Infinity;

    // Emerging if: new (Infinity growth) or 100%+ growth with meaningful time
    if ((growth === Infinity && minutes > 30) || (growth > 1.0 && minutes > 60)) {
      emerging.push(topic);
    }
  }

  return emerging;
}
```

### Time Enforcement Logic

```typescript
// apps/web/src/lib/time-limits/enforcer.ts
export async function checkTimeLimit(profileId: string): Promise<TimeLimitStatus> {
  const today = new Date();
  const dayType = isWeekend(today) ? 'weekend' : 'weekday';

  // Get limit configuration
  const config = await getTimeLimitConfig(profileId, dayType);
  if (!config) {
    return { allowed: true, unlimited: true };
  }

  // Get today's usage
  const usage = await getDailyUsage(profileId, today);

  // Check if within allowed hours
  const now = format(today, 'HH:mm');
  if (config.allowedHoursStart && config.allowedHoursEnd) {
    if (now < config.allowedHoursStart || now > config.allowedHoursEnd) {
      return {
        allowed: false,
        reason: 'outside_allowed_hours',
        nextAllowedAt: getNextAllowedTime(config)
      };
    }
  }

  // Check bedtime mode
  if (config.bedtimeModeStart && now >= config.bedtimeModeStart) {
    return {
      allowed: false,
      reason: 'bedtime',
      bedtimeMode: true
    };
  }

  // Check daily limit
  const minutesUsed = usage.totalMinutes;
  const limit = config.dailyLimitMinutes;

  if (minutesUsed >= limit) {
    return {
      allowed: false,
      reason: 'limit_reached',
      minutesUsed,
      limit,
      resetAt: startOfDay(addDays(today, 1))
    };
  }

  return {
    allowed: true,
    minutesRemaining: limit - minutesUsed,
    warningAt: limit - 15 // Warn when 15 min left
  };
}

export async function trackWatchTime(
  profileId: string,
  minutes: number
): Promise<void> {
  const today = startOfDay(new Date());

  await prisma.dailyUsage.upsert({
    where: {
      profileId_date: { profileId, date: today }
    },
    create: {
      profileId,
      date: today,
      totalMinutes: minutes,
      sessionCount: 1
    },
    update: {
      totalMinutes: { increment: minutes },
      sessionCount: { increment: 1 },
      lastUpdated: new Date()
    }
  });
}
```

## Week-by-Week Breakdown

### Week 1: Analytics Dashboard

**Days 1-2: Backend Analytics**
- [ ] Create analytics calculation functions
- [ ] Build `/api/admin/dashboard` endpoints
- [ ] Implement interest tracking
- [ ] Create daily aggregation job
- [ ] Test analytics accuracy

**Days 3-4: Dashboard UI**
- [ ] Build dashboard layout
- [ ] Implement family overview section
- [ ] Create per-child stat cards
- [ ] Add recent activity timeline
- [ ] Build pending approvals widget

**Day 5: Visualizations**
- [ ] Integrate chart library (Recharts)
- [ ] Build watch time trend chart
- [ ] Create category distribution pie chart
- [ ] Implement viewing patterns heatmap
- [ ] Add responsive chart behavior

**Acceptance Criteria:**
- Dashboard loads in <2s
- Data is accurate within 1 minute
- Charts render correctly
- Mobile responsive

### Week 2: Time Management

**Days 1-2: Time Limit System**
- [ ] Create time limit schema
- [ ] Build `/api/admin/time-limits` endpoints
- [ ] Implement enforcement logic
- [ ] Create usage tracking
- [ ] Test limit accuracy

**Days 3-4: Child-Facing Enforcement**
- [ ] Build time limit check in video player
- [ ] Implement warning notifications
- [ ] Create "Time's Up" screen
- [ ] Add grace period logic
- [ ] Build parent PIN override

**Day 5: Admin Configuration UI**
- [ ] Build time limit settings page
- [ ] Create weekday/weekend tabs
- [ ] Add allowed hours picker
- [ ] Implement break reminder settings
- [ ] Add bedtime mode configuration

**Acceptance Criteria:**
- Limits enforce within ±1 minute
- Warnings appear correctly
- Override PIN works
- Settings save properly

### Week 3: Reports & Email Digest

**Days 1-2: Export System**
- [ ] Build CSV export functionality
- [ ] Implement PDF generation (Puppeteer)
- [ ] Create JSON export
- [ ] Build download endpoint
- [ ] Test all export formats

**Days 2-3: Weekly Digest Email**
- [ ] Set up email service (Resend or Nodemailer)
- [ ] Design email template (React Email)
- [ ] Build digest data aggregation
- [ ] Implement scheduling (cron job)
- [ ] Create email preferences UI

**Day 4: Advanced Analytics**
- [ ] Build interest analysis page
- [ ] Create emerging interests detector
- [ ] Implement binge-watching alerts
- [ ] Add content recommendations
- [ ] Build comparison views (child vs child)

**Day 5: Polish & Testing**
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] Bug fixes
- [ ] User acceptance testing

**Acceptance Criteria:**
- Exports download correctly
- Emails send on schedule
- Analytics are actionable
- All tests pass

## Component Structure

```
apps/web/src/
├── app/
│   └── admin/
│       ├── dashboard/
│       │   └── page.tsx                 # Main dashboard
│       ├── analytics/
│       │   └── [profileId]/
│       │       └── page.tsx             # Child analytics
│       ├── time-limits/
│       │   └── [profileId]/
│       │       └── page.tsx             # Time limit settings
│       └── reports/
│           └── page.tsx                 # Report generation
│
├── components/
│   └── admin/
│       ├── dashboard/
│       │   ├── FamilyOverview.tsx
│       │   ├── ChildStatCard.tsx
│       │   ├── RecentActivity.tsx
│       │   └── PendingApprovals.tsx
│       ├── analytics/
│       │   ├── WatchTimeTrend.tsx       # Line chart
│       │   ├── CategoryDistribution.tsx # Pie chart
│       │   ├── ViewingHeatmap.tsx       # Day/hour heatmap
│       │   ├── InterestAnalysis.tsx
│       │   └── TopVideos.tsx
│       ├── time-limits/
│       │   ├── LimitConfiguration.tsx
│       │   ├── UsageProgress.tsx
│       │   └── SchedulePicker.tsx
│       └── reports/
│           ├── ReportBuilder.tsx
│           └── ExportButton.tsx
│
└── lib/
    ├── analytics/
    │   ├── interest-tracker.ts
    │   ├── viewing-patterns.ts
    │   └── metrics.ts
    ├── time-limits/
    │   ├── enforcer.ts
    │   └── usage-tracker.ts
    ├── email/
    │   ├── digest-generator.ts
    │   └── templates/
    │       └── weekly-digest.tsx
    └── reports/
        ├── csv-exporter.ts
        └── pdf-generator.ts
```

## Testing Strategy

### Unit Tests
```typescript
describe('Interest Tracking', () => {
  it('calculates topic minutes correctly', async () => {
    const interests = await calculateInterests(profileId, dateRange);
    expect(interests.topics['Ocean Animals']).toBe(120);
  });

  it('detects emerging interests', async () => {
    const emerging = await findEmergingInterests(profileId, interests);
    expect(emerging).toContain('Dinosaurs');
  });
});

describe('Time Limit Enforcement', () => {
  it('allows when under limit', async () => {
    const status = await checkTimeLimit(profileId);
    expect(status.allowed).toBe(true);
  });

  it('blocks when limit reached', async () => {
    await setDailyUsage(profileId, 90); // 90 minutes used, 60 limit
    const status = await checkTimeLimit(profileId);
    expect(status.allowed).toBe(false);
    expect(status.reason).toBe('limit_reached');
  });

  it('blocks outside allowed hours', async () => {
    mockTime('22:00'); // Past bedtime
    const status = await checkTimeLimit(profileId);
    expect(status.allowed).toBe(false);
  });
});
```

### Integration Tests
```typescript
describe('Analytics API', () => {
  it('returns accurate dashboard data', async () => {
    const res = await GET('/api/admin/dashboard/overview');
    expect(res.familyStats.totalWatchTime).toBeGreaterThan(0);
    expect(res.childStats).toHaveLength(2);
  });

  it('exports CSV correctly', async () => {
    const res = await GET('/api/admin/reports/watch-history?format=csv');
    expect(res.headers['content-type']).toContain('text/csv');
    const csv = await res.text();
    expect(csv).toContain('Video Title,Duration,Date');
  });
});
```

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Dashboard Load Time | <2s | Lighthouse |
| Analytics Calculation | <500ms | Server timing |
| Chart Render Time | <300ms | React Profiler |
| Export Generation | <5s | User timing |
| Email Send Time | <10s | Background job |
| Time Check (real-time) | <50ms | API monitoring |

## Security & Privacy

### Data Isolation
- Strict profile-level filtering in all queries
- Parent can only see their own family data
- No cross-family data leakage

### Export Security
- Temporary signed URLs (expire in 1 hour)
- Rate limiting on exports (5 per hour)
- No sensitive data in exports (e.g., passwords)

### Email Security
- Unsubscribe link in all emails
- No tracking pixels
- Plain text alternative

## Migration Guide

```bash
# Run migrations
cd apps/web
pnpm prisma migrate dev --name add-time-limits-and-analytics

# Create initial time limits for existing profiles
pnpm tsx scripts/migrate-time-limits.ts

# Backfill interest snapshots (optional)
pnpm tsx scripts/backfill-interests.ts
```

## Environment Variables

```env
# Email Configuration
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_...
SMTP_FROM=PlayPatch <noreply@playpatch.com>

# Digest Schedule (cron format)
DIGEST_SCHEDULE="0 18 * * 0"  # Sunday 6pm

# Export Limits
MAX_EXPORTS_PER_HOUR=5
EXPORT_URL_TTL_HOURS=1
```

## Deliverables

1. **Parent Dashboard**
   - Family overview
   - Per-child analytics
   - Visualizations

2. **Time Management**
   - Limit configuration UI
   - Enforcement system
   - Usage tracking

3. **Reports & Exports**
   - CSV/PDF/JSON exports
   - Weekly digest emails
   - Custom report builder

4. **Documentation**
   - Analytics interpretation guide
   - Time limit setup guide
   - Email configuration docs

## Next Phase Preview

**Phase 4: Make It Delightful** adds:
- Adventure Mode (gamified learning)
- Video Journals
- Watch Together Mode
- Theme customization

---

**Phase Owner:** Full-stack Team
**Status:** 📋 Planning
**Start Date:** After Phase 1 (parallel with Phase 2)
**Target Completion:** 3 weeks from start
