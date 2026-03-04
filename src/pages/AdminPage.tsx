import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Navigate } from 'react-router-dom';
import { Check, X, Shield } from 'lucide-react';

const ADMIN_EMAILS = ['avadhootkekan47@gmail.com', 'cellux.official@gmail.com'];

interface PaymentRequest {
  id: string;
  user_id: string;
  user_email: string;
  utr_number: string;
  plan_type: string;
  amount: number;
  status: string;
  created_at: string;
}

interface TrialUser {
  id: string;
  email: string;
  name: string;
  trial_start_date: string;
  created_at: string;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [trialUsers, setTrialUsers] = useState<TrialUser[]>([]);
  const [fetching, setFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (isAdmin) {
      fetchRequests();
      fetchTrialUsers();
    }
  }, [isAdmin]);

  const fetchTrialUsers = async () => {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('plan', 'trial')
    .order('created_at', { ascending: false });

  const { data: payments } = await supabase
    .from('payment_requests')
    .select('user_id, user_email');

  const merged = (profiles || []).map(p => ({
    ...p,
    email: p.email || 
      payments?.find(pay => pay.user_id === p.id)?.user_email || 
      p.id
  }));
  setTrialUsers(merged);
};

  const fetchRequests = async () => {
    setFetching(true);
    const { data } = await supabase
      .from('payment_requests')
      .select('*')
      .order('created_at', { ascending: false });
    setRequests(data || []);
    setFetching(false);
  };

  const handleActivatePremium = async (userId: string) => {
    setActionLoading(userId);
    await supabase
      .from('profiles')
      .update({ plan: 'premium' })
      .eq('id', userId);
    setActionLoading(null);
    fetchTrialUsers();
  };

  const handleAction = async (req: PaymentRequest, action: 'verified' | 'rejected') => {
    setActionLoading(req.id);
    // Update payment request status
    await supabase
      .from('payment_requests')
      .update({ status: action })
      .eq('id', req.id);

    // If verified, upgrade user plan to premium
    if (action === 'verified') {
      await supabase
        .from('profiles')
        .update({ plan: 'premium' })
        .eq('id', req.user_id);
    }

    setActionLoading(null);
    fetchRequests();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Payment Requests</h2>
          {fetching ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-muted-foreground text-sm">No payment requests yet.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-lg border border-border p-4"
                >
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{req.user_email}</p>
                    <p className="text-muted-foreground">
                      UTR: {req.utr_number} · {req.plan_type} · ₹{req.amount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(req.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {req.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleAction(req, 'verified')}
                          disabled={actionLoading === req.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleAction(req, 'rejected')}
                          disabled={actionLoading === req.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </>
                    ) : (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          req.status === 'verified'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {req.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Trial Users</h2>
          {trialUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No trial users.</p>
          ) : (
            <div className="space-y-3">
              {trialUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-lg border border-border p-4"
                >
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{u.email}</p>
                    <p className="text-muted-foreground text-xs">
                      Signed up: {new Date(u.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleActivatePremium(u.id)}
                    disabled={actionLoading === u.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" /> Activate Premium
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
