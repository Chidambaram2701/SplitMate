// Create Expense Page - Mobile Responsive
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, DollarSign, Plus } from 'lucide-react';
import Link from 'next/link';

interface Member {
  id: string; // user_id
  display_name: string;
}

export default function CreateExpensePage() {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('general');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMembers, setFetchingMembers] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setFetchingMembers(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFetchingMembers(false);
        return;
      }

      let houseId = sessionStorage.getItem('currentHouseId');
      if (!houseId) {
        const { data: memberRows } = await supabase
          .from('house_members')
          .select('house_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1);

        if (memberRows && memberRows.length > 0) {
          houseId = memberRows[0].house_id;
          sessionStorage.setItem('currentHouseId', houseId);
        } else {
          const { data: houseRows } = await supabase
            .from('houses')
            .select('id')
            .limit(1);

          if (houseRows && houseRows.length > 0) {
            houseId = houseRows[0].id;
            sessionStorage.setItem('currentHouseId', houseId);
          }
        }
      }

      if (!houseId) {
        const selfMember: Member = {
          id: user.id,
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'You',
        };
        setMembers([selfMember]);
        setSelectedMembers([selfMember.id]);
        setFetchingMembers(false);
        return;
      }

      const { data: membersData } = await supabase
        .from('house_members')
        .select('user_id, role, status')
        .eq('house_id', houseId)
        .eq('status', 'active');

      if (membersData && membersData.length > 0) {
        const userIds = membersData.map((m: any) => m.user_id).filter(Boolean);

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', userIds);

        const profileMap = new Map();
        if (profilesData) {
          profilesData.forEach((p: any) => profileMap.set(p.id, p));
        }

        const membersList: Member[] = membersData.map((m: any) => {
          const prof = profileMap.get(m.user_id);
          const isCurrentUser = m.user_id === user.id;

          return {
            id: m.user_id,
            display_name: prof?.display_name || (isCurrentUser ? (user.user_metadata?.display_name || user.email?.split('@')[0] || 'You') : 'Roommate'),
          };
        });

        setMembers(membersList);
        setSelectedMembers(membersList.map((m) => m.id));
      } else {
        const selfMember: Member = {
          id: user.id,
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'You',
        };
        setMembers([selfMember]);
        setSelectedMembers([selfMember.id]);
      }
    } catch (err) {
      console.error('Error loading members:', err);
    } finally {
      setFetchingMembers(false);
    }
  }

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((m) => m !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let houseId = sessionStorage.getItem('currentHouseId');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to create an expense.');
      setLoading(false);
      return;
    }

    if (!houseId) {
      const { data: memberRows } = await supabase
        .from('house_members')
        .select('house_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1);

      if (memberRows && memberRows.length > 0) {
        houseId = memberRows[0].house_id;
        sessionStorage.setItem('currentHouseId', houseId);
      } else {
        const { data: houseRows } = await supabase.from('houses').select('id').limit(1);
        if (houseRows && houseRows.length > 0) {
          houseId = houseRows[0].id;
          sessionStorage.setItem('currentHouseId', houseId);
        }
      }
    }

    if (!houseId) {
      setError('No active house found. Please create or select a house first.');
      setLoading(false);
      return;
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      setError('Please enter a valid expense amount.');
      setLoading(false);
      return;
    }

    if (selectedMembers.length === 0) {
      setError('Please select at least one member to split this expense.');
      setLoading(false);
      return;
    }

    const splitAmount = parseFloat((expenseAmount / selectedMembers.length).toFixed(2));

    try {
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          house_id: houseId,
          paid_by: user.id,
          description: description.trim(),
          total_amount: expenseAmount,
          category: category || 'general',
          date: date || new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (expenseError) {
        console.error('Expense insert error:', expenseError);
        throw new Error(expenseError.message || 'Failed to save expense record.');
      }

      for (const memberUserId of selectedMembers) {
        const { error: splitError } = await supabase
          .from('expense_splits')
          .insert({
            expense_id: expense.id,
            participant_id: memberUserId,
            amount: splitAmount,
            percentage: parseFloat(((splitAmount / expenseAmount) * 100).toFixed(2)),
            settled: memberUserId === user.id,
          });

        if (splitError) {
          console.error('Expense split insert error:', splitError);
          throw new Error(`Failed to save expense split: ${splitError.message}`);
        }
      }

      for (const memberUserId of selectedMembers) {
        if (memberUserId !== user.id) {
          const { error: debtError } = await supabase
            .from('debts')
            .insert({
              house_id: houseId,
              debtor_id: memberUserId,
              creditor_id: user.id,
              original_amount: splitAmount,
              remaining_amount: splitAmount,
              due_date: null,
              description: `Share of ${description.trim()}`,
              status: 'pending',
            });

          if (debtError) {
            console.error('Debt insert error:', debtError);
            throw new Error(`Failed to record debt balance: ${debtError.message}`);
          }
        }
      }

      router.push('/expenses');
      router.refresh();
    } catch (err: any) {
      console.error('Error saving expense:', err);
      setError(err.message || 'Failed to save expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const splitAmount = amount && selectedMembers.length > 0
    ? (parseFloat(amount) / selectedMembers.length).toFixed(2)
    : '0';

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-black pb-12">
      <div className="flex items-center justify-between border-b-4 border-black pb-2">
        <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-black flex items-center gap-2">
          <DollarSign size={22} className="text-black flex-shrink-0 sm:w-6 sm:h-6" />
          New Expense
        </h1>
        <Button variant="brutal" size="sm" asChild>
          <Link href="/expenses">Cancel</Link>
        </Button>
      </div>

      <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-8">
        {error && (
          <div className="mb-6 bg-red-100 border-4 border-red-600 p-4 text-red-800 font-extrabold uppercase text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="description" required>
                  Expense Name / Reason
                </Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Groceries, Electricity Bill, Rent"
                  required
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="category">
                  Category
                </Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                  className="w-full mt-1 p-2.5 border-2 border-black bg-[#F5E600]/20 font-extrabold text-xs sm:text-sm uppercase focus:outline-none focus:bg-[#F5E600]/40 cursor-pointer h-[42px]"
                >
                  <option value="general">GENERAL</option>
                  <option value="groceries">GROCERIES</option>
                  <option value="utilities">UTILITIES</option>
                  <option value="rent">RENT</option>
                  <option value="dining">DINING</option>
                  <option value="subscriptions">INTERNET / SUBSCRIPTIONS</option>
                </select>
              </div>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-gray-700">Quick Reason Suggestion Chips:</span>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  { name: 'Rent', cat: 'rent', label: '🏠 Rent' },
                  { name: 'Groceries', cat: 'groceries', label: '🛒 Groceries' },
                  { name: 'Electricity Bill', cat: 'utilities', label: '⚡ Electricity' },
                  { name: 'Water & Gas', cat: 'utilities', label: '💧 Water/Gas' },
                  { name: 'WiFi / Internet', cat: 'subscriptions', label: '🌐 Internet' },
                  { name: 'Dinner / Food', cat: 'dining', label: '🍕 Dining' },
                  { name: 'Maid / Cleaning', cat: 'general', label: '🧹 Cleaning' },
                ].map((chip) => (
                  <button
                    key={chip.name}
                    type="button"
                    onClick={() => {
                      setDescription(chip.name);
                      setCategory(chip.cat);
                    }}
                    className="px-2.5 py-1 text-[11px] font-extrabold uppercase border border-black bg-[#F4F1EA] hover:bg-[#F5E600] transition-colors cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount" required>
                  Total Amount (₹)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 1200"
                  required
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="date" required>
                  Expense Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  disabled={loading}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t-2 border-black pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Label required className="text-sm sm:text-base font-extrabold">
                Who is this expense for?
              </Label>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSelectedMembers(members.map((m) => m.id))}
                  className="text-[10px] font-extrabold uppercase px-2 py-1 bg-black text-white border border-black hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMembers([])}
                  className="text-[10px] font-extrabold uppercase px-2 py-1 bg-white text-black border border-black hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Clear All
                </button>
                <span className="font-mono font-bold text-xs bg-[#F5E600] px-2 py-1 border border-black">
                  {selectedMembers.length} selected
                </span>
              </div>
            </div>

            {fetchingMembers ? (
              <div className="p-4 border-2 border-black bg-gray-100 font-bold uppercase text-xs flex items-center gap-2">
                <div className="w-4 h-4 bg-black animate-spin" />
                Loading house members...
              </div>
            ) : members.length === 0 ? (
              <div className="p-4 border-2 border-black bg-yellow-100 text-black font-bold uppercase text-xs">
                No members found. Adding you as default participant.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {members.map((member) => {
                  const isSelected = selectedMembers.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleMember(member.id)}
                      className={`
                        flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 border-2 text-left transition-all cursor-pointer min-h-[44px]
                        ${
                          isSelected
                            ? 'border-black bg-[#F5E600] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                            : 'border-black bg-white hover:bg-gray-100'
                        }
                      `}
                    >
                      <div
                        className={`
                        flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-none font-extrabold uppercase border border-black flex-shrink-0 text-xs sm:text-sm
                        ${isSelected ? 'bg-black text-white' : 'bg-white text-black'}
                      `}
                      >
                        {isSelected ? <Check size={14} /> : member.display_name?.[0] || 'M'}
                      </div>
                      <div className="font-extrabold uppercase text-[11px] sm:text-xs truncate">{member.display_name}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {amount && selectedMembers.length > 0 && (
            <div className="border-2 border-black bg-[#F4F1EA] p-3 sm:p-4 text-center font-mono font-bold text-xs sm:text-sm">
              <span className="uppercase text-gray-700 block text-[10px] sm:text-xs mb-1">Equal Split Share:</span>
              <span className="text-sm sm:text-xl text-black">
                ₹{amount} ÷ {selectedMembers.length} = <span className="text-green-700 font-extrabold">₹{splitAmount} / member</span>
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-black">
            <Button
              type="submit"
              variant="brutalAccent"
              fullWidth
              disabled={loading || !description.trim() || !amount || selectedMembers.length === 0}
              className="py-3 sm:py-4 text-sm sm:text-base order-1 sm:order-1"
            >
              {loading ? 'Saving Expense...' : 'Save Expense'}
            </Button>
            <Button variant="brutal" asChild disabled={loading} className="order-2 sm:order-2">
              <Link href="/expenses">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
