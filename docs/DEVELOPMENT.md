# Development Guide

This guide covers development practices and conventions for PlayPatch.

## TypeScript Path Aliases

We use TypeScript path aliases to make imports cleaner and more maintainable.

### Available Aliases

```typescript
// Base alias - use for anything in src/
import { something } from '@/path/to/file';

// Component imports
import { Button } from '@/components/ui/button';
import { VideoGrid } from '@/components/admin/video-grid';

// Library/utility imports
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { formatDuration } from '@/lib/utils/shared';

// Type imports
import type { Video } from '@/types/video';

// App imports (pages, API routes)
import { metadata } from '@/app/layout';
```

### Configuration

Path aliases are configured in `apps/web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"],
      "@/app/*": ["./src/app/*"]
    }
  }
}
```

### Before and After

**Before (relative imports):**

```typescript
import { Button } from '../../../../components/ui/button';
import { prisma } from '../../../lib/db/client';
import { formatDuration } from '../../lib/utils/shared';
```

**After (path aliases):**

```typescript
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db/client';
import { formatDuration } from '@/lib/utils/shared';
```

### Benefits

- **Cleaner code:** No more `../../../` paths
- **Easier refactoring:** Imports don't break when moving files
- **Better IDE support:** Auto-complete works better
- **Consistent imports:** Same syntax across the codebase

### Guidelines

1. **Always use path aliases for src/ imports**

   ```typescript
   // ✅ Good
   import { Video } from '@/types/video';

   // ❌ Bad
   import { Video } from '../../../types/video';
   ```

2. **Use specific aliases when available**

   ```typescript
   // ✅ Better (more explicit)
   import { Button } from '@/components/ui/button';

   // ✅ Also fine
   import { Button } from '@/components/ui/button';
   ```

3. **Relative imports are OK for same directory**

   ```typescript
   // ✅ OK for files in same directory
   import { helper } from './helper';
   import type { LocalType } from './types';
   ```

4. **Group imports logically**

   ```typescript
   // External packages
   import { useState } from 'react';
   import Link from 'next/link';

   // Internal imports (@/ aliases)
   import { Button } from '@/components/ui/button';
   import { prisma } from '@/lib/db/client';
   import type { Video } from '@/types/video';

   // Relative imports
   import { helper } from './helper';
   ```

## Project Structure

Understanding the structure helps you use path aliases effectively:

```
apps/web/src/
├── app/                    # Next.js App Router (@/app/*)
│   ├── api/               # API routes
│   ├── child/             # Child-facing pages
│   ├── admin/             # Admin pages
│   └── auth/              # Auth pages
├── components/             # React components (@/components/*)
│   ├── ui/                # Reusable UI components
│   ├── child/             # Child-specific components
│   ├── admin/             # Admin components
│   └── analytics/         # Analytics components
├── lib/                    # Libraries and utilities (@/lib/*)
│   ├── db/                # Database (Prisma)
│   ├── ai/                # AI services
│   ├── auth/              # Authentication
│   ├── utils/             # Utility functions
│   └── actions/           # Server actions
└── types/                  # TypeScript types (@/types/*)
```

## Common Import Patterns

### Database Access

```typescript
import { prisma } from '@/lib/db/client';
import { getVideosByFamily } from '@/lib/db/queries/videos';
```

### UI Components

```typescript
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { VideoGrid } from '@/components/child/video-grid';
```

### Utilities

```typescript
import { formatDuration, formatDate } from '@/lib/utils/shared';
import { getAllowedAgeRatings } from '@/lib/utils/age-rating';
```

### Actions

```typescript
import { createVideo } from '@/lib/actions/videos';
import { getChildSession } from '@/lib/actions/profile-selection';
```

### Types

```typescript
import type { Video, VideoStatus } from '@/types/video';
import type { ChildProfile } from '@prisma/client';
```

## IDE Configuration

### VS Code

Path aliases work automatically in VS Code. For better IntelliSense:

1. **Install TypeScript extension** (usually pre-installed)
2. **Reload window** after changing tsconfig.json
3. **Restart TS server:** Cmd+Shift+P → "TypeScript: Restart TS Server"

### IntelliJ/WebStorm

Path aliases are automatically detected from tsconfig.json.

## Troubleshooting

### Import not found

If imports aren't resolving:

1. **Check tsconfig.json** is correct
2. **Restart TypeScript server**
3. **Check file path** matches alias pattern
4. **Verify file exists** at expected location

### Relative imports still used

To find and replace relative imports:

```bash
# Find relative imports
grep -r "from '\.\./\.\./\.\." apps/web/src

# Or use your IDE's find/replace with regex
Find: from ['"](\.\./)
Replace: from '@
```

## Next Steps

- Read [CONTRIBUTING.md](../CONTRIBUTING.md) for development workflow
- See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- Check [README.md](../README.md) for setup instructions

---

**Path aliases make imports cleaner and more maintainable!**
