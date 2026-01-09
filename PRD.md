# SafeStream Kids

## Product Requirements Document (PRD)

### Version 1.0 | January 2026

---

## 1. Executive Summary

**SafeStream Kids** is a self-hosted, parent-controlled video streaming platform designed to provide children with a safe, curated video experience. It combines the discoverability and engagement of platforms like YouTube with complete parental control over content, AI-assisted learning, and comprehensive analytics.

### Vision Statement

_"Give children the joy of discovery while giving parents peace of mind."_

### Core Value Propositions

- **For Children**: A fun, engaging, age-appropriate video platform with interactive learning features
- **For Parents**: Complete control, transparency, and insights into their child's viewing habits and curiosities

---

## 2. Problem Statement

### The YouTube Dilemma

YouTube hosts an enormous library of genuinely valuable educational and entertainment content for children. However:

1. **Algorithmic Risk**: YouTube's recommendation algorithm is optimized for engagement, not child safety. It can lead children down rabbit holes to increasingly inappropriate content.

2. **Elsagate & Content Farms**: Disturbing content disguised as children's videos has been a persistent problem.

3. **Advertising**: Children are exposed to ads, some of which may be inappropriate or manipulative.

4. **Addictive Design**: Autoplay, endless scrolling, and engagement-maximizing features can create unhealthy viewing habits.

5. **Lack of Transparency**: Parents have limited visibility into what their children watch and for how long.

6. **YouTube Kids Inadequacy**: Despite Google's efforts, YouTube Kids regularly fails to filter inappropriate content and offers limited parental insights.

### The Gap

Parents need a solution that:

- Preserves access to quality content from various sources
- Eliminates algorithmic recommendations from external platforms
- Provides complete content curation control
- Offers deep insights into children's viewing habits and interests
- Enables interactive, safe learning experiences

---

## 3. Target Users

### Primary Users

#### 👶 Children (Ages 2-12)

**Personas:**

| Persona            | Age  | Characteristics                                               | Needs                                                                                                 |
| ------------------ | ---- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Toddler Tara**   | 2-4  | Pre-literate, touch-focused, short attention span             | Large touch targets, simple navigation, bright colors, auto-advancement                               |
| **Explorer Eddie** | 5-12 | Reading ability grows, curious, developing specific interests | Easy browsing, search, favorites, voice search, playlists, AI chat, personalization within boundaries |

#### 👨‍👩‍👧 Parents/Guardians (Administrators)

- Tech-comfortable parents who value both safety and education
- Want visibility without being helicopter parents
- Willing to invest time in content curation
- Value data privacy (hence self-hosting)

### Secondary Users

- **Extended Family**: Grandparents, aunts/uncles who may supervise viewing
- **Multiple Children**: Families with multiple kids of different ages

---

## 4. Product Goals & Success Metrics

### Goals

| Priority | Goal                     | Description                                          |
| -------- | ------------------------ | ---------------------------------------------------- |
| P0       | **Safety First**         | 100% of content is parent-approved before viewing    |
| P0       | **Ease of Use**          | Children can navigate independently within 1 session |
| P1       | **Content Discovery**    | Children find new (curated) content easily           |
| P1       | **Parental Insights**    | Parents understand viewing patterns at a glance      |
| P2       | **Interactive Learning** | AI enhances understanding without risks              |
| P2       | **Sustainable Habits**   | Built-in features promote healthy viewing            |

### Success Metrics

| Metric                     | Target | Measurement                          |
| -------------------------- | ------ | ------------------------------------ |
| Content Approval Rate      | 100%   | No unapproved content ever displayed |
| Child Session Independence | 95%    | Sessions without parent intervention |
| Parent Weekly Engagement   | 80%    | Parents review dashboard weekly      |
| AI Safety Incidents        | 0      | Inappropriate AI responses           |
| Watch Time Accuracy        | 99%    | Accurate tracking vs. actual viewing |

---

## 5. Feature Specifications

### 5.1 Content Management System (Admin)

#### 5.1.1 Content Ingestion

**Supported Sources:**

- YouTube (videos, playlists, channels)
- Vimeo
- Direct video uploads
- Educational platforms (Khan Academy, PBS, etc.)
- Future: Custom integrations

**Ingestion Methods:**

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTENT INGESTION                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Single URL  │    │   Channel    │    │   Playlist   │  │
│  │    Import    │    │  Subscription│    │    Sync      │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                   │                   │          │
│         └───────────────────┼───────────────────┘          │
│                             ▼                              │
│                    ┌────────────────┐                      │
│                    │ Metadata Fetch │                      │
│                    │ & AI Analysis  │                      │
│                    └────────┬───────┘                      │
│                             ▼                              │
│                    ┌────────────────┐                      │
│                    │ Approval Queue │                      │
│                    └────────┬───────┘                      │
│                             ▼                              │
│              ┌──────────────┴──────────────┐               │
│              ▼                             ▼               │
│     ┌────────────────┐           ┌────────────────┐        │
│     │    Approved    │           │    Rejected    │        │
│     │   + Download   │           │   + Archive    │        │
│     └────────────────┘           └────────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Content Properties:**
| Property | Type | Description |
|----------|------|-------------|
| `source_url` | URL | Original video location |
| `local_path` | Path | Downloaded video location |
| `title` | String | Display title (editable) |
| `description` | Text | Full description |
| `thumbnail` | Image | Video thumbnail (editable) |
| `duration` | Integer | Length in seconds |
| `age_rating` | Enum | 2+, 4+, 7+, 10+ |
| `categories` | Array | Educational, Entertainment, Music, etc. |
| `topics` | Array | AI-extracted and parent-tagged topics |
| `transcript` | Text | Auto-generated or imported |
| `approval_status` | Enum | Pending, Approved, Rejected |
| `approval_date` | DateTime | When approved |
| `notes` | Text | Parent notes about content |

#### 5.1.2 Channel Subscriptions

When subscribing to a channel:

- **Auto-Approve Mode**: New videos go directly to library (for trusted channels)
- **Review Mode**: New videos go to approval queue (default)
- **Selective Mode**: Parent sets rules (e.g., only videos < 10 min, only certain keywords)

```
Channel: "Numberblocks"
├── Mode: Auto-Approve
├── Sync Frequency: Daily
├── Age Rating Override: 2+
├── Auto-Categories: [Math, Animation, Educational]
└── Last Sync: 2026-01-09 08:00
    └── New Videos: 2 added to library
```

#### 5.1.3 Content Organization

**Hierarchical Structure:**

