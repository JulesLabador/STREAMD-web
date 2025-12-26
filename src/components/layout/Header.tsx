"use client";

import Link from "next/link";
import {
    Play,
    LogOut,
    User,
    List,
    Menu,
    Tv,
    Palette,
    Monitor,
    Calendar,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HeaderSearch } from "@/components/search";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

/**
 * Browse dropdown links for desktop navigation menu
 * These appear in the dropdown under "Browse"
 */
const BROWSE_DROPDOWN_LINKS = [
    {
        label: "By Studio",
        href: "/studio",
        description: "Find anime by animation studio",
        icon: Tv,
    },
    {
        label: "By Genre",
        href: "/genre",
        description: "Explore anime by genre categories",
        icon: Palette,
    },
    {
        label: "By Platform",
        href: "/platforms",
        description: "Discover where to stream anime",
        icon: Monitor,
    },
    {
        label: "By Season",
        href: "/season",
        description: "Browse anime by release season",
        icon: Calendar,
    },
];

/**
 * All navigation links for mobile navigation
 * Flat list shown in the mobile sheet
 */
const MOBILE_NAV_LINKS = [
    {
        label: "Browse All",
        href: "/",
    },
    {
        label: "Browse by Studio",
        href: "/studio",
    },
    {
        label: "Browse by Genre",
        href: "/genre",
    },
    {
        label: "Browse by Platform",
        href: "/platforms",
    },
    {
        label: "Browse by Season",
        href: "/season",
    },
];

/**
 * Shared props for navigation components
 */
interface NavigationProps {
    user: {
        email?: string;
        user_metadata?: {
            avatar_url?: string;
            full_name?: string;
        };
    } | null;
    userProfile: {
        username?: string;
    } | null;
}

/**
 * Mobile navigation component with hamburger menu and Sheet panel
 *
 * Features:
 * - Hamburger button trigger
 * - Sheet sliding from the right
 * - Vertical navigation links
 * - Search component
 * - Auth section (Sign In or user info with sign out)
 */
