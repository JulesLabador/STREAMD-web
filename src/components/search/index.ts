/**
 * Search components barrel export
 *
 * Unified search system that powers both the command palette modal
 * and the homepage inline search.
 */

// Context and provider
export { SearchProvider, useSearchContext } from "./SearchProvider";

// Shared components
export { SearchInput } from "./SearchInput";
export { SearchResults } from "./SearchResults";
export { SearchResultItem } from "./SearchResultItem";

// Container components
export { SearchModal } from "./SearchModal";
export { InlineSearch } from "./InlineSearch";
export { HeaderSearch } from "./HeaderSearch";

