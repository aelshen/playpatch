# SafeStream Kids Analytics Revamp - Implementation Checklist

**Implementation Guide & Ticket Breakdown**
**Version:** 1.0
**Date:** January 11, 2026
**Total Duration:** 5 weeks (7 phases)

---

## Quick Reference

### Phase Overview
- ✅ **Phase 0**: Documentation & Planning (COMPLETE)
- 🔄 **Phase 1**: Foundation & Infrastructure (Week 1) - **NEXT**
- ⏳ **Phase 2**: AI Chat Analytics (Week 2)
- ⏳ **Phase 3**: Interaction Analytics (Week 2-3)
- ⏳ **Phase 4**: Enhanced Watch Analytics & Heatmaps (Week 3)
- ⏳ **Phase 5**: Drill-Down Navigation (Week 4)
- ⏳ **Phase 6**: Comparison Mode (Week 4-5)
- ⏳ **Phase 7**: Polish & Advanced Features (Week 5)

### Progress Tracking
- Total Tasks: 87
- Completed: 0
- In Progress: 0
- Pending: 87

---

## Phase 0: Documentation & Planning ✅

### ✅ TICKET-000: Project Planning
**Status:** COMPLETE
**Priority:** P0 (Blocker)
**Estimate:** 1 day

**Tasks:**
- [x] Create comprehensive implementation plan
- [x] Get plan approved by stakeholder
- [x] Create PRD (Product Requirements Document)
- [x] Create design specifications
- [x] Create implementation checklist

**Deliverables:**
- ✅ `/docs/analytics-revamp-prd.md`
- ✅ `/docs/analytics-revamp-design-specs.md`
- ✅ `/docs/analytics-revamp-implementation-checklist.md`

---

## Phase 1: Foundation & Infrastructure (Week 1)

**Goal:** Set up charting libraries, create base components, add database indexes

### TICKET-101: Install Dependencies
**Status:** TODO
**Priority:** P0 (Blocker)
**Estimate:** 30 minutes
**Assignee:** Developer

**Description:**
Install required charting and UI libraries for analytics dashboard.

**Tasks:**
- [ ] Run `pnpm add recharts react-force-graph-2d react-day-picker date-fns-tz`
- [ ] Run `pnpm add -D @types/d3-force`
- [ ] Verify installations in `package.json`
- [ ] Test that server starts without errors
- [ ] Commit: "chore: add analytics charting dependencies"

**Acceptance Criteria:**
- All packages installed successfully
- No dependency conflicts
- Dev server starts without errors
- Types available for TypeScript

**Files Changed:**
- `package.json`
- `pnpm-lock.yaml`

---

### TICKET-102: Add Database Indexes
**Status:** TODO
**Priority:** P0 (Blocker)
**Estimate:** 1 hour
**Assignee:** Developer

**Description:**
Add database indexes to optimize analytics queries for performance.

**Tasks:**
- [ ] Update `schema.prisma` with new indexes for AIMessage
- [ ] Update `schema.prisma` with new indexes for AIConversation
- [ ] Update `schema.prisma` with new indexes for Favorite
- [ ] Update `schema.prisma` with new indexes for RequestFromChild
- [ ] Update `schema.prisma` with new indexes for WatchSession
- [ ] Run `pnpm prisma migrate dev --name add_analytics_indexes`
- [ ] Verify migration applied successfully
- [ ] Test existing queries still work
- [ ] Commit: "feat(db): add indexes for analytics performance"

**Acceptance Criteria:**
- All indexes created successfully
- Migration runs without errors
- Existing functionality unaffected
- Query performance improved (test with EXPLAIN)

**Schema Changes:**
```prisma
model AIMessage {
  // Add:
  @@index([createdAt, conversationId])
  @@index([wasFiltered])
}

model AIConversation {
  // Add:
  @@index([startedAt, endedAt])
  @@index([topics])
}

model Favorite {
  // Add:
  @@index([createdAt])
}

model RequestFromChild {
  // Add:
  @@index([createdAt, status, requestType])
}

model WatchSession {
  // Add:
  @@index([startedAt, childId])
}
```

**Files Changed:**
- `apps/web/prisma/schema.prisma`
- `apps/web/prisma/migrations/[timestamp]_add_analytics_indexes/migration.sql` (generated)

---

### TICKET-103: Create Line Chart Component
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 2 hours
**Assignee:** Developer

**Description:**
Create reusable LineChart component using Recharts for time-series data visualization.

**Tasks:**
- [ ] Create `/components/charts/line-chart.tsx`
- [ ] Define TypeScript interface for props
- [ ] Implement ResponsiveContainer wrapper
- [ ] Add LineChart with Line, XAxis, YAxis, Tooltip, Legend
- [ ] Support multiple Y-axis keys (multiple lines)
- [ ] Add custom tooltip formatting
- [ ] Add area fill option (optional gradient)
- [ ] Add hover states for points
- [ ] Test with sample data
- [ ] Add JSDoc comments for props
- [ ] Commit: "feat(charts): add LineChart component"

**Acceptance Criteria:**
- Component renders line chart correctly
- Supports multiple data series
- Responsive sizing works
- Tooltip shows on hover
- Legend toggles lines on/off
- TypeScript types are correct

**Props Interface:**
```typescript
interface LineChartProps {
  data: Array<{ [key: string]: any }>;
  xKey: string;
  yKeys: string[];
  colors?: string[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showArea?: boolean;
  yAxisLabel?: string;
  xAxisLabel?: string;
}
```

**Files Created:**
- `apps/web/src/components/charts/line-chart.tsx`

**Testing:**
- Create sample story or test page
- Verify rendering with mock data
- Test responsive behavior

---

### TICKET-104: Create Bar Chart Component
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 2 hours
**Assignee:** Developer

**Description:**
Create reusable BarChart component using Recharts for categorical comparisons.

**Tasks:**
- [ ] Create `/components/charts/bar-chart.tsx`
- [ ] Define TypeScript interface for props
- [ ] Implement ResponsiveContainer wrapper
- [ ] Add BarChart with Bar, XAxis, YAxis, Tooltip, Legend
- [ ] Support horizontal orientation option
- [ ] Support stacked bars option
- [ ] Support grouped bars (multiple series)
- [ ] Add custom colors
- [ ] Add hover effects
- [ ] Test with sample data
- [ ] Add JSDoc comments
- [ ] Commit: "feat(charts): add BarChart component"

**Acceptance Criteria:**
- Component renders bar chart correctly
- Horizontal and vertical modes work
- Stacked and grouped modes work
- Responsive sizing works
- Colors customizable
- TypeScript types correct

**Props Interface:**
```typescript
interface BarChartProps {
  data: Array<{ [key: string]: any }>;
  xKey: string;
  yKeys: string[];
  colors?: string[];
  height?: number;
  horizontal?: boolean;
  stacked?: boolean;
  showValues?: boolean;
  showLegend?: boolean;
}
```

**Files Created:**
- `apps/web/src/components/charts/bar-chart.tsx`

---

### TICKET-105: Create Donut Chart Component
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 2 hours
**Assignee:** Developer

**Description:**
Create reusable DonutChart component using Recharts for distribution visualization.

**Tasks:**
- [ ] Create `/components/charts/donut-chart.tsx`
- [ ] Define TypeScript interface for props
- [ ] Implement ResponsiveContainer wrapper
- [ ] Add PieChart with innerRadius for donut effect
- [ ] Add Cell components for custom colors
- [ ] Add center label (text in middle)
- [ ] Add percentage labels on segments
- [ ] Add legend below chart
- [ ] Add hover effects
- [ ] Test with sample data
- [ ] Add JSDoc comments
- [ ] Commit: "feat(charts): add DonutChart component"

**Acceptance Criteria:**
- Component renders donut chart correctly
- Center label displays correctly
- Percentages shown on segments
- Legend displays with colors
- Responsive sizing works
- Colors customizable

**Props Interface:**
```typescript
interface DonutChartProps {
  data: Array<{ name: string; value: number }>;
  colors?: string[];
  centerLabel?: string;
  showLegend?: boolean;
  height?: number;
}
```

**Files Created:**
- `apps/web/src/components/charts/donut-chart.tsx`

---

### TICKET-106: Create Heatmap Component
**Status:** TODO
**Priority:** P2 (Medium)
**Estimate:** 3 hours
**Assignee:** Developer

**Description:**
Create custom Heatmap component for viewing patterns (day/hour grid).

