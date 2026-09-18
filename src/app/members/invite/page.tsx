// Invite Member Page
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, ArrowLeft, Copy, Mail, Check, Share2 } from 'lucide-react';
import Link from 'next/link';

export default function InviteMemberPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const houseId = sessionStorage.getItem('currentHouseId');
    if (!houseId) {
      setMessage({ text: 'No active house selected. Please select a house first.', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage({ text: 'You must be logged in to send invitations.', type: 'error' });
        setLoading(false);
        return;
      }

      const generatedLink = `${window.location.origin}/auth/register?houseId=${houseId}&email=${encodeURIComponent(email.trim())}`;
      setInviteUrl(generatedLink);

      // Check if user already exists in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (profile) {
        // User exists, add directly to house_members
        const { error: memberError } = await supabase
          .from('house_members')
          .insert({
            house_id: houseId,
            user_id: profile.id,
            role: 'member',
            status: 'active',
            joined_at: new Date().toISOString(),
          });

        if (memberError) {
          if (memberError.code === '23505') {
            setMessage({ text: 'This user is already a member of your house!', type: 'error' });
          } else {
            throw memberError;
          }
        } else {
          setMessage({ text: `Successfully added ${profile.display_name || email} to your house!`, type: 'success' });
        }
      } else {
        // Log in house_invitations table
        const { error: inviteError } = await supabase
          .from('house_invitations')
          .insert({
            house_id: houseId,
            inviter_id: user.id,
            invitee_email: email.trim().toLowerCase(),
            status: 'pending',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          });

        if (inviteError) console.warn('Invitation logging:', inviteError);

        setMessage({
          text: `Invitation link generated! You can copy or share the link below.`,
          type: 'success',
        });
      }
    } catch (err: any) {
      console.error('Error processing invitation:', err);
      setMessage({ text: err.message || 'Failed to process invitation.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!inviteUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join our house on SplitMate!',
          text: 'Hey! Join our shared house finance workspace on SplitMate:',
          url: inviteUrl,
        });
      } catch (err) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const sendEmail = () => {
    if (!inviteUrl || !email) return;
    const subject = encodeURIComponent('Join our house on SplitMate!');
    const body = encodeURIComponent(
      `Hey!\n\nI am inviting you to join our house financial workspace on SplitMate.\n\nClick the link below to sign up and join:\n${inviteUrl}\n\nSee you inside!`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-black pb-12">
      <div className="flex items-center justify-between border-b-4 border-black pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#F5E600] border-2 border-black">
            <UserPlus size={28} className="text-black" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-black">
              Invite Roommate
            </h1>
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-gray-700">
              Add your roommates to split bills easily
            </p>
          </div>
        </div>
        <Button variant="brutal" asChild className="touch-target">
          <Link href="/members" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Back
          </Link>
        </Button>
      </div>

      <div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-8">
        {message && (
          <div
            className={`mb-6 border-4 p-4 font-bold uppercase text-xs space-y-2 ${
              message.type === 'success'
                ? 'bg-green-100 border-green-600 text-green-800'
                : 'bg-red-100 border-red-600 text-red-800'
            }`}
          >
            <div>{message.text}</div>
          </div>
        )}

        <form onSubmit={handleInvite} className="space-y-6">
          <div>
            <Label htmlFor="email" required>
              Roommate Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. roommate@college.edu"
              required
              disabled={loading}
              className="mt-1 touch-target"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <Button variant="brutal" asChild disabled={loading} className="touch-target order-2 sm:order-1">
              <Link href="/members">Cancel</Link>
            </Button>
            <Button
              type="submit"
              variant="brutalAccent"
              disabled={loading || !email.trim()}
              className="px-8 touch-target order-1 sm:order-2"
            >
              {loading ? 'Generating Link...' : 'Generate Invite Link'}
            </Button>
          </div>
        </form>

        {/* Shareable Link Box */}
        {inviteUrl && (
          <div className="mt-8 border-4 border-black bg-[#F5E600] p-4 sm:p-6 space-y-4">
            <h3 className="font-extrabold uppercase text-lg text-black">Share Invite Link</h3>
            <p className="text-xs font-bold uppercase text-black">
              Send this link to your roommate so they can join your house instantly:
            </p>

            <div className="flex items-center gap-2 bg-white border-2 border-black p-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="w-full text-xs font-mono font-bold bg-transparent border-none outline-none text-black"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="brutalPrimary" size="sm" onClick={handleShare} className="flex-1 touch-target">
                <Share2 size={16} />
                Share Link
              </Button>
              <Button variant="brutal" size="sm" onClick={copyToClipboard} className="flex-1 touch-target">
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button variant="brutal" size="sm" onClick={sendEmail} className="flex-1 touch-target">
                <Mail size={16} />
                Email
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
