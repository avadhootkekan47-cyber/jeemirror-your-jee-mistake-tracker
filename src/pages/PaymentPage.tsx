import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Check, LogOut } from 'lucide-react';

export default function PaymentPage() {
  const { user, profile, signOut } = useAuth();
  const [step, setStep] = useState<'plan' | 'payment' | 'success'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [utr, setUtr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const amount = selectedPlan === 'monthly' ? 99 : 699;

  const copyUPI = () => {
    navigator.clipboard.writeText('9370939333@ybl');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!utr.trim() || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from('payment_requests').insert({
      user_id: user.id,
      user_email: profile?.email || user.email,
      utr_number: utr.trim(),
      plan_type: selectedPlan,
      amount,
      status: 'pending',
    });
    if (error) {
      alert('Error submitting payment: ' + error.message);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    setStep('success');
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            <span className="text-primary">JEE</span>Mirror
          </h1>
          <p className="text-muted-foreground mt-1">Activate your account to get started</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
          {step === 'plan' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold">Choose Your Plan</h2>
                <p className="text-sm text-muted-foreground mt-1">One-time payment to unlock full access</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(['monthly', 'yearly'] as const).map((plan) => (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                      selectedPlan === plan
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    {plan === 'yearly' && (
                      <span className="absolute -top-2.5 right-2 rounded-full bg-success px-2 py-0.5 text-xs font-semibold text-background">
                        Save 41%
                      </span>
                    )}
                    <div className="font-semibold capitalize">{plan}</div>
                    <div className="text-2xl font-bold mt-1">₹{plan === 'monthly' ? 99 : 699}</div>
                    <div className="text-xs text-muted-foreground">per {plan === 'monthly' ? 'month' : 'year'}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep('payment')}
                className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-all hover:opacity-90"
              >
                Proceed to Pay
              </button>
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-bold">Pay ₹{amount}</h2>
                <p className="text-sm text-muted-foreground">{selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} Plan</p>
              </div>

              <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
                <p className="text-sm font-medium">Pay via PhonePe or any UPI app</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">9370939333@ybl</span>
                  <button onClick={copyUPI} className="rounded bg-secondary px-3 py-1 text-xs font-medium transition-colors hover:bg-muted">
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="text-2xl font-bold text-primary">₹{amount}</div>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Open PhonePe, Google Pay, or any UPI app</li>
                  <li>Send exactly ₹{amount} to the UPI ID above</li>
                  <li>Find your UTR number in PhonePe → History → tap the transaction → Transaction ID</li>
                  <li>Enter it below</li>
                </ol>
              </div>

              <div>
                <label className="text-sm font-medium">UTR / Transaction ID</label>
                <input
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="12-digit number e.g. 426811234567"
                  className="mt-1 w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  This is the unique ID for your payment. We use it to verify manually.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('plan')}
                  className="flex-1 rounded-lg border border-border py-3 text-sm font-medium transition-colors hover:bg-secondary"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!utr.trim() || submitting}
                  className="flex-1 rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Payment'}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4 text-center py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
                <Check className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-xl font-bold">Payment Under Review</h2>
              <p className="text-sm text-muted-foreground">
                You will get access within 2 hours after we verify your payment.
                You'll receive a confirmation email at <strong>{profile?.email || user?.email}</strong>.
              </p>
              <p className="text-xs text-muted-foreground">
                If you have any issues contact: <strong>avadhootkekan47@gmail.com</strong>
              </p>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
