'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { ActionResult } from '@/types/common';

/**
 * Signs out the current user
 *
 * Clears the user session and redirects to the home page.
 * This is a server action that can be called from client components.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

/**
 * Gets the current authenticated user
 *
 * Returns the user object if authenticated, null otherwise.
 * Use this to check auth state in server components or actions.
 *
 * @returns ActionResult containing the user or null
 */
export async function getCurrentUser(): Promise<
  ActionResult<{ id: string; email: string } | null>
> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!user) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email ?? '',
      },
    };
  } catch {
    return { success: false, error: 'Failed to get current user' };
  }
}

