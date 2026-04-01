# Phase 6: Mobile & Scale

**Duration:** 4-6 weeks
**Goal:** Multi-platform availability and horizontal scalability
**Status:** 📋 Planned
**Prerequisites:** Phase 5 complete

## Overview

This phase expands PlayPatch to mobile platforms and prepares infrastructure for growth. Users can access PlayPatch from any device, and the system can handle increasing load.

## Success Criteria

- ✅ PWA installable on all major browsers
- ✅ iOS app in App Store
- ✅ Android app in Play Store
- ✅ Offline video playback works
- ✅ Cross-device sync <5s latency
- ✅ System handles 1000+ concurrent users
- ✅ CDN reduces video load by 80%
- ✅ Core Web Vitals all "Good"

## Key Features

### 1. Progressive Web App (PWA)

**PWA Features:**
- Installable on mobile and desktop
- Works offline (cached content)
- Push notifications
- Native-like experience
- Auto-updates
- App-like icon on home screen

**Offline Support:**
- Downloaded videos playable offline
- Offline queue management
- Auto-sync when online
- Conflict resolution

### 2. Native Mobile Apps

**React Native Apps:**
- Shared codebase (90%+)
- Native navigation
- Native video player
- Biometric authentication
- Push notifications
- Background downloads

**Platform-Specific:**
- iOS: Apple Sign In, StoreKit
- Android: Google Sign In, Play Billing

### 3. Scalability Enhancements

**Horizontal Scaling:**
- Stateless application servers
- Centralized session store (Redis)
- Database read replicas
- Worker auto-scaling

**Performance Optimization:**
- CDN for video delivery
- Edge caching
- Database query optimization
- Connection pooling
- Asset optimization

### 4. Multi-Region Support

**Geographic Distribution:**
- CDN edge locations
- Regional storage buckets
- Geo-distributed caching
- Latency optimization

**Data Sovereignty:**
- Regional data storage option
- GDPR compliance
- Data residency controls

## Technical Specifications

### PWA Configuration

```javascript
// apps/web/public/manifest.json
{
  "name": "PlayPatch",
  "short_name": "PlayPatch",
  "description": "Safe video platform for children",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "orientation": "any",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["education", "entertainment", "kids"],
  "screenshots": [
    {
      "src": "/screenshots/home-mobile.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/player-mobile.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/home-desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ]
}

// apps/web/next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
        }
      }
    },
    {
      urlPattern: /^https:\/\/storage\.playpatch\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'video-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 1 week
        }
      }
    },
    {
      urlPattern: /^\/api\/videos/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10
      }
    }
  ]
});

module.exports = withPWA({
  // existing config
});
```

### Service Worker

```typescript
// apps/web/src/service-worker/offline.ts
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Video streaming
registerRoute(
  /\.m3u8$/,
  new CacheFirst({
    cacheName: 'video-manifests',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
      }),
    ],
  })
);

// API requests
registerRoute(
  /^https:\/\/api\.playpatch\.com\//,
  new NetworkFirst({
    cacheName: 'api-responses',
    networkTimeoutSeconds: 10,
  })
);

// Offline fallback
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      })
    );
  }
});
```

### React Native App Structure

```
apps/
└── mobile/
    ├── ios/                    # iOS-specific code
    ├── android/                # Android-specific code
    ├── src/
    │   ├── navigation/         # React Navigation
    │   │   ├── RootNavigator.tsx
    │   │   ├── AuthNavigator.tsx
    │   │   └── ChildNavigator.tsx
    │   ├── screens/
    │   │   ├── auth/
    │   │   │   ├── LoginScreen.tsx
    │   │   │   └── ProfileSelectScreen.tsx
    │   │   ├── child/
    │   │   │   ├── HomeScreen.tsx
    │   │   │   ├── VideoPlayerScreen.tsx
    │   │   │   └── SearchScreen.tsx
    │   │   └── admin/
    │   │       ├── DashboardScreen.tsx
    │   │       └── AnalyticsScreen.tsx
    │   ├── components/         # Shared components
    │   ├── services/           # API clients
    │   ├── stores/             # Zustand stores
    │   └── utils/              # Utilities
    ├── package.json
    └── app.json
```

### Scaling Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Load Balancer                         │
│                      (nginx/Traefik)                         │
└───────────┬─────────────────────────────────────────────────┘
            │
            ├─→ App Server 1 ─┐
            ├─→ App Server 2 ─┼─→ Redis (Sessions & Cache)
            └─→ App Server N ─┘
                    │
                    ├─→ PostgreSQL Primary
                    │       └─→ Read Replica 1
                    │       └─→ Read Replica 2
                    │
                    ├─→ Worker Pool
                    │   ├─→ Worker 1
                    │   ├─→ Worker 2
                    │   └─→ Worker N
                    │
                    └─→ CDN (Cloudflare/CloudFront)
                            └─→ Video Storage (MinIO/S3)