**Tasks:**
- [ ] Create `/components/charts/heatmap.tsx`
- [ ] Define TypeScript interface for props
- [ ] Implement SVG-based grid rendering
- [ ] Calculate color intensity based on value range
- [ ] Add day labels (rows: Sun-Sat or 0-6)
- [ ] Add hour labels (columns: 0-23)
- [ ] Add tooltip on cell hover
- [ ] Add click handler for cells (optional)
- [ ] Add color scale legend
- [ ] Test with sample heatmap data
- [ ] Add JSDoc comments
- [ ] Commit: "feat(charts): add Heatmap component"

**Acceptance Criteria:**
- 7×24 grid renders correctly
- Color intensity reflects data values
- Tooltip shows exact value on hover
- Labels are readable
- Responsive sizing works
- Click handler works (if provided)

**Props Interface:**
```typescript
interface HeatmapProps {
  data: Array<{ day: number; hour: number; value: number }>;
  colorScheme?: [string, string, string]; // [low, medium, high]
  cellSize?: number;
  showTooltip?: boolean;
  onCellClick?: (day: number, hour: number) => void;
}
```

**Files Created:**
- `apps/web/src/components/charts/heatmap.tsx`

---

### TICKET-107: Create Date Range Picker Component
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 4 hours
**Assignee:** Developer

**Description:**
Create date range picker component with presets and custom range selection.

**Tasks:**
- [ ] Create `/components/ui/date-range-picker.tsx`
- [ ] Define TypeScript interface for props
- [ ] Add trigger button showing current range
- [ ] Implement dropdown/popover container
- [ ] Add preset buttons (7d, 30d, 90d, This Week, This Month, All Time)
- [ ] Integrate react-day-picker for custom range selection
- [ ] Handle date range state (start, end)
- [ ] Add "Apply" and "Cancel" buttons
- [ ] Add comparison mode support (optional 2nd range)
- [ ] Style with Tailwind CSS
- [ ] Test date selection behavior
- [ ] Add JSDoc comments
- [ ] Commit: "feat(ui): add DateRangePicker component"

**Acceptance Criteria:**
- Picker opens on button click
- Presets set correct date ranges
- Custom range selection works
- Selected range persists
- Comparison mode works (Phase 6)
- UI matches design specs
- Accessible (keyboard navigation)

**Props Interface:**
```typescript
interface DateRangePickerProps {
  value: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
  presets?: Array<{ label: string; getDates: () => [Date, Date] }>;
  comparisonMode?: boolean;
}
```

**Files Created:**
- `apps/web/src/components/ui/date-range-picker.tsx`

**Dependencies:**
- react-day-picker
- date-fns (for date calculations)

---

### TICKET-108: Create AI Analytics Query Functions
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 3 hours
**Assignee:** Developer

**Description:**
Create database query functions for AI chat analytics.

**Tasks:**
- [ ] Create `/lib/db/queries/ai-analytics.ts`
- [ ] Implement `getAIConversationStats()` - aggregate statistics
- [ ] Implement `getTopicsDiscussed()` - extract and count topics
- [ ] Implement `getAIConversationsByPeriod()` - time-series data
- [ ] Implement `getSafetyFilteringStats()` - safety metrics
- [ ] Implement `getAIPerformanceMetrics()` - response times, tokens
- [ ] Add proper TypeScript types for return values
- [ ] Add error handling
- [ ] Test each function with sample data
- [ ] Add JSDoc comments
- [ ] Commit: "feat(db): add AI analytics query functions"

**Acceptance Criteria:**
- All functions query database correctly
- Proper date range filtering
- Child ID filtering works ("all" vs specific child)
- Performance is acceptable (< 300ms)
- TypeScript types are correct
- Error handling works

**Functions:**
```typescript
async function getAIConversationStats(params: {
  childId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<AIConversationStats>

async function getTopicsDiscussed(params: {
  childId?: string;
  startDate: Date;
  endDate: Date;
  limit?: number;
}): Promise<TopicCount[]>

async function getAIConversationsByPeriod(params: {
  childId?: string;
  startDate: Date;
  endDate: Date;
  groupBy: 'day' | 'week';
}): Promise<TimeSeriesData[]>

async function getSafetyFilteringStats(params: {
  childId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<SafetyStats>

async function getAIPerformanceMetrics(params: {
  childId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<PerformanceMetrics>
```

**Files Created:**
- `apps/web/src/lib/db/queries/ai-analytics.ts`

---

### TICKET-109: Create Interaction Analytics Query Functions
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 2 hours
**Assignee:** Developer

**Description:**
Create database query functions for interaction analytics (favorites, requests).

**Tasks:**
- [ ] Create `/lib/db/queries/interaction-analytics.ts`
- [ ] Implement `getFavoriteStats()` - favorites counts and trends
- [ ] Implement `getRequestStats()` - request breakdown and fulfillment
- [ ] Implement `getContentSatisfactionMetrics()` - journal ratings
- [ ] Add proper TypeScript types
- [ ] Add error handling
- [ ] Test with sample data
- [ ] Add JSDoc comments
- [ ] Commit: "feat(db): add interaction analytics query functions"

**Acceptance Criteria:**
- All functions query correctly
- Date range and child filtering works
- Aggregations are accurate
- Performance acceptable
- Types correct

**Functions:**
```typescript
async function getFavoriteStats(params: {
  childId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<FavoriteStats>

async function getRequestStats(params: {
  childId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<RequestStats>

async function getContentSatisfactionMetrics(params: {
  childId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<SatisfactionMetrics>
```

**Files Created:**
- `apps/web/src/lib/db/queries/interaction-analytics.ts`

---

### TICKET-110: Create Pattern Analytics Query Functions
**Status:** TODO
**Priority:** P2 (Medium)
**Estimate:** 2 hours
**Assignee:** Developer

**Description:**
Create database query functions for viewing pattern analytics (heatmap data).

**Tasks:**
- [ ] Create `/lib/db/queries/pattern-analytics.ts`
- [ ] Implement `getHeatmapData()` - day/hour viewing patterns
- [ ] Implement `getContentFlowData()` - category/topic transitions (optional)
- [ ] Add proper TypeScript types
- [ ] Add error handling
- [ ] Test with sample data
- [ ] Add JSDoc comments
- [ ] Commit: "feat(db): add pattern analytics query functions"

**Acceptance Criteria:**
- Heatmap data groups correctly by day and hour
- Data format matches Heatmap component props
- Filtering works correctly
- Performance acceptable

**Functions:**
```typescript
async function getHeatmapData(params: {
  childId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<HeatmapDataPoint[]>

async function getContentFlowData(params: {
  childId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<ContentFlow>
```

**Files Created:**
- `apps/web/src/lib/db/queries/pattern-analytics.ts`

---

### Phase 1 Summary

**Total Tickets:** 10
**Estimated Time:** 20 hours (~3 days)

**Deliverables:**
- ✅ All dependencies installed
- ✅ Database indexes added and migrated
- ✅ 4 reusable chart components (Line, Bar, Donut, Heatmap)
- ✅ Date range picker component
- ✅ 3 query function files (ai-analytics, interaction-analytics, pattern-analytics)

**Ready for:** Phase 2 - AI Chat Analytics API endpoints and components

---

## Phase 2: AI Chat Analytics (Week 2)

**Goal:** Build comprehensive AI usage analytics and topic visualization

### TICKET-201: Create AI Stats API Endpoint
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 2 hours
**Assignee:** Developer

**Description:**
Create API endpoint for AI conversation statistics.

**Tasks:**
- [ ] Create `/app/api/analytics/ai/stats/route.ts`
- [ ] Import query functions from `ai-analytics.ts`
- [ ] Validate query parameters (profileId, startDate, endDate)
- [ ] Call `getAIConversationStats()` with params
- [ ] Format and return JSON response
- [ ] Add authentication check
- [ ] Add error handling
- [ ] Test endpoint with curl/Postman
- [ ] Commit: "feat(api): add AI stats endpoint"

**Acceptance Criteria:**
- Endpoint returns correct data structure
- Query parameters validated
- Authentication required
- Errors handled gracefully
- Response time < 500ms

**Request:**
```
GET /api/analytics/ai/stats?profileId=all&startDate=2026-01-01&endDate=2026-01-31
```

**Response:**
```json
{
  "totalConversations": 42,
  "totalMessages": 178,
  "avgConversationLength": 4.2,
  "avgResponseTime": 1250,
  "filterRate": 2.3,
  "totalTokensUsed": 15420,
  "topicsDiscussed": ["dinosaurs", "space", "ocean"]
}
```