```
Library
├── Categories (system-defined)
│   ├── Educational
│   │   ├── Math
│   │   ├── Science
│   │   ├── Reading
│   │   └── ...
│   ├── Entertainment
│   ├── Music & Dance
│   ├── Stories & Books
│   └── Arts & Crafts
│
├── Collections (parent-created)
│   ├── "Bedtime Stories"
│   ├── "Weekend Treats"
│   └── "Learning Numbers"
│
├── Age Groups
│   ├── Toddler (2-4)
│   ├── Preschool (4-6)
│   ├── Early Elementary (6-8)
│   └── Upper Elementary (8-12)
│
└── Smart Playlists
    ├── "Recently Added"
    ├── "Not Watched Yet"
    ├── "Favorites"
    └── "Short Videos (< 5 min)"
```

---

### 5.2 Child-Facing Interface

#### 5.2.1 Age-Adaptive UI

The interface adapts based on the child's profile age:

**Toddler Mode (2-4)**

```
┌─────────────────────────────────────────────────────────────┐
│  🏠                              [Profile Pic] Tara    ⚙️   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ╔═══════════════╗  ╔═══════════════╗  ╔═══════════════╗  │
│   ║               ║  ║               ║  ║               ║  │
│   ║   🎵 MUSIC    ║  ║   📖 STORIES  ║  ║   🎨 CREATE   ║  │
│   ║               ║  ║               ║  ║               ║  │
│   ╚═══════════════╝  ╚═══════════════╝  ╚═══════════════╝  │
│                                                             │
│   ╔═══════════════╗  ╔═══════════════╗  ╔═══════════════╗  │
│   ║               ║  ║               ║  ║               ║  │
│   ║   🔢 NUMBERS  ║  ║   🦁 ANIMALS  ║  ║   ⭐ FAVORITES║  │
│   ║               ║  ║               ║  ║               ║  │
│   ╚═══════════════╝  ╚═══════════════╝  ╚═══════════════╝  │
│                                                             │
│                                                             │
│              [🎤 Tap to Talk]                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Features:
- Extra large touch targets (min 88x88px)
- No text required (icon-only navigation)
- Voice activation for search
- Bright, high-contrast colors
- Sound feedback on interactions
- No scrolling required on main screen
- Haptic feedback on supported devices
```

**Explorer Mode (5-12)**

```
┌─────────────────────────────────────────────────────────────┐
│  🏠 Home    🔍 [Search videos...]    ⭐ My Stuff   [Eddie] ⚙️│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Sidebar          │  Main Content                          │
│  ┌──────────────┐ │                                        │
│  │ 📺 For You   │ │  ▶ Continue Watching                   │
│  │ ⏰ Continue  │ │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ ⭐ Favorites │ │  │ ▶ 3:42  │ │ ▶ 0:00  │ │ ▶ 12:30 │ → │
│  │ 📋 Playlists │ │  │ Octonauts│ │ Science │ │ Story.. │   │
│  │ 🕐 History   │ │  └─────────┘ └─────────┘ └─────────┘   │
│  ├──────────────┤ │                                        │
│  │ Categories   │ │  🔢 Numbers & Math                     │
│  │  📐 Math     │ │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  🔬 Science  │ │  │         │ │         │ │         │ → │
│  │  📖 Reading  │ │  │Numberbl.│ │ Peg+Cat │ │Odd Squad│   │
│  │  🎨 Art      │ │  └─────────┘ └─────────┘ └─────────┘   │
│  │  🌍 World    │ │                                        │
│  │  🎮 Fun      │ │  🦁 Animals & Nature                   │
│  └──────────────┘ │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│                   │  │         │ │         │ │         │ → │
│  [💬 Ask about    │  │Wild Kra.│ │Octonauts│ │NatGeo K.│   │
│   this video]     │  └─────────┘ └─────────┘ └─────────┘   │
│                   │                                        │
│  [🎤 Voice Search]│                                        │
└─────────────────────────────────────────────────────────────┘

Features:
- Sidebar navigation with categories
- Full text search with filters
- Horizontal scrolling rows (Netflix-style)
- Continue watching with progress bars
- Voice search with visual feedback
- Personal playlists and favorites
- Watch history
- AI chat integration ("Ask about this video")
- Keyboard navigation support
- Gentle animations
```

#### 5.2.2 Video Player

**Core Features:**

- Responsive player with standard controls
- Resume from last position
- Playback speed control (0.5x - 1.5x)
- Captions/subtitles when available
- Theater mode and fullscreen
- Chapter markers (if available)

**Child-Safe Features:**

- No external links in description
- No comments section
- No recommended videos from external sources
- "Up Next" only shows curated content
- Idle timeout with parent-defined limits

**Smart Features:**

- "Watch Again" for completed videos
- Progress syncs across devices
- Bedtime mode (dimmer, no autoplay)
- "Ask About This" button for AI chat

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back                                              ⛶ 🔊  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                                                             │
│                    [VIDEO PLAYER]                           │
│                                                             │
│                        ▶                                    │
│                                                             │
│  ▬▬▬▬▬▬▬▬▬▬●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  3:42                                              12:30    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  The Water Cycle Explained for Kids                         │
│  Science & Nature • 12 min • Age 5+                         │
│                                                             │
│  [⭐ Favorite]  [📋 Add to Playlist]  [💬 Ask Questions]   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  📺 Up Next                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Clouds  │ │ Weather │ │ Oceans  │ │ Rivers  │    →      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
```

#### 5.2.3 Search & Discovery

**Search Capabilities:**

- Text search (titles, descriptions, topics)
- Voice search (with visual feedback)
- Filter by: age, duration, category, topic
- Safe autocomplete (only suggests approved content)

**Discovery Features:**

- "For You" recommendations based on:
  - Watch history
  - Favorites
  - Similar content to liked videos
  - Parent-boosted content
- "Explore" section for new categories
- "Random Pick" for decision fatigue
- Seasonal/themed collections

**Related Content Algorithm:**

```
┌─────────────────────────────────────────────────────────────┐
│              RELATED CONTENT LOGIC                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Current Video: "Ocean Animals for Kids"                    │
│                                                             │
│  Related By:                                                │
│  ├── Same Channel (35% weight)                              │
│  │   └── "Rainforest Animals", "Desert Animals"             │
│  ├── Same Topics (30% weight)                               │
│  │   └── Videos tagged: ocean, marine life, animals         │
│  ├── Same Category (20% weight)                             │
│  │   └── Other Nature/Science videos                        │
│  ├── Viewing Patterns (10% weight)                          │
│  │   └── Videos others watched after this                   │
│  └── Parent Boosted (5% bonus)                              │
│      └── Videos parent marked as recommended                │
│                                                             │
│  EXCLUSIONS:                                                │
│  ✗ Videos above child's age rating                          │
│  ✗ Videos already watched (unless marked rewatchable)       │
│  ✗ Videos in excluded collections                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 5.2.4 Personalization

