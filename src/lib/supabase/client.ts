// Supabase Client for RoommateX
import { createClient } from '@supabase/supabase-js';

// Supabase environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

// Create a mock Supabase client for build time when config is missing
function createMockSupabase(): any {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          limit: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
    }),
    channel: () => ({
      on: () => ({
        subscribe: () => {},
      }),
    }),
    removeChannel: () => {},
  };
}

// Create Supabase client instance
let supabaseInstance: any = null;

function getSupabaseClient(): any {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    // Return mock client if config is missing (build time)
    supabaseInstance = createMockSupabase();
    return supabaseInstance;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'roommatex/1.0',
      },
    },
  });

  return supabaseInstance;
}

export const supabase: any = getSupabaseClient();

export async function getCurrentHouseId(): Promise<string | null> {
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership, error } = await supabase
    .from('house_members')
    .select('house_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (error || !membership) {
    console.error('Error fetching house ID:', error);
    return null;
  }

  return membership.house_id;
}

export async function getUserHouses() {
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships, error } = await supabase
    .from('house_members')
    .select('house_id, houses(id, name)')
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching user houses:', error);
    return [];
  }

  return (memberships as any[]).map((m: any) => m.houses);
}

export async function isHouseAdmin(houseId: string): Promise<boolean> {
  if (!supabase) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: membership, error } = await supabase
    .from('house_members')
    .select('role')
    .eq('house_id', houseId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !membership) {
    console.error('Error checking admin status:', error);
    return false;
  }

  return membership.role === 'admin';
}

export async function getUserProfile() {
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !profile) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return profile;
}
