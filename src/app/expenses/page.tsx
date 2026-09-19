// Expenses Page - With Edit and Delete functionality
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { MoneyDisplay } from '@/components/ui/money-display';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Home, Search, Filter, Receipt, Pencil, X, Check, Save } from 'lucide-react';
import Link from 'next/link';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasHouse, setHasHouse] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Edit Expense Modal State
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('general');
  const [editDate, setEditDate] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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

        const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

        const enrichedExpenses = expensesData.map((e: any) => {
          const prof = profilesMap.get(e.paid_by);
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

  const handleOpenEditModal = (expense: any) => {
    setEditingExpense(expense);
    setEditDescription(expense.description || '');
    setEditAmount(String(expense.total_amount || ''));
    setEditCategory(expense.category || 'general');
    setEditDate(expense.date || new Date().toISOString().split('T')[0]);
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    const numAmount = parseFloat(editAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setEditError('Please enter a valid amount greater than ₹0.');
      return;
    }

    if (!editDescription.trim()) {
      setEditError('Expense name/description cannot be empty.');
      return;
    }

    setSavingEdit(true);
    setEditError(null);

    try {
      // 1. Update expenses record
      const { error: updateError } = await supabase
        .from('expenses')
        .update({
          description: editDescription.trim(),
          total_amount: numAmount,
          category: editCategory,
          date: editDate,
        })
        .eq('id', editingExpense.id);

      if (updateError) {
        throw new Error(updateError.message || 'Failed to update expense record.');
      }

      // 2. If expense_splits exist, update split amounts proportionally
      const { data: splits } = await supabase
        .from('expense_splits')
        .select('id, participant_id')
        .eq('expense_id', editingExpense.id);

      if (splits && splits.length > 0) {
        const splitAmount = parseFloat((numAmount / splits.length).toFixed(2));
        for (const split of splits) {
          await supabase
            .from('expense_splits')
            .update({
              amount: splitAmount,
              percentage: parseFloat(((splitAmount / numAmount) * 100).toFixed(2)),
            })
            .eq('id', split.id);
        }
      }

      setEditingExpense(null);
      loadExpenses();
    } catch (err: any) {
      console.error('Edit error:', err);
      setEditError(err.message || 'Error saving changes. Please try again.');
    } finally {
      setSavingEdit(false);
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

  const totalAmount = filteredExpenses.reduce((sum: number, e: any) => sum + (Number(e.total_amount) || 0), 0);

  if (loading) {
    return (
      <div className="p-12 text-center border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-3 text-black">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent mx-auto" />
        <div className="font-mono font-extrabold uppercase text-xs">
          Loading Expenses Ledger...
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
        <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-black flex items-center gap-2">
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

                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-black/10">
                  <div className="text-left sm:text-right">
                    <div className="font-mono font-bold text-lg sm:text-xl text-black">₹{expense.total_amount}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="brutalAccent"
                      size="icon"
                      onClick={() => handleOpenEditModal(expense)}
                      title="Edit Expense Amount & Details"
                      className="touch-target border-2 border-black bg-[#F5E600] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="brutalDanger"
                      size="icon"
                      onClick={() => handleDelete(expense.id)}
                      title="Delete Expense Record"
                      className="touch-target border-2 border-black bg-red-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => !savingEdit && setEditingExpense(null)}
          />

          <div className="relative w-full max-w-md border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-7 z-10 text-black space-y-5 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-4 border-black pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#F5E600] border-2 border-black">
                  <Pencil size={18} className="text-black" />
                </div>
                <h2 className="text-lg font-extrabold uppercase text-black">Edit Expense</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                disabled={savingEdit}
                className="p-1.5 border-2 border-black bg-white hover:bg-gray-100 text-black font-extrabold cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Message */}
            {editError && (
              <div className="p-3 border-2 border-black bg-red-100 text-red-800 text-xs font-bold uppercase">
                {editError}
              </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase text-black mb-1">
                  Expense Name / Description *
                </label>
                <Input
                  type="text"
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="e.g. Eggs, WiFi, Groceries"
                  className="w-full text-xs sm:text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-black mb-1">
                  Expense Amount (₹ Rupees) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-extrabold text-sm text-black">₹</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="Enter correct amount"
                    className="w-full pl-8 font-mono text-base font-extrabold text-black bg-[#F5E600]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-black mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full p-2.5 border-2 border-black bg-white font-extrabold text-xs uppercase focus:outline-none focus:bg-[#F5E600]/20"
                >
                  <option value="general">General</option>
                  <option value="groceries">Groceries</option>
                  <option value="utilities">Utilities</option>
                  <option value="rent">Rent</option>
                  <option value="dining">Dining</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-black mb-1">
                  Expense Date
                </label>
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full text-xs font-mono"
                />
              </div>

              <div className="pt-3 border-t-2 border-black flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="brutal"
                  size="sm"
                  onClick={() => setEditingExpense(null)}
                  disabled={savingEdit}
                  className="flex-1 sm:flex-none justify-center text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="brutalAccent"
                  size="sm"
                  disabled={savingEdit}
                  className="flex-1 sm:flex-none justify-center gap-1.5 text-xs font-extrabold"
                >
                  <Save size={15} />
                  {savingEdit ? 'Updating...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