**Child Profiles:**

- Multiple profiles per family
- Custom avatar/profile picture
- Personal favorites list
- Personal playlists
- Watch history (per profile)
- Age-based content filtering
- Theme preferences (within approved themes)

**Favorites & Playlists:**

- Simple "heart" to favorite
- Create named playlists
- Playlist sharing between siblings (optional)
- "Watch Later" quick save

---

### 5.3 AI Integration ("Ask About This")

#### 5.3.1 Philosophy

The AI assistant is designed to be:

- **Educational**: Helps children understand and explore topics
- **Safe**: Multiple layers of content filtering
- **Transparent**: All conversations logged for parent review
- **Bounded**: Can only discuss content in the library
- **Encouraging**: Promotes curiosity and learning

#### 5.3.2 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI SAFETY ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Child Input                                                │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────┐                                       │
│  │ Input Filtering │ ◄── Block inappropriate content       │
│  │ (Pre-processing)│     Detect concerning patterns        │
│  └────────┬────────┘     Sanitize input                    │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │ Context Builder │ ◄── Video transcript/metadata         │
│  │                 │     Child's age & profile             │
│  └────────┬────────┘     Conversation history              │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │  System Prompt  │ ◄── Age-appropriate language          │
│  │   Construction  │     Topic boundaries                  │
│  └────────┬────────┘     Safety guidelines                 │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │    LLM API      │ ◄── Local or cloud-based              │
│  │  (e.g., Ollama) │     Rate limited                      │
│  └────────┬────────┘                                       │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │ Output Filtering│ ◄── Secondary content check           │
│  │(Post-processing)│     Length appropriate for age        │
│  └────────┬────────┘     No external links/refs            │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                       │
│  │    Response     │                                       │
│  │   + Logging     │ ◄── Full conversation stored          │
│  └─────────────────┘                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 5.3.3 System Prompt Framework

```markdown
You are a friendly, helpful learning companion for a child named {child_name}
who is {age} years old.

CONTEXT:

- The child just watched a video about: {video_title}
- Video summary: {video_summary}
- Topics covered: {topics}

GUIDELINES:

1. Use language appropriate for a {age}-year-old
2. Be encouraging and positive
3. Only discuss topics from the video or directly related educational extensions
4. If asked about something unrelated, gently redirect to the video topic
5. Never provide information about:
   - Violence, weapons, or harmful activities
   - Adult content or relationships
   - Specific people's personal lives
   - Medical advice
   - Anything that could be scary or disturbing
6. If unsure, say "That's a great question! Let's ask a grown-up about that together."
7. Encourage curiosity and asking parents/teachers for more
8. Keep responses short: max {max_words} words for this age

PERSONALITY:

- Warm and friendly, like a favorite teacher
- Use simple analogies and examples
- Celebrate curiosity: "Great question!"
- Use age-appropriate enthusiasm

RESTRICTIONS:

- Do not role-play as characters
- Do not generate stories that go beyond video content
- Do not discuss other children or personal topics
- Do not provide homework answers directly (guide instead)
```

#### 5.3.4 Interaction Model

**For Toddlers (2-4)**: AI features disabled or heavily simplified

- Voice responses only
- Single question/answer (no conversation)
- Parrot facts from video: "The elephant uses its trunk to..."

**For Explorers (5-12)**:

- Full chat interface with text + optional voice
- Multi-turn conversations (age-appropriate depth)
- Follow-up questions encouraged
- "Learn more" and "Dive deeper" suggestions
- Links to related videos in library
- Response complexity adjusts based on child's age within the range

**Example Interaction:**

```
┌─────────────────────────────────────────────────────────────┐
│  💬 Ask About: "The Water Cycle Explained"                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👤 Eddie: Why does it rain?                                │
│                                                             │
│  🤖 SafeStream: Great question! ☁️                          │
│                                                             │
│     In the video, we learned about the water cycle!         │
│     Here's what happens:                                    │
│                                                             │
│     1. ☀️ The sun heats up water in oceans and lakes        │
│     2. 💨 Water turns into invisible vapor and floats up    │
│     3. ❄️ High in the sky, it gets cold and makes clouds   │
│     4. 🌧️ When clouds get too heavy, water falls as rain!  │
│                                                             │
│     It's like when you see steam from a hot bath - that's   │
│     water becoming vapor too!                               │
│                                                             │
│     🎥 Want to learn more? There's a cool video about       │
│     clouds in your library!                                 │
│                                                             │
│  👤 Eddie: Can it rain other things?                        │
│                                                             │
│  🤖 SafeStream: Ooh, fun question! 🌟                       │
│                                                             │
│     On Earth, it mainly rains water. But did you know       │
│     that on other planets, it might rain different things?  │
│     Scientists think it might rain diamonds on some         │
│     planets! 💎                                             │
│                                                             │
│     That's a great thing to ask a grown-up about - they     │
│     might want to explore space videos with you!            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Type your question...                          🎤 📤 │   │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

#### 5.3.5 Safety Triggers & Alerts

| Trigger                       | Action                                      | Parent Alert |
| ----------------------------- | ------------------------------------------- | ------------ |
| Question about violence       | Gentle redirect + "Let's ask a grown-up"    | Yellow alert |
| Repeated concerning questions | End conversation + suggest video            | Orange alert |
| Attempt to discuss people     | Redirect to educational topic               | Log only     |
| Request for personal info     | Decline + educational moment                | Yellow alert |
| Signs of distress             | Comforting response + suggest finding adult | Red alert    |
| Profanity detected            | Gentle correction + continue                | Log only     |

---

### 5.4 Parental Dashboard & Analytics

#### 5.4.1 Dashboard Overview

```
┌─────────────────────────────────────────────────────────────┐
│  SafeStream Kids Admin                    [Parent] [Logout] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👨‍👩‍👧‍👦 Family Overview                              This Week │
│  ├──────────────────────────────────────────────────────────│
│  │                                                          │
│  │  Total Watch Time: 8h 32m    AI Chats: 12    Alerts: 0  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  │                                                          │
│  │  ┌─────────────────┐  ┌─────────────────┐                │
│  │  │ 👧 Tara (3)     │  │ 👦 Eddie (6)    │                │
│  │  │ 2h 15m          │  │ 6h 17m          │                │
│  │  │ 📈 -30min vs LW │  │ 📈 +45min vs LW │                │
│  │  │ ⭐ Top: Music   │  │ ⭐ Top: Animals │                │
│  │  │ 💬 0 AI chats   │  │ 💬 12 AI chats  │                │
│  │  └─────────────────┘  └─────────────────┘                │
│  │                                                          │
│  ├──────────────────────────────────────────────────────────│
│  │                                                          │
│  │  📊 Watch Time by Category (Family)                      │
│  │  ┌────────────────────────────────────────┐              │
│  │  │ Animals      ████████████████ 32%      │              │
│  │  │ Educational  ███████████ 22%           │              │
│  │  │ Music        █████████ 18%             │              │
│  │  │ Stories      ███████ 14%               │              │
│  │  │ Art/Craft    ███ 8%                    │              │
│  │  │ Other        ███ 6%                    │              │
│  │  └────────────────────────────────────────┘              │
│  │                                                          │
│  └──────────────────────────────────────────────────────────│
│                                                             │
│  ⏳ Pending Approvals: 4            📬 Channel Updates: 2  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 5.4.2 Individual Child Analytics

