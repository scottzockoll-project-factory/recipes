# recipes

## Tech Stack
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Framework**: Next.js App Router (unless otherwise specified)

## Code Quality
- Write production-quality code. No placeholder comments, no TODOs.
- Handle errors gracefully with user-friendly messages.
- Use TypeScript strict mode. No `any` types unless absolutely necessary.
- Use server actions or API routes for data mutations, never client-side direct DB access.

## Secrets
- NEVER hardcode secrets, API keys, or database URLs.
- Always read from environment variables.

## Build Verification
- The app MUST pass `npm run build` with zero errors.


## postgres - Neon Postgres database with Drizzle ORM
- **usage**: Import `db` from `@/db`. Define schema in `src/db/schema.ts`. Use Drizzle query API.
- **schema**: Use serial('id').primaryKey(), include createdAt/updatedAt timestamps.
- **imports**: import { db } from '@/db'; import { myTable } from '@/db/schema';


## frontend - Vercel frontend hosting with custom domain and DNS
- **usage**: Your app is deployed to Vercel on every push to main. Custom domain: <slug>.scottzockoll.com
- **framework**: Vercel auto-detects your framework (Next.js, Vite, Astro, etc).


