import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/app/actions/user";
import { HeaderClient } from "./Header";

/**
 * Server-side Header component
 *
 * Fetches user authentication state and profile data on the server,
 * then passes the data to the client-side HeaderClient component.
 *
 * This pattern allows us to:
 * 1. Fetch auth data on the server (faster, more secure)
 * 2. Use client-side interactivity in HeaderClient (Sheet, Dropdown)
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

    return <HeaderClient user={user} userProfile={userProfile} />;
}
