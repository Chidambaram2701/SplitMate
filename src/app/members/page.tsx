// Members Page
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Mail, Home } from 'lucide-react';
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

      const { data: membersData, error } = await supabase
        .from('house_members')
        .select(`
          id,
          role,
          status,
          joined_at,
          profiles (display_name, email)
        `)
        .eq('house_id', houseId)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error loading members:', error);
      } else if (membersData) {
        const membersList = membersData.map((m: any) => ({
          id: m.id,
          role: m.role,
          status: m.status,
          joined_at: m.joined_at,
          display_name: m.profiles?.display_name || 'House Member',
          email: m.profiles?.email || 'N/A',
        }));
        setMembers(membersList);
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

  const admins = members.filter((m: any) => m.role === 'admin');
  const regularMembers = members.filter((m: any) => m.role === 'member');

  return (
    <div className="space-y-6 text-black">
      <div className="flex items-center justify-between border-b-4 border-black pb-2">
        <h1 className="text-4xl font-extrabold uppercase tracking-tight text-black">
          House Members
        </h1>
        <Button variant="brutalAccent" asChild>
          <Link href="/members/invite">
            <Plus size={20} />
            Invite Member
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admins */}
        <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 className="text-xl font-bold uppercase text-black">Administrators</h3>
            <span className="font-mono font-bold text-lg bg-[#F5E600] px-2 border border-black">{admins.length}</span>
          </div>
          <div className="space-y-3">
            {admins.length === 0 ? (
              <p className="text-xs uppercase font-bold text-gray-500 py-4">No admins found</p>
            ) : (
              admins.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border-2 border-black bg-white hover:bg-[#F5E600] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-black text-white flex items-center justify-center font-bold uppercase rounded-none border border-black">
                      {member.display_name?.[0] || 'A'}
                    </div>
                    <div>
                      <div className="font-bold uppercase text-black">{member.display_name}</div>
                      <div className="text-xs font-bold uppercase text-gray-600">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status="active" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Members */}
        <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 className="text-xl font-bold uppercase text-black">Members</h3>
            <span className="font-mono font-bold text-lg bg-gray-200 px-2 border border-black">{regularMembers.length}</span>
          </div>
          <div className="space-y-3">
            {regularMembers.length === 0 ? (
              <p className="text-xs uppercase font-bold text-gray-500 py-4">No regular members yet</p>
            ) : (
              regularMembers.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border-2 border-black bg-white hover:bg-[#F5E600] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-black text-white flex items-center justify-center font-bold uppercase rounded-none border border-black">
                      {member.display_name?.[0] || 'M'}
                    </div>
                    <div>
                      <div className="font-bold uppercase text-black">{member.display_name}</div>
                      <div className="text-xs font-bold uppercase text-gray-600">
                        Joined: {member.joined_at ? new Date(member.joined_at).toLocaleDateString('en-IN') : 'Recently'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status="active" />
                    <Button variant="brutalDanger" size="icon" onClick={() => handleRemove(member.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="border-4 border-black bg-[#F5E600] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 text-black">
        <h2 className="text-2xl font-extrabold uppercase mb-4 border-b-2 border-black pb-2">House Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="text-4xl font-mono font-extrabold uppercase mb-1">{members.length}</div>
            <div className="text-xs font-bold uppercase">Total House Members</div>
          </div>
          <div>
            <div className="text-4xl font-mono font-extrabold uppercase mb-1">{admins.length}</div>
            <div className="text-xs font-bold uppercase">Administrators</div>
          </div>
          <div>
            <div className="text-4xl font-mono font-extrabold uppercase mb-1">{regularMembers.length}</div>
            <div className="text-xs font-bold uppercase">Regular Members</div>
          </div>
        </div>
      </div>
    </div>
  );
}
