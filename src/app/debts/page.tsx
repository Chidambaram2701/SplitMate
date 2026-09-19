'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { MoneyDisplay } from '@/components/ui/money-display';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { SettlementModal } from '@/components/settlements/SettlementModal';
import { Plus, ArrowUpRight, ArrowDownRight, CheckCircle2, DollarSign, Home } from 'lucide-react';
import Link from 'next/link';

export default function DebtsPage() {
  const [iOweDebts, setIOweDebts] = useState<any[]>([]);
  const [theyOweMeDebts, setTheyOweMeDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasHouse, setHasHouse] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'owe' | 'receive'>('all');
  const [selectedDebtForSettlement, setSelectedDebtForSettlement] = useState<any | null>(null);

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

      // 1. Fetch debts where current user OWES money (Debtor)
      const { data: debtorData, error: debtorError } = await supabase
        .from('debts')
        .select('id, description, original_amount, remaining_amount, due_date, status, created_at, creditor_id')
        .eq('house_id', houseId)
        .eq('debtor_id', user.id)
        .order('created_at', { ascending: false });

      if (debtorError) console.error('Error fetching debts user owes:', debtorError);

      // 2. Fetch debts where others OWE money to current user (Creditor)
      const { data: creditorData, error: creditorError } = await supabase
        .from('debts')
        .select('id, description, original_amount, remaining_amount, due_date, status, created_at, debtor_id')
        .eq('house_id', houseId)
        .eq('creditor_id', user.id)
        .order('created_at', { ascending: false });

      if (creditorError) console.error('Error fetching debts owed to user:', creditorError);

      const allUserIds = Array.from(
        new Set([
          ...(debtorData || []).map((d: any) => d.creditor_id),
          ...(creditorData || []).map((d: any) => d.debtor_id),
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

      const enrichedIOwe = (debtorData || []).map((d: any) => ({
        ...d,
        creditor: profileMap.get(d.creditor_id) || { display_name: 'Roommate' },
      }));

      const enrichedTheyOwe = (creditorData || []).map((d: any) => ({
        ...d,
        debtor: profileMap.get(d.debtor_id) || { display_name: 'Roommate' },
      }));

      setIOweDebts(enrichedIOwe);
      setTheyOweMeDebts(enrichedTheyOwe);
    } catch (err) {
      console.error('Error in loadDebts:', err);
    } finally {
      setLoading(false);
    }
  }

  const openSettlementModal = (debt: any, isIOwe: boolean, initialMode: 'full' | 'partial' = 'full') => {
    setSelectedDebtForSettlement({
      debt: {
        id: debt.id,
        description: debt.description,
        original_amount: debt.original_amount,
        remaining_amount: debt.remaining_amount,
        creditor_name: debt.creditor?.display_name,
        debtor_name: debt.debtor?.display_name,
        isIOwe,
      },
      initialMode,
    });
  };

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

  const totalIReceive = theyOweMeDebts.reduce((sum: number, d: any) => sum + (Number(d.remaining_amount) || 0), 0);
  const totalIOwe = iOweDebts.reduce((sum: number, d: any) => sum + (Number(d.remaining_amount) || 0), 0);
  const netBalance = totalIReceive - totalIOwe;

  const activeIOwe = iOweDebts.filter((d: any) => (Number(d.remaining_amount) || 0) > 0);
  const activeTheyOweMe = theyOweMeDebts.filter((d: any) => (Number(d.remaining_amount) || 0) > 0);

  return (
    <div className="space-y-6 text-black pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-2">
        <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-black">
          Debts & Settlements
        </h1>
        <Button variant="brutalAccent" size="sm" asChild>
          <Link href="/debts/new">
            <Plus size={16} />
            New Direct Debt
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* You Owe */}
        <div className="border-4 border-black bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="mb-2 border-b-2 border-white pb-2 flex justify-between items-center">
              <h3 className="text-base font-bold uppercase text-white">You Owe Others</h3>
              <ArrowUpRight size={20} className="text-red-400" />
            </div>
            <MoneyDisplay amount={totalIOwe} size="xl" variant="negative" />
          </div>
          <p className="text-[11px] font-mono uppercase mt-4 text-gray-300">
            {activeIOwe.length} active debt{activeIOwe.length !== 1 && 's'} to roommates
          </p>
        </div>

        {/* You Receive */}
        <div className="border-4 border-black bg-[#F5E600] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="mb-2 border-b-2 border-black pb-2 flex justify-between items-center">
              <h3 className="text-base font-extrabold uppercase text-black">Others Owe You</h3>
              <ArrowDownRight size={20} className="text-green-800" />
            </div>
            <MoneyDisplay amount={totalIReceive} size="xl" variant="positive" />
          </div>
          <p className="text-[11px] font-mono font-bold uppercase mt-4 text-black">
            {activeTheyOweMe.length} active receivable{activeTheyOweMe.length !== 1 && 's'}
          </p>
        </div>

        {/* Net Standing */}
        <div className="border-4 border-black bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="mb-2 border-b-2 border-black pb-2">
              <h3 className="text-base font-extrabold uppercase text-black">Net Position</h3>
            </div>
            <MoneyDisplay amount={netBalance} size="xl" variant={netBalance >= 0 ? 'positive' : 'negative'} />
          </div>
          <div className="mt-4 pt-2 border-t-2 border-black flex justify-between items-center">
            <span className={`font-bold text-xs uppercase px-2 py-0.5 border border-black ${netBalance >= 0 ? 'bg-green-300 text-black' : 'bg-red-300 text-black'}`}>
              {netBalance >= 0 ? 'SURPLUS' : 'DEFICIT'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b-4 border-black pb-3 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 sm:px-4 py-2 font-extrabold uppercase border-2 border-black transition-all flex-shrink-0 cursor-pointer ${
            activeTab === 'all' ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black hover:bg-gray-100'
          }`}
        >
          All Debts ({activeIOwe.length + activeTheyOweMe.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('owe')}
          className={`px-3 sm:px-4 py-2 font-extrabold uppercase border-2 border-black transition-all flex-shrink-0 cursor-pointer ${
            activeTab === 'owe' ? 'bg-[#FF0000] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black hover:bg-gray-100'
          }`}
        >
          You Owe ({activeIOwe.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('receive')}
          className={`px-3 sm:px-4 py-2 font-extrabold uppercase border-2 border-black transition-all flex-shrink-0 cursor-pointer ${
            activeTab === 'receive' ? 'bg-[#F5E600] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black hover:bg-gray-100'
          }`}
        >
          Owed To You ({activeTheyOweMe.length})
        </button>
      </div>

      {/* Section 1: Money You Owe (Liabilities) */}
      {(activeTab === 'all' || activeTab === 'owe') && (
        <div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h2 className="text-lg sm:text-xl font-extrabold uppercase text-black flex items-center gap-2">
              <ArrowUpRight className="text-red-600" size={24} />
              Money You Owe To Roommates
            </h2>
            <span className="font-mono font-bold text-xs sm:text-sm bg-red-100 border border-black px-2 py-0.5 text-black">
              Total: ₹{totalIOwe}
            </span>
          </div>

          {activeIOwe.length === 0 ? (
            <div className="p-6 border-2 border-black bg-green-50 text-center text-xs font-bold uppercase text-black">
              🎉 You do not owe money to anyone! All your roommate debts are clear.
            </div>
          ) : (
            <div className="space-y-3">
              {activeIOwe.map((debt: any) => {
                const creditorName = debt.creditor?.display_name || debt.creditor?.email?.split('@')[0] || 'Roommate';
                const isPartial = debt.status === 'partial' || Number(debt.remaining_amount) < Number(debt.original_amount);
                return (
                  <div
                    key={debt.id}
                    className="p-3 sm:p-4 border-2 border-black bg-red-50 hover:bg-red-100 transition-colors space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/20 pb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 bg-red-600 text-white flex items-center justify-center font-extrabold uppercase border border-black flex-shrink-0">
                          {creditorName[0]}
                        </div>
                        <div>
                          <div className="font-extrabold uppercase text-sm sm:text-base text-black flex items-center gap-2">
                            <span>You owe <span className="text-red-700 underline">{creditorName}</span></span>
                            {isPartial && (
                              <span className="text-[9px] font-mono uppercase bg-[#F5E600] text-black px-1.5 py-0.5 border border-black">
                                Partial Paid
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-gray-700 mt-0.5">
                            Reason: {debt.description || 'Expense split share'}
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <div className="font-mono font-extrabold text-xl sm:text-2xl text-red-700">
                          ₹{debt.remaining_amount}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-gray-600">
                          Original: ₹{debt.original_amount}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-between items-center text-xs pt-1 gap-2">
                      <span className="font-mono text-gray-600 text-[10px] sm:text-xs">
                        {debt.created_at ? `Created: ${new Date(debt.created_at).toLocaleDateString('en-IN')}` : ''}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="brutalAccent"
                          size="sm"
                          onClick={() => openSettlementModal(debt, true, 'partial')}
                          className="gap-1 touch-target text-[11px]"
                        >
                          <DollarSign size={13} />
                          Partial Pay
                        </Button>
                        <Button
                          variant="brutalPrimary"
                          size="sm"
                          onClick={() => openSettlementModal(debt, true, 'full')}
                          className="gap-1 touch-target text-[11px]"
                        >
                          <CheckCircle2 size={13} />
                          Settle Full
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Section 2: Money Owed to You (Receivables) */}
      {(activeTab === 'all' || activeTab === 'receive') && (
        <div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h2 className="text-lg sm:text-xl font-extrabold uppercase text-black flex items-center gap-2">
              <ArrowDownRight className="text-green-700" size={24} />
              Money Roommates Owe To You
            </h2>
            <span className="font-mono font-bold text-xs sm:text-sm bg-[#F5E600] border border-black px-2 py-0.5 text-black">
              Total: ₹{totalIReceive}
            </span>
          </div>

          {activeTheyOweMe.length === 0 ? (
            <div className="p-6 border-2 border-black bg-gray-50 text-center text-xs font-bold uppercase text-black">
              No roommates currently owe you money.
            </div>
          ) : (
            <div className="space-y-3">
              {activeTheyOweMe.map((debt: any) => {
                const debtorName = debt.debtor?.display_name || debt.debtor?.email?.split('@')[0] || 'Roommate';
                const isPartial = debt.status === 'partial' || Number(debt.remaining_amount) < Number(debt.original_amount);
                return (
                  <div
                    key={debt.id}
                    className="p-3 sm:p-4 border-2 border-black bg-[#F5E600]/30 hover:bg-[#F5E600]/60 transition-colors space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/20 pb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 bg-black text-white flex items-center justify-center font-extrabold uppercase border border-black flex-shrink-0">
                          {debtorName[0]}
                        </div>
                        <div>
                          <div className="font-extrabold uppercase text-sm sm:text-base text-black flex items-center gap-2">
                            <span><span className="underline">{debtorName}</span> owes you</span>
                            {isPartial && (
                              <span className="text-[9px] font-mono uppercase bg-black text-white px-1.5 py-0.5 border border-black">
                                Partial Paid
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-gray-700 mt-0.5">
                            Reason: {debt.description || 'Expense split share'}
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <div className="font-mono font-extrabold text-xl sm:text-2xl text-green-700">
                          ₹{debt.remaining_amount}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-gray-600">
                          Original: ₹{debt.original_amount}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-between items-center text-xs pt-1 gap-2">
                      <span className="font-mono text-gray-600 text-[10px] sm:text-xs">
                        {debt.created_at ? `Created: ${new Date(debt.created_at).toLocaleDateString('en-IN')}` : ''}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="brutal"
                          size="sm"
                          onClick={() => openSettlementModal(debt, false, 'partial')}
                          className="gap-1 touch-target text-[11px]"
                        >
                          <DollarSign size={13} />
                          Partial Pay
                        </Button>
                        <Button
                          variant="brutalSuccess"
                          size="sm"
                          onClick={() => openSettlementModal(debt, false, 'full')}
                          className="gap-1 touch-target text-[11px]"
                        >
                          <CheckCircle2 size={13} />
                          Full Settle
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Interactive Full & Partial Settlement Modal */}
      <SettlementModal
        isOpen={Boolean(selectedDebtForSettlement)}
        onClose={() => setSelectedDebtForSettlement(null)}
        debt={selectedDebtForSettlement?.debt || null}
        initialMode={selectedDebtForSettlement?.initialMode || 'full'}
        onSuccess={loadDebts}
      />
    </div>
  );
}
