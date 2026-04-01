# Interactive Knowledge Graph

## What This Is

An interactive visual graph that shows connections between videos, topics, and concepts children have watched. Kids explore like a mind map to discover related content visually. Parents see their child's learning journey to understand interests and guide future content imports and real-world purchases (books, toys, activities).

## Core Value

Visual discovery - children find new videos through intuitive topic exploration instead of search or browse, making content discovery feel like play.

## Requirements

### Validated

These capabilities already exist in PlayPatch and will be leveraged:

- ✓ Video metadata and topics already tagged — existing
- ✓ Watch session tracking with duration and completion — existing
- ✓ AI service for entity extraction (Ollama/OpenAI) — existing
- ✓ Child profiles with UI modes (Explorer/Toddler) — existing
- ✓ React Force Graph 2D library already in stack — existing
- ✓ Prisma + PostgreSQL database layer — existing
- ✓ Parent and child view separation — existing

### Active

These are the new capabilities we're building for the knowledge graph:

- [ ] **Graph database schema** - Node and edge tables for knowledge graph relationships
- [ ] **AI entity extraction** - Extract topics/concepts from video transcripts and descriptions
- [ ] **Connection algorithms** - Build weighted edges based on category, topic co-appearance, and watch sequence
- [ ] **Graph builder service** - Process watch history into graph structure
- [ ] **Node ranking** - Identify top 50-100 most relevant nodes to display
- [ ] **D3.js visualization** - Interactive force-directed graph with zoom/pan/click
- [ ] **Explorer mode UI** - Full interactive graph with detailed connections
- [ ] **Toddler mode UI** - Simplified version with big colorful bubbles
- [ ] **Video watch page integration** - "Explore Topics" button to launch graph
- [ ] **Home screen section** - Dedicated "My Learning Map" entry point
- [ ] **Node interactions** - Click topic to zoom, highlight connections, show related videos
- [ ] **Watched/unwatched visual distinction** - Different colors for discovered vs watched content
- [ ] **Parent insights view** - Show deep vs shallow interests, learning paths
- [ ] **Graph API endpoints** - Fetch graph data for profile, centered on video, filtered by parameters

### Out of Scope

Deferred to v2 or explicitly excluded:

- AI chat connections — defer to v2 (requires AI conversation analysis)
- Temporal interest tracking — defer to v2 (tracks how interests evolve over time)
- 3D graph visualization — defer (2D sufficient for v1)
- Real-time graph updates — defer (rebuild on page load is sufficient)
- Graph sharing between siblings — defer (privacy concerns)
- Export as image/PDF — defer (nice-to-have, not core)
- Full watch history view — explicitly limited to top 50-100 nodes for performance

## Context

**Brownfield project:** PlayPatch is an existing self-hosted video platform for children (ages 2-12) with 100% parent-approved content. Core platform is ~85% complete with video player, AI chat, analytics, content import (YouTube + RealDebrid), and recommendation system all working.

**Inspiration:** Adapted from "Society Map" concept - uses AI entity extraction, fuzzy matching (92% threshold), Union-Find deduplication, and weighted co-appearance algorithms to build intelligent relationships.

**User modes:**

- **Explorer mode (ages 5-12):** Full features, detailed interface, search capabilities
- **Toddler mode (ages 2-4):** Simplified UI with big buttons, limited complexity

**Current state:**

- Chat Memory UI is fully implemented
- Progress bars, Continue Watching, time remaining badges all working
- Sentry error tracking configured
- Health check scripts and Docker one-click installer complete

**Key use case for parents:**
"I can see my child is deeply interested in ocean mammals → import more ocean documentaries, buy ocean animal books/toys, plan aquarium visit"

## Constraints

- **Tech stack:** Next.js 15, TypeScript 5.3, React 18, Prisma 5.9, PostgreSQL - must integrate with existing architecture
- **Performance:** Limit displayed nodes to top 50-100 for responsive visualization (full graph in backend)
- **Compatibility:** Must work in both Explorer and Toddler UI modes with appropriate simplification
- **Safety:** All parent controls and content filtering must still apply to discovered videos
- **Timeline:** Realistic implementation in 2-3 weeks with phased approach

## Key Decisions

| Decision                                           | Rationale                                                                | Outcome   |
| -------------------------------------------------- | ------------------------------------------------------------------------ | --------- |
| Use React Force Graph 2D instead of D3.js directly | Already in stack, optimized for performance, simpler API                 | — Pending |
| Start with video-centric view (not full history)   | Focused discovery from current context, manageable scope                 | — Pending |
| Defer AI chat connections to v2                    | Core value is visual discovery via topics, chat analysis adds complexity | — Pending |
| Top 50-100 node display limit                      | Balance between rich exploration and performance/visual clarity          | — Pending |
| Both watch page and home screen entry points       | Contextual discovery (watch page) + dedicated exploration (home screen)  | — Pending |
| Toddler mode gets simplified version               | Ages 2-4 need simpler interaction model, not full graph complexity       | — Pending |

---

_Last updated: 2026-02-03 after initialization_
