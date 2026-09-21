// Register Page with Auto-House Join on Invitation
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { Home } from 'lucide-react';
import Link from 'next/link';

function RegisterForm() {
  const searchParams = useSearchParams();
  const inviteHouseId = searchParams.get('houseId');
  const initialEmail = searchParams.get('email') || '';

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [houseName, setHouseName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (inviteHouseId) {
      // Fetch house name to show invitation header
      supabase
        .from('houses')
        .select('name')
        .eq('id', inviteHouseId)
        .maybeSingle()
        .then(({ data }: { data: any }) => {
          if (data?.name) setHouseName(data.name);
        });
    }
  }, [inviteHouseId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Sign up user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: displayName.trim(),
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const user = authData.user;
      if (!user) {
        setError('Registration failed. Please try again.');
        return;
      }

      // 2. Insert user profile into public.profiles
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: cleanEmail,
          display_name: displayName.trim(),
        });

      // 3. Handle House Invitation Join
      let targetHouseId = inviteHouseId;

      // If no houseId in URL, check if there's a pending invite for this email in house_invitations
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

      // Add user to house_members if there is an invite target house
      if (targetHouseId) {
        const { error: memberError } = await supabase
          .from('house_members')
          .insert({
            house_id: targetHouseId,
            user_id: user.id,
            role: 'member',
            status: 'active',
            joined_at: new Date().toISOString(),
          });

        if (!memberError) {
          sessionStorage.setItem('currentHouseId', targetHouseId);

          // Mark invitation as accepted
          await supabase
            .from('house_invitations')
            .update({ status: 'accepted' })
            .eq('invitee_email', cleanEmail)
            .eq('house_id', targetHouseId);
        } else {
          console.warn('Could not auto-add to house members:', memberError);
        }
      }

      // If session exists (email confirmation turned off), redirect immediately to dashboard
      if (authData.session) {
        router.push('/dashboard');
        router.refresh();
      } else {
        router.push('/auth/login');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-black">
      <div className="text-center flex flex-col items-center">
        <div className="border-b-4 border-black pb-3 w-full flex justify-center">
          <Logo size="lg" showText={true} />
        </div>
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
                Sign up below to automatically join your roommate's house!
              </div>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg sm:text-xl font-extrabold uppercase border-b-2 border-black pb-2 mb-2 text-black">
            Create Account
          </h2>
          <p className="text-xs font-bold uppercase text-gray-700">
            Join SplitMate to manage your house finances
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border-4 border-red-600 p-4 text-red-800 font-extrabold uppercase text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <Label htmlFor="displayName" required>
              Your Name / Display Name
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Smith"
              required
              disabled={loading}
              className="mt-1"
            />
          </div>

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
              placeholder="Create a password (min 6 chars)"
              required
              minLength={6}
              disabled={loading}
              className="mt-1"
            />
          </div>

          <Button type="submit" variant="brutalPrimary" fullWidth disabled={loading}>
            {loading ? 'Creating Account & Joining House...' : 'Create Account & Join House'}
          </Button>
        </form>

        <div className="text-center text-xs font-bold uppercase border-t-2 border-black pt-4">
          <p className="mb-2 text-gray-600">Already have an account?</p>
          <Link
            href={`/auth/login${inviteHouseId ? `?houseId=${inviteHouseId}` : ''}`}
            className="underline hover:text-[#F5E600] text-black"
          >
            Sign in to accept invite
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