```
┌─────────────────────────────────────────────────────────────┐
│  👦 Eddie's Activity                          Jan 1-9, 2026 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📈 ENGAGEMENT SUMMARY                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Sessions: 14    Avg Duration: 27min    Videos: 31      │ │
│  │ Favorites Added: 5    Playlists Created: 1             │ │
│  │ AI Conversations: 12    Questions Asked: 34            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ⏰ VIEWING PATTERNS                                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │     M   T   W   T   F   S   S                          │ │
│  │ AM  ░   ░   ░   ░   ░   █   █                          │ │
│  │ PM  █   █   ░   █   █   █   █                          │ │
│  │ EVE ░   ░   █   ░   ░   ░   ░                          │ │
│  │                                                        │ │
│  │ Peak: Saturday 10am    Avg Session Start: 3:42pm       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  🔥 INTERESTS (based on watch time + engagement)            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🦁 Animals & Nature        ████████████████████ 94%    │ │
│  │ 🔬 Science Experiments     ██████████████ 67%          │ │
│  │ 🚀 Space & Astronomy       ███████████ 52%             │ │
│  │ 🎵 Music & Movement        ██████ 31%                  │ │
│  │ ✨ NEW: Dinosaurs          ████ (emerging interest)    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  📺 TOP VIDEOS THIS PERIOD                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 1. Ocean Animals          │ 3 views │ 12:30 │ ⭐ Fav   │ │
│  │ 2. Wild Kratts: Wolves    │ 2 views │ 22:00 │         │ │
│  │ 3. How Volcanoes Work     │ 2 views │ 8:45  │ ⭐ Fav  │ │
│  │ 4. T-Rex Documentary      │ 1 view  │ 15:00 │ 💬 Chat │ │
│  │ 5. Butterfly Life Cycle   │ 1 view  │ 6:20  │ 💬 Chat │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  💡 INSIGHTS                                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • Eddie watched 45min more than last week              │ │
│  │ • New interest in dinosaurs - consider adding content  │ │
│  │ • Asked 8 questions about animal habitats              │ │
│  │ • Completed 3 "series" of related videos               │ │
│  │ • Prefers videos 10-20 minutes in length               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  [View Full Watch History] [View AI Conversations] [Export] │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 5.4.3 AI Conversation Logs

```
┌─────────────────────────────────────────────────────────────┐
│  💬 Eddie's AI Conversations                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Filter: [All] [This Week] [Flagged Only]    🔍 Search     │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📅 Jan 9, 2026 - 3:45pm                                │ │
│  │ 🎥 Video: "Dinosaurs: Giants of the Past"              │ │
│  │ 💬 5 messages | Duration: 4 min | ✅ No flags          │ │
│  │                                                        │ │
│  │ Topics discussed:                                      │ │
│  │ • Why dinosaurs went extinct                           │ │
│  │ • How big T-Rex was                                    │ │
│  │ • Whether dinosaurs had feathers                       │ │
│  │                                                        │ │
│  │ [View Full Conversation]                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📅 Jan 8, 2026 - 4:12pm                                │ │
│  │ 🎥 Video: "The Water Cycle Explained"                  │ │
│  │ 💬 3 messages | Duration: 2 min | ✅ No flags          │ │
│  │ [View Full Conversation]                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  📊 QUESTION THEMES (Last 30 Days)                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ "How does X work?"         ████████████ 12 questions   │ │
│  │ "Why do/does X?"           █████████ 9 questions       │ │
│  │ "What is X?"               ██████ 6 questions          │ │
│  │ "Where do X live?"         █████ 5 questions           │ │
│  │ "Can X do Y?"              ██ 2 questions              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  💡 Eddie is most curious about: How things work,          │
│     Animal behaviors, Space phenomena                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 5.4.4 Reports & Exports

**Weekly Digest Email:**

```
Subject: SafeStream Weekly: Eddie & Tara's Week in Review

Hi [Parent],

Here's what your kids explored this week on SafeStream:

👦 EDDIE (6)
━━━━━━━━━━━━━
⏱ Watch Time: 6h 17m (↑ 45min from last week)
📺 Videos: 31 | 🆕 New favorites: 5
💬 AI Chats: 12 about dinosaurs, oceans, space

🔥 Top Interest: Animals & Nature
💡 Emerging Interest: Dinosaurs

Top questions Eddie asked:
• "Why did dinosaurs go extinct?"
• "How do whales sleep underwater?"
• "Is Pluto really not a planet?"

📚 Content Suggestion: Based on Eddie's dinosaur interest,
consider adding "Dino Dana" or "Dinosaur Train" to the library.

👧 TARA (3)
━━━━━━━━━━━━━
⏱ Watch Time: 2h 15m (↓ 30min from last week)
📺 Videos: 18 | 🆕 New favorites: 2
💬 AI Chats: Disabled for age group

🔥 Top Interest: Music & Movement
📺 Most Watched: "Baby Shark" (4 times 🦈)

━━━━━━━━━━━━━━━━━━━━
📋 Pending Approvals: 4 new videos need review
🔔 Alerts: None this week

[View Full Dashboard]
```

**Export Options:**

