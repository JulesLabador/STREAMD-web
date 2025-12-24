# STREAMD Database Migrations

This folder contains SQL migration scripts for the STREAMD PostgreSQL database.

## Migration Files

| File | Description |
|------|-------------|
| `000_reset.sql` | ⚠️ Development only - Drops all tables and data |
| `001_initial_schema.sql` | Core table definitions with indexes and constraints |
| `002_functions_triggers.sql` | Database functions and triggers for automation |
| `003_rls_policies.sql` | Row Level Security policies for all tables |
| `004_seed_data.sql` | Initial seed data (genres, studios) |

## Running Migrations

### Option 1: Supabase CLI (Recommended)

```bash
# Initialize Supabase (if not already done)
npx supabase init

# Link to your project
npx supabase link --project-ref <your-project-ref>

# Run migrations
npx supabase db push
```

### Option 2: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run each migration file in order (001 → 002 → 003 → 004)

### Option 3: Direct psql Connection

```bash
# Get your connection string from Supabase Dashboard > Settings > Database
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Run migrations in order
\i supabase/migrations/001_initial_schema.sql
\i supabase/migrations/002_functions_triggers.sql
\i supabase/migrations/003_rls_policies.sql
\i supabase/migrations/004_seed_data.sql
```

## Resetting the Database (Development Only)

⚠️ **WARNING**: This will delete all data!

```bash
# Run reset script first
\i supabase/migrations/000_reset.sql

# Then run all migrations again
\i supabase/migrations/001_initial_schema.sql
\i supabase/migrations/002_functions_triggers.sql
\i supabase/migrations/003_rls_policies.sql
\i supabase/migrations/004_seed_data.sql
```

## Schema Overview

### Core Tables

- **users** - User profiles (extends Supabase auth.users)
- **anime** - Anime catalog with metadata
- **user_anime** - User tracking/watchlist entries
- **user_episodes** - Episode-level watch tracking

### Social Tables

- **follows** - User follow relationships
- **reviews** - User reviews for anime

### Reference Tables

- **genres** - Anime genres
- **studios** - Animation studios
- **anime_genres** - Many-to-many: anime ↔ genres
- **anime_studios** - Many-to-many: anime ↔ studios
- **streaming_links** - Streaming platform links

### System Tables

- **import_jobs** - Background import job tracking

## Generating TypeScript Types

After running migrations, generate TypeScript types:

```bash
npx supabase gen types typescript --project-id <project-id> > src/types/database.types.ts
```

## Key Features

### Automatic Timestamps
- `updated_at` columns are automatically updated via triggers

### User Profile Creation
- User profiles are automatically created when users sign up via Supabase Auth

### Rating Calculation
- Anime `average_rating` is automatically recalculated when users rate anime

### Popularity Tracking
- Anime `popularity` is automatically updated when users add/remove from their lists

### Row Level Security
- All tables have RLS policies for secure data access
- Public data is readable by everyone
- Private data is restricted to owners

