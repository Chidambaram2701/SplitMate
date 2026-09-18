'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { BarChart3, Download, PieChart, TrendingUp, DollarSign, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [hasHouse, setHasHouse] = useState(true);
  const [totalExpenditure, setTotalExpenditure] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<{ category: string; amount: number; percentage: number }[]>([]);
  const [settlementEfficiency, setSettlementEfficiency] = useState<number>(0);
  const [totalDebtsCount, setTotalDebtsCount] = useState({ total: 0, settled: 0 });
  const [memberContributions, setMemberContributions] = useState<{ name: string; amount: number; percentage: number }[]>([]);
  const [rawExpenses, setRawExpenses] = useState<any[]>([]);

  useEffect(() => {
    loadReportData();
  }, []);

  async function loadReportData() {
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
        setLoading(false);
        return;
      }
      setHasHouse(true);

      // Fetch all profiles for name resolution
      const { data: profiles } = await supabase.from('profiles').select('id, display_name, email');
      const profileMap = new Map<string, string>();
      if (profiles) {
        profiles.forEach((p) => {
          profileMap.set(p.id, p.display_name || p.email?.split('@')[0] || 'Roommate');
        });
      }

      // 1. Fetch Expenses
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('id, description, total_amount, date, category, paid_by, created_at')
        .eq('house_id', houseId)
        .order('date', { ascending: false });

      const expensesList = expensesData || [];
      setRawExpenses(expensesList);

      const grandTotal = expensesList.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);
      setTotalExpenditure(grandTotal);

      // Category Distribution
      const catMap: Record<string, number> = {};
      expensesList.forEach((exp) => {
        const cat = exp.category ? exp.category.toUpperCase() : 'GENERAL';
        catMap[cat] = (catMap[cat] || 0) + Number(exp.total_amount || 0);
      });

      const catList = Object.entries(catMap).map(([category, amount]) => ({
        category,
        amount,
        percentage: grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0,
      })).sort((a, b) => b.amount - a.amount);

      setCategoryBreakdown(catList);

      // Member Spend Breakdown
      const memberMap: Record<string, number> = {};
      expensesList.forEach((exp) => {
        const name = profileMap.get(exp.paid_by) || 'Unknown Roommate';
        memberMap[name] = (memberMap[name] || 0) + Number(exp.total_amount || 0);
      });

      const memberList = Object.entries(memberMap).map(([name, amount]) => ({
        name,
        amount,
        percentage: grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0,
      })).sort((a, b) => b.amount - a.amount);

      setMemberContributions(memberList);

      // 2. Fetch Debts for Settlement Efficiency
      const { data: debtsData } = await supabase
        .from('debts')
        .select('id, original_amount, remaining_amount, status')
        .eq('house_id', houseId);

      const debtsList = debtsData || [];
      let totalOriginalDebts = 0;
      let totalRemainingDebts = 0;
      let settledCount = 0;

      debtsList.forEach((d) => {
        const orig = Number(d.original_amount || 0);
        const rem = Number(d.remaining_amount || 0);
        totalOriginalDebts += orig;
        totalRemainingDebts += rem;
        if (d.status === 'settled' || d.status === 'paid' || rem === 0) {
          settledCount++;
        }
      });

      const totalPaidOff = totalOriginalDebts - totalRemainingDebts;
      const efficiency = totalOriginalDebts > 0
        ? Math.min(100, Math.round((totalPaidOff / totalOriginalDebts) * 100))
        : (debtsList.length > 0 ? Math.round((settledCount / debtsList.length) * 100) : 100);

      setSettlementEfficiency(efficiency);
      setTotalDebtsCount({ total: debtsList.length, settled: settledCount });

    } catch (err) {
      console.error('Error loading report data:', err);
    } finally {
      setLoading(false);
    }
  }

  const exportToCSV = () => {
    if (rawExpenses.length === 0) {
      alert('No expense data available to export.');
      return;
    }

    const headers = ['Date', 'Description', 'Category', 'Paid By User ID', 'Amount (INR)'];
    const rows = rawExpenses.map((exp) => [
      exp.date || exp.created_at?.slice(0, 10) || '',
      `"${(exp.description || '').replace(/"/g, '""')}"`,
      exp.category || 'general',
      exp.paid_by || '',
      exp.total_amount || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SplitMate_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-12 text-center border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent mx-auto" />
        <p className="font-mono font-extrabold uppercase text-xs text-black">Calculating Real Financial Metrics...</p>
      </div>
    );
  }

  if (!hasHouse) {
    return (
      <div className="p-8 border-4 border-black bg-[#F5E600] text-center space-y-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <ShieldAlert size={40} className="mx-auto text-black" />
        <h2 className="text-xl font-extrabold uppercase text-black">No House Selected</h2>
        <p className="text-sm font-bold text-gray-800">Join or create a house to view real live financial reports.</p>
        <Link href="/houses">
          <Button variant="brutal" className="mt-2">
            Go to Houses <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-4 border-black pb-3 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-black flex items-center gap-2">
            <BarChart3 className="text-black" size={32} />
            Financial Reports
          </h1>
          <p className="text-xs font-bold uppercase text-gray-700 mt-0.5">
            Real-time live audit & category analytics from database
          </p>
        </div>
        <Button variant="brutalAccent" size="sm" onClick={exportToCSV} className="self-start sm:self-auto gap-1">
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border-4 border-black bg-[#F5E600] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-xs uppercase font-extrabold text-black flex items-center gap-1">
            <DollarSign size={16} />
            Total House Expenditure
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-black mt-1">
            ₹{totalExpenditure.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] uppercase font-bold text-black/70 mt-1">
            Across {rawExpenses.length} logged expense{rawExpenses.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-xs uppercase font-extrabold text-black flex items-center gap-1">
            <CheckCircle2 size={16} className="text-green-700" />
            Settlement Efficiency
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-green-700 mt-1">
            {settlementEfficiency}%
          </div>
          <div className="text-[10px] uppercase font-bold text-gray-600 mt-1">
            {totalDebtsCount.settled} of {totalDebtsCount.total} total debts settled
          </div>
        </div>

        <div className="border-4 border-black bg-blue-50 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-xs uppercase font-extrabold text-black flex items-center gap-1">
            <TrendingUp size={16} className="text-blue-700" />
            Top Expenditure Category
          </div>
          <div className="text-xl sm:text-2xl font-extrabold uppercase text-blue-900 mt-1 truncate">
            {categoryBreakdown.length > 0 ? categoryBreakdown[0].category : 'N/A'}
          </div>
          <div className="text-[10px] uppercase font-bold text-blue-700 mt-1">
            {categoryBreakdown.length > 0 ? `₹${categoryBreakdown[0].amount.toLocaleString('en-IN')} (${categoryBreakdown[0].percentage}%)` : 'No data'}
          </div>
        </div>
      </div>

      {/* Main Breakdown Section */}
      <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-3 border-b-2 border-black pb-4">
          <PieChart size={24} className="text-black" />
          <div>
            <h2 className="text-base sm:text-lg font-extrabold uppercase text-black">Category & Member Breakdown</h2>
            <p className="text-xs font-bold uppercase text-gray-700">Calculated directly from live database logs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <div className="border-2 border-black p-4 bg-[#F5E600]/20 space-y-3">
            <h3 className="font-extrabold uppercase text-sm border-b-2 border-black pb-2 text-black flex items-center justify-between">
              <span>Category Distribution</span>
              <span className="font-mono text-xs">{categoryBreakdown.length} Categories</span>
            </h3>

            {categoryBreakdown.length === 0 ? (
              <div className="p-4 border border-black bg-white text-center text-xs font-bold uppercase">
                No expenses logged yet.
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs font-bold">
                {categoryBreakdown.map((item) => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between items-center text-black">
                      <span className="font-extrabold uppercase">{item.category}</span>
                      <span>₹{item.amount.toLocaleString('en-IN')} ({item.percentage}%)</span>
                    </div>
                    <div className="w-full h-3 border border-black bg-white overflow-hidden">
                      <div
                        className="h-full bg-black transition-all"
                        style={{ width: `${Math.max(item.percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Member Spend Breakdown */}
          <div className="border-2 border-black p-4 bg-white space-y-3">
            <h3 className="font-extrabold uppercase text-sm border-b-2 border-black pb-2 text-black flex items-center justify-between">
              <span>Top Roommate Spenders</span>
              <span className="font-mono text-xs">{memberContributions.length} Members</span>
            </h3>

            {memberContributions.length === 0 ? (
              <div className="p-4 border border-black bg-gray-50 text-center text-xs font-bold uppercase">
                No roommate spending records found.
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs font-bold">
                {memberContributions.map((member) => (
                  <div key={member.name} className="space-y-1">
                    <div className="flex justify-between items-center text-black">
                      <span className="font-extrabold uppercase">{member.name}</span>
                      <span>₹{member.amount.toLocaleString('en-IN')} ({member.percentage}%)</span>
                    </div>
                    <div className="w-full h-3 border border-black bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-[#F5E600] border-r border-black transition-all"
                        style={{ width: `${Math.max(member.percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
