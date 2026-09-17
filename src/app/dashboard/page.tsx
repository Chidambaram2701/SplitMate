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
        .select(`
          id,
          remaining_amount,
          description,
          status,
          creditor:creditor_id (
            display_name,
            email
          )
        `)
        .eq('house_id', houseId)
        .eq('debtor_id', user.id);

      // 2. Get debts where user is creditor (OTHERS OWE YOU)
      const { data: creditorDebts } = await supabase
        .from('debts')
        .select(`
          id,
          remaining_amount,
          description,
          status,
          debtor:debtor_id (
            display_name,
            email
          )
        `)
        .eq('house_id', houseId)
        .eq('creditor_id', user.id);

      const activeIOweList = (debtorDebts as any[])?.filter((d: any) => (Number(d.remaining_amount) || 0) > 0) || [];
      const activeTheyOweList = (creditorDebts as any[])?.filter((d: any) => (Number(d.remaining_amount) || 0) > 0) || [];

      setPeopleIOwe(activeIOweList);
      setPeopleWhoOweMe(activeTheyOweList);

      const totalOwed = activeIOweList.reduce((sum: number, d: any) => sum + (Number(d.remaining_amount) || 0), 0);
      const totalReceivable = activeTheyOweList.reduce((sum: number, d: any) => sum + (Number(d.remaining_amount) || 0), 0);

      setYouOwe(totalOwed);
      setYouReceive(totalReceivable);
      setNetBalance(totalReceivable - totalOwed);

      // Fetch recent expenses from Supabase
      const { data: expenseData } = await supabase
        .from('expenses')
        .select('id, description, total_amount, date, paid_by:paid_by(display_name)')
        .eq('house_id', houseId)
        .order('created_at', { ascending: false })
        .limit(4);

      setRecentExpenses(expenseData || []);
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
    <div className="space-y-8 text-black pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <div>
          <h1 className="text-4xl font-extrabold uppercase tracking-tight text-black">
            {houseName || 'House'} Terminal
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-700 mt-1 flex items-center gap-2">
            <Users size={14} />
            {memberCount} Active Member{memberCount === 1 ? '' : 's'}
          </p>
        </div>
        <Button variant="brutalAccent" size="lg" asChild className="self-start sm:self-auto">
          <Link href="/expenses/new">
            <Plus size={20} />
            Add Expense
          </Link>
        </Button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* You Owe */}
        <div className="border-4 border-black bg-black text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col justify-between">
          <div>
            <div className="mb-4 border-b-2 border-white pb-2 flex items-center justify-between">
              <h3 className="text-lg font-bold uppercase text-white">You Owe</h3>
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
        <div className="border-4 border-black bg-[#F5E600] text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col justify-between">
          <div>
            <div className="mb-4 border-b-2 border-black pb-2 flex items-center justify-between">
              <h3 className="text-lg font-bold uppercase text-black">You Receive</h3>
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
        <div className="border-4 border-black bg-white text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col justify-between">
          <div>
            <div className="mb-4 border-b-2 border-black pb-2 flex items-center justify-between">
              <h3 className="text-lg font-bold uppercase text-black">Net Position</h3>
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
          <div className="pt-2 border-t-2 border-black flex justify-between items-center">
            <span className={`font-bold text-xs uppercase px-2 py-1 border border-black ${netBalance >= 0 ? 'bg-green-300 text-black' : 'bg-red-300 text-black'}`}>
              {netBalance >= 0 ? 'SURPLUS' : 'DEFICIT'}
            </span>
            <Button variant="brutalPrimary" size="sm" asChild>
              <Link href="/debts">
                View All Debts
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Real Data Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Debts Summary List */}
        <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 className="text-xl font-bold uppercase text-black">Active Roommate Debts</h3>
            <Button variant="brutal" size="sm" asChild>
              <Link href="/debts">View All</Link>
            </Button>
          </div>
          {peopleIOwe.length === 0 && peopleWhoOweMe.length === 0 ? (
            <p className="text-xs font-bold uppercase text-gray-500 py-6 text-center">
              No pending roommate debts. All balances are clear!
            </p>
          ) : (
            <div className="space-y-3">
              {/* Show who you owe */}
              {peopleIOwe.map((debt: any) => (
                <div key={debt.id} className="flex items-center justify-between p-3 border-2 border-black bg-red-50 hover:bg-red-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-red-600 text-white flex items-center justify-center font-bold uppercase rounded-none border border-black">
                      {debt.creditor?.display_name?.[0] || 'C'}
                    </div>
                    <div>
                      <div className="font-extrabold uppercase text-xs text-black">
                        You owe <span className="text-red-700">{debt.creditor?.display_name || 'Roommate'}</span>
                      </div>
                      <div className="text-[10px] font-bold uppercase text-gray-600">
                        {debt.description || 'Expense share'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-base text-red-700">₹{debt.remaining_amount}</div>
                  </div>
                </div>
              ))}

              {/* Show who owes you */}
              {peopleWhoOweMe.map((debt: any) => (
                <div key={debt.id} className="flex items-center justify-between p-3 border-2 border-black bg-[#F5E600]/40 hover:bg-[#F5E600] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-black text-white flex items-center justify-center font-bold uppercase rounded-none border border-black">
                      {debt.debtor?.display_name?.[0] || 'D'}
                    </div>
                    <div>
                      <div className="font-extrabold uppercase text-xs text-black">
                        <span>{debt.debtor?.display_name || 'Roommate'}</span> owes you
                      </div>
                      <div className="text-[10px] font-bold uppercase text-gray-600">
                        {debt.description || 'Expense share'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-base text-green-700">₹{debt.remaining_amount}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 className="text-xl font-bold uppercase text-black">Recent Activity</h3>
            <Button variant="brutal" size="sm" asChild>
              <Link href="/expenses">View All</Link>
            </Button>
          </div>
          {recentExpenses.length === 0 ? (
            <p className="text-xs font-bold uppercase text-gray-500 py-6 text-center">
              No recent expenses logged. Click "+ Add Expense" to start!
            </p>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((expense: any) => (
                <div key={expense.id} className="flex items-start gap-3 p-3 border-b-2 border-black last:border-0 hover:bg-[#F5E600] transition-colors">
                  <DollarSign size={18} className="text-black flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold uppercase text-sm">{expense.description}</span>
                      <span className="font-mono font-bold text-sm">₹{expense.total_amount}</span>
                    </div>
                    <div className="text-[10px] uppercase text-gray-600 flex items-center gap-2 mt-0.5">
                      <span>Paid by: {expense.paid_by?.display_name || 'Member'}</span>
                      <span>|</span>
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
