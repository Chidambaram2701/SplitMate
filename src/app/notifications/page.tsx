// Notifications Page
'use client';

import { Bell, CheckCircle2 } from 'lucide-react';

export default function NotificationsPage() {
  const notifications = [
    { id: '1', title: 'System Connected', time: 'Just now', desc: 'Supabase Database & Authentication connected successfully.' },
    { id: '2', title: 'House Active', time: 'Today', desc: 'Active house workspace synchronized.' },
  ];

  return (
    <div className="space-y-6 text-black">
      <div className="flex items-center justify-between border-b-4 border-black pb-2">
        <h1 className="text-4xl font-extrabold uppercase tracking-tight text-black">
          Notifications & Alerts
        </h1>
      </div>

      <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 space-y-4">
        {notifications.map((n) => (
          <div key={n.id} className="flex items-start gap-4 p-4 border-2 border-black bg-white hover:bg-[#F5E600] transition-colors">
            <Bell size={24} className="text-black flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold uppercase text-lg text-black">{n.title}</h3>
                <span className="text-xs font-mono font-bold text-gray-600">{n.time}</span>
              </div>
              <p className="text-sm font-medium mt-1">{n.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
