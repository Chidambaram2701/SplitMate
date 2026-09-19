// Members Page - Robust Member Fetch & Profile Fallback
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Home } from 'lucide-react';
import Link from 'next/link';

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasHouse, setHasHouse] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setLoading(true);
    try {
      const houseId = sessionStorage.getItem('currentHouseId');
      if (!houseId) {
        setHasHouse(false);
        return;
      }
      setHasHouse(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch house members
      const { data: membersData, error } = await supabase
        .from('house_members')
        .select('id, house_id, user_id, role, status, joined_at')
        .eq('house_id', houseId)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error loading membersData:', error);
      }

      if (membersData && membersData.length > 0) {
        // 2. Fetch profiles for user IDs
        const userIds = membersData.map((m: any) => m.user_id).filter(Boolean);

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', userIds);

        const profileMap = new Map();
        if (profilesData) {
          profilesData.forEach((p: any) => profileMap.set(p.id, p));
        }

        const membersList = membersData.map((m: any) => {
          const prof = profileMap.get(m.user_id);
          const isCurrentUser = m.user_id === user.id;

          return {
            id: m.id,
            user_id: m.user_id,
            role: m.role || 'member',
            status: m.status || 'active',
            joined_at: m.joined_at,
            display_name: prof?.display_name || (isCurrentUser ? (user.user_metadata?.display_name || user.email?.split('@')[0] || 'You') : 'House Member'),
            email: prof?.email || (isCurrentUser ? user.email : 'Member Account'),
          };
        });

        setMembers(membersList);
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error('Error in loadMembers:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    const { error } = await supabase
      .from('house_members')
      .update({ status: 'left', left_at: new Date().toISOString() })
      .eq('id', memberId);

    if (!error) {
      loadMembers();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
          <div className="w-5 h-5 bg-[#F5E600] animate-spin border-2 border-black" />
          <h2 className="text-xl font-bold uppercase tracking-wider text-black">
            Loading House Members...
          </h2>
        </div>
      </div>
    );
  }

  if (!hasHouse) {
    return (
      <div className="max-w-2xl mx-auto my-12 border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6 text-black">
        <div className="flex items-center gap-4 border-b-4 border-black pb-4">
          <Home size={32} className="text-black" />
          <h1 className="text-3xl font-extrabold uppercase">No Active House Selected</h1>
        </div>
        <p className="text-sm font-medium">Please select or create a house workspace to view house members.</p>
        <Button variant="brutalAccent" size="lg" asChild>
          <Link href="/houses/new">
            <Plus size={20} /> Create A House
          </Link>
        </Button>
      </div>
    );
  }

  const activeMembers = members.filter((m: any) => m.status !== 'left');
  const admins = activeMembers.filter((m: any) => m.role === 'admin' || m.role === 'owner');
  const regularMembers = activeMembers.filter((m: any) => m.role !== 'admin' && m.role !== 'owner');

  return (
    <div className="space-y-6 text-black pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-4 border-black pb-3">
        <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-black">
          House Members
        </h1>
        <Button variant="brutalAccent" size="sm" asChild className="self-start sm:self-auto touch-target">
          <Link href="/members/invite" className="flex items-center gap-1.5">
            <Plus size={16} />
            <span>Invite Member</span>
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Admins */}
        <div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 className="text-lg sm:text-xl font-bold uppercase text-black">Administrators</h3>
            <span className="font-mono font-bold text-base sm:text-lg bg-[#F5E600] px-3 py-0.5 border-2 border-black text-black">{admins.length}</span>
          </div>
          <div className="space-y-3">
            {admins.length === 0 ? (
              <p className="text-xs uppercase font-bold text-gray-500 py-4">No admins found</p>
            ) : (
              admins.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border-2 border-black bg-white hover:bg-[#F5E600]/30 transition-colors gap-2 min-w-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="h-9 w-9 bg-black text-white flex items-center justify-center font-extrabold uppercase rounded-none border border-black flex-shrink-0 text-xs sm:text-sm">
                      {member.display_name?.[0] || 'A'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold uppercase text-black text-xs sm:text-sm truncate">{member.display_name}</div>
                      <div className="text-[10px] sm:text-[11px] font-bold text-gray-600 truncate">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <StatusBadge status="active" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Regular Members */}
        <div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 className="text-lg sm:text-xl font-bold uppercase text-black">Members</h3>
            <span className="font-mono font-bold text-base sm:text-lg bg-gray-200 px-3 py-0.5 border-2 border-black text-black">{regularMembers.length}</span>
          </div>
          <div className="space-y-3">
            {regularMembers.length === 0 ? (
              <p className="text-xs uppercase font-bold text-gray-500 py-4">No regular members yet</p>
            ) : (
              regularMembers.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border-2 border-black bg-white hover:bg-[#F5E600]/30 transition-colors gap-2 min-w-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="h-9 w-9 bg-black text-white flex items-center justify-center font-extrabold uppercase rounded-none border border-black flex-shrink-0 text-xs sm:text-sm">
                      {member.display_name?.[0] || 'M'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold uppercase text-black text-xs sm:text-sm truncate">{member.display_name}</div>
                      <div className="text-[10px] sm:text-[11px] font-bold text-gray-600 truncate">
                        {member.email !== 'N/A' ? member.email : `Joined: ${member.joined_at ? new Date(member.joined_at).toLocaleDateString('en-IN') : 'Recently'}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <StatusBadge status="active" />
                    <Button variant="brutalDanger" size="icon" onClick={() => handleRemove(member.id)} className="h-8 w-8 p-1 flex-shrink-0">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="border-4 border-black bg-[#F5E600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 text-black">
        <h2 className="text-lg sm:text-2xl font-black uppercase mb-3 sm:mb-4 border-b-2 border-black pb-2">House Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="flex sm:block items-center justify-between border-b sm:border-b-0 pb-2 sm:pb-0 border-black/20">
            <div className="text-xl sm:text-2xl font-mono font-extrabold uppercase">{activeMembers.length}</div>
            <div className="text-[10px] sm:text-xs font-extrabold uppercase">Total House Members</div>
          </div>
          <div className="flex sm:block items-center justify-between border-b sm:border-b-0 pb-2 sm:pb-0 border-black/20">
            <div className="text-xl sm:text-2xl font-mono font-extrabold uppercase">{admins.length}</div>
            <div className="text-[10px] sm:text-xs font-extrabold uppercase">Administrators</div>
          </div>
          <div className="flex sm:block items-center justify-between">
            <div className="text-xl sm:text-2xl font-mono font-extrabold uppercase">{regularMembers.length}</div>
            <div className="text-[10px] sm:text-xs font-extrabold uppercase">Regular Members</div>
          </div>
        </div>
      </div>
    </div>
  );
}
