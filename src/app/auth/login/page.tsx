// Login Page with Auto-House Join on Invitation
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Home } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const searchParams = useSearchParams();
  const inviteHouseId = searchParams.get('houseId');
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [houseName, setHouseName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (inviteHouseId) {
      supabase
        .from('houses')
        .select('name')
        .eq('id', inviteHouseId)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.name) setHouseName(data.name);
        });
    }
  }, [inviteHouseId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError) {
        if (signInError.message.toLowerCase().includes('email not confirmed')) {
          setError('Email Not Confirmed: Please check your inbox or turn off "Confirm email" in Supabase Auth Settings.');
        } else {
          setError(signInError.message);
        }
        return;
      }

      if (data.user) {
        const user = data.user;
        let targetHouseId = inviteHouseId;

        // Check pending invitations table if no houseId in URL
        if (!targetHouseId) {
          const { data: pendingInvite } = await supabase
            .from('house_invitations')
            .select('house_id')
            .eq('invitee_email', cleanEmail)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .maybeSingle();

          if (pendingInvite?.house_id) {
            targetHouseId = pendingInvite.house_id;
          }
        }

        // Add user to house_members if there is a target house
        if (targetHouseId) {
          const { error: memberError } = await supabase
            .from('house_members')
            .upsert({
              house_id: targetHouseId,
              user_id: user.id,
              role: 'member',
              status: 'active',
              joined_at: new Date().toISOString(),
            }, { onConflict: 'house_id,user_id' });

          if (!memberError) {
            sessionStorage.setItem('currentHouseId', targetHouseId);

            await supabase
              .from('house_invitations')
              .update({ status: 'accepted' })
              .eq('invitee_email', cleanEmail)
              .eq('house_id', targetHouseId);
          } else {
            console.warn('Could not auto-add user to house:', memberError);
          }
        }

        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-black">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold uppercase tracking-tighter border-b-4 border-black pb-4 text-black">
          RoommateX
        </h1>
        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-gray-700">
          Shared House Financial Platform
        </p>
      </div>

      <Card variant="default" size="lg" className="space-y-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white p-6">
        {inviteHouseId && (
          <div className="bg-[#F5E600] border-2 border-black p-4 flex items-center gap-3">
            <Home size={24} className="text-black flex-shrink-0" />
            <div>
              <div className="font-extrabold uppercase text-sm text-black">
                Invitation to Join {houseName ? `"${houseName}"` : 'House'}
              </div>
              <div className="text-[10px] font-bold uppercase text-black">
                Sign in below to accept the invitation and join this house!
              </div>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-extrabold uppercase border-b-2 border-black pb-2 mb-2 text-black">
            Login
          </h2>
          <p className="text-xs font-bold uppercase text-gray-700">
            Enter your credentials to access your house account
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border-4 border-red-600 p-4 text-red-800 font-extrabold uppercase text-xs space-y-2">
            <div>{error}</div>
            {error.includes('Email Not Confirmed') && (
              <div className="text-[11px] font-medium text-red-900 border-t border-red-400 pt-2 normal-case">
                💡 <strong>Quick Fix:</strong> In your Supabase Dashboard, go to <strong>Authentication $\rightarrow$ Providers $\rightarrow$ Email</strong> and uncheck <strong>"Confirm email"</strong>.
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" required>
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password" required>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
              className="mt-1"
            />
          </div>

          <Button type="submit" variant="brutalPrimary" fullWidth disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center text-xs font-bold uppercase border-t-2 border-black pt-4">
          <p className="mb-2 text-gray-600">Don't have an account?</p>
          <Link
            href={`/auth/register${inviteHouseId ? `?houseId=${inviteHouseId}` : ''}`}
            className="underline hover:text-[#F5E600] text-black"
          >
            Create new account
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
