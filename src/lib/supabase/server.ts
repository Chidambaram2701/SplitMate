// Supabase Server Client for API Routes
import { createServerClient } from '@supabase/ssr';

export async function createClient() {
  // Get cookies from headers
  const cookieStore = (await import('next/headers')).cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Setting cookies is handled by the response
        },
      },
    }
  );
}