```

## Week-by-Week Breakdown

### Week 1-2: PWA Implementation

**Week 1: PWA Setup**
- [ ] Configure next-pwa
- [ ] Create manifest.json
- [ ] Design app icons (all sizes)
- [ ] Implement service worker
- [ ] Add install prompts
- [ ] Test installability

**Week 2: Offline Support**
- [ ] Implement offline video caching
- [ ] Build offline queue UI
- [ ] Add sync indicators
- [ ] Handle offline API calls
- [ ] Test offline flows
- [ ] Optimize cache strategy

**Acceptance Criteria:**
- PWA installs on Chrome, Safari, Edge
- Offline video playback works
- Sync happens automatically
- Core Web Vitals pass

### Week 3-4: React Native Apps

**Week 3: App Foundation**
- [ ] Initialize React Native project
- [ ] Set up navigation
- [ ] Build authentication screens
- [ ] Implement API client
- [ ] Set up state management
- [ ] Add push notifications

**Week 4: Feature Parity**
- [ ] Build child home screen
- [ ] Implement video player (react-native-video)
- [ ] Add search functionality
- [ ] Build favorites/playlists
- [ ] Implement AI chat
- [ ] Add offline downloads

**Acceptance Criteria:**
- App builds for iOS and Android
- Core features work natively
- Performance is smooth (60fps)
- Push notifications work

### Week 5: Scalability

**Days 1-2: Database Optimization**
- [ ] Set up read replicas
- [ ] Implement connection pooling
- [ ] Add query caching
- [ ] Optimize slow queries
- [ ] Add database indexes
- [ ] Test with load

**Days 3-4: Application Scaling**
- [ ] Make app servers stateless
- [ ] Move sessions to Redis
- [ ] Configure load balancer
- [ ] Set up auto-scaling
- [ ] Implement health checks
- [ ] Test failover

**Day 5: Worker Scaling**
- [ ] Implement worker auto-scaling
- [ ] Add job prioritization
- [ ] Optimize job processing
- [ ] Monitor queue depth
- [ ] Test under load

**Acceptance Criteria:**
- System handles 1000+ concurrent users
- Database queries remain fast
- Workers scale automatically
- No single point of failure

### Week 6: CDN & Optimization

**Days 1-2: CDN Integration**
- [ ] Configure CloudFront/Cloudflare
- [ ] Set up edge caching rules
- [ ] Migrate static assets
- [ ] Configure video streaming
- [ ] Set cache headers
- [ ] Test CDN performance

**Days 3-4: Performance Optimization**
- [ ] Optimize images (next/image)
- [ ] Code splitting
- [ ] Tree shaking
- [ ] Bundle size optimization
- [ ] Lazy loading
- [ ] Critical CSS

**Day 5: Final Testing**
- [ ] Load testing (k6, Artillery)
- [ ] Lighthouse audits
- [ ] Mobile performance testing
- [ ] Cross-browser testing
- [ ] App Store submission prep
- [ ] Documentation updates

**Acceptance Criteria:**
- CDN handles 80% of requests
- Core Web Vitals all "Good"
- Apps ready for store submission
- Performance benchmarks met

## Mobile App Features

### iOS App
- [ ] Native video player (AVPlayer)
- [ ] Face ID/Touch ID authentication
- [ ] Background downloads
- [ ] Picture-in-Picture
- [ ] Apple Sign In
- [ ] Siri Shortcuts (optional)
- [ ] Widget (optional)

### Android App
- [ ] Native video player (ExoPlayer)
- [ ] Biometric authentication
- [ ] Background downloads
- [ ] Picture-in-Picture
- [ ] Google Sign In
- [ ] Quick Settings tiles (optional)
- [ ] Widget (optional)

## Performance Targets

### PWA
| Metric | Target | Measurement |
|--------|--------|-------------|
| Lighthouse Score | >90 | Lighthouse |
| LCP | <2.5s | Core Web Vitals |
| FID | <100ms | Core Web Vitals |
| CLS | <0.1 | Core Web Vitals |
| Time to Interactive | <3s | Lighthouse |

### Mobile Apps
| Metric | Target | Measurement |
|--------|--------|-------------|
| App Launch Time | <2s | Profiling |
| Video Start Time | <1.5s | Analytics |
| Frame Rate | 60fps | Profiling |
| App Size (iOS) | <50MB | Xcode |
| App Size (Android) | <30MB | Android Studio |

### Scalability
| Metric | Target | Measurement |
|--------|--------|-------------|
| Concurrent Users | 1000+ | Load testing |
| API Response (p95) | <300ms | Monitoring |
| Database Query (p95) | <50ms | Monitoring |
| Worker Throughput | 100 jobs/min | Monitoring |
| CDN Hit Rate | >80% | CDN analytics |

## Infrastructure Requirements

### Production Scaling
```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  app:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2.0'
          memory: 4G

  worker:
    deploy:
      replicas: 5
      resources:
        limits:
          cpus: '1.0'
          memory: 2G

  postgres:
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 8G

  redis:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
