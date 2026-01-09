# Database Utilities

This directory contains database-related utilities and query functions.

## Structure

- `client.ts` - Prisma client singleton
- `queries/` - Organized query functions by domain
  - `users.ts` - User and child profile queries
  - `videos.ts` - Video queries
  - `analytics.ts` - Analytics queries
  - etc.

## Usage

```typescript
import { prisma } from '@/lib/db/client';

// Use Prisma client directly
const users = await prisma.user.findMany();

// Or import specific query functions
import { getUserByEmail } from '@/lib/db/queries/users';
const user = await getUserByEmail('email@example.com');
```

## Migrations

Run migrations:
```bash
pnpm db:migrate
```

Generate Prisma Client:
```bash
pnpm db:generate
```

Open Prisma Studio:
```bash
pnpm db:studio
```
