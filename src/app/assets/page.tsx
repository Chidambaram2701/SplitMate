// Assets Page - Real Supabase Queries
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Box, Plus, Home } from 'lucide-react';
import Link from 'next/link';

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasHouse, setHasHouse] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [value, setValue] = useState('');

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    setLoading(true);
    try {
      const houseId = sessionStorage.getItem('currentHouseId');
      if (!houseId) {
        setHasHouse(false);
        return;
      }
      setHasHouse(true);

      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('house_id', houseId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assets:', error);
      } else {
        setAssets(data || []);
      }
    } catch (err) {
      console.error('Assets load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    const houseId = sessionStorage.getItem('currentHouseId');
    if (!houseId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('assets')
        .insert({
          house_id: houseId,
          name: name.trim(),
          category: category.trim() || 'General',
          estimated_value: parseFloat(value) || 0,
        });

      if (!error) {
        setName('');
        setValue('');
        setShowAddForm(false);
        loadAssets();
      }
    } catch (err) {
      console.error('Error adding asset:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
          <div className="w-5 h-5 bg-[#F5E600] animate-spin border-2 border-black" />
          <h2 className="text-xl font-bold uppercase tracking-wider text-black">
            Loading House Assets...
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
        <p className="text-sm font-medium">Please select or create a house workspace to manage house assets.</p>
        <Button variant="brutalAccent" size="lg" asChild>
          <Link href="/houses/new">
            <Plus size={20} /> Create A House
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-black">
      <div className="flex items-center justify-between border-b-4 border-black pb-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-black">
          House Assets
        </h1>
        <Button variant="brutalAccent" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={16} />
          {showAddForm ? 'Close Form' : 'Add Asset'}
        </Button>
      </div>

      {showAddForm && (
        <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <h3 className="text-xl font-extrabold uppercase text-black border-b-2 border-black pb-2">Add New House Asset</h3>
          <form onSubmit={handleAddAsset} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label required>Asset Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Fridge, TV, Microwave"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Appliances, Kitchen"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Estimated Value (₹)</Label>
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 15000"
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <Button type="submit" variant="brutalAccent">Save Asset</Button>
            </div>
          </form>
        </div>
      )}

      <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
        <h2 className="text-2xl font-extrabold uppercase border-b-2 border-black pb-4 mb-4 text-black">
          Shared Belongings Registry
        </h2>

        {assets.length === 0 ? (
          <div className="py-12 text-center">
            <div className="border-4 border-black bg-[#F5E600] p-8 inline-block shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <p className="font-extrabold uppercase text-xl mb-2 text-black">No Assets Logged Yet</p>
              <p className="text-xs font-bold uppercase text-black mb-4">
                Your house asset registry is empty. Add shared belongings to keep track of ownership!
              </p>
              <Button variant="brutalPrimary" onClick={() => setShowAddForm(true)}>
                <Plus size={18} />
                Add First Asset
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <div key={asset.id} className="border-2 border-black bg-white p-4 hover:bg-[#F5E600] transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Box size={24} className="text-black flex-shrink-0" />
                  <div>
                    <h3 className="font-bold uppercase text-lg text-black">{asset.name}</h3>
                    <span className="text-xs font-mono font-bold bg-black text-white px-2 py-0.5">{asset.category || 'General'}</span>
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-black flex justify-between text-xs font-bold uppercase">
                  <span>Value: ₹{Number(asset.estimated_value || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
