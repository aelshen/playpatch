# SafeStream Kids Analytics Dashboard - Design Specifications

**Design Document**
**Version:** 1.0
**Date:** January 11, 2026
**Status:** Approved

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Design System](#design-system)
3. [Page Layouts](#page-layouts)
4. [Component Specifications](#component-specifications)
5. [Interaction Patterns](#interaction-patterns)
6. [Responsive Behavior](#responsive-behavior)
7. [Accessibility](#accessibility)

---

## Design Philosophy

### Core Principles

**1. Insight Over Data**
- Present insights and trends, not just raw numbers
- Use visualizations to make patterns obvious
- Highlight what's important, hide unnecessary details

**2. Progressive Disclosure**
- Start with high-level overview
- Allow users to drill down for details
- Don't overwhelm with information

**3. Consistency & Familiarity**
- Use consistent chart types for similar data
- Follow existing SafeStream design patterns
- Match existing navigation and layout

**4. Actionable & Clear**
- Every metric should be understandable
- Provide context with comparisons and trends
- Guide users toward meaningful actions

**5. Trust & Transparency**
- AI analytics provide confidence in safety
- Clear explanations for all metrics
- No hidden or confusing calculations

---

## Design System

### Color Palette

#### Primary Colors (Existing SafeStream Brand)
```
- Primary Blue: #3B82F6
- Primary Dark: #1E40AF
- Background: #F9FAFB
- Surface: #FFFFFF
- Text Primary: #111827
- Text Secondary: #6B7280
```

#### Chart Color Palette (Colorblind-Friendly)
```
- Chart Blue: #3B82F6 (watch time, primary metrics)
- Chart Green: #10B981 (positive changes, growth)
- Chart Yellow: #F59E0B (warnings, moderate values)
- Chart Red: #EF4444 (alerts, negative changes)
- Chart Purple: #8B5CF6 (AI topics, special metrics)
- Chart Orange: #F97316 (secondary highlights)
- Chart Teal: #14B8A6 (interaction metrics)
- Chart Pink: #EC4899 (favorites, likes)
```

#### Semantic Colors
```
- Success: #10B981
- Warning: #F59E0B
- Error: #EF4444
- Info: #3B82F6
- Neutral: #6B7280
```

### Typography

#### Font Family
```
- Sans-serif: Inter, system-ui, sans-serif (existing app font)
- Monospace: 'Courier New', monospace (for metrics)
```

#### Font Sizes & Weights
```
- Display: 3rem (48px), Bold
- H1: 2.25rem (36px), Bold
- H2: 1.875rem (30px), Semibold
- H3: 1.5rem (24px), Semibold
- H4: 1.25rem (20px), Medium
- Body: 1rem (16px), Regular
- Small: 0.875rem (14px), Regular
- Tiny: 0.75rem (12px), Regular
- Metrics: 2rem (32px), Bold, Tabular
```

### Spacing Scale
```
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)
- 3xl: 4rem (64px)
```

### Border Radius
```
- sm: 0.375rem (6px) - small cards, buttons
- md: 0.5rem (8px) - cards, modals
- lg: 0.75rem (12px) - large containers
- full: 9999px - pills, badges
```

### Shadows
```
- sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
- md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
- lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
- xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)
```

---

## Page Layouts

### 1. Family Dashboard (Main Analytics Page)

**Route:** `/admin/analytics`

#### Header Section
```
┌─────────────────────────────────────────────────────────────────┐
│  SafeStream Analytics                    [Date Range Selector] │
│  [Family Overview ▼] [All Children]     [Compare Mode] [Export]│
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Height: 80px
- Background: White surface (#FFFFFF)
- Border-bottom: 1px solid #E5E7EB
- Padding: 1rem 2rem
- Sticky position on scroll

**Elements:**
1. **Title** - "SafeStream Analytics"
   - Font: H2 (1.875rem), Semibold
   - Color: Text Primary (#111827)

2. **Breadcrumb/Profile Selector**
   - Dropdown showing current view ("Family Overview", "Eddie", etc.)
   - Icon: User or Family icon
   - Font: Body (1rem), Medium
   - Background: Light gray on hover

3. **Date Range Selector**
   - Button showing current range (e.g., "Last 30 Days")
   - Click opens calendar popup
   - Icon: Calendar icon
   - Font: Small (0.875rem)

4. **Compare Mode Toggle**
   - Button with "Compare" text
   - Icon: Split screen icon
   - Active state: Blue background
   - Inactive state: Gray background

5. **Export Button** (Optional)
   - Icon button with download icon
   - Tooltip: "Export analytics"

#### KPI Cards Section
```
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────┐│
│  │Watch Time   │  │Videos       │  │AI Convos    │  │Complet.││
│  │24h 32m  +12%│  │47  +8%      │  │18  +25%     │  │87% +3% ││
│  │─────────────│  │─────────────│  │─────────────│  │────────││
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────┘│
│  ┌─────────────┐  ┌─────────────┐                              │
│  │Favorites    │  │Requests     │                              │
│  │12  +4%      │  │5 pending    │                              │
│  │─────────────│  │─────────────│                              │
│  └─────────────┘  └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Grid: 4 columns on desktop, 2 on tablet, 1 on mobile
- Gap: 1.5rem (24px)
- Card dimensions: Flexible width, 140px min-height
- Margin-top: 2rem

**KPI Card Design:**
- Background: White (#FFFFFF)
- Border: 1px solid #E5E7EB
- Border-radius: 0.5rem (8px)
- Padding: 1.5rem
- Shadow: sm
- Hover: shadow-md transition

**Card Content:**
1. **Icon** (top-left)
   - Size: 2rem (32px)
   - Color: Chart Blue (#3B82F6)
   - Background: Light blue circle

2. **Label** (below icon)
   - Font: Small (0.875rem), Medium
   - Color: Text Secondary (#6B7280)
   - Margin-top: 0.5rem

3. **Value** (large number)
   - Font: Metrics (2rem), Bold, Tabular
   - Color: Text Primary (#111827)
   - Margin-top: 0.25rem

4. **Change Indicator** (inline with value)
   - Font: Small (0.875rem), Medium
   - Color: Green (#10B981) for positive, Red (#EF4444) for negative
   - Icon: Up/down arrow
   - Format: "+12%" or "-8%"

5. **Sparkline** (optional, bottom)
   - Mini line chart showing trend
   - Height: 40px
   - Color: Chart Blue (muted)
   - No axes or labels

#### Watch Time Trends Chart
```
┌─────────────────────────────────────────────────────────────────┐
│  Watch Time Trend                               [7d][30d][90d]  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                  ╱           │ │
│  │  4h                                           ╱              │ │
│  │                                             ╱                │ │
│  │  3h                           ╱╲        ╱╲╱                 │ │
│  │                            ╱╲╱  ╲  ╱╲╱                      │ │
│  │  2h              ╱╲    ╱╲╱      ╲╱                          │ │
│  │             ╱╲╱╲╱  ╲╱╱                                      │ │
│  │  1h      ╱╲╱                                                │ │
│  │        ╱                                                    │ │
│  │  0h  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │      Mon  Tue  Wed  Thu  Fri  Sat  Sun                     │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Width: Full container width
- Height: 320px
- Margin-top: 3rem (48px)
- Background: White card
- Padding: 1.5rem

**Chart Elements:**
1. **Title** - "Watch Time Trend"
   - Font: H3 (1.5rem), Semibold
   - Color: Text Primary
   - Position: Top-left of card

2. **Time Range Tabs** - "[7d][30d][90d]"
   - Position: Top-right of card
   - Font: Small (0.875rem)
   - Active: Blue background
   - Inactive: Gray background

3. **Line Chart**
   - Line color: Chart Blue (#3B82F6)
   - Line width: 2px
   - Area under line: Light blue gradient (10% opacity at top, 0% at bottom)
   - Points: 6px circles, visible on hover
   - Grid: Horizontal lines (light gray, dashed)
   - X-axis: Days of week or dates
   - Y-axis: Hours (0h, 1h, 2h, 3h, 4h)

4. **Tooltip** (on hover)
   - Background: Dark gray (#374151)
   - Color: White
   - Font: Small (0.875rem)
   - Border-radius: sm
   - Shadow: md
   - Content: "Monday, Jan 6: 2h 45m"

5. **Legend** (if multiple lines)
   - Position: Below chart
   - Font: Small (0.875rem)
   - Clickable to show/hide lines

#### Content Category Mix & Viewing Heatmap Row
```
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────┬─────────────────────────┐ │
│  │ Content Category Mix            │ Viewing Patterns        │ │
│  │                                 │                         │ │
│  │       Educational 45%           │  Hour  M  T  W  T  F  S │ │
│  │          ╱────╲                 │  6am  ░  ░  ░  ░  ░  ░ │ │
│  │        ╱        ╲               │  12pm █  ░  █  ░  █  ░ │ │
│  │      ╱     O      ╲             │  6pm  ██ ██ ██ ██ ██ █ │ │
│  │      ╲            ╱             │  12am ░  ░  ░  ░  ░  ░ │ │
│  │        ╲        ╱               │                         │ │
│  │          ╲────╱                 │  ░ Low  █ Medium  ██ High │
│  │  Entertainment 35%              │                         │ │
│  │  Documentary 20%                │                         │ │
│  └─────────────────────────────────┴─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Grid: 2 columns (1:1 ratio)
- Gap: 1.5rem (24px)
- Each card height: 360px
- Margin-top: 2rem

**Donut Chart (Content Mix):**
1. **Donut Chart**
   - Outer radius: 100px
   - Inner radius: 60px (40% hole)
   - Segment colors: Different chart colors per category
   - Segment labels: Percentage inside or outside ring

2. **Center Label** (inside donut)
   - Text: "47 videos"
   - Font: H4 (1.25rem), Semibold
   - Color: Text Primary

3. **Legend** (below chart)
   - List of categories with color swatches
   - Font: Small (0.875rem)
   - Format: "● Educational 45% (21 videos)"

**Heatmap (Viewing Patterns):**
1. **Grid**
   - Rows: 24 hours (grouped: 6am, 9am, 12pm, etc.)
   - Columns: 7 days (Mon-Sun)
   - Cell size: 40px × 40px
   - Gap: 2px

2. **Color Scale**
   - Low: #E0F2FE (light blue)
   - Medium: #3B82F6 (chart blue)
   - High: #1E40AF (dark blue)

3. **Labels**
   - Row labels (hours): Font Small (0.875rem), left-aligned
   - Column labels (days): Font Small, top-aligned, rotated if needed

4. **Tooltip** (on hover)
   - "Monday 6pm: 2h 15m (3 sessions)"

5. **Legend** (bottom)
   - Horizontal gradient showing "Low" to "High"
   - Font: Tiny (0.75rem)

#### AI Chat Analytics Section
```
┌─────────────────────────────────────────────────────────────────┐
│  AI Chat Analytics                                              │
│  ┌───────────────┬───────────────┬───────────────┬──────────┐  │
│  │ Topics        │ Conversation  │ Safety &      │ Perform. │  │
│  │ Discussed     │ Quality       │ Filtering     │ Metrics  │  │
│  │               │               │               │          │  │
│  │ Dinosaurs 15  │ Avg Length    │ Filter Rate   │ Avg Time │  │
│  │ █████████     │ 4.2 messages  │ 2.3%  ●●●○○   │ 1.25s    │  │
│  │               │               │               │          │  │
│  │ Space 12      │ Total Convos  │ Filtered      │ Tokens   │  │
│  │ ███████       │ 42            │ 4 messages    │ 15,420   │  │
│  │               │               │               │          │  │
│  │ Ocean 10      │ Engagement    │ Safe          │ Errors   │  │
│  │ █████         │ High ●●●●○    │ 96.5%  ●●●●● │ 0.2%     │  │
│  └───────────────┴───────────────┴───────────────┴──────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Grid: 4 columns (equal width)
- Gap: 1.5rem (24px)
- Margin-top: 3rem (48px)
- Section title: H2 (1.875rem), Semibold, margin-bottom: 1.5rem

**Topics Discussed Panel:**
1. **Bar Chart** - Horizontal bars
   - Bar height: 32px
   - Bar color: Chart Purple (#8B5CF6)
   - Bar max-width: Proportional to highest count
   - Label: Topic name + count (left)
   - Show top 5 topics

2. **Click Interaction**
   - Hover: Darken bar color
   - Click: Filter analytics to show only that topic

**Conversation Quality Panel:**
1. **Metrics Grid**
   - 3-4 key metrics stacked vertically
   - Each metric: Label + Value
   - Label: Small (0.875rem), Text Secondary
   - Value: H3 (1.5rem), Bold, Text Primary

2. **Engagement Indicator**
   - Star rating or dot indicator
   - Format: "High ●●●●○" or "★★★★☆"
   - Color: Green for high, Yellow for medium, Red for low

**Safety & Filtering Panel:**
1. **Filter Rate Metric**
   - Large percentage: H2 (1.875rem), Bold
   - Dot indicator showing severity (green = low/good)

2. **Breakdown**
   - "Filtered: 4 messages"
   - "Safe: 170 messages (96.5%)"
   - Font: Body (1rem)

3. **Visual Indicator**
   - Progress bar or dot indicator
   - Green for low filter rate (good)
   - Yellow for moderate
   - Red for high (concerning)

**Performance Metrics Panel:**
1. **Key Metrics**
   - Avg Response Time: "1.25s"
   - Total Tokens: "15,420"
   - Error Rate: "0.2%"

2. **Mini Line Chart** (optional)
   - Response time trend over selected period
   - Height: 80px
   - Color: Chart Green (#10B981)

#### Interaction Analytics Section
```
┌─────────────────────────────────────────────────────────────────┐
│  Interaction Analytics                                          │
│  ┌────────────────────────────┬────────────────────────────┐   │
│  │ Favorites Trend            │ Content Requests           │   │
│  │                            │                            │   │
│  │ 25 total favorites         │ 5 pending requests         │   │
│  │  ╱╲                        │  [Video Request]  3        │   │
│  │ ╱  ╲      ╱                │  [Topic Request]  2        │   │
│  │      ╲  ╱                  │                            │   │
│  │        ╲╱                  │  Fulfillment Rate: 80%     │   │
│  └────────────────────────────┴────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Grid: 2 columns (equal width)
- Gap: 1.5rem (24px)
- Margin-top: 2rem
- Section title: H2, margin-bottom: 1.5rem

**Favorites Trend Chart:**
1. **Line Chart**
   - Line color: Chart Pink (#EC4899)
   - Area fill: Pink gradient (20% opacity)
   - Height: 240px
   - X-axis: Dates
   - Y-axis: Favorites count

2. **Total Count** (top-left)
   - "25 total favorites"
   - Font: Body, Semibold
   - Color: Chart Pink

**Content Requests Panel:**
1. **Pending Count** (prominent)
   - "5 pending requests"
   - Font: H3, Bold
   - Color: Chart Orange (#F97316)
   - Clickable link to requests page

2. **Request Type Breakdown**
   - List format with counts
   - "[Video Request] 3"
   - "[Topic Request] 2"
   - Font: Body

3. **Fulfillment Rate**
   - "Fulfillment Rate: 80%"
   - Font: Body, Semibold
   - Progress bar visual (80% filled, green)

#### Most Watched Videos Section
```
┌─────────────────────────────────────────────────────────────────┐
│  Most Watched Videos                            [View All →]    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. [Thumbnail] Dinosaur Adventure                       │   │
│  │    ████████████████████████░░░░░░░░ 85% completion      │   │
│  │    12 views • 8h 24m watch time                         │   │
│  │                                                          │   │
│  │ 2. [Thumbnail] Space Exploration                        │   │
│  │    ████████████████████░░░░░░░░░░░ 78% completion       │   │
│  │    10 views • 6h 15m watch time                         │   │
│  │                                                          │   │
│  │ 3. [Thumbnail] Ocean Animals                            │   │
│  │    ██████████████████████░░░░░░░░ 80% completion        │   │
│  │    9 views • 5h 30m watch time                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Full width container
- Margin-top: 3rem
- List items: 3-5 videos

**List Item Design:**
1. **Rank Number** (left)
   - Font: H3, Bold
   - Color: Text Secondary
   - Width: 40px

2. **Thumbnail** (left of content)
   - Size: 120px × 68px (16:9 ratio)
   - Border-radius: sm
   - Shadow: sm

3. **Video Title** (main)
   - Font: Body (1rem), Semibold
   - Color: Text Primary
   - Clickable link to video detail page

4. **Completion Bar**
   - Horizontal progress bar
   - Width: Full width of text area
   - Height: 8px
   - Fill color: Chart Blue (#3B82F6)
   - Background: Light gray (#E5E7EB)
   - Label: "85% completion" (right-aligned, small)

5. **Metadata Row**
   - "12 views • 8h 24m watch time"
   - Font: Small (0.875rem)
   - Color: Text Secondary
   - Separator: "•"

6. **Hover State**
   - Background: Light gray (#F9FAFB)
   - Cursor: pointer
   - Transition: smooth

---

### 2. Child Detail Page

**Route:** `/admin/analytics/child/[childId]`

#### Header Section
```
┌─────────────────────────────────────────────────────────────────┐
│  [← Back to Family]                      [Date Range Selector] │
│                                                                 │
│  [Avatar]  Eddie                         [Compare Mode]        │
│            Age 7 • AGE_7_PLUS                                   │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │Watch Time│ │Videos    │ │AI Chats  │ │Favorites │          │
│  │24h 32m   │ │47        │ │18        │ │12        │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Background: White surface
- Padding: 2rem
- Margin-bottom: 2rem

**Elements:**
1. **Back Button**
   - Icon: Left arrow
   - Text: "Back to Family"
   - Font: Body, Medium
   - Color: Chart Blue (link color)
   - Position: Top-left

2. **Child Avatar & Info**
   - Avatar: 80px circle, child's profile picture
   - Name: H1 (2.25rem), Bold
   - Age info: Body (1rem), Text Secondary
   - Layout: Horizontal (avatar left, info right)

3. **Quick Stats Row**
   - 4 mini KPI cards
   - Card size: 160px wide, 100px tall
   - Layout: Horizontal row
   - Same design as main KPI cards (simplified)

#### Watch Timeline Section
```
┌─────────────────────────────────────────────────────────────────┐
│  Watch Timeline                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Jan 1  Jan 2   Jan 3    Jan 4    Jan 5    Jan 6   Jan 7   │ │
│  │   │      │       │        │        │        │       │      │ │
│  │   ●─────●──────●────────●─────────────────●───────●       │ │
│  │   │      │       │        │                 │       │      │ │
│  │  Dino  Space  Ocean    Dino              Space   Dino     │ │
│  │  30m   45m    20m      1h15m             55m     40m      │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Width: Full container width
- Height: 200px
- Margin-top: 2rem
- Background: White card

**Timeline Design:**
1. **Horizontal Axis**
   - X-axis: Dates across selected range
   - Y-axis: Not shown (single row)
   - Line: 2px blue line connecting events

2. **Event Markers**
   - Circle: 12px diameter, Chart Blue fill
   - Position: On timeline at corresponding date/time
   - Hover: Scale up to 16px

3. **Event Label** (below marker)
   - Video thumbnail (small, 60px × 34px)
   - Video title (truncated, Small font)
   - Duration watched (Tiny font, Text Secondary)
   - Click to navigate to video detail

4. **Tooltip** (on hover)
   - Full video title
   - Watch time and completion %
   - Date/time started

#### Topic Interests & Content Preferences Row
```
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────┬─────────────────────────┐ │
│  │ Eddie's Topic Interests         │ Content Preferences     │ │
│  │                                 │                         │ │
│  │  Dinosaurs ████████████ 15     │      Educational 45%    │ │
│  │  Space     ████████     12      │         ╱────╲          │ │
│  │  Ocean     ██████       10      │       ╱        ╲        │ │
│  │  Animals   █████        8       │     ╱     O      ╲      │ │
│  │  Science   ████         6       │     ╲            ╱      │ │
│  │                                 │       ╲        ╱        │ │
│  │  [View All Topics →]            │         ╲────╱          │ │
│  │                                 │   Entertainment 35%     │ │
│  └─────────────────────────────────┴─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Grid: 2 columns (1:1 ratio)
- Gap: 1.5rem
- Margin-top: 2rem

**Topic Interests (Horizontal Bar Chart):**
1. **Bars**
   - Height: 32px each
   - Color: Chart Purple
   - Max-width: Proportional to highest count
   - Gap: 0.5rem between bars

2. **Labels**
   - Topic name (left of bar)
   - Count (right of bar)
   - Font: Body

3. **View All Link**
   - "View All Topics →"
   - Font: Small, Medium
   - Color: Chart Blue (link)
   - Align: Bottom-left

**Content Preferences (Donut Chart):**
- Same design as main dashboard donut chart
- Shows Eddie's specific category distribution
- Center label: "47 videos watched"

#### AI Conversation Patterns Section
```
┌─────────────────────────────────────────────────────────────────┐
│  Eddie's AI Conversations                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  18 conversations • 76 messages • Avg 4.2 messages/conv  │  │
│  │                                                          │  │
│  │  Recent Topics: Dinosaurs, Space exploration, Ocean      │  │
│  │                                                          │  │
│  │  Engagement: High ●●●●○                                 │  │
│  │  Safety Score: 98% ●●●●● (2 messages filtered)          │  │
│  │                                                          │  │
│  │  [View All Conversations →]                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Width: Full container width
- Margin-top: 2rem
- Background: White card
- Padding: 1.5rem

**Content:**
1. **Summary Stats** (top row)
   - Font: Body, Semibold
   - Color: Text Primary
   - Separator: "•"

2. **Topics List**
   - "Recent Topics: Dinosaurs, Space exploration, Ocean"
   - Font: Body
   - Color: Text Secondary

3. **Engagement & Safety Indicators**
   - Dot indicators or star ratings
   - Color-coded by level (green = good, yellow = moderate, red = concern)

4. **View All Link**
   - Button or link to full conversation history
   - Font: Body, Medium
   - Color: Chart Blue

---

### 3. Video Performance Page

**Route:** `/admin/analytics/video/[videoId]`

#### Header Section
```
┌─────────────────────────────────────────────────────────────────┐
│  [← Back to Analytics]                   [Date Range Selector] │
│                                                                 │
│  [Video Thumbnail]  Dinosaur Adventure                          │
│  (Large 320×180)    Duration: 15:30 • Educational • AGE_7_PLUS │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │Views     │ │Unique    │ │Watch Time│ │Completion│          │
│  │12        │ │Viewers 3 │ │8h 24m    │ │85%       │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Background: White surface
- Padding: 2rem
- Margin-bottom: 2rem

**Elements:**
1. **Back Button**
   - Same as child detail page

2. **Video Thumbnail**
   - Size: 320px × 180px (16:9)
   - Border-radius: md
   - Shadow: md
   - Position: Left

3. **Video Info** (right of thumbnail)
   - Title: H1 (2.25rem), Bold
   - Metadata: Body, Text Secondary
   - Format: "Duration • Category • Age Rating"

4. **Quick Stats Row**
   - 4 mini KPI cards
   - Same design as child detail page

#### Viewer Demographics Section
```
┌─────────────────────────────────────────────────────────────────┐
│  Who Watched This Video                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [Avatar] Eddie, Age 7                                    │  │
│  │          5 views • 3h 45m • 90% completion               │  │
│  │          ████████████████████████████░░░░ 90%            │  │
│  │                                                          │  │
│  │ [Avatar] Sarah, Age 5                                    │  │
│  │          4 views • 2h 30m • 75% completion               │  │
│  │          ███████████████████░░░░░░░░░░░░░ 75%            │  │
│  │                                                          │  │
│  │ [Avatar] Max, Age 10                                     │  │
│  │          3 views • 2h 09m • 80% completion               │  │
│  │          ████████████████████░░░░░░░░░░░░ 80%            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Width: Full container width
- Margin-top: 2rem
- Background: White card
- List of all children who watched

**List Item Design:**
1. **Child Avatar** (left)
   - Size: 48px circle
   - Child's profile picture

2. **Child Info** (main)
   - Name and age: Body (1rem), Semibold
   - Stats: "5 views • 3h 45m • 90% completion"
   - Font: Small, Text Secondary

3. **Completion Bar**
   - Full-width progress bar
   - Color: Chart Blue
   - Shows completion percentage

4. **Click Interaction**
   - Clickable to navigate to child detail page
   - Hover: Background lightens

#### Engagement Metrics Section
```
┌─────────────────────────────────────────────────────────────────┐
│  Engagement Metrics                                             │
│  ┌──────────────┬──────────────┬──────────────┬─────────────┐  │
│  │ Favorites    │ AI Convos    │ Rewatch Rate │ Journal     │  │
│  │              │              │              │ Entries     │  │
│  │     5        │      3       │     25%      │      2      │  │
│  │   ★★★★★      │              │              │             │  │
│  │              │ Dinosaurs    │ 3 rewatches  │ Avg 4.5★    │  │
│  └──────────────┴──────────────┴──────────────┴─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Grid: 4 columns (equal width)
- Gap: 1.5rem
- Margin-top: 2rem
- Background: Individual white cards

**Card Design:**
- Each metric in its own card
- Large number/value at top (H2, Bold)
- Supporting text below (Small, Text Secondary)
- Icon or visual indicator

#### Performance Trend Section
```
┌─────────────────────────────────────────────────────────────────┐
│  Views Over Time                                [7d][30d][90d]  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  5                           ●                            │ │
│  │                                                           │ │
│  │  4                                                        │ │
│  │                        ●                                  │ │
│  │  3                                 ●         ●            │ │
│  │                  ●                                        │ │
│  │  2        ●                                         ●     │ │
│  │     ●                                                     │ │
│  │  1                                                        │ │
│  │                                                           │ │
│  │  0  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │     Jan 1  Jan 2  Jan 3  Jan 4  Jan 5  Jan 6  Jan 7      │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Width: Full container width
- Height: 320px
- Margin-top: 2rem
- Background: White card

**Chart Design:**
- Line chart with points (area chart optional)
- X-axis: Dates
- Y-axis: View count
- Color: Chart Blue
- Points: Visible, 8px diameter
- Hover tooltip: Date and view count

---

### 4. Comparison Mode Views

#### Period Comparison Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  [Comparison Mode Active]                                       │
│  Period A: Jan 1-7  vs  Period B: Dec 25-31        [Exit]      │
│  ┌────────────────────────────┬────────────────────────────┐   │
│  │ Period A: Jan 1-7          │ Period B: Dec 25-31        │   │
│  │                            │                            │   │
│  │ Watch Time: 24h 32m        │ Watch Time: 21h 45m        │   │
│  │ +12% vs Period B           │ -12% vs Period A           │   │
│  │                            │                            │   │
│  │ Videos: 47                 │ Videos: 43                 │   │
│  │ +9%                        │ -9%                        │   │
│  └────────────────────────────┴────────────────────────────┘   │
│                                                                 │
│  Key Changes:                                                   │
│  • Watch time increased by 2h 47m (+12%)                        │
│  • 4 more videos watched (+9%)                                  │
│  • AI conversations up 25%                                      │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Split screen layout (2 columns)
- Each column shows same metrics for different period
- Comparison header at top
- Auto-generated insights at bottom

**Elements:**
1. **Comparison Header**
   - Shows both period labels
   - Exit button to disable comparison
   - Background: Light blue (#E0F2FE)
   - Font: Body, Semibold

2. **Split Cards**
   - Each KPI card duplicated side-by-side
   - Left: Period A, Right: Period B
   - Change indicators show difference vs other period

3. **Insights Panel**
   - "Key Changes:" heading
   - Bulleted list of top 3 changes
   - Font: Body
   - Color: Text Primary
   - Icons: Up/down arrows

#### Child Comparison Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  Comparing: Eddie vs Sarah vs Max                    [Exit]     │
│  ┌──────────┬──────────┬──────────┐                            │
│  │ Eddie    │ Sarah    │ Max      │                            │
│  │          │          │          │                            │
│  │ 24h 32m  │ 18h 15m  │ 21h 05m  │  Watch Time               │
│  │ ████████ │ ██████   │ ███████  │                            │
│  │          │          │          │                            │
│  │ 47 vids  │ 35 vids  │ 40 vids  │  Videos Watched            │
│  │ ████████ │ █████    │ ██████   │                            │
│  └──────────┴──────────┴──────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Multi-column layout (2-4 children)
- Each column shows child's metrics
- Horizontal bar charts for comparison
- Synchronized scales

**Elements:**
1. **Comparison Header**
   - Lists all children being compared
   - Exit button
   - Background: Light blue

2. **Metric Rows**
   - Each row is a different metric
   - Metric label on right
   - Bars show relative values
   - Longest bar = 100% width

3. **Child Columns**
   - Avatar and name at top
   - Values below each metric
   - Color-coded bars (different color per child)

---

## Component Specifications

### Reusable Chart Components

#### LineChart Component

**Props:**
```typescript
interface LineChartProps {
  data: Array<{ x: string | number; [key: string]: any }>;
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

**Styling:**
- Responsive container (width: 100%)
- Default height: 320px
- Line width: 2px
- Point size: 6px (hover: 8px)
- Grid: Dashed horizontal lines (#E5E7EB)
- Tooltip: Dark background (#374151), white text
- Legend: Bottom-aligned, clickable to toggle lines

#### BarChart Component

**Props:**
```typescript
interface BarChartProps {
  data: Array<{ category: string; [key: string]: any }>;
  xKey: string;
  yKeys: string[];
  colors?: string[];
  height?: number;
  horizontal?: boolean;
  stacked?: boolean;
  showValues?: boolean;
}
```

**Styling:**
- Responsive container
- Default height: 280px
- Bar width: Auto (with max-width)
- Gap between bars: 4px
- Hover: Lighten bar color
- Value labels: Inside or above bars (optional)

#### DonutChart Component

**Props:**
```typescript
interface DonutChartProps {
  data: Array<{ name: string; value: number }>;
  colors?: string[];
  centerLabel?: string;
  showLegend?: boolean;
  height?: number;
}
```

**Styling:**
- Responsive container
- Default size: 200px diameter
- Outer radius: 100px
- Inner radius: 60px (40% hole)
- Segment labels: Percentages outside ring
- Center label: H4 font, Text Primary
- Legend: Bottom-aligned with color swatches

#### Heatmap Component

**Props:**
```typescript
interface HeatmapProps {
  data: Array<{ day: number; hour: number; value: number }>;
  colorScheme?: [string, string, string]; // [low, medium, high]
  cellSize?: number;
  showTooltip?: boolean;
  onCellClick?: (day: number, hour: number) => void;
}
```

**Styling:**
- SVG-based custom implementation
- Default cell size: 40px × 40px
- Gap: 2px between cells
- Border-radius: 2px per cell
- Color interpolation: Linear gradient from low to high
- Tooltip: On hover, shows exact value
- Hover: Scale cell slightly (1.05x)

### KPI Card Component

**Props:**
```typescript
interface KPICardProps {
  title: string;
  value: string | number;
  change?: { value: number; isPositive: boolean };
  icon?: React.ReactNode;
  trend?: Array<number>; // For sparkline
  color?: string;
  onClick?: () => void;
}
```

**Styling:**
- Background: White (#FFFFFF)
- Border: 1px solid #E5E7EB
- Border-radius: 0.5rem
- Padding: 1.5rem
- Shadow: sm (hover: md)
- Min-height: 140px
- Cursor: pointer if onClick provided

**Layout:**
```
┌─────────────────┐
│ [Icon]          │
│                 │
│ Title           │
│ VALUE  +12% ↑   │
│                 │
│ ───────── trend │
└─────────────────┘
```

### Date Range Picker Component

**Props:**
```typescript
interface DateRangePickerProps {
  value: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
  presets?: Array<{ label: string; value: [Date, Date] }>;
  comparisonMode?: boolean;
}
```

**UI:**
```
┌─────────────────────────────────────┐
│ [📅 Last 30 Days ▼]                │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Quick Select:                   │ │
│ │ [7 Days] [30 Days] [90 Days]    │ │
│ │ [This Week] [This Month]        │ │
│ │                                 │ │
│ │ Custom Range:                   │ │
│ │ [Calendar Picker]               │ │
│ │                                 │ │
│ │        [Cancel]  [Apply]        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Styling:**
- Button: Body font, padding 0.5rem 1rem
- Dropdown: Absolute positioned, shadow-lg
- Background: White
- Border: 1px solid #E5E7EB
- Border-radius: md
- Preset buttons: Gray background (active: Blue)
- Calendar: Use react-day-picker styling

---

## Interaction Patterns

### Hover States
- **Cards**: Elevate shadow (sm → md), transition 150ms
- **Buttons**: Darken background 10%, transition 100ms
- **Chart Elements**: Show tooltip, highlight element
- **Links**: Underline, color darken

### Click Interactions
- **KPI Cards**: Navigate to relevant detail page (optional)
- **Chart Elements**: Drill down or filter (e.g., click topic → filter analytics)
- **Video Items**: Navigate to video performance page
- **Child Names**: Navigate to child detail page
- **Back Buttons**: Navigate to previous level

### Loading States
- **Initial Load**: Skeleton loaders for cards and charts
- **Data Refetch**: Spinner overlay on affected component
- **Transitions**: Fade in/out, 200ms duration
- **Preserve Layout**: Show skeleton with correct dimensions

### Empty States
- **No Data**: Gray empty state card with helpful message
- **Icon**: Large 64px icon (e.g., chart icon)
- **Message**: "No data yet. [Explanation]"
- **Action**: Optional button or link (e.g., "Watch a video to see analytics")

### Error States
- **API Error**: Red error banner at top of page
- **Chart Error**: Gray card with error message and retry button
- **Graceful Degradation**: Show partial data if possible

---

## Responsive Behavior

### Breakpoints
```
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px
```

### Mobile (<640px)
- **Grid**: All columns stack (1 column)
- **KPI Cards**: Full width, smaller (120px height)
- **Charts**: Full width, height 240px
- **Heatmap**: Horizontal scroll or smaller cells
- **Navigation**: Hamburger menu
- **Date Picker**: Full-screen modal

### Tablet (640px - 1024px)
- **Grid**: 2 columns for most layouts
- **KPI Cards**: 2 per row
- **Charts**: Full width or 2 columns
- **Heatmap**: Full width, smaller cells
- **Navigation**: Horizontal tabs

### Desktop (>1024px)
- **Grid**: 4 columns for KPI cards, 2-3 for charts
- **Charts**: Multiple per row
- **Heatmap**: Full size cells
- **Navigation**: Full breadcrumb and header
- **Sidebars**: Optional filters sidebar

---

## Accessibility

### WCAG AA Compliance

**Color Contrast:**
- Text on white: ≥ 4.5:1 (AA standard)
- Large text (≥18pt): ≥ 3:1
- UI elements: ≥ 3:1

**Keyboard Navigation:**
- Tab order: Logical top-to-bottom, left-to-right
- Focus indicators: 2px blue outline on focused elements
- Skip links: "Skip to content" at top
- Keyboard shortcuts: D (date picker), C (comparison), Esc (close modals)

**Screen Reader Support:**
- ARIA labels on all interactive elements
- ARIA roles: button, link, navigation, main, article
- Chart descriptions: aria-label with summary (e.g., "Line chart showing watch time over 7 days, ranging from 2h to 4h")
- Live regions: aria-live for dynamic updates

**Focus Management:**
- Focus returns to trigger after modal close
- Focus moves to new page heading after navigation
- Focus indicator always visible

**Alternative Text:**
- All images have alt text
- Charts have text alternatives or descriptions
- Icons have aria-label or are aria-hidden with text label nearby

---

## Design Tokens

### CSS Variables (Tailwind Config)
```css
:root {
  /* Colors */
  --color-primary: #3B82F6;
  --color-primary-dark: #1E40AF;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;

  /* Chart Colors */
  --chart-blue: #3B82F6;
  --chart-green: #10B981;
  --chart-yellow: #F59E0B;
  --chart-red: #EF4444;
  --chart-purple: #8B5CF6;
  --chart-orange: #F97316;
  --chart-teal: #14B8A6;
  --chart-pink: #EC4899;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;

  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

  /* Typography */
  --font-family: Inter, system-ui, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
}
```

---

## Animation & Transitions

### Transition Durations
```
- Fast: 100ms (button hover)
- Normal: 150ms (card hover, focus)
- Slow: 200ms (modal open/close, page transitions)
- Chart: 300ms (data updates, chart animations)
```

### Easing Functions
```
- Ease-in-out: cubic-bezier(0.4, 0, 0.2, 1) - default
- Ease-out: cubic-bezier(0, 0, 0.2, 1) - entering
- Ease-in: cubic-bezier(0.4, 0, 1, 1) - exiting
```

### Animations
- **Fade In**: opacity 0 → 1, 200ms ease-out
- **Slide In**: translateY(10px) → translateY(0), 200ms ease-out
- **Scale Up**: scale(0.95) → scale(1), 150ms ease-out (modals)
- **Skeleton Pulse**: background shimmer, 1.5s infinite ease-in-out

---

## Figma/Design File Notes

**Artboard Structure:**
```
1. Design System (colors, typography, components)
2. Family Dashboard (desktop, tablet, mobile)
3. Child Detail Page (desktop, tablet, mobile)
4. Video Performance Page (desktop, tablet, mobile)
5. Comparison Mode Views (period, child)
6. Component Library (all reusable components)
7. Interaction States (hover, focus, active, disabled, error)
8. Empty States & Error States
```

**Export Assets:**
- Icons: SVG format
- Charts: Export as components (not images)
- Thumbnails: Use placeholder images or video stills

---

## Implementation Notes

### Component File Structure
```
/components/charts/
  line-chart.tsx
  bar-chart.tsx
  donut-chart.tsx
  heatmap.tsx
  comparison-chart.tsx
  semantic-cluster-viz.tsx

/components/analytics/
  analytics-dashboard.tsx
  kpi-card-enhanced.tsx
  date-range-picker.tsx
  ai-analytics-panel.tsx
  interaction-analytics.tsx
  viewing-heatmap.tsx
  most-watched-videos-enhanced.tsx
  /child-detail/
    child-header.tsx
    watch-timeline.tsx
    topic-interests.tsx
  /video-detail/
    video-header.tsx
    viewer-demographics.tsx
    engagement-metrics.tsx
```

### CSS/Styling Approach
- Use Tailwind utility classes for most styling
- Create custom classes for complex components (e.g., heatmap cells)
- Use CSS modules or styled-components for chart-specific styling
- Leverage Tailwind's `@apply` for repeated patterns

### Chart Configuration
- Recharts configuration should be extracted to shared constants
- Color palettes defined as arrays for easy reuse
- Tooltip formatters as utility functions
- Responsive behavior via ResponsiveContainer

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-11 | Initial design specifications |

---

**Prepared By:** Claude Code Assistant
**Status:** Approved for Implementation
**Next:** Implementation Checklist & Ticket Breakdown
