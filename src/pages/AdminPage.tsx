import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Navigate } from 'react-router-dom';
import { Check, X, Shield, Users, Crown, CreditCard, Search } from 'lucide-react';

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

interface UserProfile {
  id: string;
  email: string;
  name: string;
  full_name?: string;
  plan: string;
  plan_type?: string;
  premium_expiry?: string;
  trial_start_date: string;
  created_at: string;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [trialUsers, setTrialUsers] = useState<UserProfile[]>([]);
  const [premiumUsers, setPremiumUsers] = useState<UserProfile[]>([]);
  const [fetching, setFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [planSelections, setPlanSelections] = useState<Record<string, 'monthly' | 'yearly'>>({});
  const [paymentIds, setPaymentIds] = useState<Record<string, string>>({});

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (isAdmin) {
      fetchAll();
    }
  }, [isAdmin]);

  const fetchAll = async () => {
    setFetching(true);
    await Promise.all([fetchRequests(), fetchUsers()]);
    setFetching(false);
  };

  const fetchUsers = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: payments } = await supabase
      .from('payment_requests')
      .select('user_id, user_email');

    const all = (profiles || []).map(p => ({
      ...p,
      email: p.email || payments?.find(pay => pay.user_id === p.id)?.user_email || p.id,
    }));

    setTrialUsers(all.filter(u => u.plan === 'trial' || u.plan === 'expired'));
    setPremiumUsers(all.filter(u => u.plan === 'premium'));
  };

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('payment_requests')
      .select('*')
      .order('created_at', { ascending: false });
    setRequests(data || []);
  };

  const handleActivatePremium = async (userId: string, planType: 'monthly' | 'yearly') => {
    setActionLoading(userId);
    const daysToAdd = planType === 'yearly' ? 365 : 30;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + daysToAdd);

    await supabase
      .from('profiles')
      .update({
        plan: 'premium',
        plan_type: planType,
        premium_expiry: expiry.toISOString(),
      })
      .eq('id', userId);
    setActionLoading(null);
    fetchUsers();
  };

  const handleAction = async (req: PaymentRequest, action: 'verified' | 'rejected') => {
    setActionLoading(req.id);
    await supabase
      .from('payment_requests')
      .update({ status: action })
      .eq('id', req.id);

    if (action === 'verified') {
      const planType = req.plan_type === 'yearly' ? 'yearly' : 'monthly';
      const daysToAdd = planType === 'yearly' ? 365 : 30;
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + daysToAdd);

      await supabase
        .from('profiles')
        .update({
          plan: 'premium',
          plan_type: planType,
          premium_expiry: expiry.toISOString(),
        })
        .eq('id', req.user_id);
    }

    setActionLoading(null);
    fetchAll();
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

  const totalUsers = trialUsers.length + premiumUsers.length;
  const pendingPayments = requests.filter(r => r.status === 'pending').length;

  const filteredTrial = trialUsers.filter(u =>
    !searchQuery || u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredPremium = premiumUsers.filter(u =>
    !searchQuery || u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name?: string, email?: string) => {
    if (name && name !== 'Unknown') return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return (email || '??').slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage users & payments</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-primary' },
            { label: 'Trial Users', value: trialUsers.length, icon: Users, color: 'text-warning' },
            { label: 'Premium Users', value: premiumUsers.length, icon: Crown, color: 'text-accent' },
            { label: 'Pending Payments', value: pendingPayments, icon: CreditCard, color: 'text-destructive' },
          ].map(s => (
            <div key={s.label} className="card-premium p-4">
              <s.icon className={`h-4 w-4 ${s.color} mb-2`} />
              <div className="text-2xl font-bold tabular-nums">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Payment Requests */}
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Requests
          </h2>
          {fetching ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-20 rounded-lg shimmer" />)}
            </div>
          ) : requests.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No payment requests yet.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                      {getInitials(undefined, req.user_email)}
                    </div>
                    <div className="space-y-0.5 text-sm">
                      <p className="font-medium">{req.user_email}</p>
                      <p className="text-muted-foreground text-xs">
                        UTR: <span className="font-mono">{req.utr_number}</span> · {req.plan_type} · ₹{req.amount}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {req.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleAction(req, 'verified')}
                          disabled={actionLoading === req.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
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
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                        req.status === 'verified' ? 'bg-accent/15 text-accent' : 'bg-destructive/15 text-destructive'
                      }`}>
                        {req.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trial Users */}
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-warning" />
            Trial / Expired Users
            <span className="ml-auto text-xs rounded-full bg-warning/15 text-warning px-2.5 py-1 font-medium">{filteredTrial.length}</span>
          </h2>
          {filteredTrial.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No trial users.</p>
          ) : (
            <div className="space-y-3">
              {filteredTrial.map((u) => (
                <div key={u.id} className="rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">
                        {getInitials(u.name || u.full_name, u.email)}
                      </div>
                      <div className="space-y-0.5 text-sm min-w-0">
                        <p className="font-medium">{u.full_name || u.name || 'Unknown'}</p>
                        <p className="text-muted-foreground text-xs truncate">{u.email}</p>
                        <p className="text-muted-foreground text-[10px] font-mono truncate">ID: {u.id.slice(0, 12)}...</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className={`self-start rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                        u.plan === 'trial' ? 'bg-warning/15 text-warning' : 'bg-destructive/15 text-destructive'
                      }`}>
                        {u.plan === 'trial' ? 'Trial' : 'Expired'}
                      </span>
                      <div className="flex items-center gap-2">
                        <select
                          value={planSelections[u.id] || 'monthly'}
                          onChange={e => setPlanSelections(prev => ({ ...prev, [u.id]: e.target.value as 'monthly' | 'yearly' }))}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                        <input
                          placeholder="Payment ID"
                          value={paymentIds[u.id] || ''}
                          onChange={e => setPaymentIds(prev => ({ ...prev, [u.id]: e.target.value }))}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs w-28"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleActivatePremium(u.id, 'monthly')}
                          disabled={actionLoading === u.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-accent/80 px-2.5 py-1.5 text-[11px] font-medium text-accent-foreground hover:bg-accent disabled:opacity-50"
                        >
                          <Crown className="h-3 w-3" /> Monthly
                        </button>
                        <button
                          onClick={() => handleActivatePremium(u.id, 'yearly')}
                          disabled={actionLoading === u.id}
                          className="inline-flex items-center gap-1 rounded-lg gradient-primary px-2.5 py-1.5 text-[11px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                        >
                          <Crown className="h-3 w-3" /> Yearly
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Premium Users */}
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Crown className="h-5 w-5 text-accent" />
            Premium Users
            <span className="ml-auto text-xs rounded-full bg-accent/15 text-accent px-2.5 py-1 font-medium">{filteredPremium.length}</span>
          </h2>
          {filteredPremium.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No premium users yet.</p>
          ) : (
            <div className="space-y-3">
              {filteredPremium.map((u) => (
                <div key={u.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-lg border border-accent/20 bg-accent/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-bold">
                      {getInitials(u.name || u.full_name, u.email)}
                    </div>
                    <div className="space-y-0.5 text-sm">
                      <p className="font-medium">{u.full_name || u.name || 'Unknown'}</p>
                      <p className="text-muted-foreground text-xs">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-accent/15 text-accent px-2.5 py-0.5 text-xs font-semibold capitalize">
                      {u.plan_type || 'monthly'}
                    </span>
                    {u.premium_expiry && (
                      <span className="text-xs text-muted-foreground">
                        Expires: {new Date(u.premium_expiry).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
