// Login Page
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setError('Email Not Confirmed: Please check your inbox or turn off "Confirm email" in Supabase Auth Settings.');
        } else {
          setError(error.message);
        }
        return;
      }

      if (data.session) {
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
          <Link href="/auth/register" className="underline hover:text-[#F5E600] text-black">
            Create new account
          </Link>
        </div>
      </Card>

      <div className="text-center">
        <Link href="/dashboard" className="text-xs font-bold uppercase underline text-black">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
