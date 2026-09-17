// HouseSwitcher Component - Clean, Responsive & Mobile Friendly
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ChevronDown, Home, Plus, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface House {
  id: string;
  name: string;
}

export function HouseSwitcher() {
  const [houses, setHouses] = useState<House[]>([]);
  const [currentHouseId, setCurrentHouseId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadHouses();
  }, []);

  async function loadHouses() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: houseRows, error } = await supabase
        .from('houses')
        .select('id, name')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading houses:', error);
        setLoading(false);
        return;
      }

      if (houseRows && houseRows.length > 0) {
        const housesList = houseRows.map((h: any) => ({ id: h.id, name: h.name }));
        setHouses(housesList);

        const savedHouseId = sessionStorage.getItem('currentHouseId');
        const activeId = savedHouseId && housesList.some(h => h.id === savedHouseId)
          ? savedHouseId
          : housesList[0].id;

        setCurrentHouseId(activeId);
        sessionStorage.setItem('currentHouseId', activeId);
      } else {
        setHouses([]);
        setCurrentHouseId(null);
        sessionStorage.removeItem('currentHouseId');
      }
    } catch (err) {
      console.error('Unexpected error loading houses:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleHouseChange = (houseId: string) => {
    setCurrentHouseId(houseId);
    setIsOpen(false);
    sessionStorage.setItem('currentHouseId', houseId);
    window.location.reload();
  };

  const currentHouse = houses.find((h: House) => h.id === currentHouseId);

  return (
    <div className="relative z-40">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold uppercase text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
      >
        <Home size={14} className="text-black flex-shrink-0 sm:w-4 sm:h-4" />
        <span className="max-w-[110px] sm:max-w-[180px] truncate text-black font-extrabold">
          {loading ? 'LOADING...' : currentHouse?.name || (houses.length > 0 ? houses[0].name : 'SELECT HOUSE')}
        </span>
        <ChevronDown size={14} className="text-black ml-1 flex-shrink-0 sm:w-4 sm:h-4" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-50 w-60 sm:w-64 border-4 border-black bg-white text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="p-2 border-b-2 border-black text-[10px] font-extrabold uppercase tracking-widest text-gray-700 bg-gray-100">
              Your House Workspaces
            </div>
            {houses.length === 0 ? (
              <div className="p-4 text-xs font-bold uppercase text-gray-600 text-center">
                No active house found
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto">
                {houses.map((house: House) => {
                  const isSelected = house.id === currentHouseId;
                  return (
                    <button
                      key={house.id}
                      onClick={() => handleHouseChange(house.id)}
                      className={`w-full text-left px-4 py-3 font-extrabold uppercase text-xs border-b border-black/10 flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-[#F5E600] text-black' : 'hover:bg-gray-100 text-black'
                      }`}
                    >
                      <span className="truncate">{house.name}</span>
                      {isSelected && <Check size={14} className="text-black flex-shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="p-3 bg-gray-50 border-t-2 border-black">
              <button
                type="button"
                className="flex items-center gap-2 w-full text-left text-xs font-extrabold uppercase text-black hover:underline"
                onClick={() => {
                  setIsOpen(false);
                  router.push('/houses/new');
                }}
              >
                <Plus size={14} />
                + Create New House
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
