import Link from "next/link";
import { Play, LogOut, User, List } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { getCurrentUserProfile } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * Main navigation header component
 *
 * Features:
 * - Logo with link to home
 * - Navigation links
 * - Authentication state (Sign In button or User dropdown)
 * - Responsive design (mobile-friendly)
 *
 * Uses the dark-mode-first design system with subtle borders
 * and elevated surface colors for visual hierarchy.
 */
export async function Header() {
    // Fetch the current user session
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Fetch user profile to get username (for profile link)
    const profileResult = user ? await getCurrentUserProfile() : null;
    const userProfile = profileResult?.success ? profileResult.data : null;

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo and brand */}
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

                {/* Navigation links and auth */}
                <nav className="flex items-center gap-6">
                    <Link
                        href="/"
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Browse
                    </Link>

                    {user ? (
                        // Authenticated: Show user dropdown
                        <UserDropdown
                            email={user.email ?? ""}
                            avatarUrl={user.user_metadata?.avatar_url}
                            displayName={user.user_metadata?.full_name}
                            username={userProfile?.username}
                        />
                    ) : (
                        // Not authenticated: Show sign in button
                        <Button asChild variant="default" size="sm">
                            <Link href="/login">Sign In</Link>
                        </Button>
                    )}
                </nav>
            </div>
        </header>
    );
}

/**
 * User dropdown menu component
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
                    className="relative h-8 w-8 rounded-full"
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
