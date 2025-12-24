This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Your Supabase project URL (found in Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Your Supabase publishable key (found in Project Settings > API)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key

# Your Supabase secret key (found in Project Settings > API)
# WARNING: This key bypasses Row Level Security - keep it secret!
# Only used for admin operations like bulk imports
SUPABASE_SECRET_KEY=your-secret-key
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Scripts

### Import Anime Data

To import anime data from `anime.json` into the database:

```bash
npm run import:anime
```

This script:
- Reads the `anime.json` file from the project root
- Transforms and maps fields to the database schema
- Creates studios on-the-fly and links them via junction tables
- Creates streaming platform links
- Processes records in batches of 100
- Uses upsert to allow re-running without duplicates

**Requirements:**
- `anime.json` file in the project root
- Valid Supabase credentials in `.env.local`
- Database tables must already exist (see `docs/technical-spec.md`)