**Files Created:**
- `apps/web/src/app/api/analytics/ai/stats/route.ts`

---

### TICKET-202: Create AI Topics API Endpoint
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 1.5 hours
**Assignee:** Developer

**Description:**
Create API endpoint for AI topics discussed.

**Tasks:**
- [ ] Create `/app/api/analytics/ai/topics/route.ts`
- [ ] Import `getTopicsDiscussed()` query function
- [ ] Validate query parameters
- [ ] Call query function with params
- [ ] Return JSON response
- [ ] Add authentication
- [ ] Add error handling
- [ ] Test endpoint
- [ ] Commit: "feat(api): add AI topics endpoint"

**Acceptance Criteria:**
- Returns top topics with counts
- Limit parameter works
- Authenticated
- Errors handled

**Request:**
```
GET /api/analytics/ai/topics?profileId=child-id&startDate=2026-01-01&endDate=2026-01-31&limit=10
```

**Response:**
```json
{
  "topics": [
    {
      "name": "dinosaurs",
      "count": 15,
      "videos": ["video-id-1", "video-id-2"]
    },
    {
      "name": "space exploration",
      "count": 12,
      "videos": ["video-id-3"]
    }
  ]
}
```

**Files Created:**
- `apps/web/src/app/api/analytics/ai/topics/route.ts`

---

### TICKET-203: Create AI Conversations API Endpoint
**Status:** TODO
**Priority:** P2 (Medium)
**Estimate:** 2 hours
**Assignee:** Developer

**Description:**
Create API endpoint for paginated AI conversation list.

**Tasks:**
- [ ] Create `/app/api/analytics/ai/conversations/route.ts`
- [ ] Implement pagination logic
- [ ] Call query function with pagination params
- [ ] Return conversations with metadata
- [ ] Add authentication
- [ ] Add error handling
- [ ] Test with pagination
- [ ] Commit: "feat(api): add AI conversations endpoint"

**Acceptance Criteria:**
- Returns paginated conversation list
- Pagination works correctly
- Total count included
- Authenticated

**Request:**
```
GET /api/analytics/ai/conversations?profileId=child-id&startDate=2026-01-01&page=1&limit=20
```

