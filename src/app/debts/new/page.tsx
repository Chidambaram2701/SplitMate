// Create Debt Page
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Member {
  id: string;
  display_name: string;
}

export default function CreateDebtPage() {
  const [debtorId, setDebtorId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    const houseId = sessionStorage.getItem('currentHouseId');
    if (!houseId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: membersData } = await supabase
      .from('house_members')
      .select('user_id, profiles(id, display_name)')
      .eq('house_id', houseId)
      .eq('status', 'active');

    if (membersData) {
      const list = membersData
        .filter((m: any) => m.user_id !== user.id)
        .map((m: any) => ({
          id: m.user_id,
          display_name: m.profiles?.display_name || 'Roommate',
        }));
      setMembers(list);
      if (list.length > 0) {
        setDebtorId(list[0].id);
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const houseId = sessionStorage.getItem('currentHouseId');
    if (!houseId) {
      setError('No active house selected.');
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to create a debt.');
        setLoading(false);
        return;
      }

      const debtAmount = parseFloat(amount);
      if (isNaN(debtAmount) || debtAmount <= 0) {
        setError('Please enter a valid positive amount.');
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('debts')
        .insert({
          house_id: houseId,
          creditor_id: user.id,
          debtor_id: debtorId,
          original_amount: debtAmount,
          remaining_amount: debtAmount,
          due_date: dueDate || null,
          description: description.trim() || 'Direct loan',
          status: 'pending',
        });

      if (insertError) throw insertError;

      router.push('/debts');
      router.refresh();
    } catch (err: any) {
      console.error('Error creating debt:', err);
      setError(err.message || 'Failed to record debt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-black">
      <div className="flex items-center justify-between border-b-4 border-black pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#F5E600] border-2 border-black">
            <CreditCard size={28} className="text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight text-black">
              Record New Debt
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-700">
              Track money owed to you by a roommate
            </p>
          </div>
        </div>
        <Button variant="brutal" asChild>
          <Link href="/debts" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Back
          </Link>
        </Button>
      </div>

      <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8">
        {error && (
          <div className="mb-6 bg-red-100 border-4 border-red-600 p-4 text-red-800 font-bold uppercase text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="debtor" required>
              Who owes you money?
            </Label>
            {members.length === 0 ? (
              <p className="text-xs font-bold uppercase text-red-600 mt-2">
                No other roommates found in this house. Invite members first!
              </p>
            ) : (
              <select
                id="debtor"
                value={debtorId}
                onChange={(e) => setDebtorId(e.target.value)}
                className="w-full mt-1 p-3 border-2 border-black bg-white font-bold uppercase text-black"
                disabled={loading}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.display_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <Label htmlFor="amount" required>
              Amount (₹)
            </Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500"
              required
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">
              Reason / Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Electricity bill share, Cash loan"
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="dueDate">
              Due Date (Optional)
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div className="pt-4 border-t-2 border-black flex items-center justify-end gap-4">
            <Button variant="brutal" asChild disabled={loading}>
              <Link href="/debts">Cancel</Link>
            </Button>
            <Button
              type="submit"
              variant="brutalAccent"
              disabled={loading || !amount || !debtorId}
              className="px-8"
            >
              {loading ? 'Saving...' : 'Record Debt'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
