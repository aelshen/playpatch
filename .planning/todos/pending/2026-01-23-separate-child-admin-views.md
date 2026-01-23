---
created: 2026-01-23T11:58
title: Separate child view from admin view access
area: auth
files:
  - TBD
---

## Problem

Need a better way to differentiate between the child view and the admin view. Currently, a child should not be able to navigate to the admin portal, but there may not be sufficient separation or access controls to prevent this.

Security concerns:
- Children could potentially access admin functionality
- No clear visual/navigation separation between user types
- Risk of children accessing content management, settings, or other admin features
- May lack proper role-based access control (RBAC)

## Solution

Implement proper view separation:
1. Add role-based route guards (middleware) to protect admin routes
2. Create separate navigation components for child vs admin users
3. Implement different layouts for child and admin views
4. Add session/token validation to ensure role matches accessed routes
5. Consider separate subdomains or path prefixes (/child/* vs /admin/*)
6. Hide admin navigation elements entirely from child profiles
7. Add redirect logic to send children to child view if they attempt admin access

Files likely involved:
- Auth middleware/guards
- Layout components
- Navigation components
- Route configuration
- Role/permission definitions