**Response:**
```json
{
  "conversations": [ /* array of conversation objects */ ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

**Files Created:**
- `apps/web/src/app/api/analytics/ai/conversations/route.ts`

---

### TICKET-204: Create AI Safety API Endpoint
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 1.5 hours
**Assignee:** Developer

**Description:**
Create API endpoint for AI safety filtering statistics.

**Tasks:**
- [ ] Create `/app/api/analytics/ai/safety/route.ts`
- [ ] Import `getSafetyFilteringStats()` query function
- [ ] Validate params
- [ ] Call query function
- [ ] Return safety statistics
- [ ] Add authentication
- [ ] Add error handling
- [ ] Test endpoint
- [ ] Commit: "feat(api): add AI safety stats endpoint"

**Acceptance Criteria:**
- Returns filter rate and breakdown
- Trend data included
- Authenticated
- Errors handled

**Response:**
```json
{
  "totalMessages": 178,
  "filteredMessages": 4,
  "filterRate": 2.25,
  "flagsByType": { "inappropriate": 3, "spam": 1 },
  "safetyTrends": [
    { "date": "2026-01-01", "flagged": 0, "total": 12 },
    { "date": "2026-01-02", "flagged": 1, "total": 15 }
  ]
}
```

**Files Created:**
- `apps/web/src/app/api/analytics/ai/safety/route.ts`

---

### TICKET-205: Create AI Analytics Panel Component
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 4 hours
**Assignee:** Developer

**Description:**
Create comprehensive AI analytics panel for dashboard.

**Tasks:**
- [ ] Create `/components/analytics/ai-analytics-panel.tsx`
- [ ] Fetch data from AI stats endpoint
- [ ] Display 4 sub-panels (Topics, Quality, Safety, Performance)
- [ ] Implement Topics bar chart using BarChart component
- [ ] Display conversation quality metrics
- [ ] Display safety stats with visual indicators
- [ ] Display performance metrics (optional chart)
- [ ] Add loading states
- [ ] Add error handling
- [ ] Style with Tailwind (match design specs)
- [ ] Test component rendering
- [ ] Commit: "feat(analytics): add AI analytics panel"

**Acceptance Criteria:**
- 4-column grid layout
- All metrics display correctly
- Charts render properly
- Loading states work
- Responsive design
- Matches design specs

**Files Created:**
- `apps/web/src/components/analytics/ai-analytics-panel.tsx`

---

### TICKET-206: Create AI Topic Chart Component
**Status:** TODO
**Priority:** P2 (Medium)
**Estimate:** 2 hours
**Assignee:** Developer

**Description:**
Create dedicated component for AI topic visualization (horizontal bar chart).

**Tasks:**
- [ ] Create `/components/analytics/ai-topic-chart.tsx`
- [ ] Fetch topics from endpoint
- [ ] Use BarChart component (horizontal mode)
- [ ] Display top 10 topics
- [ ] Add click handler for topic filtering (future)
- [ ] Add loading state
- [ ] Style with Tailwind
- [ ] Test rendering
- [ ] Commit: "feat(analytics): add AI topic chart"

**Acceptance Criteria:**
- Horizontal bars display topics
- Top N topics shown
- Click interaction works (optional)
- Loading state works

**Files Created:**
- `apps/web/src/components/analytics/ai-topic-chart.tsx`

---

### TICKET-207: Create AI Safety Stats Component
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 2 hours
**Assignee:** Developer

**Description:**
Create component displaying AI safety filtering statistics.

**Tasks:**
- [ ] Create `/components/analytics/ai-safety-stats.tsx`
- [ ] Fetch safety data from endpoint
- [ ] Display filter rate with visual indicator
- [ ] Show breakdown (filtered vs safe messages)
- [ ] Add trend chart (optional line chart)
- [ ] Add loading state
- [ ] Color-code indicators (green = low/good, red = high/concern)
- [ ] Style with Tailwind
- [ ] Test component
- [ ] Commit: "feat(analytics): add AI safety stats component"

**Acceptance Criteria:**
- Filter rate displays prominently
- Visual indicators work
- Color coding reflects severity
- Responsive design

**Files Created:**
- `apps/web/src/components/analytics/ai-safety-stats.tsx`

---

### TICKET-208: Integrate AI Analytics into Dashboard
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 1 hour
**Assignee:** Developer

**Description:**
Add AI analytics section to main analytics dashboard.

**Tasks:**
- [ ] Open `/components/analytics/analytics-dashboard.tsx`
- [ ] Import AI Analytics Panel component
- [ ] Add section after watch analytics
- [ ] Add section title "AI Chat Analytics"
- [ ] Pass date range and profile props
- [ ] Test integration
- [ ] Verify layout and spacing
- [ ] Commit: "feat(analytics): integrate AI analytics into dashboard"

**Acceptance Criteria:**
- AI section appears on dashboard
- Receives correct props
- Layout matches design
- No console errors

**Files Modified:**
- `apps/web/src/components/analytics/analytics-dashboard.tsx`

---

### Phase 2 Summary

**Total Tickets:** 8
**Estimated Time:** 16 hours (~2 days)

**Deliverables:**
- ✅ 4 AI analytics API endpoints
- ✅ AI analytics panel component
- ✅ AI topic chart component
- ✅ AI safety stats component
- ✅ Integration into main dashboard

**Ready for:** Phase 3 - Interaction Analytics

---

## Phase 3: Interaction Analytics (Week 2-3)

**Goal:** Add favorites and request analytics with visualizations

### TICKET-301: Create Favorites API Endpoint
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 2 hours

**Description:**
Create API endpoint for favorites analytics.

**Tasks:**
- [ ] Create `/app/api/analytics/interactions/favorites/route.ts`
- [ ] Import `getFavoriteStats()` query function
- [ ] Validate params
- [ ] Call query function
- [ ] Return favorites statistics with trends
- [ ] Add authentication
- [ ] Add error handling
- [ ] Test endpoint
- [ ] Commit: "feat(api): add favorites analytics endpoint"

**Acceptance Criteria:**
- Returns total favorites, trend data, top favorited videos
- Category distribution included
- Authenticated
- Errors handled

**Files Created:**
- `apps/web/src/app/api/analytics/interactions/favorites/route.ts`

---

### TICKET-302: Create Requests API Endpoint
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 2 hours

**Description:**
Create API endpoint for content request analytics.

**Tasks:**
- [ ] Create `/app/api/analytics/interactions/requests/route.ts`
- [ ] Import `getRequestStats()` query function
- [ ] Validate params
- [ ] Call query function
- [ ] Return request statistics
- [ ] Add authentication
- [ ] Add error handling
- [ ] Test endpoint
- [ ] Commit: "feat(api): add requests analytics endpoint"

**Acceptance Criteria:**
- Returns request breakdown by type
- Fulfillment rate calculated
- Pending requests count included
- Top requested topics included

**Files Created:**
- `apps/web/src/app/api/analytics/interactions/requests/route.ts`

---

### TICKET-303: Create Enhanced KPI Card Component
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 3 hours

**Description:**
Enhance KPI card component with sparklines and comparison support.

**Tasks:**
- [ ] Create `/components/analytics/kpi-card-enhanced.tsx`
- [ ] Add icon support (top-left)
- [ ] Add label, value, change indicator
- [ ] Add optional sparkline (mini line chart)
- [ ] Add comparison mode support (show both values)
- [ ] Add color-coded change indicators
- [ ] Style with Tailwind (match design specs)
- [ ] Add hover effects
- [ ] Add click handler (optional navigation)
- [ ] Test with sample data
- [ ] Commit: "feat(analytics): create enhanced KPI card component"

**Acceptance Criteria:**
- Card displays icon, label, value, change
- Sparkline renders correctly (optional)
- Comparison mode works
- Hover effects work
- Responsive design

**Files Created:**
- `apps/web/src/components/analytics/kpi-card-enhanced.tsx`

---

### TICKET-304: Update Dashboard with Enhanced KPI Cards
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 2 hours

**Description:**
Replace existing KPI cards with enhanced version.

**Tasks:**
- [ ] Open `/components/analytics/stats-cards.tsx`
- [ ] Import KPICardEnhanced component
- [ ] Replace existing cards with enhanced version
- [ ] Add icons to each card
- [ ] Add change indicators (calculate vs previous period)
- [ ] Add optional sparklines
- [ ] Test rendering
- [ ] Verify responsiveness
- [ ] Commit: "feat(analytics): upgrade to enhanced KPI cards"

**Acceptance Criteria:**
- All KPI cards use enhanced component
- Icons display correctly
- Change indicators show meaningful data
- Sparklines work (optional)

**Files Modified:**
- `apps/web/src/components/analytics/stats-cards.tsx`

---

### TICKET-305: Create Favorites Chart Component
**Status:** TODO
**Priority:** P2 (Medium)
**Estimate:** 2 hours

**Description:**
Create component displaying favorites trend over time.

**Tasks:**
- [ ] Create `/components/analytics/favorites-chart.tsx`
- [ ] Fetch favorites data from endpoint
- [ ] Use LineChart component for trend
- [ ] Display total favorites count
- [ ] Add loading state
- [ ] Style with Tailwind
- [ ] Test rendering
- [ ] Commit: "feat(analytics): add favorites chart component"

**Acceptance Criteria:**
- Line chart shows favorites over time
- Total count displayed
- Responsive design
- Loading state works

**Files Created:**
- `apps/web/src/components/analytics/favorites-chart.tsx`

---

### TICKET-306: Create Request Breakdown Component
**Status:** TODO
**Priority:** P2 (Medium)
**Estimate:** 2 hours

**Description:**
Create component displaying request breakdown and fulfillment.

**Tasks:**
- [ ] Create `/components/analytics/request-breakdown.tsx`
- [ ] Fetch request data from endpoint
- [ ] Display pending requests prominently
- [ ] Show request type breakdown (list or donut chart)
- [ ] Display fulfillment rate with progress bar
- [ ] Add loading state
- [ ] Style with Tailwind
- [ ] Test component
- [ ] Commit: "feat(analytics): add request breakdown component"

**Acceptance Criteria:**
- Pending requests count visible
- Request types listed with counts
- Fulfillment rate displayed with visual
- Responsive design

**Files Created:**
- `apps/web/src/components/analytics/request-breakdown.tsx`

---

### TICKET-307: Create Interaction Analytics Section
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 2 hours

**Description:**
Create wrapper component for interaction analytics section.

**Tasks:**
- [ ] Create `/components/analytics/interaction-analytics.tsx`
- [ ] Import FavoritesChart and RequestBreakdown
- [ ] Create 2-column grid layout
- [ ] Add section title "Interaction Analytics"
- [ ] Pass date range and profile props to children
- [ ] Add loading states
- [ ] Style with Tailwind
- [ ] Test layout
- [ ] Commit: "feat(analytics): add interaction analytics section"

**Acceptance Criteria:**
- 2-column grid layout
- Both child components render
- Section title displays
- Responsive design

**Files Created:**
- `apps/web/src/components/analytics/interaction-analytics.tsx`

---

### TICKET-308: Integrate Interaction Analytics into Dashboard
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 1 hour

**Description:**
Add interaction analytics section to dashboard.

**Tasks:**
- [ ] Open `/components/analytics/analytics-dashboard.tsx`
- [ ] Import InteractionAnalytics component
- [ ] Add section after AI analytics
- [ ] Pass props (date range, profile)
- [ ] Test integration
- [ ] Verify spacing and layout
- [ ] Commit: "feat(analytics): integrate interaction analytics"

**Acceptance Criteria:**
- Interaction section appears on dashboard
- Positioned after AI analytics
- Layout matches design
- No errors

**Files Modified:**
- `apps/web/src/components/analytics/analytics-dashboard.tsx`

---

### Phase 3 Summary

**Total Tickets:** 8
**Estimated Time:** 16 hours (~2 days)

**Deliverables:**
- ✅ 2 interaction analytics API endpoints
- ✅ Enhanced KPI card component
- ✅ Favorites chart component
- ✅ Request breakdown component
- ✅ Interaction analytics section
- ✅ Integration into dashboard

**Ready for:** Phase 4 - Enhanced Watch Analytics & Heatmaps

---

## Phase 4: Enhanced Watch Analytics & Heatmaps (Week 3)

**Goal:** Upgrade existing watch analytics with visualizations and patterns

### TICKET-401: Create Heatmap API Endpoint
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 2 hours

**Description:**
Create API endpoint for viewing pattern heatmap data.

**Tasks:**
- [ ] Create `/app/api/analytics/patterns/heatmap/route.ts`
- [ ] Import `getHeatmapData()` query function
- [ ] Validate params
- [ ] Call query function
- [ ] Return heatmap data (day/hour grid)
- [ ] Add authentication
- [ ] Add error handling
- [ ] Test endpoint with sample data
- [ ] Commit: "feat(api): add viewing heatmap endpoint"

**Acceptance Criteria:**
- Returns heatmap data in correct format
- Day and hour grouping correct
- Watch time aggregated properly
- Authenticated

**Files Created:**
- `apps/web/src/app/api/analytics/patterns/heatmap/route.ts`

---

### TICKET-402: Create Viewing Heatmap Component
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 3 hours

**Description:**
Create component displaying viewing patterns as heatmap.

**Tasks:**
- [ ] Create `/components/analytics/viewing-heatmap.tsx`
- [ ] Fetch heatmap data from endpoint
- [ ] Use Heatmap component
- [ ] Add section title "Viewing Patterns"
- [ ] Add color scale legend
- [ ] Add loading state
- [ ] Style with Tailwind
- [ ] Test with various data
- [ ] Commit: "feat(analytics): add viewing heatmap component"

**Acceptance Criteria:**
- Heatmap displays 7×24 grid
- Colors reflect watch intensity
- Tooltip shows details on hover
- Legend explains color scale
- Responsive design

**Files Created:**
- `apps/web/src/components/analytics/viewing-heatmap.tsx`

---

### TICKET-403: Create Content Mix Chart Component
**Status:** TODO
**Priority:** P2 (Medium)
**Estimate:** 2 hours

**Description:**
Create component displaying content category distribution.

**Tasks:**
- [ ] Create `/components/analytics/content-mix-chart.tsx`
- [ ] Fetch category data from existing stats endpoint
- [ ] Use DonutChart component
- [ ] Display category percentages
- [ ] Add center label (e.g., "47 videos")
- [ ] Add legend below chart
- [ ] Add loading state
- [ ] Style with Tailwind
- [ ] Test component
- [ ] Commit: "feat(analytics): add content mix chart"

**Acceptance Criteria:**
- Donut chart displays categories
- Percentages sum to 100%
- Legend displays with colors
- Center label shows total
- Responsive design

**Files Created:**
- `apps/web/src/components/analytics/content-mix-chart.tsx`

---

### TICKET-404: Enhance Most Watched Videos Component
**Status:** TODO
**Priority:** P2 (Medium)
**Estimate:** 3 hours

**Description:**
Enhance most watched videos list with visualizations.

**Tasks:**
- [ ] Open `/components/analytics/most-watched-videos.tsx`
- [ ] Add mini bar charts for relative watch times
- [ ] Add completion rate progress bars
- [ ] Add trend indicators (↑ trending up)
- [ ] Make video items clickable (navigate to video detail)
- [ ] Add hover effects
- [ ] Improve styling (match design specs)
- [ ] Test with sample data
- [ ] Commit: "feat(analytics): enhance most watched videos"

**Acceptance Criteria:**
- Mini bar charts display
- Completion bars show percentages
- Trend indicators visible
- Click navigation works
- Hover effects work

**Files Modified:**
- `apps/web/src/components/analytics/most-watched-videos.tsx`

---

### TICKET-405: Create Watch Time Trends Chart
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 2 hours

**Description:**
Create dedicated component for watch time trend visualization.

**Tasks:**
- [ ] Create `/components/analytics/watch-time-chart.tsx`
- [ ] Fetch watch session data grouped by day/week
- [ ] Use LineChart component
- [ ] Add time range tabs (7d, 30d, 90d)
- [ ] Add area fill under line
- [ ] Add loading state
- [ ] Style with Tailwind
- [ ] Test rendering
- [ ] Commit: "feat(analytics): add watch time trends chart"

**Acceptance Criteria:**
- Line chart shows watch time over period
- Time range tabs work
- Area fill displays
- Responsive design
- Loading state works

**Files Created:**
- `apps/web/src/components/analytics/watch-time-chart.tsx`

---

### TICKET-406: Integrate Enhanced Watch Analytics
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 2 hours

**Description:**
Add new watch analytics components to dashboard.

**Tasks:**
- [ ] Open `/components/analytics/analytics-dashboard.tsx`
- [ ] Add WatchTimeChart component (after KPI cards)
- [ ] Create 2-column row for ContentMixChart and ViewingHeatmap
- [ ] Ensure enhanced MostWatchedVideos displays
- [ ] Verify layout and spacing
- [ ] Test all components render
- [ ] Commit: "feat(analytics): integrate enhanced watch analytics"

**Acceptance Criteria:**
- All new components visible on dashboard
- Layout matches design specs
- Proper spacing between sections
- Responsive design works

**Files Modified:**
- `apps/web/src/components/analytics/analytics-dashboard.tsx`

---

### Phase 4 Summary

**Total Tickets:** 6
**Estimated Time:** 14 hours (~2 days)

**Deliverables:**
- ✅ Heatmap API endpoint
- ✅ Viewing heatmap component
- ✅ Content mix chart component
- ✅ Enhanced most watched videos
- ✅ Watch time trends chart
- ✅ Integration into dashboard

**Ready for:** Phase 5 - Drill-Down Navigation

---

## Phase 5: Drill-Down Navigation (Week 4)

**Goal:** Implement 3-level drill-down (Family → Child → Video)

### TICKET-501: Create Child Overview API Endpoint
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 3 hours

**Description:**
Create API endpoint for child detail analytics overview.

**Tasks:**
- [ ] Create `/app/api/analytics/child/[childId]/overview/route.ts`
- [ ] Validate childId parameter
- [ ] Fetch child profile data
- [ ] Aggregate watch stats for specific child
- [ ] Get top topics for child
- [ ] Get favorite categories for child
- [ ] Get AI usage stats for child
- [ ] Return comprehensive overview
- [ ] Add authentication (verify child belongs to user's family)
- [ ] Add error handling
- [ ] Test endpoint
- [ ] Commit: "feat(api): add child analytics overview endpoint"

**Acceptance Criteria:**
- Returns child profile and all analytics
- Filtered to specific child
- Authentication checks family membership
- Response time < 500ms

**Files Created:**
- `apps/web/src/app/api/analytics/child/[childId]/overview/route.ts`

---

### TICKET-502: Create Child Timeline API Endpoint
**Status:** TODO
**Priority:** P2 (Medium)
**Estimate:** 2 hours

**Description:**
Create API endpoint for child activity timeline.

**Tasks:**
- [ ] Create `/app/api/analytics/child/[childId]/timeline/route.ts`
- [ ] Fetch all activity events for child (watch, favorite, request, AI chat)
- [ ] Sort by timestamp
- [ ] Format as timeline events
- [ ] Return event array
- [ ] Add authentication
- [ ] Add error handling
- [ ] Test endpoint
- [ ] Commit: "feat(api): add child timeline endpoint"

**Acceptance Criteria:**
- Returns chronological event list
- All event types included
- Metadata for each event included
- Authenticated

**Files Created:**
- `apps/web/src/app/api/analytics/child/[childId]/timeline/route.ts`

---

### TICKET-503: Create Video Performance API Endpoint
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 3 hours

**Description:**
Create API endpoint for video performance analytics.

**Tasks:**
- [ ] Create `/app/api/analytics/video/[videoId]/performance/route.ts`
- [ ] Validate videoId parameter
- [ ] Fetch video metadata
- [ ] Calculate view count, unique viewers
- [ ] Calculate total watch time, avg completion rate
- [ ] Get viewer demographics (children who watched)
- [ ] Get engagement metrics (favorites, AI convos, rewatches)
- [ ] Get performance trend (views over time)
- [ ] Return comprehensive video analytics
- [ ] Add authentication
- [ ] Add error handling
- [ ] Test endpoint
- [ ] Commit: "feat(api): add video performance endpoint"

**Acceptance Criteria:**
- Returns video metadata and all analytics
- Viewer demographics accurate
- Engagement metrics correct
- Performance trend included
- Authenticated

**Files Created:**
- `apps/web/src/app/api/analytics/video/[videoId]/performance/route.ts`

---

### TICKET-504: Create Child Header Component
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 2 hours

**Description:**
Create child detail page header component.

**Tasks:**
- [ ] Create `/components/analytics/child-detail/child-header.tsx`
- [ ] Display child avatar (large, 80px)
- [ ] Display child name (H1)
- [ ] Display child age and age rating
- [ ] Add "Back to Family" button
- [ ] Add 4 mini KPI cards (watch time, videos, AI chats, favorites)
- [ ] Style with Tailwind (match design specs)
- [ ] Test rendering
- [ ] Commit: "feat(analytics): add child header component"

**Acceptance Criteria:**
- Avatar displays correctly
- Name and age info display
- Back button works
- Mini KPI cards display
- Responsive design

**Files Created:**
- `apps/web/src/components/analytics/child-detail/child-header.tsx`

---

### TICKET-505: Create Watch Timeline Component
**Status:** TODO
**Priority:** P2 (Medium)
**Estimate:** 3 hours

**Description:**
Create horizontal timeline showing child's watch history.

**Tasks:**
- [ ] Create `/components/analytics/child-detail/watch-timeline.tsx`
- [ ] Fetch timeline data from endpoint
- [ ] Render horizontal timeline with event markers
- [ ] Add video thumbnail and title below each marker
- [ ] Add hover tooltip with full details
- [ ] Make events clickable (navigate to video detail)
- [ ] Style with Tailwind
- [ ] Test with various data
- [ ] Commit: "feat(analytics): add watch timeline component"

**Acceptance Criteria:**
- Timeline displays chronologically
- Event markers positioned correctly
- Thumbnails and titles display
- Hover tooltip works
- Click navigation works

**Files Created:**
- `apps/web/src/components/analytics/child-detail/watch-timeline.tsx`

---

### TICKET-506: Create Topic Interests Component
**Status:** TODO
**Priority:** P2 (Medium)
**Estimate:** 2 hours

**Description:**
Create component displaying child's topic preferences.

**Tasks:**
- [ ] Create `/components/analytics/child-detail/topic-interests.tsx`
- [ ] Fetch child-specific topics from API
- [ ] Use BarChart component (horizontal)
- [ ] Display top 10 topics
- [ ] Add "View All Topics" link
- [ ] Style with Tailwind
- [ ] Test rendering
- [ ] Commit: "feat(analytics): add topic interests component"

**Acceptance Criteria:**
- Horizontal bar chart displays
- Topics ranked by frequency
- View all link works
- Responsive design

**Files Created:**
- `apps/web/src/components/analytics/child-detail/topic-interests.tsx`

---

### TICKET-507: Create Child Detail Page
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 3 hours

**Description:**
Create child detail analytics page.

**Tasks:**
- [ ] Create `/app/admin/analytics/child/[childId]/page.tsx`
- [ ] Implement breadcrumb navigation
- [ ] Import and render ChildHeader
- [ ] Import and render WatchTimeline
- [ ] Create 2-column layout for TopicInterests and ContentMix
- [ ] Add AI conversation patterns section
- [ ] Fetch data from child overview endpoint
- [ ] Pass data to child components
- [ ] Add loading states
- [ ] Add error handling
- [ ] Style page layout
- [ ] Test navigation and rendering
- [ ] Commit: "feat(analytics): add child detail page"

**Acceptance Criteria:**
- Page accessible at `/admin/analytics/child/[childId]`
- Breadcrumb shows "Family > Child Name"
- All sections render correctly
- Data filtered to specific child
- Responsive design

**Files Created:**
- `apps/web/src/app/admin/analytics/child/[childId]/page.tsx`

---

### TICKET-508: Create Video Header Component
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 2 hours

**Description:**
Create video performance page header component.

**Tasks:**
- [ ] Create `/components/analytics/video-detail/video-header.tsx`
- [ ] Display video thumbnail (large, 320×180)
- [ ] Display video title (H1)
- [ ] Display video metadata (duration, category, age rating)
- [ ] Add "Back to Analytics" button
- [ ] Add 4 mini KPI cards (views, unique viewers, watch time, completion)
- [ ] Style with Tailwind
- [ ] Test rendering
- [ ] Commit: "feat(analytics): add video header component"

**Acceptance Criteria:**
- Thumbnail displays correctly
- Title and metadata display
- Back button works
- Mini KPI cards display
- Responsive design

**Files Created:**
- `apps/web/src/components/analytics/video-detail/video-header.tsx`

---

### TICKET-509: Create Viewer Demographics Component
**Status:** TODO
**Priority:** P2 (Medium)
**Estimate:** 2 hours

**Description:**
Create component showing which children watched the video.

**Tasks:**
- [ ] Create `/components/analytics/video-detail/viewer-demographics.tsx`
- [ ] Display list of children who watched
- [ ] Show avatar, name, age for each child
- [ ] Show view count, watch time, completion % per child
- [ ] Add completion progress bar for each
- [ ] Make child names clickable (navigate to child detail)
- [ ] Style with Tailwind
- [ ] Test component
- [ ] Commit: "feat(analytics): add viewer demographics component"

**Acceptance Criteria:**
- List displays all viewers
- Stats accurate for each child
- Progress bars display
- Click navigation works
- Responsive design

**Files Created:**
- `apps/web/src/components/analytics/video-detail/viewer-demographics.tsx`

---

### TICKET-510: Create Engagement Metrics Component
**Status:** TODO
**Priority:** P2 (Medium)
**Estimate:** 2 hours

**Description:**
Create component displaying video engagement metrics.

**Tasks:**
- [ ] Create `/components/analytics/video-detail/engagement-metrics.tsx`
- [ ] Display 4 metric cards (favorites, AI convos, rewatch rate, journal entries)
- [ ] Show counts and supporting details
- [ ] Add icons to each metric
- [ ] Style with Tailwind (match design specs)
- [ ] Test rendering
- [ ] Commit: "feat(analytics): add engagement metrics component"

**Acceptance Criteria:**
- 4-column grid layout
- All metrics display correctly
- Icons display
- Responsive design

**Files Created:**
- `apps/web/src/components/analytics/video-detail/engagement-metrics.tsx`

---

### TICKET-511: Create Video Performance Page
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 3 hours

**Description:**
Create video performance analytics page.

**Tasks:**
- [ ] Create `/app/admin/analytics/video/[videoId]/page.tsx`
- [ ] Implement breadcrumb navigation
- [ ] Import and render VideoHeader
- [ ] Import and render ViewerDemographics
- [ ] Import and render EngagementMetrics
- [ ] Add performance trend chart (views over time)
- [ ] Fetch data from video performance endpoint
- [ ] Pass data to child components
- [ ] Add loading states
- [ ] Add error handling
- [ ] Style page layout
- [ ] Test navigation and rendering
- [ ] Commit: "feat(analytics): add video performance page"

**Acceptance Criteria:**
- Page accessible at `/admin/analytics/video/[videoId]`
- Breadcrumb shows navigation path
- All sections render correctly
- Data accurate for specific video
- Responsive design

**Files Created:**
- `apps/web/src/app/admin/analytics/video/[videoId]/page.tsx`

---

### TICKET-512: Add Navigation from Dashboard
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 2 hours

**Description:**
Make dashboard elements clickable to navigate to detail pages.

**Tasks:**
- [ ] Open `/components/analytics/analytics-dashboard.tsx`
- [ ] Add profile selector dropdown (children list + "All Children")
- [ ] Make profile selector change trigger navigation to child detail
- [ ] Open `/components/analytics/most-watched-videos.tsx`
- [ ] Make video items clickable (navigate to video detail page)
- [ ] Test navigation from dashboard
- [ ] Verify breadcrumbs update correctly
- [ ] Commit: "feat(analytics): add drill-down navigation"

**Acceptance Criteria:**
- Profile selector navigates to child detail
- Video items navigate to video detail
- Breadcrumbs update correctly
- Back buttons work

**Files Modified:**
- `apps/web/src/components/analytics/analytics-dashboard.tsx`
- `apps/web/src/components/analytics/most-watched-videos.tsx`

---

### Phase 5 Summary

**Total Tickets:** 12
**Estimated Time:** 29 hours (~4 days)

**Deliverables:**
- ✅ 3 drill-down API endpoints
- ✅ Child detail page with 3 components
- ✅ Video performance page with 3 components
- ✅ Navigation from dashboard
- ✅ Breadcrumb navigation

**Ready for:** Phase 6 - Comparison Mode

---

## Phase 6: Comparison Mode (Week 4-5)

**Goal:** Enable period and child comparisons with side-by-side views

### TICKET-601: Create Period Comparison API Endpoint
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 3 hours

**Description:**
Create API endpoint for comparing two time periods.

**Tasks:**
- [ ] Create `/app/api/analytics/compare/periods/route.ts`
- [ ] Create query function in `comparison-analytics.ts`
- [ ] Validate params (4 dates: period1Start, period1End, period2Start, period2End)
- [ ] Fetch analytics for both periods
- [ ] Calculate differences (absolute and percentage)
- [ ] Return comparison data
- [ ] Add authentication
- [ ] Add error handling
- [ ] Test endpoint
- [ ] Commit: "feat(api): add period comparison endpoint"

**Acceptance Criteria:**
- Returns analytics for both periods
- Differences calculated correctly
- Percentage changes included
- Authenticated

**Files Created:**
- `apps/web/src/app/api/analytics/compare/periods/route.ts`
- `apps/web/src/lib/db/queries/comparison-analytics.ts` (add function)

---

### TICKET-602: Create Child Comparison API Endpoint
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 2 hours

**Description:**
Create API endpoint for comparing multiple children.

**Tasks:**
- [ ] Create `/app/api/analytics/compare/children/route.ts`
- [ ] Create query function in `comparison-analytics.ts`
- [ ] Validate params (childIds array, date range)
- [ ] Fetch analytics for each child
- [ ] Return array of child stats
- [ ] Add authentication
- [ ] Add error handling
- [ ] Test with 2-4 children
- [ ] Commit: "feat(api): add child comparison endpoint"

**Acceptance Criteria:**
- Returns analytics for all specified children
- Data structure consistent for each child
- Support 2-4 children
- Authenticated

**Files Created:**
- `apps/web/src/app/api/analytics/compare/children/route.ts`
- Update `apps/web/src/lib/db/queries/comparison-analytics.ts`

---

### TICKET-603: Create Comparison Chart Component
**Status:** TODO
**Priority:** P2 (Medium)
**Estimate:** 3 hours

**Description:**
Create wrapper component for side-by-side chart comparison.

**Tasks:**
- [ ] Create `/components/charts/comparison-chart.tsx`
- [ ] Accept leftData and rightData props
- [ ] Render two charts side-by-side
- [ ] Support different chart types (line, bar, donut)
- [ ] Synchronize axes for fair comparison
- [ ] Add difference indicators between charts
- [ ] Style with Tailwind
- [ ] Test with various chart types
- [ ] Commit: "feat(charts): add comparison chart component"

**Acceptance Criteria:**
- Two charts display side-by-side
- Axes synchronized
- Difference indicators show
- Supports multiple chart types
- Responsive design

**Files Created:**
- `apps/web/src/components/charts/comparison-chart.tsx`

---

### TICKET-604: Update Enhanced KPI Cards for Comparison
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 2 hours

**Description:**
Add comparison mode support to enhanced KPI cards.

**Tasks:**
- [ ] Open `/components/analytics/kpi-card-enhanced.tsx`
- [ ] Add comparisonValue prop (optional)
- [ ] When provided, display both values side-by-side
- [ ] Calculate and show difference
- [ ] Color-code change indicator
- [ ] Adjust layout for comparison mode
- [ ] Test with comparison data
- [ ] Commit: "feat(analytics): add comparison mode to KPI cards"

**Acceptance Criteria:**
- Comparison mode displays two values
- Difference calculated and displayed
- Color coding works
- Layout adjusts for comparison

**Files Modified:**
- `apps/web/src/components/analytics/kpi-card-enhanced.tsx`

---

### TICKET-605: Create Comparison Mode Toggle Component
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 2 hours

**Description:**
Create UI component to enable/disable comparison mode.

**Tasks:**
- [ ] Create `/components/analytics/comparison-mode-toggle.tsx`
- [ ] Add toggle button in dashboard header
- [ ] Add period selector UI (when period comparison active)
- [ ] Add child selector UI (when child comparison active)
- [ ] Manage comparison state (context or prop drilling)
- [ ] Style with Tailwind
- [ ] Test toggle behavior
- [ ] Commit: "feat(analytics): add comparison mode toggle"

**Acceptance Criteria:**
- Toggle button enables/disables comparison
- Period/child selectors appear when active
- State managed correctly
- UI matches design specs

**Files Created:**
- `apps/web/src/components/analytics/comparison-mode-toggle.tsx`

---

### TICKET-606: Create Comparison Insights Component
**Status:** TODO
**Priority:** P2 (Medium)
**Estimate:** 2 hours

**Description:**
Create component auto-generating insights from comparison data.

**Tasks:**
- [ ] Create `/components/analytics/comparison-insights.tsx`
- [ ] Accept comparison data as prop
- [ ] Calculate top 3 changes
- [ ] Generate human-readable insight text
- [ ] Display as bulleted list
- [ ] Add icons (up/down arrows)
- [ ] Style with Tailwind
- [ ] Test with various comparison scenarios
- [ ] Commit: "feat(analytics): add comparison insights"

**Acceptance Criteria:**
- Top 3 changes identified
- Insights text is clear and accurate
- Icons display correctly
- Responsive design

**Files Created:**
- `apps/web/src/components/analytics/comparison-insights.tsx`

---

### TICKET-607: Integrate Comparison Mode into Dashboard
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 4 hours

**Description:**
Add comparison mode functionality to analytics dashboard.

**Tasks:**
- [ ] Open `/components/analytics/analytics-dashboard.tsx`
- [ ] Add comparison state management
- [ ] Import and add ComparisonModeToggle to header
- [ ] Fetch comparison data when mode active
- [ ] Update all KPI cards with comparison values
- [ ] Update charts to show comparison (or use ComparisonChart)
- [ ] Add ComparisonInsights component
- [ ] Test period comparison
- [ ] Test child comparison
- [ ] Test toggling off returns to normal view
- [ ] Commit: "feat(analytics): integrate comparison mode"

**Acceptance Criteria:**
- Comparison mode activates from toggle
- All metrics update to show comparison
- Charts display comparison data
- Insights generate automatically
- Toggle off restores normal view
- Both period and child comparison work

**Files Modified:**
- `apps/web/src/components/analytics/analytics-dashboard.tsx`

---

### Phase 6 Summary

**Total Tickets:** 7
**Estimated Time:** 18 hours (~3 days)

**Deliverables:**
- ✅ 2 comparison API endpoints
- ✅ Comparison chart component
- ✅ Enhanced KPI cards with comparison
- ✅ Comparison mode toggle
- ✅ Comparison insights component
- ✅ Full integration into dashboard

**Ready for:** Phase 7 - Polish & Advanced Features

---

## Phase 7: Polish & Advanced Features (Week 5)

**Goal:** Add final touches, optimization, and advanced features

### TICKET-701: Implement Loading Skeletons
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 3 hours

**Description:**
Add skeleton loaders for all components during data fetching.

**Tasks:**
- [ ] Create `/components/ui/skeleton.tsx` (reusable skeleton component)
- [ ] Add skeleton loaders to KPI cards
- [ ] Add skeleton loaders to charts
- [ ] Add skeleton loaders to tables/lists
- [ ] Ensure skeletons match component dimensions
- [ ] Animate skeletons (pulse effect)
- [ ] Test loading states
- [ ] Commit: "feat(ui): add loading skeletons"

**Acceptance Criteria:**
- Skeletons display during initial load
- Dimensions match actual components
- Smooth transition from skeleton to content
- No layout shift

**Files Created:**
- `apps/web/src/components/ui/skeleton.tsx`

**Files Modified:**
- All analytics components (add loading states)

---

### TICKET-702: Create Empty State Components
**Status:** TODO
**Priority:** P2 (Medium)
**Estimate:** 2 hours

**Description:**
Create empty state components for when no data exists.

**Tasks:**
- [ ] Create `/components/analytics/empty-states.tsx`
- [ ] Design empty state for no watch sessions
- [ ] Design empty state for no AI conversations
- [ ] Design empty state for no favorites
- [ ] Design empty state for no requests
- [ ] Add helpful messages and icons
- [ ] Add call-to-action buttons/links (optional)
- [ ] Style with Tailwind
- [ ] Test display
- [ ] Commit: "feat(analytics): add empty states"

**Acceptance Criteria:**
- Empty states display when no data
- Messages are helpful and clear
- Icons are appropriate
- CTAs work (if provided)

**Files Created:**
- `apps/web/src/components/analytics/empty-states.tsx`

---

### TICKET-703: Add Responsive Design Refinements
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 4 hours

**Description:**
Ensure all analytics components work well on mobile and tablet.

**Tasks:**
- [ ] Test dashboard on mobile (< 640px)
- [ ] Test dashboard on tablet (640px - 1024px)
- [ ] Adjust grid layouts for smaller screens
- [ ] Make charts scrollable/smaller on mobile
- [ ] Ensure heatmap works on mobile (horizontal scroll or smaller cells)
- [ ] Test date picker on mobile (full-screen modal)
- [ ] Fix any layout issues
- [ ] Test touch interactions
- [ ] Commit: "feat(analytics): add responsive design refinements"

**Acceptance Criteria:**
- All components usable on mobile
- Layouts adapt to screen size
- No horizontal overflow
- Touch interactions work
- Charts remain readable

**Files Modified:**
- All analytics components (add responsive classes)

---

### TICKET-704: Optimize Database Queries
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 3 hours

**Description:**
Review and optimize all analytics queries for performance.

**Tasks:**
- [ ] Run EXPLAIN ANALYZE on all analytics queries
- [ ] Identify slow queries (> 300ms)
- [ ] Add additional indexes if needed
- [ ] Optimize JOIN operations
- [ ] Reduce unnecessary data fetching (select only needed fields)
- [ ] Test query performance improvements
- [ ] Document query optimization decisions
- [ ] Commit: "perf(db): optimize analytics queries"

**Acceptance Criteria:**
- All queries execute in < 300ms
- Indexes used effectively (verify with EXPLAIN)
- No N+1 query issues
- Data fetching minimized

**Files Modified:**
- `/lib/db/queries/*.ts` (all query files)

---

### TICKET-705: Add Client-Side Caching with React Query
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 4 hours

**Description:**
Implement React Query for client-side caching and data fetching.

**Tasks:**
- [ ] Install `@tanstack/react-query`
- [ ] Set up QueryClientProvider in app layout
- [ ] Create custom hooks for analytics data fetching
- [ ] Add cache time configuration (5 min for family, 2 min for child)
- [ ] Add staleTime configuration
- [ ] Replace fetch calls with React Query hooks
- [ ] Test caching behavior
- [ ] Test refetch on date range change
- [ ] Commit: "feat(analytics): add React Query caching"

**Acceptance Criteria:**
- React Query installed and configured
- All data fetching uses React Query
- Caching reduces redundant API calls
- Stale data refetches appropriately
- Loading and error states work

**Files Modified:**
- `apps/web/src/app/layout.tsx` (add QueryClientProvider)
- All analytics components (use React Query hooks)

---

### TICKET-706: Add Accessibility Improvements
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 3 hours

**Description:**
Ensure analytics dashboard meets WCAG AA accessibility standards.

**Tasks:**
- [ ] Add ARIA labels to all interactive elements
- [ ] Add ARIA roles (button, link, navigation, main, article)
- [ ] Add chart descriptions (aria-label with summary)
- [ ] Add focus indicators (2px blue outline)
- [ ] Test keyboard navigation (Tab, Enter, Esc)
- [ ] Test with screen reader (VoiceOver or NVDA)
- [ ] Verify color contrast meets AA standards (4.5:1)
- [ ] Add skip links ("Skip to content")
- [ ] Commit: "a11y(analytics): improve accessibility"

**Acceptance Criteria:**
- WCAG AA compliance achieved
- Keyboard navigation works throughout
- Screen reader announces elements correctly
- Focus indicators visible
- Color contrast passes

**Files Modified:**
- All analytics components (add ARIA attributes, focus styles)

---

### TICKET-707: Add Error Boundaries
**Status:** TODO
**Priority:** P2 (Medium)
**Estimate:** 2 hours

**Description:**
Add error boundaries to prevent crashes and show graceful errors.

**Tasks:**
- [ ] Create `/components/error-boundary.tsx`
- [ ] Wrap analytics dashboard in error boundary
- [ ] Wrap each major section in error boundary
- [ ] Design error fallback UI
- [ ] Add retry button
- [ ] Log errors to console or monitoring service
- [ ] Test error scenarios
- [ ] Commit: "feat(analytics): add error boundaries"

**Acceptance Criteria:**
- Error boundaries catch component errors
- Fallback UI displays on error
- Retry button works
- Errors logged
- Partial failures don't crash entire dashboard

**Files Created:**
- `apps/web/src/components/error-boundary.tsx`

**Files Modified:**
- Analytics components (wrap in error boundaries)

---

### TICKET-708: Add Semantic Cluster Visualization (Optional)
**Status:** TODO
**Priority:** P3 (Low - Stretch Goal)
**Estimate:** 6 hours

**Description:**
Implement advanced semantic clustering visualization using OpenAI embeddings.

**Tasks:**
- [ ] Create `/lib/analytics/embeddings.ts`
- [ ] Implement function to generate embeddings for topics using OpenAI API
- [ ] Implement clustering algorithm (k-means or DBSCAN)
- [ ] Create `/components/charts/semantic-cluster-viz.tsx`
- [ ] Use react-force-graph-2d for visualization
- [ ] Implement force-directed layout
- [ ] Add node sizing (frequency)
- [ ] Add node coloring (clusters)
- [ ] Add interactive features (zoom, pan, click)
- [ ] Test with topic data
- [ ] Commit: "feat(analytics): add semantic cluster visualization"

**Acceptance Criteria:**
- Embeddings generated for topics
- Topics clustered meaningfully
- Force-directed graph displays
- Interactive features work
- Performance acceptable

**Files Created:**
- `apps/web/src/lib/analytics/embeddings.ts`
- `apps/web/src/components/charts/semantic-cluster-viz.tsx`

**Note:** This is a stretch goal and can be deferred if time is limited.

---

### TICKET-709: Add Export Functionality (Optional)
**Status:** TODO
**Priority:** P3 (Low - Stretch Goal)
**Estimate:** 4 hours

**Description:**
Add ability to export analytics data as CSV or PDF.

**Tasks:**
- [ ] Add "Export" button to dashboard header
- [ ] Implement CSV export for tabular data
- [ ] Implement PDF export for full dashboard (use jsPDF or similar)
- [ ] Add export options modal (format, date range)
- [ ] Test exports with various data
- [ ] Commit: "feat(analytics): add export functionality"

**Acceptance Criteria:**
- Export button opens options modal
- CSV export works for tables
- PDF export captures dashboard (optional)
- Exported data is accurate

**Files Modified:**
- Dashboard and related components

**Note:** This is a stretch goal and can be deferred.

---

### TICKET-710: Perform End-to-End Testing
**Status:** TODO
**Priority:** P1 (High)
**Estimate:** 4 hours

**Description:**
Test all analytics features end-to-end to ensure quality.

**Tasks:**
- [ ] Test family dashboard loads correctly
- [ ] Test date range picker changes update all charts
- [ ] Test profile selector filters to specific child
- [ ] Test drill-down navigation (family → child → video)
- [ ] Test breadcrumb navigation
- [ ] Test comparison mode (period and child)
- [ ] Test all API endpoints return correct data
- [ ] Test responsive design on mobile/tablet
- [ ] Test with large datasets (performance)
- [ ] Test error scenarios (API failures, empty data)
- [ ] Document any bugs found
- [ ] Fix critical bugs
- [ ] Commit: "test(analytics): perform end-to-end testing and fixes"

**Acceptance Criteria:**
- All major features tested
- Critical bugs fixed
- Performance acceptable
- Responsive design works
- Error handling works

**Files Modified:**
- Various (bug fixes)

---

### Phase 7 Summary

**Total Tickets:** 10 (8 required, 2 optional)
**Estimated Time:** 31 hours (~4 days) for required, +10 hours for optional

**Deliverables:**
- ✅ Loading skeletons for all components
- ✅ Empty state components
- ✅ Responsive design refinements
- ✅ Query optimization
- ✅ React Query caching
- ✅ Accessibility improvements
- ✅ Error boundaries
- ⭕ Semantic clustering (optional)
- ⭕ Export functionality (optional)
- ✅ End-to-end testing and bug fixes

**Ready for:** Production deployment

---

## Testing Checklist

### Unit Testing
- [ ] All chart components render correctly with sample data
- [ ] Query functions return expected data structures
- [ ] API endpoints return correct response formats
- [ ] Date range filtering works correctly
- [ ] Child filtering works correctly

### Integration Testing
- [ ] Dashboard loads and displays all sections
- [ ] Date range changes update all components
- [ ] Profile selector filters analytics correctly
- [ ] Drill-down navigation works (family → child → video)
- [ ] Comparison mode activates and displays correctly

### Performance Testing
- [ ] Dashboard loads in < 2 seconds (p95)
- [ ] API endpoints respond in < 500ms (p95)
- [ ] Large datasets don't cause UI jank
- [ ] Charts render smoothly at 60fps
- [ ] Database queries execute in < 300ms

### Accessibility Testing
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces elements correctly
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators visible on all interactive elements
- [ ] ARIA labels present and accurate

### Responsive Testing
- [ ] Dashboard works on mobile (< 640px)
- [ ] Dashboard works on tablet (640px - 1024px)
- [ ] Dashboard works on desktop (> 1024px)
- [ ] Charts scale appropriately
- [ ] No horizontal overflow

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Deployment Checklist

### Pre-Deployment
- [ ] All Phase 1-6 tickets completed (Phase 7 optional features can follow)
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Code reviewed and approved
- [ ] Database migrations ready
- [ ] Environment variables configured

### Deployment Steps
1. [ ] Run database migrations in production
2. [ ] Deploy backend changes (API routes, query functions)
3. [ ] Deploy frontend changes (components, pages)
4. [ ] Verify deployment successful
5. [ ] Smoke test critical features
6. [ ] Monitor error logs
7. [ ] Monitor performance metrics

### Post-Deployment
- [ ] User documentation published
- [ ] Announcement to users (if applicable)
- [ ] Monitor analytics dashboard usage
- [ ] Collect user feedback
- [ ] Plan Phase 7 optional features (if deferred)

---

## Risk Mitigation

### High-Risk Areas
1. **Performance with Large Datasets**
   - Mitigation: Database indexes, pagination, caching
   - Contingency: Add daily aggregation table if needed

2. **Chart Rendering Performance**
   - Mitigation: Limit data points, use Recharts optimizations
   - Contingency: Reduce chart complexity or add loading thresholds

3. **Complex Comparison Logic**
   - Mitigation: Thorough testing, clear data structures
   - Contingency: Simplify comparison features if bugs persist

### Medium-Risk Areas
1. **Responsive Design Challenges**
   - Mitigation: Test early and often on multiple devices
   - Contingency: Prioritize desktop, iterate on mobile

2. **Topic Extraction Accuracy**
   - Mitigation: Start simple, validate manually
   - Contingency: Defer advanced semantic clustering

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-11 | 1.0 | Initial implementation checklist created |

---

**Prepared By:** Claude Code Assistant
**Status:** Ready for Implementation
**Next Step:** Begin Phase 1 - Foundation & Infrastructure
