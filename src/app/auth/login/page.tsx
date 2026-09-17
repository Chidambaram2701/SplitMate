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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold uppercase tracking-tighter border-b-4 border-black pb-4">
          RoommateX
        </h1>
        <p className="mt-2 text-sm uppercase tracking-widest text-gray-600">
          Shared House Financial Platform
        </p>
      </div>

      <Card variant="default" size="lg" className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold uppercase border-b-2 border-black pb-2 mb-4">
            Login
          </h2>
          <p className="text-sm text-gray-600">
            Enter your credentials to access your house account
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border-2 border-red-600 p-4 text-red-700 font-bold uppercase text-sm">
            {error}
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
            />
          </div>

          <Button type="submit" variant="brutalPrimary" fullWidth disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center text-sm">
          <p className="mb-4">OR</p>
          <Link href="/auth/register" className="underline hover:text-gray-800">
            Create new account
          </Link>
        </div>
      </Card>

      <div className="text-center">
        <Link href="/" className="text-sm underline hover:text-gray-800">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