```

### CDN Configuration
```javascript
// cloudflare-worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // Cache videos for 1 week
  if (url.pathname.match(/\.(m3u8|ts)$/)) {
    const cache = caches.default;
    let response = await cache.match(request);

    if (!response) {
      response = await fetch(request);
      response = new Response(response.body, response);
      response.headers.set('Cache-Control', 'public, max-age=604800');
      event.waitUntil(cache.put(request, response.clone()));
    }

    return response;
  }

  return fetch(request);
}
```

## App Store Submission

### iOS App Store
- [ ] Create App Store Connect account
- [ ] Prepare app metadata
  - App name and description
  - Keywords
  - Screenshots (all sizes)
  - Privacy policy
  - Age rating
- [ ] Create provisioning profiles
- [ ] Build release version
- [ ] Submit for review
- [ ] Monitor review status

### Google Play Store
- [ ] Create Google Play Console account
- [ ] Prepare store listing
  - App title and description
  - Feature graphic
  - Screenshots (all sizes)
  - Privacy policy
  - Content rating
- [ ] Generate signed APK/AAB
- [ ] Create release track
- [ ] Submit for review
- [ ] Monitor review status

## Testing Strategy

### PWA Testing
```typescript
describe('PWA Features', () => {
  it('is installable', async () => {
    await page.goto('/');
    const installPrompt = await page.locator('#install-button');
    await expect(installPrompt).toBeVisible();
  });

  it('works offline', async () => {
    await page.goto('/');
    await page.context().setOffline(true);
    await page.reload();
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
  });

  it('caches videos for offline', async () => {
    const video = await downloadVideoForOffline('video-1');
    await page.context().setOffline(true);
    await playVideo('video-1');
    await expect(page.locator('video')).toBeVisible();
  });
});
```

### Mobile App Testing
```typescript
// Detox E2E tests
describe('Mobile App', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should login successfully', async () => {
    await element(by.id('email-input')).typeText('demo@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    await expect(element(by.id('home-screen'))).toBeVisible();
  });

  it('should play video', async () => {
    await element(by.id('video-card')).atIndex(0).tap();
    await expect(element(by.id('video-player'))).toBeVisible();
    await element(by.id('play-button')).tap();
    // Wait for video to start playing
  });
});
```

## Known Challenges

### Challenge 1: iOS App Store Review
**Problem:** Strict review guidelines
**Solution:**
- Follow Human Interface Guidelines
- Comprehensive content rating
- Clear privacy policy
- No external payment links

### Challenge 2: Video Streaming on Mobile
**Problem:** Variable network conditions
**Solution:**
- Adaptive bitrate streaming
- Offline downloads
- Network quality detection
- Graceful degradation

### Challenge 3: Database Scaling
**Problem:** Write bottleneck on single primary
**Solution:**
- Read replicas for queries
- Connection pooling
- Query optimization
- Eventual consistency where acceptable

## Migration Guide

### PWA Deployment
```bash
# Build PWA
pnpm build

# Test PWA locally
pnpm start

# Deploy to production
# Ensure HTTPS is enabled
# Service worker will auto-update clients
```

### Mobile App Release
```bash
# iOS
cd apps/mobile/ios
fastlane release

# Android
cd apps/mobile/android
./gradlew bundleRelease
```

## Environment Variables

```env
# CDN Configuration
CDN_URL=https://cdn.playpatch.com
CDN_ENABLED=true

# Push Notifications
FIREBASE_SERVER_KEY=...
FIREBASE_PROJECT_ID=...

# App Store
IOS_BUNDLE_ID=com.playpatch.app
ANDROID_PACKAGE_NAME=com.playpatch.app
```

## Deliverables

1. **PWA**
   - Installable web app
   - Offline support
   - Push notifications
   - App-like experience

2. **Mobile Apps**
   - iOS app in App Store
   - Android app in Play Store
   - Feature parity with web
   - Native performance

3. **Scalability**
   - Multi-server deployment
   - Database replicas
   - Worker auto-scaling
   - Load balancer config

4. **CDN**
   - Edge caching
   - Video streaming optimization
   - Static asset delivery
   - Performance improvement

5. **Documentation**
   - Mobile app setup guide
   - Scaling guide
   - CDN configuration docs
   - App Store submission guide

## Success Metrics

### Adoption
- PWA install rate >20%
- Mobile app downloads >500 in first month
- Cross-platform usage >30%

### Performance
- Core Web Vitals all "Good"
- Mobile app rating >4.5 stars
- CDN hit rate >80%
- System uptime >99.9%

### Scalability
- Concurrent users >1000
- Auto-scaling works
- Zero downtime deployments

---

**Phase Owner:** Mobile + DevOps Team
**Status:** 📋 Planning
**Start Date:** After Phase 5
**Target Completion:** 6 weeks from start
