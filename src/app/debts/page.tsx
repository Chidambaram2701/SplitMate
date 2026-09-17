// Debts Page
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { MoneyDisplay } from '@/components/ui/money-display';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const cardVariants = {
  default: 'border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
  accent: 'border-2 border-black bg-[#F5E600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
  dark: 'border-2 border-black bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
};

export default function DebtsPage() {
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDebts();
  }, []);

  async function loadDebts() {
    const houseId = sessionStorage.getItem('currentHouseId');
    if (!houseId) return;

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: debtsData, error } = await supabase
      .from('debts')
      .select(`
        id,
        original_amount,
        remaining_amount,
        due_date,
        status,
        debtor (
          display_name
        )
      `)
      .eq('house_id', houseId)
      .eq('creditor_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading debts:', error);
    } else if (debtsData) {
      setDebts(debtsData);
    }

    setLoading(false);
  }

  const totalReceivable = debts.reduce((sum: number, d: any) => sum + d.remaining_amount, 0);
  const overdueDebts = debts.filter((d: any) => d.remaining_amount > 0 && (!d.due_date || new Date(d.due_date) < new Date()));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-gray-300 animate-pulse border-2 border-black" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold uppercase border-b-4 border-black pb-2">
          Debts & Loans
        </h1>
        <Button variant="brutalAccent" asChild>
          <Link href="/debts/new">
            <Plus size={20} />
            New Debt
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border-2 border-black bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
          <div className="mb-4 border-b-2 border-white pb-2">
            <h3 className="text-lg font-bold uppercase">Total Receivable</h3>
          </div>
          <MoneyDisplay amount={totalReceivable} size="xl" variant="positive" />
        </div>

        <div className="border-2 border-black bg-[#F5E600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
          <div className="mb-4 border-b-2 border-black pb-2">
            <h3 className="text-lg font-bold uppercase">Active Debts</h3>
          </div>
          <div className="text-4xl font-mono font-bold uppercase">{debts.length}</div>
          <p className="text-sm uppercase mt-2">People who owe you money</p>
        </div>

        <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
          <div className="mb-4 border-b-2 border-black pb-2">
            <h3 className="text-lg font-bold uppercase">Overdue</h3>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle size={32} className="text-[#FF5A1F]" />
            <div>
              <div className="text-4xl font-mono font-bold uppercase">{overdueDebts.length}</div>
              <p className="text-sm uppercase mt-2">Items past due date</p>
            </div>
          </div>
        </div>
      </div>

      {/* Debt List */}
      <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
        <h2 className="text-2xl font-bold uppercase border-b-2 border-black pb-4 mb-4">
          All Debts
        </h2>

        {debts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="border-2 border-black p-8 inline-block">
              <p className="font-bold uppercase mb-2">No Debts</p>
              <p className="text-sm uppercase text-gray-600 mb-4">
                Everyone is settled up! No outstanding balances.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {debts.map((debt: any) => (
              <div
                key={debt.id}
                className="p-4 border-2 border-black hover:bg-[#F5E600] transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-black text-white flex items-center justify-center font-bold uppercase rounded-none">
                      {debt.debtor?.display_name?.[0] || '?'}
                    </div>
                    <div>
                      <div className="font-bold uppercase text-lg">
                        {debt.debtor?.display_name || 'Unknown'} owes you
                      </div>
                      <div className="text-xs uppercase text-gray-600">
                        Debt #{debt.id?.substring(0, 8) || '???'}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={debt.status || 'pending'} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="font-mono font-bold text-2xl">₹{debt.remaining_amount || 0}</div>
                  <div className="text-right">
                    <div className="text-sm uppercase text-gray-600">Original: ₹{debt.original_amount || 0}</div>
                    {debt.due_date && (
                      <div className="text-xs uppercase mt-1">
                        Due: {new Date(debt.due_date).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t-2 border-black flex gap-2">
                  <Button variant="brutal" size="sm" asChild className="text-xs">
                    <Link href={`/debts/${debt.id}/payment`}>+ Record Payment</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
