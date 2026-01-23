---
created: 2026-01-23T12:00
title: Add channel edit functionality
area: ui
files:
  - TBD
---

## Problem

Currently, channels only have "View", "Sync Now", and "Delete" options. There's no way to edit or change channel settings after creation. If a user wants to change:
- Sync cadence (how often to check for new videos)
- Minimum video length
- Maximum video length
- Other channel-specific settings

They have to delete and recreate the channel, which is inconvenient and could lose data/history.

## Solution

Add an "Edit" action/button for channels:
1. Create an edit channel form/modal with all configurable fields:
   - Sync cadence/frequency
   - Min/max video length filters
   - Other channel settings from creation form
2. Add API endpoint to update channel settings (PUT/PATCH /api/channels/:id)
3. Update the channels list UI to include "Edit" action alongside existing actions
4. Validate that changes don't break existing functionality
5. Consider showing what will change if filters are modified (e.g., videos that no longer match)

Files likely involved:
- Channel list component (with actions dropdown/buttons)
- Edit channel form/modal component
- API route for updating channels
- Channel settings validation logic
