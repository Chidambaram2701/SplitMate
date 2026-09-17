// Dashboard Page - Brutalist Financial Terminal Style
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { MoneyDisplay } from '@/components/ui/money-display';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Plus, Users, DollarSign, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [netBalance, setNetBalance] = useState(0);
  const [pendingDebtsCount, setPendingDebtsCount] = useState(0);

  async function loadDashboardData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const houseId = sessionStorage.getItem('currentHouseId');
    if (!houseId) return;

    setLoading(true);

    try {
      // Get debts where user is creditor (people who owe user)
      const { data: creditorDebts } = await supabase
        .from('debts')
        .select('remaining_amount, status')
        .eq('house_id', houseId)
        .eq('creditor_id', user.id);

      // Get debts where user is debtor (user owes others)
      const { data: debtorDebts } = await supabase
        .from('debts')
        .select('remaining_amount, status')
        .eq('house_id', houseId)
        .eq('debtor_id', user.id);

      // Calculate totals with type assertions
      const totalReceivable = (creditorDebts as any[])?.reduce((sum: number, d: any) => sum + (d.remaining_amount || 0), 0) || 0;
      const totalOwed = (debtorDebts as any[])?.reduce((sum: number, d: any) => sum + (d.remaining_amount || 0), 0) || 0;

      // Count pending/overdue
      const count = (creditorDebts as any[])?.filter((d: any) => d.status === 'pending' || d.status === 'partial')?.length || 0;
      setPendingDebtsCount(count);
      setNetBalance(totalReceivable - totalOwed);
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-6">
        <div className="h-64 bg-gray-300 animate-pulse border-2 border-black" />
        <div className="h-64 bg-gray-300 animate-pulse border-2 border-black" />
        <div className="h-64 bg-gray-300 animate-pulse border-2 border-black" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold uppercase border-b-4 border-black pb-2">
            Dashboard
          </h1>
          <p className="text-sm uppercase tracking-widest mt-2">
            {loading ? 0 : 'Active Members'} Active Members
          </p>
        </div>
        <Button variant="brutalAccent" asChild>
          <Link href="/expenses/new">
            <Plus size={20} />
            Add Expense
          </Link>
        </Button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="border-2 border-black bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
          <div className="mb-4 border-b-2 border-white pb-2">
            <h3 className="text-lg font-bold uppercase">You Owe</h3>
          </div>
          <div className="mb-6">
            <MoneyDisplay
              amount={0}
              size="xl"
              variant="negative"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between border-b border-white/30 pb-2">
              <span className="text-sm uppercase">Pending Debts</span>
              <span className="font-mono font-bold">{loading ? 0 : pendingDebtsCount}</span>
            </div>
          </div>
        </div>

        <div className="border-2 border-black bg-[#F5E600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
          <div className="mb-4 border-b-2 border-black pb-2">
            <h3 className="text-lg font-bold uppercase">You Receive</h3>
          </div>
          <div className="mb-6">
            <MoneyDisplay
              amount={0}
              size="xl"
              variant="positive"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between border-b border-black pb-2">
              <span className="text-sm uppercase">People Owe You</span>
              <span className="font-mono font-bold">4</span>
            </div>
          </div>
        </div>

        <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
          <div className="mb-4 border-b-2 border-black pb-2">
            <h3 className="text-lg font-bold uppercase">Net Balance</h3>
          </div>
          <div className="mb-6">
            <MoneyDisplay
              amount={netBalance}
              size="xl"
              variant={netBalance >= 0 ? 'positive' : 'negative'}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={`font-bold uppercase ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netBalance >= 0 ? 'POSITIVE' : 'NEGATIVE'}
            </span>
            <Button variant="brutalPrimary" size="sm" asChild>
              <Link href="/debts">
                View All Debts
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
          <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
            <h3 className="text-xl font-bold uppercase">Upcoming Payments</h3>
            <Button variant="brutal" size="sm" asChild>
              <Link href="/debts">View All</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Bala', amount: 500, due: 'Sep 20', status: 'due-soon' },
              { name: 'Chandru', amount: 750, due: 'Sep 25', status: 'pending' },
              { name: 'Dinesh', amount: 300, due: 'Sep 30', status: 'pending' },
            ].map((payment: any, i) => (
              <div key={i} className="flex items-center justify-between p-3 border-2 border-black hover:bg-[#F5E600] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-black text-white flex items-center justify-center font-bold uppercase rounded-none">
                    {payment.name[0]}
                  </div>
                  <div>
                    <div className="font-bold uppercase">{payment.name}</div>
                    <div className="text-xs uppercase text-gray-600">Due: {payment.due}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-lg">₹{payment.amount}</div>
                  <StatusBadge status={payment.status as any} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
          <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
            <h3 className="text-xl font-bold uppercase">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {[
              { date: '17 Sep', type: 'Payment Received', description: 'Chandru paid ₹300', icon: ArrowDownRight, iconColor: 'text-green-600' },
              { date: '16 Sep', type: 'New Expense', description: 'Groceries expense added', icon: DollarSign, iconColor: 'text-black' },
              { date: '15 Sep', type: 'Payment Sent', description: 'You paid ₹500 to Arun', icon: ArrowUpRight, iconColor: 'text-red-600' },
            ].map((activity: any, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border-b-2 border-black last:border-0 hover:bg-[#F5E600] transition-colors">
                <activity.icon size={20} className={activity.iconColor} />
                <div>
                  <div className="text-xs font-bold uppercase text-gray-600 mb-1">{activity.date}</div>
                  <div className="font-bold uppercase">{activity.type}</div>
                  <div className="text-sm">{activity.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
