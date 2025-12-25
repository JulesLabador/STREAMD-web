import {
    CalendarDays,
    Play,
    CheckCircle,
    Clock,
    Pause,
    XCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import type { UserProfileWithStats } from "@/types/user";

/**
 * Props for the ProfileHeader component
 */
interface ProfileHeaderProps {
    profile: UserProfileWithStats;
}

/**
 * Formats a date string to a readable format
 */
function formatJoinDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
}

/**
 * Gets initials from display name or username
 */
function getInitials(displayName: string | null, username: string): string {
    const name = displayName || username;
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

/**
 * ProfileHeader component
 *
 * Displays user profile information including:
 * - Avatar with fallback initials
 * - Display name and username
 * - Join date
 * - Anime tracking stats
 */
export function ProfileHeader({ profile }: ProfileHeaderProps) {
    const initials = getInitials(profile.displayName, profile.username);

    return (
        <div className="space-y-6">
            {/* User info section */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                {/* Avatar */}
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg sm:h-28 sm:w-28">
                    <AvatarImage
                        src={profile.avatarUrl ?? undefined}
                        alt={profile.displayName || profile.username}
                    />
                    <AvatarFallback className="text-2xl font-semibold">
                        {initials}
                    </AvatarFallback>
                </Avatar>

                {/* Name and metadata */}
                <div className="flex flex-col items-center gap-2 sm:items-start">
                    {/* Display name */}
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        {profile.displayName || profile.username}
                    </h1>

                    {/* Username (if different from display name) */}
                    {profile.displayName && (
                        <p className="text-muted-foreground">
                            @{profile.username}
                        </p>
                    )}

                    {/* Join date */}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        <span>Joined {formatJoinDate(profile.createdAt)}</span>
                    </div>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                <StatCard
                    label="Watching"
                    value={profile.stats.watching}
                    variant="watching"
                />
                <StatCard
                    label="Completed"
                    value={profile.stats.completed}
                    variant="completed"
                />
                <StatCard
                    label="Planning"
                    value={profile.stats.planning}
                    variant="planning"
                />
                <StatCard
                    label="On Hold"
                    value={profile.stats.paused}
                    variant="paused"
                />
                <StatCard
                    label="Dropped"
                    value={profile.stats.dropped}
                    variant="dropped"
                />
            </div>
        </div>
    );
}

/**
 * Stat card component for displaying individual stats
 */
interface StatCardProps {
    label: string;
    value: number;
    variant: "watching" | "completed" | "planning" | "paused" | "dropped";
}

/**
 * Icon components mapped to each stat variant
 */
const STAT_ICONS: Record<StatCardProps["variant"], React.ElementType> = {
    watching: Play,
    completed: CheckCircle,
    planning: Clock,
    paused: Pause,
    dropped: XCircle,
};

function StatCard({ label, value, variant }: StatCardProps) {
    // Color classes based on variant
    const colorClasses: Record<StatCardProps["variant"], string> = {
        watching: "border-l-blue-500",
        completed: "border-l-green-500",
        planning: "border-l-purple-500",
        paused: "border-l-yellow-500",
        dropped: "border-l-red-500",
    };

    const Icon = STAT_ICONS[variant];

    return (
        <Card className={`border-l-4 ${colorClasses[variant]}`}>
            <CardContent className="p-3">
                <p className="text-2xl font-bold">{value}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    {label}
                </p>
            </CardContent>
        </Card>
    );
}
