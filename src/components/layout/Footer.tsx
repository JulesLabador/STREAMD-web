import Link from "next/link";
import { Play } from "lucide-react";

/**
 * Footer navigation link groups
 */
const FOOTER_LINKS = {
    browse: {
        title: "Browse",
        links: [
            { label: "All Anime", href: "/" },
            { label: "By Genre", href: "/genre" },
            { label: "By Studio", href: "/studio" },
            { label: "By Season", href: "/season" },
            { label: "By Platform", href: "/platforms" },
        ],
    },
    discover: {
        title: "Discover",
        links: [
            { label: "Upcoming Anime", href: "/upcoming" },
            { label: "Top Rated", href: "/?sort=rating" },
            { label: "Most Popular", href: "/?sort=popularity" },
        ],
    },
    legal: {
        title: "Legal",
        links: [
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Service", href: "/terms" },
        ],
    },
};

/**
 * Get current year for copyright
 */
function getCurrentYear(): number {
    return new Date().getFullYear();
}

/**
 * Footer component
 *
 * Displays site navigation, legal links, and copyright information.
 * Designed to match the dark-mode-first aesthetic of the site.
 */
export function Footer() {
    const currentYear = getCurrentYear();

    return (
        <footer className="border-t border-border bg-card/30">
            <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Main footer content */}
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    {/* Brand section */}
                    <div className="col-span-2 md:col-span-1">
                        <Link
                            href="/"
                            className="flex items-center gap-2 transition-opacity hover:opacity-80"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                                <Play className="h-4 w-4 fill-primary-foreground text-primary-foreground" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">
                                STREAMD
                            </span>
                        </Link>
                        <p className="mt-4 text-sm text-muted-foreground max-w-xs">
                            Track your anime journey. Rate, review, and discover
                            new shows to watch.
                        </p>
                    </div>

                    {/* Browse links */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">
                            {FOOTER_LINKS.browse.title}
                        </h3>
                        <ul className="mt-4 space-y-3">
                            {FOOTER_LINKS.browse.links.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Discover links */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">
                            {FOOTER_LINKS.discover.title}
                        </h3>
                        <ul className="mt-4 space-y-3">
                            {FOOTER_LINKS.discover.links.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal links */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">
                            {FOOTER_LINKS.legal.title}
                        </h3>
                        <ul className="mt-4 space-y-3">
                            {FOOTER_LINKS.legal.links.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom section with copyright */}
                <div className="mt-12 border-t border-border pt-8">
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <p className="text-sm text-muted-foreground">
                            &copy; {currentYear} STREAMD. All rights reserved.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Made with ♥ for anime fans
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}