- CSV export of all viewing data
- PDF reports for any time period
- JSON API for custom integrations
- GDPR-compliant data export

---

### 5.5 Watch Time Controls

#### 5.5.1 Time Limits

```
┌─────────────────────────────────────────────────────────────┐
│  ⏰ Screen Time Settings: Eddie                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DAILY LIMITS                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Weekdays (Mon-Fri)           [●] Enabled               │ │
│  │ ├── Maximum:  [1:30] per day                           │ │
│  │ ├── Warning at: [1:15] remaining                       │ │
│  │ └── Allowed hours: [3:00pm] to [7:00pm]               │ │
│  │                                                        │ │
│  │ Weekends (Sat-Sun)           [●] Enabled               │ │
│  │ ├── Maximum: [2:30] per day                            │ │
│  │ ├── Warning at: [0:30] remaining                       │ │
│  │ └── Allowed hours: [8:00am] to [8:00pm]               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  BREAK REMINDERS                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [●] Remind to take break every [30] minutes            │ │
│  │ [●] Suggest stretching/movement activity               │ │
│  │ [ ] Require break (pause video until acknowledged)     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  SESSION CONTROLS                                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [●] Show time remaining in player                      │ │
│  │ [●] Gentle "Time's almost up" warning                  │ │
│  │ [ ] Require parent PIN to extend time                  │ │
│  │ [●] Allow finishing current video when time expires    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  BEDTIME MODE                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [●] Enable bedtime mode                                │ │
│  │ ├── Starts at: [6:30pm]                                │ │
│  │ ├── Only show: [Calm/Bedtime] collection               │ │
│  │ ├── Dim screen by: [20%]                               │ │
│  │ └── Disable autoplay                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 5.5.2 Time Limit UX (Child-Facing)

**Gentle Warnings:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     ⏰ 15 Minutes Left!                                     │
│                                                             │
│     You're doing great, Eddie!                              │
│     You have time for one more short video                  │
│     or to finish this one.                                  │
│                                                             │
│     [Got it! 👍]                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Time's Up:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     🌟 Great Watching Today! 🌟                             │
│                                                             │
│     You watched for 1 hour and 30 minutes!                  │
│     That's your daily video time.                           │
│                                                             │
│     Ideas for now:                                          │
│     • 🎨 Draw something from a video you liked             │
│     • 📖 Read a book                                        │
│     • 🏃 Go play outside                                    │
│     • 🧩 Play with toys                                     │
│                                                             │
│     See you tomorrow! 👋                                    │
│                                                             │
│     [Parent: Enter PIN to extend] (small, subtle)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 5.6 Multi-Device Support

#### Supported Platforms (Priority Order)

| Platform         | Priority | Implementation       |
| ---------------- | -------- | -------------------- |
| Web (responsive) | P0       | React/Next.js PWA    |
| iOS/iPadOS       | P1       | React Native or PWA  |
| Android Tablet   | P1       | React Native or PWA  |
| Smart TV         | P2       | React-based TV app   |
| Chromecast       | P2       | Cast SDK integration |

#### Device Features

- Session continuity across devices
- "Now Playing" visibility for parents
- Remote pause/lock capability
- Device-specific time limits optional

---

## 6. Technical Architecture

### 6.1 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    SafeStream Kids Architecture             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                   Client Layer                       │   │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│   │  │   Web   │ │  iOS    │ │ Android │ │   TV    │   │   │
│   │  │  (PWA)  │ │  App    │ │   App   │ │   App   │   │   │
│   │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │   │
│   └───────┼───────────┼───────────┼───────────┼─────────┘   │
│           │           │           │           │             │
│           └───────────┴─────┬─────┴───────────┘             │
│                             │                               │
│   ┌─────────────────────────┴───────────────────────────┐   │
│   │                    API Gateway                       │   │
│   │              (Authentication, Rate Limiting)         │   │
│   └─────────────────────────┬───────────────────────────┘   │
│                             │                               │
│   ┌─────────────────────────┴───────────────────────────┐   │
│   │                  Application Layer                   │   │
│   │  ┌─────────────────────────────────────────────┐    │   │
│   │  │              Backend Services                │    │   │
│   │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐     │    │   │
│   │  │  │  Content │ │  User    │ │Analytics │     │    │   │
│   │  │  │ Service  │ │ Service  │ │ Service  │     │    │   │
│   │  │  └──────────┘ └──────────┘ └──────────┘     │    │   │
│   │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐     │    │   │
│   │  │  │   AI     │ │ Ingest   │ │  Media   │     │    │   │
│   │  │  │ Service  │ │ Service  │ │ Service  │     │    │   │
│   │  │  └──────────┘ └──────────┘ └──────────┘     │    │   │
│   │  └─────────────────────────────────────────────┘    │   │
│   └─────────────────────────┬───────────────────────────┘   │
│                             │                               │
│   ┌─────────────────────────┴───────────────────────────┐   │
│   │                    Data Layer                        │   │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐             │   │
│   │  │PostgreSQL│ │  Redis   │ │   S3/    │             │   │
│   │  │(Metadata)│ │ (Cache)  │ │ MinIO    │             │   │
│   │  └──────────┘ └──────────┘ │ (Videos) │             │   │
│   │                            └──────────┘             │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                 External Services                    │   │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐             │   │
│   │  │ yt-dlp   │ │  Ollama  │ │ Whisper  │             │   │
│   │  │(Download)│ │  (LLM)   │ │(Transcr.)│             │   │
│   │  └──────────┘ └──────────┘ └──────────┘             │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Tech Stack Recommendation

| Component           | Technology                                    | Rationale                          |
| ------------------- | --------------------------------------------- | ---------------------------------- |
| **Frontend**        | Next.js 14+ (React)                           | SSR, PWA support, modern React     |
| **Child UI**        | React with Framer Motion                      | Smooth animations, touch-friendly  |
| **Admin UI**        | Next.js + Tailwind + shadcn/ui                | Fast development, good defaults    |
| **Backend**         | Node.js (Express/Fastify) or Python (FastAPI) | Flexible, good for media handling  |
| **Database**        | PostgreSQL                                    | Robust, good for analytics queries |
| **Cache**           | Redis                                         | Session management, rate limiting  |
| **Object Storage**  | MinIO (self-hosted S3)                        | Video file storage                 |
| **Video Streaming** | HLS via custom transcoding                    | Adaptive bitrate, wide support     |
| **Video Download**  | yt-dlp                                        | Best-in-class YouTube downloader   |
| **Transcription**   | Whisper (local)                               | Privacy-preserving, accurate       |
| **AI/LLM**          | Ollama (local) or OpenAI API                  | Local for privacy, API for quality |
| **Search**          | Meilisearch or PostgreSQL FTS                 | Fast, typo-tolerant search         |
| **Auth**            | NextAuth.js or custom JWT                     | Family member management           |
| **Deployment**      | Docker Compose                                | Easy self-hosting                  |

### 6.3 Data Models

```typescript
// Core Models

