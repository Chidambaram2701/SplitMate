// Create Expense Page
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

interface Member {
  id: string;
  display_name: string;
}

export default function CreateExpensePage() {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
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
      .select(`
        id,
        profiles (display_name)
      `)
      .eq('house_id', houseId)
      .eq('status', 'active');

    if (membersData) {
      const membersList = membersData.map((m: any) => ({
        id: m.id,
        display_name: m.profiles?.display_name || 'Unknown',
      }));
      setMembers(membersList);
      setSelectedMembers(membersList.map((m: any) => m.id));
    }
  }

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(m => m !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const houseId = sessionStorage.getItem('currentHouseId');
    if (!houseId) {
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      alert('Please enter a valid amount');
      setLoading(false);
      return;
    }

    // Calculate equal split
    const splitAmount = Math.round(expenseAmount / selectedMembers.length);

    try {
      // Insert expense
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          house_id: houseId,
          paid_by: user.id,
          description,
          total_amount: expenseAmount,
          category: 'general',
          date,
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      // Insert splits for each participant
      for (const memberId of selectedMembers) {
        await supabase
          .from('expense_splits')
          .insert({
            expense_id: expense.id,
            participant_id: memberId,
            amount: splitAmount,
            percentage: (splitAmount / expenseAmount) * 100,
            settled: false,
          });
      }

      // Create debts if someone other than the payer is selected
      for (const memberId of selectedMembers) {
        if (memberId !== user.id) {
          await supabase
            .from('debts')
            .insert({
              house_id: houseId,
              debtor_id: memberId,
              creditor_id: user.id,
              original_amount: splitAmount,
              remaining_amount: splitAmount,
              due_date: null,
              description: `Split from ${description}`,
              status: 'pending',
            });
        }
      }

      router.push('/expenses');
      router.refresh();
    } catch (error) {
      console.error('Error creating expense:', error);
      alert('Error creating expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const splitAmount = amount ? Math.round(parseFloat(amount) / selectedMembers.length) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold uppercase border-b-4 border-black pb-2">
          New Expense
        </h1>
        <Button variant="brutal" asChild>
          <Link href="/expenses">Cancel</Link>
        </Button>
      </div>

      <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Expense Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="description" required>
                Expense Name
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Washing Machine, Groceries"
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount" required>
                  Total Amount (₹)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="date" required>
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Participants Selector */}
          <div className="space-y-4 border-t-2 border-black pt-6">
            <div className="flex items-center justify-between">
              <Label required>
                Who is this for?
              </Label>
              <span className="font-mono font-bold text-sm">
                {selectedMembers.length} member{selectedMembers.length !== 1 && 's'} selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {members.map((member: any) => {
                const isSelected = selectedMembers.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleMember(member.id)}
                    className={`
                      flex items-center gap-3 p-4 border-2 text-left transition-all
                      ${isSelected
                        ? 'border-black bg-[#F5E600] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'border-black hover:border-[#F5E600]'
                      }
                    `}
                  >
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-none font-bold uppercase
                      ${isSelected ? 'bg-black text-white' : 'bg-white text-black'}
                    `}>
                      {member.display_name?.[0] || '?'}
                    </div>
                    <div className="font-bold uppercase text-sm">{member.display_name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split Calculator */}
          {amount && selectedMembers.length > 0 && (
            <div className="space-y-4 border-t-2 border-black pt-6">
              <Label>Split Calculator</Label>
              <div className="bg-[#F4F1EA] border-2 border-black p-6">
                <div className="text-center space-y-4">
                  <div>
                    <span className="text-sm uppercase text-gray-600 block mb-2">
                      Total Amount
                    </span>
                    <span className="font-mono font-bold text-3xl">
                      ₹{parseFloat(amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="border-t-2 border-black pt-4">
                    <span className="text-sm uppercase text-gray-600 block mb-2">
                      {selectedMembers.length} Member{selectedMembers.length !== 1 && 's'}
                    </span>
                    <div className="font-mono font-bold text-xl">
                      ₹{parseFloat(amount).toLocaleString('en-IN')} ÷ {selectedMembers.length}
                    </div>
                  </div>
                  <div className="border-t-2 border-black pt-4">
                    <span className="text-sm uppercase text-gray-600 block mb-2">
                      Each pays
                    </span>
                    <span className="font-mono font-bold text-3xl text-green-600">
                      ₹{splitAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              type="submit"
              variant="brutalPrimary"
              fullWidth
              disabled={loading || !description || !amount || selectedMembers.length === 0}
            >
              {loading ? 'Saving...' : 'Save Expense'}
            </Button>
            <Button variant="brutal" asChild>
              <Link href="/expenses">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
