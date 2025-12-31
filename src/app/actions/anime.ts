/**
 * @deprecated Import from '@/app/actions/anime/' instead.
 * This file exists for backwards compatibility only.
 *
 * The anime actions have been split into domain-specific modules:
 * - core.ts: Core anime CRUD + filtered queries
 * - studios.ts: Studio entity actions
 * - seasons.ts: Season entity actions (includes upcoming)
 * - genres.ts: Genre entity actions
 * - platforms.ts: Platform entity actions
 */
export * from "./anime/index";
