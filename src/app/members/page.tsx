// Members Page
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Mail } from 'lucide-react';
import Link from 'next/link';

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    const houseId = sessionStorage.getItem('currentHouseId');
    if (!houseId) return;

    setLoading(true);

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
        display_name: m.profiles?.display_name,
        email: m.profiles?.email,
      })).filter((m: any) => m.display_name !== undefined);
      setMembers(membersList);
    }

    setLoading(false);
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
        <div className="h-64 bg-gray-300 animate-pulse border-2 border-black" />
      </div>
    );
  }

  const admins = members.filter((m: any) => m.role === 'admin');
  const regularMembers = members.filter((m: any) => m.role === 'member');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold uppercase border-b-4 border-black pb-2">
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
        <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
          <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
            <h3 className="text-xl font-bold uppercase">Administrators</h3>
            <span className="font-mono font-bold">{admins.length}</span>
          </div>
          <div className="space-y-3">
            {admins.map((member: any) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border-2 border-black hover:bg-[#F5E600] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-black text-white flex items-center justify-center font-bold uppercase rounded-none">
                    {member.display_name?.[0]}
                  </div>
                  <div>
                    <div className="font-bold uppercase">{member.display_name}</div>
                    <div className="text-xs uppercase text-gray-600">{member.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status="active" />
                  <Button variant="brutal" size="icon">
                    <Mail size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Members */}
        <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
          <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
            <h3 className="text-xl font-bold uppercase">Members</h3>
            <span className="font-mono font-bold">{regularMembers.length}</span>
          </div>
          <div className="space-y-3">
            {regularMembers.map((member: any) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border-2 border-black hover:bg-[#F5E600] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-black text-white flex items-center justify-center font-bold uppercase rounded-none">
                    {member.display_name?.[0]}
                  </div>
                  <div>
                    <div className="font-bold uppercase">{member.display_name}</div>
                    <div className="text-xs uppercase text-gray-600">
                      Joined: {new Date(member.joined_at).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status="active" />
                  <Button variant="brutal" size="icon" onClick={() => handleRemove(member.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="border-2 border-black bg-[#F5E600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold uppercase mb-2">House Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-4xl font-mono font-bold uppercase mb-1">{members.length}</div>
                <div className="text-xs uppercase">Total Members</div>
              </div>
              <div>
                <div className="text-4xl font-mono font-bold uppercase mb-1">{admins.length}</div>
                <div className="text-xs uppercase">Administrators</div>
              </div>
              <div>
                <div className="text-4xl font-mono font-bold uppercase mb-1">{regularMembers.length}</div>
                <div className="text-xs uppercase">Regular Members</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
