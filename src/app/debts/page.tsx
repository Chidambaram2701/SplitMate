// Debts Page
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { MoneyDisplay } from '@/components/ui/money-display';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, Home } from 'lucide-react';
import Link from 'next/link';

export default function DebtsPage() {
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasHouse, setHasHouse] = useState(true);

  useEffect(() => {
    loadDebts();
  }, []);

  async function loadDebts() {
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
    } catch (err) {
      console.error('Error in loadDebts:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
          <div className="w-5 h-5 bg-[#F5E600] animate-spin border-2 border-black" />
          <h2 className="text-xl font-bold uppercase tracking-wider text-black">
            Loading Debts & Liabilities...
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
        <p className="text-sm font-medium">Please select or create a house workspace to view debts.</p>
        <Button variant="brutalAccent" size="lg" asChild>
          <Link href="/houses/new">
            <Plus size={20} /> Create A House
          </Link>
        </Button>
      </div>
    );
  }

  const totalReceivable = debts.reduce((sum: number, d: any) => sum + (Number(d.remaining_amount) || 0), 0);
  const overdueDebts = debts.filter((d: any) => (Number(d.remaining_amount) || 0) > 0 && (!d.due_date || new Date(d.due_date) < new Date()));

  return (
    <div className="space-y-6 text-black">
      <div className="flex items-center justify-between border-b-4 border-black pb-2">
        <h1 className="text-4xl font-extrabold uppercase tracking-tight text-black">
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
        <div className="border-4 border-black bg-black text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
          <div className="mb-4 border-b-2 border-white pb-2">
            <h3 className="text-lg font-bold uppercase text-white">Total Receivable</h3>
          </div>
          <MoneyDisplay amount={totalReceivable} size="xl" variant="positive" />
        </div>

        <div className="border-4 border-black bg-[#F5E600] text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
          <div className="mb-4 border-b-2 border-black pb-2">
            <h3 className="text-lg font-bold uppercase text-black">Active Debts</h3>
          </div>
          <div className="text-4xl font-mono font-extrabold uppercase text-black">{debts.length}</div>
          <p className="text-xs font-bold uppercase mt-2 text-black">People who owe you money</p>
        </div>

        <div className="border-4 border-black bg-white text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
          <div className="mb-4 border-b-2 border-black pb-2">
            <h3 className="text-lg font-bold uppercase text-black">Overdue</h3>
          </div>
          <div className="flex items-center gap-3">
            <AlertTriangle size={32} className="text-red-600 flex-shrink-0" />
            <div>
              <div className="text-4xl font-mono font-extrabold uppercase text-black">{overdueDebts.length}</div>
              <p className="text-xs font-bold uppercase mt-1 text-gray-700">Past due date</p>
            </div>
          </div>
        </div>
      </div>

      {/* Debt List */}
      <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
        <h2 className="text-2xl font-extrabold uppercase border-b-2 border-black pb-4 mb-4 text-black">
          Outstanding Debts
        </h2>

        {debts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="border-4 border-black bg-[#F5E600] p-8 inline-block shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <p className="font-extrabold uppercase text-xl mb-2 text-black">No Active Debts</p>
              <p className="text-xs font-bold uppercase text-black">
                Everyone is settled up! There are no pending debts recorded.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {debts.map((debt: any) => (
              <div
                key={debt.id}
                className="p-4 border-2 border-black bg-white hover:bg-[#F5E600] transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-black text-white flex items-center justify-center font-extrabold uppercase border border-black">
                      {debt.debtor?.display_name?.[0] || 'D'}
                    </div>
                    <div>
                      <div className="font-bold uppercase text-lg text-black">
                        {debt.debtor?.display_name || 'Member'} owes you
                      </div>
                      <div className="text-xs font-bold uppercase text-gray-600">
                        Debt #{debt.id?.substring(0, 8) || '???'}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={debt.status || 'pending'} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="font-mono font-bold text-2xl text-black">₹{debt.remaining_amount || 0}</div>
                  <div className="text-right">
                    <div className="text-xs font-bold uppercase text-gray-700">Original: ₹{debt.original_amount || 0}</div>
                    {debt.due_date && (
                      <div className="text-xs font-bold uppercase text-black mt-1">
                        Due: {new Date(debt.due_date).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t-2 border-black flex gap-2">
                  <Button variant="brutalPrimary" size="sm" asChild className="text-xs">
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
