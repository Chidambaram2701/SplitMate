// UserProfile Component - Mobile Responsive
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User } from 'lucide-react';

export function UserProfile() {
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.display_name) {
        setDisplayName(profile.display_name);
      } else if (user.email) {
        setDisplayName(user.email.split('@')[0]);
      } else {
        setDisplayName('User');
      }
    }

    loadProfile();
  }, []);

  return (
    <div className="flex items-center gap-1.5 border-2 border-black bg-white px-2 py-1 sm:px-3 sm:py-1.5 font-bold uppercase text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[10px] sm:text-xs tracking-wide flex-shrink-0">
      <User size={13} className="text-black sm:w-4 sm:h-4 flex-shrink-0" />
      <span className="max-w-[50px] sm:max-w-[120px] truncate font-extrabold text-black">
        {displayName || 'USER'}
      </span>
    </div>
  );
}
