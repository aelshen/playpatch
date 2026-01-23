---
created: 2026-01-23T11:55
title: Filter channel videos when clicking "view videos"
area: ui
files:
  - TBD
---

## Problem

When viewing channels in the "View Channels" page, clicking "View Videos" navigates to all videos instead of filtering for videos from just that channel. This makes it difficult for users to quickly see content from a specific channel they're interested in.

## Solution

Update the "View Videos" button/link on the channels page to:
1. Pass the channel ID as a query parameter (e.g., `/videos?channelId=123`)
2. Apply channel filter on the videos page when the parameter is present
3. Show active filter indicator in the UI

Files likely involved:
- Channel listing component
- Videos page/component
- Video filtering logic
