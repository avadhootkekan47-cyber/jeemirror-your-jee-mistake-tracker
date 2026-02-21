import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import UpgradeModal from './UpgradeModal';

export default function TrialBanner() {
  const { profile } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (!profile || profile.plan === 'premium') return null;

  const trialStart = new Date(profile.trial_start_date);
  const now = new Date();
  const daysPassed = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, 7 - daysPassed);

  if (profile.plan === 'expired') {
    return (
      <>
        <UpgradeModal open={true} dismissable={false} />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between bg-primary/10 border-b border-primary/20 px-4 py-2.5 text-sm">
        <span>⏳ {daysLeft} day{daysLeft !== 1 ? 's' : ''} left in your free trial</span>
        <button
          onClick={() => setShowUpgrade(true)}
          className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90"
        >
          Upgrade Now
        </button>
      </div>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
}
