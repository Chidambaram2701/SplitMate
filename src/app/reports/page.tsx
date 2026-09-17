// Reports Page
'use client';

import { BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  return (
    <div className="space-y-6 text-black">
      <div className="flex items-center justify-between border-b-4 border-black pb-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-black">
          Financial Reports
        </h1>
        <Button variant="brutalAccent" size="sm">
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 space-y-6">
        <div className="flex items-center gap-3 border-b-2 border-black pb-4">
          <BarChart3 size={24} className="text-black" />
          <div>
            <h2 className="text-base sm:text-lg font-extrabold uppercase text-black">Monthly Expenditure Breakdown</h2>
            <p className="text-xs font-bold uppercase text-gray-700">Analytics and house audit logs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-2 border-black p-4 bg-[#F5E600]">
            <h3 className="font-extrabold uppercase mb-2">Category Distribution</h3>
            <div className="space-y-2 text-sm font-mono font-bold">
              <div className="flex justify-between border-b border-black pb-1">
                <span>GROCERIES & FOOD</span>
                <span>45%</span>
              </div>
              <div className="flex justify-between border-b border-black pb-1">
                <span>ELECTRICITY & WATER</span>
                <span>30%</span>
              </div>
              <div className="flex justify-between border-b border-black pb-1">
                <span>INTERNET & SUBSCRIPTIONS</span>
                <span>15%</span>
              </div>
              <div className="flex justify-between">
                <span>MISCELLANEOUS</span>
                <span>10%</span>
              </div>
            </div>
          </div>

          <div className="border-2 border-black p-4 bg-white">
            <h3 className="font-extrabold uppercase mb-2">Settlement Efficiency</h3>
            <p className="text-xs uppercase font-bold text-gray-700 mb-4">Percentage of expenses settled within 7 days of billing.</p>
            <div className="text-5xl font-mono font-extrabold text-green-700">92%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
