// Expenses Page
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { MoneyDisplay } from '@/components/ui/money-display';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Home, Search, Filter, Receipt } from 'lucide-react';
import Link from 'next/link';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasHouse, setHasHouse] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
        .select('id, description, total_amount, date, category, created_at, paid_by')
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
    if (!confirm('Are you sure you want to delete this expense record?')) return;

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (!error) {
      loadExpenses();
    }
  };

  const filteredExpenses = expenses.filter((e: any) => {
    const matchesSearch =
      e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.paid_by?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || (e.category || 'general').toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const totalAmount = filteredExpenses.reduce((sum: number, e: any) => sum + Number(e.total_amount || 0), 0);

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

  return (
    <div className="space-y-6 text-black pb-12">
      <div className="flex items-center justify-between border-b-4 border-black pb-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-black flex items-center gap-2">
          <Receipt size={28} className="hidden sm:inline-block" />
          Expenses Ledger
        </h1>
        <Button variant="brutalAccent" size="sm" asChild className="touch-target">
          <Link href="/expenses/new">
            <Plus size={16} />
            Add Expense
          </Link>
        </Button>
      </div>

      <div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold uppercase text-black">Total House Expenses</h2>
            <p className="text-[11px] uppercase font-bold text-gray-700">Cumulative record ({filteredExpenses.length} entries)</p>
          </div>
          <MoneyDisplay amount={totalAmount} size="lg" />
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-3 bg-[#F4F1EA] p-3 border-2 border-black">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              type="text"
              placeholder="Search by expense name or paid by roommate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border-2 border-black text-xs sm:text-sm font-extrabold uppercase placeholder:normal-case placeholder:font-normal placeholder:text-gray-500 focus:outline-none focus:bg-[#F5E600]/20"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <Filter size={14} className="flex-shrink-0 text-black ml-1" />
            {['all', 'general', 'groceries', 'utilities', 'rent', 'dining'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 font-extrabold uppercase border border-black transition-all flex-shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center">
            <div className="border-4 border-black bg-[#F5E600] p-6 inline-block shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-md">
              <p className="font-extrabold uppercase text-base mb-2 text-black">No Expenses Found</p>
              <p className="text-xs font-bold uppercase text-black mb-4">
                {searchQuery || selectedCategory !== 'all'
                  ? 'No matching expenses for the applied filter.'
                  : 'Your house ledger is empty. Click below to add your first expense!'}
              </p>
              <Button variant="brutalPrimary" size="sm" asChild className="touch-target">
                <Link href="/expenses/new">
                  <Plus size={16} />
                  Add Expense
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((expense: any) => (
              <div
                key={expense.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border-2 border-black bg-white hover:bg-[#F5E600]/30 transition-colors gap-3"
              >
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-black text-white flex items-center justify-center font-extrabold uppercase text-sm sm:text-base border-2 border-black flex-shrink-0">
                    {expense.description?.[0] || 'E'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold uppercase text-sm sm:text-base text-black truncate">{expense.description}</div>
                    <div className="text-[11px] font-bold uppercase text-gray-700 flex flex-wrap items-center gap-2 mt-0.5">
                      <span>Paid by: <strong className="text-black">{expense.paid_by?.display_name || 'Member'}</strong></span>
                      <span>•</span>
                      <span>{new Date(expense.date).toLocaleDateString('en-IN')}</span>
                      {expense.category && (
                        <span className="bg-black text-white px-1.5 py-0.5 text-[9px] uppercase font-mono">
                          {expense.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-black/10">
                  <div className="text-left sm:text-right">
                    <div className="font-mono font-bold text-lg sm:text-xl text-black">₹{expense.total_amount}</div>
                  </div>
                  <Button variant="brutalDanger" size="icon" onClick={() => handleDelete(expense.id)} className="touch-target">
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
