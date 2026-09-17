// Create New House Page
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateHousePage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to create a house.');
        setLoading(false);
        router.push('/auth/login');
        return;
      }

      // 1. Create the house
      const { data: house, error: houseError } = await supabase
        .from('houses')
        .insert({
          owner_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          address: address.trim() || null,
        })
        .select()
        .single();

      if (houseError) {
        console.error('House insertion error:', houseError);
        throw new Error(houseError.message || 'Failed to create house.');
      }

      // 2. Add owner as admin member of the house
      const { error: memberError } = await supabase
        .from('house_members')
        .insert({
          house_id: house.id,
          user_id: user.id,
          role: 'admin',
          status: 'active',
          joined_at: new Date().toISOString(),
        });

      if (memberError) {
        console.error('Member insertion error:', memberError);
        throw new Error(memberError.message || 'Failed to assign house membership.');
      }

      // 3. Save as active house ID in session storage
      sessionStorage.setItem('currentHouseId', house.id);

      // 4. Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      console.error('Error creating house:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-black">
      <div className="flex items-center justify-between border-b-4 border-black pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#F5E600] border-2 border-black">
            <Home size={28} className="text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight text-black">
              Create New House
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-700">
              Set up a shared financial space for your roommates
            </p>
          </div>
        </div>
        <Button variant="brutal" asChild>
          <Link href="/dashboard" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Back
          </Link>
        </Button>
      </div>

      <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8">
        {error && (
          <div className="mb-6 bg-red-100 border-4 border-red-600 p-4 text-red-800 font-bold uppercase text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name" required>
              House Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Baker Street Villa, Apartment 4B"
              required
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">
              Description (Optional)
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. College shared apartment for 4 roommates"
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="address">
              Address / Location (Optional)
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 122 Main Street, City"
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div className="pt-4 border-t-2 border-black flex items-center justify-end gap-4">
            <Button variant="brutal" asChild disabled={loading}>
              <Link href="/dashboard">Cancel</Link>
            </Button>
            <Button
              type="submit"
              variant="brutalAccent"
              disabled={loading || !name.trim()}
              className="px-8"
            >
              {loading ? 'Creating House...' : 'Create House'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
