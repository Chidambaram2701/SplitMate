// Dashboard Page - Brutalist Financial Terminal Style
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { MoneyDisplay } from '@/components/ui/money-display';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, ArrowUpRight, ArrowDownRight, Home, CreditCard, Users, Clock } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [hasHouse, setHasHouse] = useState(false);
  const [houseName, setHouseName] = useState('');
  const [youOwe, setYouOwe] = useState(0);
  const [youReceive, setYouReceive] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);

  // Detailed lists of WHO owes WHO
  const [peopleIOwe, setPeopleIOwe] = useState<any[]>([]);
  const [peopleWhoOweMe, setPeopleWhoOweMe] = useState<any[]>([]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const houseId = sessionStorage.getItem('currentHouseId');
      if (!houseId) {
        setHasHouse(false);
        setLoading(false);
        return;
      }

      setHasHouse(true);

      // Get house details
      const { data: houseData } = await supabase
        .from('houses')
        .select('name')
        .eq('id', houseId)
        .maybeSingle();

      if (houseData) {
        setHouseName(houseData.name);
      }

      // Count members
      const { data: members } = await supabase
        .from('house_members')
        .select('id')
        .eq('house_id', houseId)
        .eq('status', 'active');

      setMemberCount(members?.length || 1);

      // 1. Get debts where user is debtor (YOU OWE OTHERS)
      const { data: debtorDebts } = await supabase
        .from('debts')
        .select('id, remaining_amount, description, status, creditor_id')
        .eq('house_id', houseId)
        .eq('debtor_id', user.id);

      // 2. Get debts where user is creditor (OTHERS OWE YOU)
      const { data: creditorDebts } = await supabase
        .from('debts')
        .select('id, remaining_amount, description, status, debtor_id')
        .eq('house_id', houseId)
        .eq('creditor_id', user.id);

      // 3. Fetch recent expenses
      const { data: rawExpenses } = await supabase
        .from('expenses')
        .select('id, description, total_amount, date, paid_by, created_at')
        .eq('house_id', houseId)
        .order('created_at', { ascending: false })
        .limit(4);

      // Fetch all referenced user profiles for names
      const allUserIds = Array.from(
        new Set([
          ...(debtorDebts || []).map((d: any) => d.creditor_id),
          ...(creditorDebts || []).map((d: any) => d.debtor_id),
          ...(rawExpenses || []).map((e: any) => e.paid_by),
        ].filter(Boolean))
      );

      const profileMap = new Map();
      if (allUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', allUserIds);

        if (profilesData) {
          profilesData.forEach((p: any) => profileMap.set(p.id, p));
        }
      }

      const activeIOweList = (debtorDebts || [])
        .filter((d: any) => (Number(d.remaining_amount) || 0) > 0)
        .map((d: any) => ({
          ...d,
          creditor: profileMap.get(d.creditor_id) || { display_name: 'Roommate' },
        }));

      const activeTheyOweList = (creditorDebts || [])
        .filter((d: any) => (Number(d.remaining_amount) || 0) > 0)
        .map((d: any) => ({
          ...d,
          debtor: profileMap.get(d.debtor_id) || { display_name: 'Roommate' },
        }));

      const enrichedRecentExpenses = (rawExpenses || []).map((e: any) => ({
        ...e,
        paid_by: profileMap.get(e.paid_by) || { display_name: e.paid_by === user.id ? 'You' : 'Roommate' },
      }));

      setPeopleIOwe(activeIOweList);
      setPeopleWhoOweMe(activeTheyOweList);

      const totalOwed = activeIOweList.reduce((sum: number, d: any) => sum + (Number(d.remaining_amount) || 0), 0);
      const totalReceivable = activeTheyOweList.reduce((sum: number, d: any) => sum + (Number(d.remaining_amount) || 0), 0);

      setYouOwe(totalOwed);
      setYouReceive(totalReceivable);
      setNetBalance(totalReceivable - totalOwed);
      setRecentExpenses(enrichedRecentExpenses);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-[#F5E600] animate-spin border-2 border-black" />
            <h2 className="text-xl font-bold uppercase tracking-wider text-black">
              Fetching House Data...
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 animate-pulse border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6" />
          ))}
        </div>
      </div>
    );
  }

  if (!hasHouse) {
    return (
      <div className="max-w-2xl mx-auto my-12 border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6 text-black">
        <div className="flex items-center gap-4 border-b-4 border-black pb-4">
          <div className="p-3 bg-[#F5E600] border-2 border-black">
            <Home size={32} className="text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold uppercase">No House Selected</h1>
            <p className="text-xs uppercase tracking-widest text-gray-700">Setup your house workspace to continue</p>
          </div>
        </div>

        <p className="text-sm font-medium leading-relaxed">
          You are currently not connected to an active house. Create a new house or ask your roommate to send you an invite link.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t-2 border-black">
          <Button variant="brutalAccent" size="lg" asChild className="flex-1 justify-center">
            <Link href="/houses/new">
              <Plus size={20} />
              Create A New House
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 text-black pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-black flex items-center gap-2">
            <Home className="hidden sm:inline-block" size={28} />
            {houseName || 'House'} Terminal
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-700 mt-1 flex items-center gap-2">
            <Users size={14} />
            {memberCount} Active Member{memberCount === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <Button variant="brutalAccent" size="default" asChild className="flex-1 sm:flex-none justify-center touch-target">
            <Link href="/expenses/new">
              <Plus size={18} />
              Add Expense
            </Link>
          </Button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* You Owe */}
        <div className="border-4 border-black bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="mb-4 border-b-2 border-white pb-2 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold uppercase text-white">You Owe</h3>
              <ArrowUpRight size={20} className="text-red-400" />
            </div>
            <div className="mb-4">
              <MoneyDisplay
                amount={youOwe}
                size="xl"
                variant="negative"
              />
            </div>

            {/* Names Breakdown */}
            {peopleIOwe.length > 0 ? (
              <div className="space-y-1.5 border-t border-white/20 pt-3">
                {peopleIOwe.slice(0, 3).map((d: any) => (
                  <div key={d.id} className="flex justify-between items-center text-xs text-red-300">
                    <span className="truncate max-w-[140px]">To {d.creditor?.display_name || 'Roommate'}:</span>
                    <span className="font-mono font-bold">₹{d.remaining_amount}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] uppercase text-gray-400">You owe ₹0 to roommates</p>
            )}
          </div>
          <div className="pt-3 border-t border-white/20 flex justify-between text-[11px] font-mono mt-4">
            <span className="uppercase text-gray-300">Pending Liabilities</span>
            <span className="font-bold text-white">₹{youOwe}</span>
          </div>
        </div>

        {/* You Receive */}
        <div className="border-4 border-black bg-[#F5E600] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="mb-4 border-b-2 border-black pb-2 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold uppercase text-black">You Receive</h3>
              <ArrowDownRight size={20} className="text-green-800" />
            </div>
            <div className="mb-4">
              <MoneyDisplay
                amount={youReceive}
                size="xl"
                variant="positive"
              />
            </div>

            {/* Names Breakdown */}
            {peopleWhoOweMe.length > 0 ? (
              <div className="space-y-1.5 border-t border-black/20 pt-3">
                {peopleWhoOweMe.slice(0, 3).map((d: any) => (
                  <div key={d.id} className="flex justify-between items-center text-xs text-green-950 font-bold">
                    <span className="truncate max-w-[140px]">From {d.debtor?.display_name || 'Roommate'}:</span>
                    <span className="font-mono">₹{d.remaining_amount}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] uppercase text-black font-bold">No receivables pending</p>
            )}
          </div>
          <div className="pt-3 border-t-2 border-black flex justify-between text-[11px] font-mono font-bold mt-4">
            <span className="uppercase text-black">Pending Receivables</span>
            <span className="text-black">₹{youReceive}</span>
          </div>
        </div>

        {/* Net Balance */}
        <div className="border-4 border-black bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="mb-4 border-b-2 border-black pb-2 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold uppercase text-black">Net Position</h3>
              <CreditCard size={20} className="text-black" />
            </div>
            <div className="mb-6">
              <MoneyDisplay
                amount={netBalance}
                size="xl"
                variant={netBalance >= 0 ? 'positive' : 'negative'}
              />
            </div>
          </div>
          <div className="pt-2 border-t-2 border-black flex justify-between items-center gap-2">
            <span className={`font-bold text-xs uppercase px-2 py-1 border border-black ${netBalance >= 0 ? 'bg-green-300 text-black' : 'bg-red-300 text-black'}`}>
              {netBalance >= 0 ? 'SURPLUS' : 'DEFICIT'}
            </span>
            <Button variant="brutalPrimary" size="sm" asChild className="touch-target">
              <Link href="/debts">
                Manage Debts
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Real Data Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Debts Summary List */}
        <div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 className="text-lg sm:text-xl font-bold uppercase text-black">Active Debts</h3>
            <Button variant="brutal" size="sm" asChild>
              <Link href="/debts">View All</Link>
            </Button>
          </div>
          {peopleIOwe.length === 0 && peopleWhoOweMe.length === 0 ? (
            <div className="text-center py-8 px-4 border-2 border-dashed border-black/40 bg-gray-50">
              <p className="text-xs font-bold uppercase text-gray-600 mb-2">
                All balances are fully settled!
              </p>
              <p className="text-[11px] text-gray-500">
                Log a shared expense to split bills automatically with roommates.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Show who you owe */}
              {peopleIOwe.map((debt: any) => (
                <div key={debt.id} className="flex items-center justify-between p-3 border-2 border-black bg-red-50 hover:bg-red-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-red-600 text-white flex items-center justify-center font-bold uppercase rounded-none border border-black flex-shrink-0">
                      {debt.creditor?.display_name?.[0] || 'C'}
                    </div>
                    <div>
                      <div className="font-extrabold uppercase text-xs text-black">
                        You owe <span className="text-red-700">{debt.creditor?.display_name || 'Roommate'}</span>
                      </div>
                      <div className="text-[10px] font-bold uppercase text-gray-600 truncate max-w-[150px] sm:max-w-[200px]">
                        {debt.description || 'Expense share'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono font-bold text-base text-red-700">₹{debt.remaining_amount}</div>
                    <Link href="/debts" className="text-[10px] font-extrabold uppercase text-black underline">
                      Settle
                    </Link>
                  </div>
                </div>
              ))}

              {/* Show who owes you */}
              {peopleWhoOweMe.map((debt: any) => (
                <div key={debt.id} className="flex items-center justify-between p-3 border-2 border-black bg-[#F5E600]/40 hover:bg-[#F5E600] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-black text-white flex items-center justify-center font-bold uppercase rounded-none border border-black flex-shrink-0">
                      {debt.debtor?.display_name?.[0] || 'D'}
                    </div>
                    <div>
                      <div className="font-extrabold uppercase text-xs text-black">
                        <span>{debt.debtor?.display_name || 'Roommate'}</span> owes you
                      </div>
                      <div className="text-[10px] font-bold uppercase text-gray-600 truncate max-w-[150px] sm:max-w-[200px]">
                        {debt.description || 'Expense share'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono font-bold text-base text-green-700">₹{debt.remaining_amount}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 className="text-lg sm:text-xl font-bold uppercase text-black">Recent Activity</h3>
            <Button variant="brutal" size="sm" asChild>
              <Link href="/expenses">View All</Link>
            </Button>
          </div>
          {recentExpenses.length === 0 ? (
            <div className="text-center py-8 px-4 border-2 border-dashed border-black/40 bg-gray-50">
              <p className="text-xs font-bold uppercase text-gray-600 mb-2">
                No recent expenses logged
              </p>
              <Button variant="brutalAccent" size="sm" asChild className="mt-2">
                <Link href="/expenses/new">
                  <Plus size={14} /> Add First Expense
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((expense: any) => (
                <div key={expense.id} className="flex items-start gap-3 p-3 border-2 border-black bg-gray-50 hover:bg-[#F5E600]/40 transition-colors">
                  <div className="p-2 bg-black text-white border border-black flex-shrink-0">
                    <DollarSign size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-extrabold uppercase text-xs sm:text-sm truncate">{expense.description}</span>
                      <span className="font-mono font-bold text-xs sm:text-sm flex-shrink-0">₹{expense.total_amount}</span>
                    </div>
                    <div className="text-[10px] uppercase text-gray-600 flex items-center gap-2 mt-1">
                      <span>Paid by: <strong className="text-black">{expense.paid_by?.display_name || 'Member'}</strong></span>
                      <span>•</span>
                      <span>{new Date(expense.date).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
}