function MobileNavigation({ user, userProfile }: NavigationProps) {
    // Get user display info
    const displayName = user?.user_metadata?.full_name;
    const email = user?.email ?? "";
    const avatarUrl = user?.user_metadata?.avatar_url;
    const username = userProfile?.username;

    // Get initials for avatar fallback
    const initials = displayName
        ? displayName
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : email.slice(0, 2).toUpperCase();

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    aria-label="Open navigation menu"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                            <Play className="h-4 w-4 fill-primary-foreground text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">
                            STREAMD
                        </span>
                    </SheetTitle>
                </SheetHeader>

                {/* Navigation links */}
                <nav className="mt-6 flex flex-col gap-1">
                    {MOBILE_NAV_LINKS.map((link) => (
                        <SheetClose asChild key={link.href}>
                            <Link
                                href={link.href}
                                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            >
                                {link.label}
                            </Link>
                        </SheetClose>
                    ))}
                </nav>

                <Separator className="my-4" />

                {/* Search */}
                <div className="px-3">
                    <HeaderSearch />
                </div>

                <Separator className="my-4" />

                {/* Auth section */}
                <div className="px-3">
                    {user ? (
                        <div className="flex flex-col gap-3">
                            {/* User info */}
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage
                                        src={avatarUrl}
                                        alt={displayName ?? email}
                                    />
                                    <AvatarFallback className="text-sm">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    {displayName && (
                                        <p className="font-medium">
                                            {displayName}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {email}
                                    </p>
                                </div>
                            </div>

                            {/* User links */}
                            {username && (
                                <div className="flex flex-col gap-1">
                                    <SheetClose asChild>
                                        <Link
                                            href={`/u/${username}`}
                                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                        >
                                            <User className="h-4 w-4" />
                                            My Profile
                                        </Link>
                                    </SheetClose>
                                    <SheetClose asChild>
                                        <Link
                                            href={`/u/${username}`}
                                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                        >
                                            <List className="h-4 w-4" />
                                            My Anime List
                                        </Link>
                                    </SheetClose>
                                </div>
                            )}

                            {/* Sign out */}
                            <form action={signOut}>
                                <Button
                                    type="submit"
                                    variant="outline"
                                    className="w-full justify-start gap-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign out
                                </Button>
                            </form>
                        </div>
                    ) : (
                        <SheetClose asChild>
                            <Button
                                asChild
                                variant="default"
                                className="w-full"
                            >
                                <Link href="/login">Sign In</Link>
                            </Button>
                        </SheetClose>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

/**
 * Desktop navigation component with Navigation Menu dropdown
 *
 * Features:
 * - Browse dropdown with categorized links using NavigationMenu
 * - HeaderSearch component
 * - User dropdown or Sign In button
 */
function DesktopNavigation({ user, userProfile }: NavigationProps) {
    return (
        <nav className="hidden items-center gap-4 md:flex">
            {/* Browse Navigation Menu */}
            <NavigationMenu viewportAlign="end">
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <NavigationMenuTrigger className="bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground data-[state=open]:bg-accent/50">
                            Browse
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <ul className="grid w-[400px] gap-1 p-2 md:w-[500px] md:grid-cols-2">
                                {/* Featured: Browse All */}
                                <li className="col-span-2">
                                    <NavigationMenuLink asChild>
                                        <Link
                                            href="/"
                                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-linear-to-b from-muted/50 to-muted p-4 no-underline outline-none transition-colors hover:bg-accent focus:shadow-md"
                                        >
                                            <Play className="h-6 w-6 text-primary" />
                                            <div className="mb-1 mt-2 text-base font-medium">
                                                Browse All Anime
                                            </div>
                                            <p className="text-sm leading-tight text-muted-foreground">
                                                Explore our complete collection
                                                of anime titles
                                            </p>
                                        </Link>
                                    </NavigationMenuLink>
                                </li>
                                {/* Browse category links */}
                                {BROWSE_DROPDOWN_LINKS.map((link) => (
                                    <li key={link.href}>
                                        <NavigationMenuLink asChild>
                                            <Link
                                                href={link.href}
                                                className="flex select-none items-start gap-3 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                            >
                                                <link.icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-medium leading-none">
                                                        {link.label}
                                                    </span>
                                                    <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                                                        {link.description}
                                                    </span>
                                                </div>
                                            </Link>
                                        </NavigationMenuLink>
                                    </li>
                                ))}
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>

            {/* Search trigger and modal */}
            <HeaderSearch />

            {/* Auth section */}
            {user ? (
                <UserDropdown
                    email={user.email ?? ""}
                    avatarUrl={user.user_metadata?.avatar_url}
                    displayName={user.user_metadata?.full_name}
                    username={userProfile?.username}
                />
            ) : (
                <Button asChild variant="default" size="sm">
                    <Link href="/login">Sign In</Link>
                </Button>
            )}
        </nav>
    );
}

/**
 * User dropdown menu component (for desktop)
 *
 * Displays user avatar and provides navigation to profile and sign out.
 */
interface UserDropdownProps {
    email: string;
    avatarUrl?: string;
    displayName?: string;
    username?: string;
}

function UserDropdown({
    email,
    avatarUrl,
    displayName,
    username,
}: UserDropdownProps) {
    // Get initials for avatar fallback
    const initials = displayName
        ? displayName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : email.slice(0, 2).toUpperCase();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full hover:cursor-pointer hover:text-primary"
                >
                    <Avatar className="h-8 w-8">
                        <AvatarImage
                            src={avatarUrl}
                            alt={displayName ?? email}
                        />
                        <AvatarFallback className="text-xs">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                        {displayName && (
                            <p className="font-medium">{displayName}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{email}</p>
                    </div>
                </div>
                <DropdownMenuSeparator />
                {username && (
                    <>
                        <DropdownMenuItem asChild>
                            <Link
                                href={`/u/${username}`}
                                className="cursor-pointer"
                            >
                                <User className="mr-2 h-4 w-4" />
                                My Profile
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link
                                href={`/u/${username}`}
                                className="cursor-pointer"
                            >
                                <List className="mr-2 h-4 w-4" />
                                My Anime List
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}
                <form action={signOut}>
                    <DropdownMenuItem asChild>
                        <button type="submit" className="w-full cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                        </button>
                    </DropdownMenuItem>
                </form>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * Header wrapper props - passed from server component
 */
interface HeaderClientProps {
    user: NavigationProps["user"];
    userProfile: NavigationProps["userProfile"];
}

/**
 * Client-side header component
 *
 * Renders both mobile and desktop navigation with CSS-based responsive visibility.
 * Mobile nav visible below md breakpoint, desktop nav visible at md and above.
 */
export function HeaderClient({ user, userProfile }: HeaderClientProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo and brand - always visible */}
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

                {/* Desktop navigation - visible at md and above */}
                <DesktopNavigation user={user} userProfile={userProfile} />

                {/* Mobile navigation - visible below md */}
                <MobileNavigation user={user} userProfile={userProfile} />
            </div>
        </header>
    );
}
