"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Props for the BackButton component
 */
interface BackButtonProps {
    /** Text to display next to the arrow icon (default: "Back") */
    text?: string;
    /** Button variant (default: "ghost") */
    variant?:
        | "default"
        | "destructive"
        | "outline"
        | "secondary"
        | "ghost"
        | "link";
    /** Button size (default: "sm") */
    size?: "default" | "sm" | "lg" | "icon";
    /** Additional CSS classes */
    className?: string;
}

/**
 * BackButton component
 *
 * A client-side button that navigates to the previous page in browser history
 * using Next.js router.back(). This provides true back navigation instead of
 * hardcoded links, preserving the user's navigation context.
 *
 * @example
 * // Basic usage
 * <BackButton />
 *
 * @example
 * // Custom text and styling
 * <BackButton text="Go Back" variant="outline" className="mt-4" />
 */
export function BackButton({
    text = "Back",
    variant = "ghost",
    size = "sm",
    className = "",
}: BackButtonProps) {
    const router = useRouter();

    /**
     * Handles click event by navigating to the previous page in history
     */
    const handleBack = () => {
        router.back();
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleBack}
            className={className}
        >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {text}
        </Button>
    );
}