interface Family {
  id: string;
  name: string;
  createdAt: Date;
  settings: FamilySettings;
}

interface User {
  id: string;
  familyId: string;
  name: string;
  type: "admin" | "child";
  avatar: string;
  settings: UserSettings;
}

interface ChildProfile extends User {
  type: "child";
  birthDate: Date;
  ageGroup: "toddler" | "explorer"; // Toddler (2-4), Explorer (5-12)
  settings: ChildSettings;
}

interface ChildSettings {
  ageRatingMax: "2+" | "4+" | "7+" | "10+";
  aiEnabled: boolean;
  aiVoiceEnabled: boolean;
  timeLimits: TimeLimitConfig;
  theme: string;
  allowedCategories: string[];
}

interface Video {
  id: string;
  sourceUrl: string;
  sourceType: "youtube" | "vimeo" | "upload" | "other";
  localPath: string;
  status: "pending" | "downloading" | "processing" | "ready" | "error";

  // Metadata
  title: string;
  description: string;
  thumbnailPath: string;
  duration: number; // seconds

  // Classification
  ageRating: "2+" | "4+" | "7+" | "10+";
  categories: string[];
  topics: string[]; // AI-extracted + manual

  // Content
  transcript: string | null;
  chapters: Chapter[];

  // Admin
  approvalStatus: "pending" | "approved" | "rejected";
  approvedBy: string | null;
  approvedAt: Date | null;
  notes: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

interface Channel {
  id: string;
  sourceId: string; // e.g., YouTube channel ID
  sourceType: "youtube" | "vimeo" | "other";
  name: string;
  thumbnailUrl: string;

  // Sync settings
  syncMode: "auto-approve" | "review" | "selective";
  syncFrequency: "hourly" | "daily" | "weekly" | "manual";
  selectiveRules: SelectiveRule[];
  defaultAgeRating: string;
  defaultCategories: string[];

