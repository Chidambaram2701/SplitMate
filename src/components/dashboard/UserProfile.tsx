// UserProfile Component
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { House } from 'lucide-react';

export function UserProfile() {
  const [profile, setProfile] = useState<{ display_name: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setProfile(profile);
      }
    }

    loadProfile();
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <House size={16} />
        <span className="min-w-[80px]">{profile?.display_name || 'User'}</span>
      </div>
    </div>
  );
}
