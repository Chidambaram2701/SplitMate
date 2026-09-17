// HouseSwitcher Component
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface House {
  id: string;
  name: string;
}

export function HouseSwitcher() {
  const [houses, setHouses] = useState<House[]>([]);
  const [currentHouseId, setCurrentHouseId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadHouses();
  }, []);

  async function loadHouses() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: memberships, error } = await supabase
      .from('house_members')
      .select('house_id, houses(id, name)')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (error) {
      console.error('Error loading houses:', error);
      return;
    }

    if (memberships && memberships.length > 0) {
      const housesList = (memberships as any[])
        .map((m: any) => (m.houses ? { id: m.houses.id, name: m.houses.name } : null))
        .filter(Boolean) as House[];
      setHouses(housesList);
      setCurrentHouseId(memberships[0]?.house_id || null);
      sessionStorage.setItem('currentHouseId', memberships[0]?.house_id || '');
    }
  }

  const handleHouseChange = async (houseId: string) => {
    setCurrentHouseId(houseId);
    setIsOpen(false);
    sessionStorage.setItem('currentHouseId', houseId);
    router.push('/dashboard');
  };

  const currentHouse = houses.find((h: House) => h.id === currentHouseId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 border-2 border-black bg-white px-4 py-2 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
      >
        <span className="min-w-[120px]">{currentHouse?.name || 'Select House'}</span>
        <span className="text-lg">▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-20 w-64 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {houses.map((house: House) => (
              <button
                key={house.id}
                onClick={() => handleHouseChange(house.id)}
                className="w-full text-left px-4 py-3 hover:bg-[#F5E600] font-bold uppercase"
              >
                {house.name}
              </button>
            ))}
            <div className="border-t-2 border-black p-4">
              <button className="w-full text-left text-sm underline" onClick={() => router.push('/houses/new')}>
                + Create New House
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
