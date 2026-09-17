// Assets Page
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { MoneyDisplay } from '@/components/ui/money-display';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    const houseId = sessionStorage.getItem('currentHouseId');
    if (!houseId) return;

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: assetsData, error } = await supabase
      .from('assets')
      .select('*')
      .eq('house_id', houseId)
      .order('purchase_date', { ascending: false });

    if (error) {
      console.error('Error loading assets:', error);
    } else if (assetsData) {
      setAssets(assetsData);
    }

    setLoading(false);
  }

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', assetId);

    if (!error) {
      loadAssets();
    }
  };

  const totalPurchaseValue = assets.reduce((sum: number, a: any) => sum + a.purchase_price, 0);
  const totalCurrentValue = assets.reduce((sum: number, a: any) => sum + a.current_value, 0);

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
          House Assets
        </h1>
        <Button variant="brutalAccent" asChild>
          <Link href="/assets/new">
            <Plus size={20} />
            Add Asset
          </Link>
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-2 border-black bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
          <div className="mb-4 border-b-2 border-white pb-2">
            <h3 className="text-lg font-bold uppercase">Total Purchase Value</h3>
          </div>
          <MoneyDisplay amount={totalPurchaseValue} size="xl" />
        </div>

        <div className="border-2 border-black bg-[#F5E600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
          <div className="mb-4 border-b-2 border-black pb-2">
            <h3 className="text-lg font-bold uppercase">Current Value</h3>
          </div>
          <MoneyDisplay amount={totalCurrentValue} size="xl" variant="positive" />
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((asset: any) => (
          <div
            key={asset.id}
            className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-black text-white flex items-center justify-center font-bold uppercase rounded-none">
                  A
                </div>
                <StatusBadge status={asset.status || 'active'} />
              </div>

              <h3 className="text-xl font-bold uppercase mb-2">{asset.name}</h3>
              {asset.description && (
                <p className="text-sm text-gray-600 mb-4">{asset.description}</p>
              )}

              <div className="space-y-2 mb-4 border-b-2 border-black pb-4">
                <div className="flex justify-between">
                  <span className="text-xs uppercase">Purchase Price:</span>
                  <span className="font-mono font-bold">₹{asset.purchase_price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs uppercase">Current Value:</span>
                  <span className="font-mono font-bold">₹{asset.current_value}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs uppercase">Purchased:</span>
                  <span className="font-mono font-bold">
                    {new Date(asset.purchase_date).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="brutal" size="sm" asChild className="flex-1">
                  <Link href={`/assets/${asset.id}`}>View</Link>
                </Button>
                <Button variant="brutalDanger" size="icon" onClick={() => handleDelete(asset.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {assets.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3">
            <div className="border-2 border-black p-12 text-center">
              <p className="font-bold uppercase mb-2">No Assets Yet</p>
              <p className="text-sm uppercase text-gray-600 mb-4">
                Start tracking your house's shared assets
              </p>
              <Button variant="brutalAccent" asChild>
                <Link href="/assets/new">+ Add First Asset</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
