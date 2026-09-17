// Expenses Page
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { MoneyDisplay } from '@/components/ui/money-display';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    const houseId = sessionStorage.getItem('currentHouseId');
    if (!houseId) return;

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: expensesData, error } = await supabase
      .from('expenses')
      .select(`
        id,
        description,
        total_amount,
        date,
        created_at,
        paid_by (
          display_name
        )
      `)
      .eq('house_id', houseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading expenses:', error);
    } else if (expensesData) {
      setExpenses(expensesData);
    }

    setLoading(false);
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
        <div className="h-64 bg-gray-300 animate-pulse border-2 border-black" />
      </div>
    );
  }

  const totalAmount = expenses.reduce((sum: number, e: any) => sum + e.total_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold uppercase border-b-4 border-black pb-2">
          Expenses
        </h1>
        <Button variant="brutalAccent" asChild>
          <Link href="/expenses/new">
            <Plus size={20} />
            Add Expense
          </Link>
        </Button>
      </div>

      <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
        <div className="flex items-center justify-between mb-6 border-b-2 border-black pb-4">
          <div>
            <h2 className="text-2xl font-bold uppercase">Total Expenses</h2>
            <p className="text-sm uppercase text-gray-600">All time ledger</p>
          </div>
          <MoneyDisplay amount={totalAmount} size="lg" />
        </div>

        {expenses.length === 0 ? (
          <div className="py-12 text-center">
            <div className="border-2 border-black p-8 inline-block mb-4">
              <p className="font-bold uppercase mb-2">No Expenses Yet</p>
              <p className="text-sm uppercase text-gray-600 mb-4">
                Your house ledger is clean. Add your first expense!
              </p>
              <Button variant="brutalAccent" asChild>
                <Link href="/expenses/new">+ Add First Expense</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((expense: any) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 border-2 border-black hover:bg-[#F5E600] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-black text-white flex items-center justify-center font-bold uppercase rounded-none flex-shrink-0">
                    E
                  </div>
                  <div>
                    <div className="font-bold uppercase text-lg">{expense.description}</div>
                    <div className="text-xs uppercase text-gray-600 flex items-center gap-2 mt-1">
                      <span>Paid by: {expense.paid_by?.display_name || 'Unknown'}</span>
                      <span className="text-gray-400">|</span>
                      <span>{new Date(expense.date).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono font-bold text-xl">₹{expense.total_amount}</div>
                    <div className="text-xs uppercase text-gray-600">{new Date(expense.created_at).toLocaleDateString('en-IN')}</div>
                  </div>
                  <Button variant="brutal" size="icon" onClick={() => handleDelete(expense.id)}>
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
