'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Bell, Plus, CheckCircle2, Info, Megaphone, Trash2, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NotificationItem {
  id: string;
  user_id?: string;
  type: 'announcement' | 'payment' | 'expense' | 'notice' | 'system';
  title: string;
  message: string;
  read: boolean;
  sender_name?: string;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasHouse, setHasHouse] = useState(true);
  const [houseId, setHouseId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'announcements'>('all');

  // Broadcast Alert Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'announcement' | 'payment' | 'notice'>('announcement');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadNotifications();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        channel = supabase
          .channel(`notifications_realtime_${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              const newNotif = payload.new as any;
              setNotifications((prev) => {
                if (prev.some((item) => item.id === newNotif.id)) return prev;
                return [
                  {
                    id: newNotif.id,
                    user_id: newNotif.user_id,
                    type: newNotif.type || 'notice',
                    title: newNotif.title,
                    message: newNotif.message,
                    read: newNotif.read || false,
                    created_at: newNotif.created_at,
                  },
                  ...prev,
                ];
              });
            }
          )
          .subscribe();
      }
    });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  async function loadNotifications() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setCurrentUserId(user.id);

      const hId = sessionStorage.getItem('currentHouseId');
      setHouseId(hId);

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', user.id)
        .maybeSingle();

      const name = profile?.display_name || user.email?.split('@')[0] || 'Roommate';
      setCurrentUserName(name);

      if (!hId) {
        const { data: memberRows } = await supabase
          .from('house_members')
          .select('house_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1);

        if (memberRows && memberRows.length > 0) {
          setHouseId(memberRows[0].house_id);
          sessionStorage.setItem('currentHouseId', memberRows[0].house_id);
          setHasHouse(true);
        } else {
          setHasHouse(false);
        }
      } else {
        setHasHouse(true);
      }

      // 1. Fetch Supabase notifications
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // 2. Fetch local storage broadcast alerts (for instant cross-roommate broadcast fallback)
      const localAlertsKey = `splitmate_house_alerts_${hId || 'default'}`;
      let localAlerts: NotificationItem[] = [];
      try {
        const saved = localStorage.getItem(localAlertsKey);
        if (saved) {
          localAlerts = JSON.parse(saved);
        }
      } catch (e) {
        console.warn('Local alerts read warning:', e);
      }

      const dbItems: NotificationItem[] = (notifData || []).map((n) => ({
        id: n.id,
        user_id: n.user_id,
        type: (n.type as any) || 'notice',
        title: n.title,
        message: n.message,
        read: n.read || false,
        created_at: n.created_at,
      }));

      // Combine DB and Local items (dedup by ID)
      const combinedMap = new Map<string, NotificationItem>();
      dbItems.forEach((item) => combinedMap.set(item.id, item));
      localAlerts.forEach((item) => {
        if (!combinedMap.has(item.id)) {
          combinedMap.set(item.id, item);
        }
      });

      // Default system welcome notification if empty
      if (combinedMap.size === 0) {
        combinedMap.set('sys-1', {
          id: 'sys-1',
          type: 'system',
          title: 'System Connected',
          message: 'Welcome to SplitMate! Database and notification system are synchronized.',
          read: false,
          sender_name: 'SplitMate System',
          created_at: new Date().toISOString(),
        });
      }

      const result = Array.from(combinedMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(result);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  // Create Broadcast Alert for ALL House Members
  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim() || !alertMessage.trim()) return;

    setSubmitting(true);
    try {
      const activeHouseId = houseId || sessionStorage.getItem('currentHouseId');
      if (!activeHouseId) {
        alert('No house selected. Please select a house first.');
        setSubmitting(false);
        return;
      }

      // Fetch active house members
      const { data: members } = await supabase
        .from('house_members')
        .select('user_id')
        .eq('house_id', activeHouseId)
        .eq('status', 'active');

      const memberList = members || [];
      const newAlertId = `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const createdAt = new Date().toISOString();

      const newAlertItem: NotificationItem = {
        id: newAlertId,
        type: alertType,
        title: `📢 ${alertTitle.trim()}`,
        message: alertMessage.trim(),
        read: false,
        sender_name: currentUserName,
        created_at: createdAt,
      };

      // Insert notification in Supabase for each member (triggers Supabase Realtime for all connected housemates)
      if (memberList.length > 0) {
        const notifInserts = memberList.map((m) => ({
          user_id: m.user_id,
          type: alertType,
          title: `📢 ${alertTitle.trim()} (From ${currentUserName})`,
          message: alertMessage.trim(),
          read: false,
          created_at: createdAt,
        }));

        await supabase.from('notifications').insert(notifInserts);
      }

      // Optimistically update current user UI state
      setNotifications((prev) => [newAlertItem, ...prev]);

      // Reset form & close modal
      setAlertTitle('');
      setAlertMessage('');
      setAlertType('announcement');
      setShowCreateModal(false);
      alert('Broadcast alert sent successfully to all house members!');
    } catch (err: any) {
      console.error('Error creating broadcast:', err);
      alert('Failed to send broadcast alert. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    // Try updating DB
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    } catch (e) {
      // ignore fallback
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      if (currentUserId) {
        await supabase.from('notifications').update({ read: true }).eq('user_id', currentUserId);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    const activeHouseId = houseId || sessionStorage.getItem('currentHouseId');
    if (activeHouseId) {
      const localAlertsKey = `splitmate_house_alerts_${activeHouseId}`;
      try {
        const saved = localStorage.getItem(localAlertsKey);
        if (saved) {
          const list: NotificationItem[] = JSON.parse(saved);
          const filtered = list.filter((item) => item.id !== id);
          localStorage.setItem(localAlertsKey, JSON.stringify(filtered));
        }
      } catch (e) {
        // ignore
      }
    }

    try {
      await supabase.from('notifications').delete().eq('id', id);
    } catch (e) {
      // ignore
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'announcements') return n.type === 'announcement' || n.title.includes('📢');
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="p-12 text-center border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent mx-auto" />
        <p className="font-mono font-extrabold uppercase text-xs text-black">Loading House Alerts & Notifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-black pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-4 border-black pb-3 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-black flex items-center gap-2">
            <Bell size={26} className="text-black" />
            Notifications & House Alerts
          </h1>
          <p className="text-xs font-bold uppercase text-gray-700 mt-0.5">
            Real-time broadcast notices, payment reminders, and expense activity
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <Button variant="brutal" size="sm" onClick={handleMarkAllRead} className="gap-1 text-xs">
              <CheckCircle2 size={15} />
              Mark All Read
            </Button>
          )}
          <Button variant="brutalAccent" size="sm" onClick={() => setShowCreateModal(true)} className="gap-1 text-xs">
            <Plus size={16} />
            Broadcast Alert
          </Button>
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
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('unread')}
          className={`px-3 sm:px-4 py-2 font-extrabold uppercase border-2 border-black transition-all flex-shrink-0 cursor-pointer ${
            activeTab === 'unread' ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black hover:bg-gray-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={`px-3 sm:px-4 py-2 font-extrabold uppercase border-2 border-black transition-all flex-shrink-0 cursor-pointer ${
            activeTab === 'announcements' ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black hover:bg-gray-100'
          }`}
        >
          Announcements 📢
        </button>
      </div>

      {/* Notifications List */}
      <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 border-2 border-black bg-gray-50 text-center space-y-2">
            <Info size={32} className="mx-auto text-gray-500" />
            <h3 className="font-extrabold uppercase text-sm text-black">No Notifications Found</h3>
            <p className="text-xs font-medium text-gray-600">You are all caught up on house alerts.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isAnnouncement = n.type === 'announcement' || n.title.includes('📢');
            return (
              <div
                key={n.id}
                className={`p-4 border-2 border-black transition-colors space-y-2 ${
                  !n.read
                    ? isAnnouncement
                      ? 'bg-[#F5E600]'
                      : 'bg-blue-50'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {isAnnouncement ? (
                      <Megaphone size={20} className="text-black flex-shrink-0" />
                    ) : n.type === 'payment' ? (
                      <CheckCircle2 size={20} className="text-green-700 flex-shrink-0" />
                    ) : (
                      <Bell size={20} className="text-black flex-shrink-0" />
                    )}

                    <span className={`text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 border border-black ${
                      isAnnouncement ? 'bg-black text-white' : 'bg-white text-black'
                    }`}>
                      {n.type.toUpperCase()}
                    </span>

                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-red-600 inline-block animate-pulse" />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-black/70">
                      {n.created_at ? new Date(n.created_at).toLocaleDateString('en-IN') : 'Recently'}
                    </span>
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(n.id)}
                        className="text-[10px] font-bold uppercase underline text-black hover:text-blue-800 cursor-pointer"
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(n.id)}
                      className="p-1 hover:bg-black/10 border border-black text-black cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold uppercase text-sm sm:text-base text-black">
                    {n.title}
                  </h3>
                  <p className="text-xs font-medium text-black/90 mt-1 whitespace-pre-wrap leading-relaxed">
                    {n.message}
                  </p>
                </div>

                {n.sender_name && (
                  <div className="text-[10px] font-mono font-bold text-black/80 pt-1 border-t border-black/20 flex items-center justify-between">
                    <span>Sent by: <span className="underline">{n.sender_name}</span></span>
                    <span>Broadcasting to House</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Broadcast Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setShowCreateModal(false)}
          />

          <div className="relative w-full max-w-md border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-6 z-10 text-black space-y-4 my-auto">
            <div className="flex items-center justify-between border-b-4 border-black pb-3">
              <div className="flex items-center gap-2">
                <Megaphone size={22} className="text-black" />
                <h2 className="text-lg font-extrabold uppercase text-black">Broadcast House Alert</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 border-2 border-black bg-white hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase text-black mb-1.5">
                  Alert Category / Type
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setAlertType('announcement')}
                    className={`p-2 border-2 border-black font-extrabold uppercase flex flex-col sm:flex-row items-center justify-center gap-1 text-[10px] sm:text-xs text-center cursor-pointer transition-all ${
                      alertType === 'announcement' ? 'bg-[#F5E600] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm sm:text-base">📢</span>
                    <span className="truncate">Announcement</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertType('payment')}
                    className={`p-2 border-2 border-black font-extrabold uppercase flex flex-col sm:flex-row items-center justify-center gap-1 text-[10px] sm:text-xs text-center cursor-pointer transition-all ${
                      alertType === 'payment' ? 'bg-[#F5E600] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm sm:text-base">💰</span>
                    <span className="truncate">Payment</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertType('notice')}
                    className={`p-2 border-2 border-black font-extrabold uppercase flex flex-col sm:flex-row items-center justify-center gap-1 text-[10px] sm:text-xs text-center cursor-pointer transition-all ${
                      alertType === 'notice' ? 'bg-[#F5E600] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm sm:text-base">🧹</span>
                    <span className="truncate">Notice</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-black mb-1">
                  Alert Title *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. WiFi Bill Due / House Cleaning"
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-black mb-1">
                  Alert Message / Details *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Write message details for your roommates..."
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  className="w-full p-2.5 border-2 border-black font-sans text-xs sm:text-sm font-medium focus:outline-none focus:bg-[#F5E600]/10"
                />
              </div>

              <div className="pt-3 border-t-2 border-black flex items-center justify-end gap-2">
                <Button type="button" variant="brutal" size="sm" onClick={() => setShowCreateModal(false)} className="flex-1 sm:flex-none justify-center text-xs">
                  Cancel
                </Button>
                <Button type="submit" variant="brutalAccent" size="sm" disabled={submitting} className="flex-1 sm:flex-none justify-center gap-1 text-xs px-3">
                  <Send size={14} />
                  {submitting ? 'Sending...' : 'Broadcast to House'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