  lastSyncAt: Date;
  videoCount: number;
}

interface WatchSession {
  id: string;
  childId: string;
  videoId: string;
  startedAt: Date;
  endedAt: Date | null;
  duration: number; // seconds watched
  completed: boolean;
  lastPosition: number; // seconds
  deviceInfo: DeviceInfo;
}

interface AIConversation {
  id: string;
  childId: string;
  videoId: string;
  startedAt: Date;
  endedAt: Date;
  messages: AIMessage[];
  flags: AIFlag[];
  topics: string[]; // Extracted topics discussed
}

interface AIMessage {
  id: string;
  role: "child" | "assistant";
  content: string;
  timestamp: Date;
  metadata: {
    filtered: boolean;
    originalContent?: string; // If filtered
    processingTime: number;
  };
}

interface Collection {
  id: string;
  familyId: string;
  name: string;
  description: string;
  thumbnailPath: string;
  videoIds: string[];
  type: "manual" | "smart";
  smartRules?: SmartPlaylistRule[];
  visibility: "all" | "specific-ages" | "specific-children";
  visibleTo: string[]; // child IDs or age groups
}

interface Favorite {
  id: string;
  childId: string;
  videoId: string;
  createdAt: Date;
}

interface ChildPlaylist {
  id: string;
  childId: string;
  name: string;
  videoIds: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.4 API Structure

```
/api/v1
├── /auth
│   ├── POST   /login          # Parent login
│   ├── POST   /child-select   # Child profile selection (PIN optional)
│   └── POST   /logout
│
├── /admin
│   ├── /content
│   │   ├── GET    /videos             # List all videos
│   │   ├── POST   /videos/import      # Import from URL
│   │   ├── POST   /videos/upload      # Direct upload
│   │   ├── PATCH  /videos/:id         # Update video metadata
│   │   ├── DELETE /videos/:id         # Remove video
│   │   ├── POST   /videos/:id/approve # Approve video
│   │   └── POST   /videos/:id/reject  # Reject video
│   │
│   ├── /channels
│   │   ├── GET    /                   # List subscribed channels
│   │   ├── POST   /subscribe          # Subscribe to channel
│   │   ├── PATCH  /:id                # Update channel settings
│   │   ├── DELETE /:id                # Unsubscribe
│   │   └── POST   /:id/sync           # Manual sync
│   │
│   ├── /collections
│   │   ├── CRUD operations
│   │   └── POST   /:id/videos         # Add/remove videos
│   │
│   ├── /children
│   │   ├── CRUD operations
│   │   └── PATCH  /:id/settings       # Update child settings
│   │
│   └── /analytics
│       ├── GET    /overview           # Family overview
│       ├── GET    /child/:id          # Child-specific analytics
│       ├── GET    /child/:id/sessions # Watch sessions
│       ├── GET    /child/:id/ai       # AI conversation logs
│       └── GET    /reports/weekly     # Weekly report data
│
├── /child
│   ├── GET    /profile               # Current child profile
│   ├── GET    /home                  # Home screen data
│   ├── GET    /videos                # Browse videos
│   ├── GET    /videos/:id            # Video detail
│   ├── GET    /search                # Search videos
│   ├── GET    /collections           # Available collections
│   ├── GET    /collections/:id       # Collection videos
│   │
│   ├── /watch
│   │   ├── POST   /start             # Start watching (creates session)
│   │   ├── POST   /heartbeat         # Update watch position
│   │   └── POST   /end               # End session
│   │
│   ├── /favorites
│   │   ├── GET    /                  # List favorites
│   │   ├── POST   /                  # Add favorite
│   │   └── DELETE /:videoId          # Remove favorite
│   │
│   ├── /playlists
│   │   ├── CRUD operations
│   │   └── POST   /:id/videos        # Add/remove videos
│   │
│   └── /ai
│       ├── POST   /chat              # Send message, get response
│       └── GET    /history/:videoId  # Previous chat about video
│
└── /media
    ├── GET    /video/:id/stream     # HLS stream endpoint
    ├── GET    /video/:id/thumbnail  # Thumbnail image
    └── GET    /video/:id/captions   # Caption/subtitle file
```

### 6.5 Security Considerations

| Concern              | Mitigation                                                          |
| -------------------- | ------------------------------------------------------------------- |
| **Authentication**   | JWT with short expiry, refresh tokens, PIN for child switching      |
| **Authorization**    | Role-based access (admin vs child), profile-based content filtering |
| **Content Safety**   | All content pre-approved, no external links, sanitized descriptions |
| **AI Safety**        | Input/output filtering, conversation logging, alert system          |
| **Network**          | HTTPS only, local network deployment option, VPN compatible         |
| **Data Privacy**     | All data on-premise, no external analytics, GDPR-ready exports      |
| **Video Protection** | Signed URLs for streaming, no direct download links for children    |

---

## 7. Innovative Features & Design Ideas

### 7.1 "Adventure Mode" - Gamified Learning Paths

Transform video watching into guided learning adventures:

```
┌─────────────────────────────────────────────────────────────┐
│  🚀 SPACE EXPLORER ADVENTURE                Level 2 of 5   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🌍 ─── 🚀 ─── 🌙 ─── ✨ ─── 🪐 ─── ⭐ ─── 🌌              │
│  ✓     ✓     ▶     ○     ○     ○     ○                     │
│ Earth  Rockets Moon  Stars Saturn Galaxies 🏆              │
│                                                             │
│  Current Mission: Learn about the Moon! 🌙                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  📺 Videos to Watch:                                │    │
│  │  [✓] The Moon for Kids (5 min)                      │    │
│  │  [▶] Moon Phases Explained (7 min)                  │    │
│  │  [ ] Apollo 11 Moon Landing (10 min)                │    │
│  │                                                     │    │
│  │  🎯 Bonus Challenge:                                │    │
│  │  Ask the AI: "Why does the moon change shape?"      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  🏅 Rewards: Space Explorer Badge 🧑‍🚀                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**

- Parent-created or pre-made learning paths
- Progress tracking with rewards/badges
- Milestone celebrations
- Certificate generation for completed paths
- Suggested "quests" based on interests

### 7.2 "Video Journals" - Reflection & Creation

Encourage active engagement:

```
┌─────────────────────────────────────────────────────────────┐
│  📓 Eddie's Video Journal                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  After watching: "Ocean Animals"                            │
│                                                             │
│  What did you learn? (tap or voice)                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🎤 "I learned that octopuses have 3 hearts!"        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Draw your favorite part:                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │      [Simple drawing canvas]                        │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ⭐ Rate this video:  ⭐ ⭐ ⭐ ⭐ ☆                          │
│                                                             │
│  [Save to Journal 📓]                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**

- Voice notes about videos
- Simple drawing tool
- Rating system
- Parent-viewable journal
- "Memory" prompts after certain videos

### 7.3 "Watch Together" Mode

Remote co-watching features:

```
┌─────────────────────────────────────────────────────────────┐
│  👨‍👧 Watch Together: Eddie + Grandma                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     ┌───────────────────────────────────────────────┐       │
│     │                                               │       │
│     │              [Video Player]                   │       │
│     │                                               │       │
│     │              ▶ Sync'd playback               │       │
│     │                                               │       │
│     └───────────────────────────────────────────────┘       │
│                                                             │
│     ┌─────────────────┐  ┌─────────────────┐               │
│     │ 📹 Eddie        │  │ 📹 Grandma      │               │
│     │   [camera]      │  │   [camera]      │               │
│     └─────────────────┘  └─────────────────┘               │
│                                                             │
│     💬 "Wow, look at that whale!" - Grandma                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**

- Synchronized playback
- Optional video chat
- Shared reactions
- "Grandma approved" tagging for family
- Remote queue additions

### 7.4 "Curiosity Sparks" - AI-Generated Discussion Prompts

After videos, AI generates age-appropriate discussion starters:

```
┌─────────────────────────────────────────────────────────────┐
│  💡 Curiosity Sparks                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  You just watched: "How Butterflies Are Born"               │
│                                                             │
│  Here are some fun things to think about or discuss:        │
│                                                             │
│  🦋 What's the hardest part about being a caterpillar?      │
│                                                             │
│  🔬 What other animals change shape when they grow up?      │
│                                                             │
│  🎨 If you could design a butterfly, what colors would it   │
│     have?                                                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [💬 Ask the AI]  [📓 Add to Journal]  [Skip →]      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.5 "Content Request" System

Allow children to request content (with parent approval):

```
┌─────────────────────────────────────────────────────────────┐
│  ADMIN: Content Requests                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📬 Eddie requested:                                        │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ "More dinosaur videos please!"                         │ │
│  │                                                        │ │
│  │ Context: Eddie watched 5 dinosaur videos this week     │ │
│  │          and asked AI 8 questions about dinosaurs      │ │
│  │                                                        │ │
│  │ 💡 Suggestions:                                        │ │
│  │ • Dinosaur Train (PBS, 52 episodes)                   │ │
│  │ • Dino Dana (Amazon, 26 episodes)                     │ │
│  │ • Walking with Dinosaurs (BBC, 6 episodes)            │ │
│  │                                                        │ │
│  │ [Review Suggestions] [Add Custom] [Dismiss]            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.6 "Healthy Habits" Integration

Promote balanced screen time:

```
┌─────────────────────────────────────────────────────────────┐
│  🌟 Great job watching for 30 minutes!                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     Time for a wiggle break! 🎵                             │
│                                                             │
│     ┌───────────────────────────────────────────────┐       │
│     │                                               │       │
│     │    [2-minute movement video plays]            │       │
│     │                                               │       │
│     │    🏃 Jump! 🙆 Stretch! 💃 Dance!            │       │
│     │                                               │       │
│     └───────────────────────────────────────────────┘       │
│                                                             │
│     After this, you'll have 1 hour left to watch today!     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.7 Visual Customization for Kids

```
┌─────────────────────────────────────────────────────────────┐
│  🎨 Customize Your SafeStream!                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Pick a theme:                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│  │ 🚀     │ │ 🌊     │ │ 🦁     │ │ 🏰     │               │
│  │ Space  │ │ Ocean  │ │ Safari │ │Fantasy │               │
│  │   ✓    │ │        │ │        │ │        │               │
│  └────────┘ └────────┘ └────────┘ └────────┘               │
│                                                             │
│  Pick your avatar:                                          │
│  🧑‍🚀 👨‍🔬 🦸 🧙 🦊 🐰 🐻 🦄                                  │
│                                                             │
│  Your name on screen:                                       │
│  [Captain Eddie    ]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Months 1-2)

**Goal: Basic functional system**

- [ ] Database schema and migrations
- [ ] Basic authentication (admin only)
- [ ] Video import from YouTube (single video)
- [ ] Simple video player
- [ ] Basic admin video list
- [ ] Local video storage with MinIO

**Deliverable**: Admin can import and watch videos locally

### Phase 2: Child Experience (Months 2-3)

**Goal: Usable by children**

- [ ] Child profiles with PIN selection
- [ ] Age-adaptive home screens (basic versions)
- [ ] Video browsing and playback
- [ ] Favorites and continue watching
- [ ] Basic search
- [ ] Progress tracking
- [ ] Simple time limits

**Deliverable**: Children can safely browse and watch curated content

### Phase 3: Content Management (Months 3-4)

**Goal: Efficient curation workflow**

- [ ] Channel subscriptions
- [ ] Bulk import
- [ ] Approval queue
- [ ] Auto-categorization (basic)
- [ ] Collections and playlists
- [ ] Smart playlists
- [ ] Transcript generation (Whisper)

**Deliverable**: Parents can efficiently manage content library

### Phase 4: Analytics (Months 4-5)

**Goal: Insights for parents**

- [ ] Watch session tracking
- [ ] Admin dashboard
- [ ] Individual child analytics
- [ ] Interest detection
- [ ] Weekly digest emails
- [ ] Export capabilities

**Deliverable**: Parents understand viewing habits in detail

### Phase 5: AI Integration (Months 5-6)

**Goal: Safe interactive learning**

- [ ] Ollama/LLM integration
- [ ] AI chat interface
- [ ] Input/output safety filters
- [ ] Conversation logging
- [ ] Alert system
- [ ] Curiosity Sparks feature

**Deliverable**: Children can ask questions about video content safely

### Phase 6: Polish & Advanced (Months 6-8)

**Goal: Delightful experience**

- [ ] Adventure Mode (learning paths)
- [ ] Video journals
- [ ] Enhanced animations and transitions
- [ ] Theme customization
- [ ] Content request system
- [ ] PWA optimization
- [ ] Mobile app (React Native)

**Deliverable**: Feature-complete platform

### Phase 7: Extended (Ongoing)

- [ ] Watch Together mode
- [ ] Smart TV app
- [ ] Additional platform integrations
- [ ] Multi-language support
- [ ] Community content packs

---

## 9. Success Criteria & Validation

### MVP Success Criteria

| Criteria                     | Target | Validation Method                        |
| ---------------------------- | ------ | ---------------------------------------- |
| Child can watch videos       | Yes    | Manual testing with 3-year-old           |
| Content 100% parent-approved | Yes    | Code review + testing                    |
| Basic analytics work         | Yes    | Dashboard shows accurate data            |
| Time limits enforced         | Yes    | Test boundary conditions                 |
| AI chat is safe              | Yes    | Red team testing with adversarial inputs |

### Long-term Success Metrics

| Metric                      | Target               | Timeframe            |
| --------------------------- | -------------------- | -------------------- |
| Weekly active usage         | 5+ days/week         | 3 months post-launch |
| Parent dashboard engagement | 80% weekly check-ins | 3 months             |
| AI safety incidents         | 0                    | Ongoing              |
| Child satisfaction          | Prefers to YouTube   | 6 months             |
| Content library growth      | 500+ approved videos | 6 months             |

---

## 10. Risks & Mitigations

| Risk                                     | Impact | Likelihood | Mitigation                                   |
| ---------------------------------------- | ------ | ---------- | -------------------------------------------- |
| **yt-dlp breaks due to YouTube changes** | High   | Medium     | Monitor updates, have fallback sources       |
| **AI generates inappropriate content**   | High   | Low        | Multi-layer filtering, conservative defaults |
| **Child finds way to bypass limits**     | Medium | Medium     | Defense in depth, age-appropriate challenges |
| **Storage becomes expensive**            | Medium | Medium     | Configurable retention, quality settings     |
| **System too complex for self-hosting**  | High   | Medium     | Docker one-click, good documentation         |
| **Child loses interest**                 | Medium | Low        | Gamification, personalization, variety       |

---

## 11. Glossary

| Term                 | Definition                                             |
| -------------------- | ------------------------------------------------------ |
| **Adventure Mode**   | Gamified learning paths with progress tracking         |
| **Age Rating**       | Content classification (2+, 4+, 7+, 10+)               |
| **Curiosity Sparks** | AI-generated discussion prompts post-video             |
| **Ingest**           | Process of importing and processing video content      |
| **Profile**          | Individual child's account with personalized settings  |
| **Smart Playlist**   | Auto-updating playlist based on rules                  |
| **Watch Session**    | Single continuous viewing period tracked for analytics |

---

## 12. Appendices

### A. Competitor Analysis

| Platform         | Pros                     | Cons                                      |
| ---------------- | ------------------------ | ----------------------------------------- |
| **YouTube Kids** | Large library, free      | Poor filtering, no parental insights, ads |
| **Netflix Kids** | Good UI, no ads          | No curation control, limited educational  |
| **Jellyfin**     | Self-hosted, open source | Not designed for kids, no safety features |
| **Plex**         | Good media server        | Minimal kid-specific features             |

### B. Recommended Initial Content Sources

| Source                   | Content Type              | Notes                                  |
| ------------------------ | ------------------------- | -------------------------------------- |
| PBS Kids                 | Educational               | Excellent quality, age-appropriate     |
| National Geographic Kids | Nature/Science            | High production value                  |
| Khan Academy Kids        | Educational               | Structured learning                    |
| Cosmic Kids Yoga         | Movement/Mindfulness      | Great for breaks                       |
| StoryBots                | Educational/Entertainment | Engaging for young kids                |
| SciShow Kids             | Science                   | Good for curious minds                 |
| Numberblocks/Alphablocks | Math/Reading              | BBC, excellent for foundational skills |

### C. Privacy & Data Handling

All data remains on-premise:

- Videos stored locally
- Analytics in local database
- AI inference via local Ollama (optional cloud)
- No third-party tracking
- GDPR-compliant data exports available

---

## Document History

| Version | Date         | Author      | Changes                                                                               |
| ------- | ------------ | ----------- | ------------------------------------------------------------------------------------- |
| 1.0     | January 2026 | Parent + AI | Initial PRD creation                                                                  |
| 1.1     | January 2026 | Parent + AI | Combined Explorer (5-7) and Independent (8-12) modes into single Explorer mode (5-12) |

---

_This PRD is a living document and will be updated as the project evolves._
