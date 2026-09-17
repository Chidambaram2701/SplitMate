// Expenses Page
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { MoneyDisplay } from '@/components/ui/money-display';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Home } from 'lucide-react';
import Link from 'next/link';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasHouse, setHasHouse] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    setLoading(true);
    try {
      let houseId = sessionStorage.getItem('currentHouseId');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        setHasHouse(false);
        return;
      }
      setHasHouse(true);

      const { data: expensesData, error } = await supabase
        .from('expenses')
        .select('id, description, total_amount, date, created_at, paid_by')
        .eq('house_id', houseId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading expenses:', error);
        setExpenses([]);
      } else if (expensesData && expensesData.length > 0) {
        const paidByIds = Array.from(new Set(expensesData.map((e: any) => e.paid_by).filter(Boolean)));
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', paidByIds);

        const profileMap = new Map();
        if (profilesData) {
          profilesData.forEach((p: any) => profileMap.set(p.id, p));
        }

        const enrichedExpenses = expensesData.map((e: any) => {
          const prof = profileMap.get(e.paid_by);
          const isUser = e.paid_by === user.id;
          return {
            ...e,
            paid_by: {
              display_name: prof?.display_name || (isUser ? (user.user_metadata?.display_name || 'You') : 'Roommate'),
            },
          };
        });

        setExpenses(enrichedExpenses);
      } else {
        setExpenses([]);
      }
    } catch (err) {
      console.error('Failed loading expenses:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (!error) {
      loadExpenses();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
          <div className="w-5 h-5 bg-[#F5E600] animate-spin border-2 border-black" />
          <h2 className="text-xl font-bold uppercase tracking-wider text-black">
            Loading Expenses Ledger...
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
        <p className="text-sm font-medium">Please select or create a house workspace to manage house expenses.</p>
        <Button variant="brutalAccent" size="lg" asChild>
          <Link href="/houses/new">
            <Plus size={20} /> Create A House
          </Link>
        </Button>
      </div>
    );
  }

  const totalAmount = expenses.reduce((sum: number, e: any) => sum + Number(e.total_amount || 0), 0);

  return (
    <div className="space-y-6 text-black">
      <div className="flex items-center justify-between border-b-4 border-black pb-2">
        <h1 className="text-4xl font-extrabold uppercase tracking-tight text-black">
          Expenses Ledger
        </h1>
        <Button variant="brutalAccent" asChild>
          <Link href="/expenses/new">
            <Plus size={20} />
            Add Expense
          </Link>
        </Button>
      </div>

      <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8">
        <div className="flex items-center justify-between mb-6 border-b-2 border-black pb-4">
          <div>
            <h2 className="text-2xl font-extrabold uppercase text-black">Total House Expenses</h2>
            <p className="text-xs uppercase font-bold text-gray-700">Cumulative record</p>
          </div>
          <MoneyDisplay amount={totalAmount} size="lg" />
        </div>

        {expenses.length === 0 ? (
          <div className="py-12 text-center">
            <div className="border-4 border-black bg-[#F5E600] p-8 inline-block shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <p className="font-extrabold uppercase text-xl mb-2 text-black">No Expenses Logged Yet</p>
              <p className="text-xs font-bold uppercase text-black mb-6">
                Your house ledger is empty. Click below to add your first expense!
              </p>
              <Button variant="brutalPrimary" asChild>
                <Link href="/expenses/new">
                  <Plus size={18} />
                  Add First Expense
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense: any) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 border-2 border-black bg-white hover:bg-[#F5E600] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-black text-white flex items-center justify-center font-extrabold uppercase text-lg border-2 border-black flex-shrink-0">
                    E
                  </div>
                  <div>
                    <div className="font-bold uppercase text-lg text-black">{expense.description}</div>
                    <div className="text-xs font-bold uppercase text-gray-700 flex items-center gap-2 mt-1">
                      <span>Paid by: {expense.paid_by?.display_name || 'Member'}</span>
                      <span>|</span>
                      <span>{new Date(expense.date).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono font-bold text-xl text-black">₹{expense.total_amount}</div>
                    <div className="text-xs font-bold uppercase text-gray-600">{new Date(expense.created_at).toLocaleDateString('en-IN')}</div>
                  </div>
                  <Button variant="brutalDanger" size="icon" onClick={() => handleDelete(expense.id)}>
                    <Trash2 size={16} />
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
