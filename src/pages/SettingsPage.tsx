import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import UpgradeModal from '@/components/UpgradeModal';

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveName = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ name }).eq('user_id', user.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sendPasswordReset = async () => {
    if (!user?.email) return;
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    alert('Check your email for a password reset link.');
  };

  const deleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    await supabase.from('mistakes').delete().eq('user_id', user.id);
    await supabase.from('payment_requests').delete().eq('user_id', user.id);
    await supabase.from('profiles').delete().eq('user_id', user.id);
    await signOut();
  };

  const trialDaysLeft = profile?.trial_start_date
    ? Math.max(0, 7 - Math.floor((Date.now() - new Date(profile.trial_start_date).getTime()) / 86400000))
    : 0;

  return (
    <div className="max-w-lg mx-auto space-y-8 animate-fade-in">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <div>
          <label className="text-sm font-medium">Name</label>
          <div className="flex gap-2 mt-1">
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <button onClick={saveName} disabled={saving}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50">
              {saved ? 'Saved!' : saving ? '...' : 'Save'}
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input value={user?.email || ''} readOnly
            className="mt-1 w-full rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground" />
        </div>
      </div>

      {/* Subscription */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold">Subscription</h2>
        <div className="flex items-center gap-3">
          <span className={`rounded-md px-3 py-1 text-xs font-semibold ${
            profile?.plan === 'premium' ? 'bg-success/20 text-success' :
            profile?.plan === 'expired' ? 'bg-destructive/20 text-destructive' :
            'bg-primary/20 text-primary'
          }`}>
            {profile?.plan === 'trial' ? 'Free Trial' : profile?.plan === 'premium' ? 'Premium' : 'Expired'}
          </span>
          {profile?.plan === 'trial' && (
            <span className="text-sm text-muted-foreground">{trialDaysLeft} days left</span>
          )}
        </div>
        {profile?.plan !== 'premium' && (
          <button onClick={() => setShowUpgrade(true)}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90">
            Upgrade to Premium
          </button>
        )}
      </div>

      {/* Account */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold">Account</h2>
        <button onClick={sendPasswordReset}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary">
          Change Password
        </button>
        <div>
          <button onClick={() => setShowDelete(true)}
            className="rounded-lg border border-destructive/30 px-5 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
            Delete Account
          </button>
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />

      {/* Delete confirmation */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-lg font-bold">Delete Account?</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure? This will permanently delete all your mistakes and data.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium transition-colors hover:bg-secondary">
                Cancel
              </button>
              <button onClick={deleteAccount} disabled={deleting}
                className="flex-1 rounded-lg bg-destructive py-2.5 text-sm font-medium text-destructive-foreground transition-all hover:opacity-90 disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
